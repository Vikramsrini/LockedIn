import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import TIMETABLE from './timetableData.js';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const INTERVIEW_LIBRARY = {
  hr: {
    label: 'HR',
    opening: 'I will assess communication, self-awareness, and professional clarity.',
    questions: [
      'Tell me about yourself in under two minutes.',
      'Why should we hire you over another student with similar grades?',
      'Describe a time you handled pressure or a setback.',
      'What kind of team environment helps you do your best work?',
      'Where do you see yourself in the next two years?',
    ],
    focusAreas: ['communication', 'clarity', 'ownership', 'motivation'],
  },
  technical: {
    label: 'Technical',
    opening: 'I will test problem-solving, depth, and the way you explain technical tradeoffs.',
    questions: [
      'Explain the difference between a process and a thread with one practical example.',
      'When would you choose a hash map over a balanced tree?',
      'How would you design a scalable job tracking system for students?',
      'What happens internally when you type a URL into a browser?',
      'Explain one project decision where you traded simplicity for scalability.',
    ],
    focusAreas: ['technical depth', 'problem solving', 'tradeoffs', 'examples'],
  },
  resume: {
    label: 'Resume',
    opening: 'I will ask targeted questions that convert project bullets into measurable impact.',
    questions: [
      'Pick one project from your resume and explain the real problem it solves.',
      'What was the hardest bug or blocker in that project, and how did you fix it?',
      'Which metric improved because of your work, and how do you know?',
      'If I asked your teammate about your contribution, what would they say?',
      'What would you improve in that project if you had one more week?',
    ],
    focusAreas: ['impact', 'ownership', 'metrics', 'execution'],
  },
  company: {
    label: 'Company-Specific',
    opening: 'I will simulate a company-style round and look for structured, confident answers.',
    questions: [
      'Why do you want to work at this company specifically?',
      'How would your strengths fit this company’s engineering culture?',
      'Tell me about a project that proves you can handle ambiguity.',
      'If assigned an unfamiliar stack on day one, how would you ramp up quickly?',
      'What kind of problems do you want to solve here and why?',
    ],
    focusAreas: ['company fit', 'research', 'adaptability', 'motivation'],
  },
};

function getInterviewConfig(mode) {
  return INTERVIEW_LIBRARY[mode] || INTERVIEW_LIBRARY.hr;
}

function createInterviewPrompt({
  stage,
  mode,
  companyName,
  studentData,
  history,
  answer,
  questionIndex,
}) {
  const config = getInterviewConfig(mode);
  const companyContext = companyName ? `Target company: ${companyName}.` : 'No specific company selected.';

  if (stage === 'start') {
    return `You are LockedIn Interviewer, a precise but encouraging mock interviewer.
Interview mode: ${config.label}.
${companyContext}
Student profile: ${JSON.stringify(studentData || {})}
Ask the first interview question only. Keep it natural, under 35 words, and aligned to these themes: ${config.focusAreas.join(', ')}.
Do not include analysis or bullet points.`;
  }

  return `You are LockedIn Interviewer, a precise mock interviewer.
Interview mode: ${config.label}.
${companyContext}
Student profile: ${JSON.stringify(studentData || {})}
Current question number: ${questionIndex + 1}.
Conversation so far: ${JSON.stringify(history || [])}
Candidate answer: ${answer}

Return strict JSON with this shape:
{
  "score": number,
  "communication": number,
  "technicalDepth": number,
  "confidence": number,
  "strengths": ["..."],
  "gaps": ["..."],
  "feedback": "short paragraph",
  "idealAnswer": "short paragraph",
  "followUpQuestion": "one question",
  "shouldEnd": boolean
}

Scoring rules:
- Scores must be 0-100
- Be honest, not generous
- Prefer concrete feedback
- Set shouldEnd true after 4-5 rounds or when the answer is too weak to continue naturally`;
}

async function runChatCompletion(messages, options = {}) {
  const LLM_API_KEY = process.env.LLM_API_KEY;
  const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
  const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';

  if (!LLM_API_KEY) {
    return null;
  }

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
      response_format: options.response_format,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    const message = data?.error?.message || 'Unknown LLM error';
    throw new Error(message);
  }

  return data.choices?.[0]?.message?.content || null;
}

function scoreAnswer(answer) {
  const text = (answer || '').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  let score = 38;

  if (words >= 25) score += 14;
  if (words >= 60) score += 10;
  if (words >= 100) score += 6;
  if (/\b(example|because|result|impact|improved|built|designed|implemented)\b/.test(lower)) score += 12;
  if (/\b(i|my|me)\b/.test(lower)) score += 5;
  if (/\bteam|users|system|performance|scale|challenge|learned|deadline\b/.test(lower)) score += 8;
  if (/\bumm|uh|idk|don't know|not sure\b/.test(lower)) score -= 12;
  if (words < 12) score -= 18;

  return Math.max(18, Math.min(95, score));
}

function buildFallbackInterviewStart({ mode, companyName }) {
  const config = getInterviewConfig(mode);
  const firstQuestion = config.questions[0];

  return {
    intro: `${config.label} interview started. ${config.opening}${companyName ? ` Company focus: ${companyName}.` : ''}`,
    question: firstQuestion,
    questionIndex: 0,
  };
}

function buildFallbackInterviewTurn({ mode, answer, questionIndex }) {
  const config = getInterviewConfig(mode);
  const score = scoreAnswer(answer);
  const communication = Math.max(20, Math.min(98, score + (/[,.;:]/.test(answer) ? 4 : -3)));
  const technicalDepth = Math.max(20, Math.min(98, score + (/\b(system|api|database|complexity|tradeoff|architecture|scalable)\b/i.test(answer) ? 6 : -4)));
  const confidence = Math.max(20, Math.min(98, score + (/\bI\b/.test(answer) ? 4 : -5)));
  const strengths = [];
  const gaps = [];

  if (answer.length > 180) strengths.push('You gave enough context instead of a one-line answer.');
  if (/\bexample|project|built|implemented|result|impact\b/i.test(answer)) strengths.push('You used concrete examples instead of generic claims.');
  if (/\bteam|user|customer|deadline|pressure\b/i.test(answer)) strengths.push('You connected the answer to real execution constraints.');
  if (strengths.length === 0) strengths.push('You stayed on topic and answered the question directly.');

  if (answer.length < 120) gaps.push('Add more depth with one specific example and one measurable result.');
  if (!/\bresult|impact|improved|reduced|increased|learned\b/i.test(answer)) gaps.push('Close with a result or takeaway so the answer feels complete.');
  if (!/\bbecause|therefore|so that|which meant\b/i.test(answer)) gaps.push('Explain your reasoning, not just the action you took.');
  if (gaps.length === 0) gaps.push('Make the answer tighter and more structured to sound more senior.');

  const nextIndex = questionIndex + 1;
  const shouldEnd = nextIndex >= config.questions.length || nextIndex >= 4;

  return {
    score,
    communication,
    technicalDepth,
    confidence,
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 3),
    feedback: `Your answer was ${score >= 75 ? 'strong' : score >= 55 ? 'decent' : 'underpowered'}. Focus on a tighter story: context, action, result.`,
    idealAnswer: 'Lead with the situation, explain your decision clearly, then finish with measurable impact and what you learned.',
    followUpQuestion: shouldEnd ? 'Interview complete.' : config.questions[nextIndex],
    shouldEnd,
    questionIndex: nextIndex,
  };
}

function buildFallbackInterviewSummary({ mode, transcript }) {
  const scores = transcript.map((entry) => entry.score).filter((value) => typeof value === 'number');
  const averageScore = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;
  const config = getInterviewConfig(mode);

  return {
    mode: config.label,
    averageScore,
    strengths: [
      'Stayed aligned to the interview question',
      'Showed willingness to explain your reasoning',
      'Built enough material to improve across sessions',
    ],
    weaknesses: [
      'Needs sharper examples with measurable outcomes',
      'Needs stronger closing statements after each answer',
      `Should improve on ${config.focusAreas[0]} and ${config.focusAreas[1]}`,
    ],
    nextSteps: [
      'Practice 3 answers using the STAR structure',
      'Add one number, outcome, or user impact to every answer',
      'Do another mock round within 24 hours to reinforce improvements',
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. LEETCODE API — Fetch daily challenge and user stats
// ═══════════════════════════════════════════════════════════════════════

app.get('/api/leetcode/daily', async (req, res) => {
  try {
    const query = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          userStatus
          link
          question {
            acRate
            difficulty
            freqBar
            frontendQuestionId: questionFrontendId
            isFavor
            paidOnly: isPaidOnly
            status
            title
            titleSlug
            hasVideoSolution
            hasSolution
            topicTags {
              name
              id
              slug
            }
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', { query });
    const daily = response.data.data.activeDailyCodingChallengeQuestion;

    res.json({
      title: daily.question.title,
      difficulty: daily.question.difficulty,
      date: daily.date,
      url: `https://leetcode.com${daily.link}`,
      topicTags: daily.question.topicTags.map(t => t.name)
    });
  } catch (error) {
    console.error('Error fetching LeetCode daily:', error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode daily problem' });
  }
});

app.get('/api/leetcode/user/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const query = `
      query userProblemsSolved($username: String!) {
        allQuestionsCount {
          difficulty
          count
        }
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com/',
        'Content-Type': 'application/json'
      }
    });

    const stats = response.data.data.matchedUser.submitStats.acSubmissionNum;
    const formattedStats = {};
    stats.forEach(s => {
      formattedStats[s.difficulty] = s.count;
    });

    res.json({
      username,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Error fetching LeetCode user stats:', error.message);
    res.status(500).json({ error: 'Failed to fetch LeetCode user stats' });
  }
});

// ── SSE for real-time login progress ───────────────────────────────────
const activeStreams = new Map();

app.get('/api/auth/login/status/:sessionId', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"step":"connected","message":"Connected to server..."}\n\n');
  activeStreams.set(req.params.sessionId, res);
  req.on('close', () => activeStreams.delete(req.params.sessionId));
});

function sendStatus(sessionId, step, message) {
  const stream = activeStreams.get(sessionId);
  if (stream) stream.write(`data: ${JSON.stringify({ step, message })}\n\n`);
  console.log(`[${step}] ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. LOGIN — Verify SRM credentials via Puppeteer
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  const { username, password, sessionId } = req.body;

  if (!username || !password) {
    return res.status(400).json({ detail: 'Missing credentials' });
  }

  let browser = null;
  try {
    sendStatus(sessionId, 'launch', 'Launching browser...');
    
    const launchOptions = isProd 
      ? {
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
        }
      : {
          headless: true,
          defaultViewport: null,
          args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
        };

    browser = await (isProd ? puppeteerCore : puppeteer).launch(launchOptions);

    const page = await browser.newPage();

    sendStatus(sessionId, 'navigate', 'Connecting to SRM Academia...');
    await page.goto('https://academia.srmist.edu.in/', { waitUntil: 'networkidle2', timeout: 60000 });

    sendStatus(sessionId, 'iframe', 'Waiting for login portal...');
    const iframeElement = await page.waitForSelector('iframe', { timeout: 20000 });
    const frame = await iframeElement.contentFrame();
    if (!frame) throw new Error('Could not access login iframe.');

    const emailSel = '#login_id';
    const passSel = '#password';
    const nextBtn = '#nextbtn';

    // Enter email
    sendStatus(sessionId, 'email', 'Entering credentials...');
    await frame.waitForSelector(emailSel, { timeout: 15000 });
    await frame.click(emailSel);
    await frame.evaluate(sel => { document.querySelector(sel).value = ''; }, emailSel);
    await frame.type(emailSel, username, { delay: 80 });
    await new Promise(r => setTimeout(r, 500));
    await frame.click(nextBtn);

    // Wait for password field with retry
    sendStatus(sessionId, 'password', 'Waiting for password field...');
    await new Promise(r => setTimeout(r, 2000));

    // Check for error after email
    const emailError = await frame.evaluate(() => {
      const el = document.querySelector('.error, .alert, #errormsg, .zloginerror, [class*="error"]');
      return el && el.innerText.trim() ? el.innerText.trim() : null;
    }).catch(() => null);
    if (emailError) throw new Error(`SRM rejected login: ${emailError}`);

    let passOk = false;
    for (let i = 0; i < 3; i++) {
      try {
        await frame.waitForSelector(passSel, { visible: true, timeout: 10000 });
        passOk = true;
        break;
      } catch (_) {
        sendStatus(sessionId, 'password', `Retrying password field (${i + 2}/3)...`);
        try { await frame.click(nextBtn); } catch (_) { }
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    if (!passOk) throw new Error('Password field never appeared. Check your email or try again.');

    await new Promise(r => setTimeout(r, 500));
    await frame.click(passSel);
    await frame.type(passSel, password, { delay: 80 });

    // Sign in
    sendStatus(sessionId, 'signin', 'Signing in...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => { }),
      frame.click(nextBtn),
    ]);

    // Verify
    const url = page.url();
    let stillOnLogin = false;
    try { stillOnLogin = await frame.evaluate(s => !!document.querySelector(s), emailSel); } catch (_) { }

    if (url.includes('login') && stillOnLogin) {
      const msg = await frame.evaluate(() => {
        const el = document.querySelector('.error, .alert, #errormsg');
        return el ? el.innerText : null;
      }).catch(() => null);
      throw new Error(msg || 'Login failed. Check your credentials.');
    }

    sendStatus(sessionId, 'loggedin', 'Login successful!');

    // Grab student name
    let studentName = 'SRM Student';
    try {
      await new Promise(r => setTimeout(r, 2000));
      studentName = await page.evaluate(() => {
        const el = document.querySelector('.user-name, .student-name, [class*="name"], span.lbl');
        return el ? el.innerText.trim() : 'SRM Student';
      });
    } catch (_) { }

    const token = crypto.randomBytes(32).toString('hex');
    sendStatus(sessionId, 'done', 'All done!');

    res.json({
      token,
      message: `Welcome ${studentName}! Logged in successfully.`,
      data_source: 'live',
      student_data: {
        name: studentName,
        timetable: TIMETABLE,
        data_source: 'live',
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    sendStatus(sessionId, 'error', `Error: ${error.message}`);
    res.status(401).json({ detail: `Login failed: ${error.message}` });
  } finally {
    if (browser) {
      await new Promise(r => setTimeout(r, 1000));
      await browser.close();
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 2. TIMETABLE — Serve the timetable data directly
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/timetable', (req, res) => {
  res.json({ timetable: TIMETABLE });
});



// ═══════════════════════════════════════════════════════════════════════
// 3. CHATBOT — Open Source LLM API
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/chatbot/ask', async (req, res) => {
  const { message, student_data, history } = req.body;

  const LLM_API_KEY = process.env.LLM_API_KEY;
  const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1'; // Defaulting to Groq for speed but works with any OpenAI Compatible endpoint (Together, OpenRouter, etc)
  const LLM_MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile'; // Standard available model on groq or openrouter

  if (!LLM_API_KEY) {
    return res.status(500).json({ reply: 'LLM API key not configured. Set LLM_API_KEY in your environment.' });
  }

  try {
    const systemPrompt = `You are LockedIn AI, an academic assistant for an SRM university student. 
You have access to their timetable and academic data.
Be concise, helpful, and friendly. Use emojis sparingly.
If asked about schedule/timetable, refer to the student data provided.
If asked about study tips, placement prep, or coding, give actionable advice.

Student data: ${JSON.stringify(student_data || {})}`;

    // Standard OpenAI compatible messages array
    const messages = [{ role: "system", content: systemPrompt }];

    // Add history
    if (history && history.length > 0) {
      for (const entry of history) {
        messages.push({ role: entry.role, content: entry.text });
      }
    }

    // Add the current message if not already in history
    if (!history || history.length === 0) {
      messages.push({ role: 'user', content: message });
    }

    const response = await fetch(
      `${LLM_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LLM_API_KEY}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('LLM API error:', data.error);
      return res.json({ reply: `API error: ${data.error.message}` });
    }

    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.json({ reply: 'Oops, something went wrong connecting to the Open Source AI service.' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// 4. AI MOCK INTERVIEWER
// ═══════════════════════════════════════════════════════════════════════
app.post('/api/interview/start', async (req, res) => {
  const { mode = 'hr', companyName = '', student_data: studentData } = req.body || {};
  const config = getInterviewConfig(mode);

  try {
    const content = await runChatCompletion(
      [
        {
          role: 'system',
          content: createInterviewPrompt({
            stage: 'start',
            mode,
            companyName,
            studentData,
            history: [],
            questionIndex: 0,
          }),
        },
      ],
      { temperature: 0.5, max_tokens: 120 }
    );

    return res.json({
      mode,
      intro: `${config.label} interview started. ${config.opening}${companyName ? ` Company focus: ${companyName}.` : ''}`,
      question: content || config.questions[0],
      questionIndex: 0,
      provider: 'llm',
    });
  } catch (error) {
    console.error('Interview start fallback:', error.message);
    return res.json({
      mode,
      ...buildFallbackInterviewStart({ mode, companyName }),
      provider: 'local',
    });
  }
});

app.post('/api/interview/respond', async (req, res) => {
  const {
    mode = 'hr',
    companyName = '',
    questionIndex = 0,
    answer = '',
    history = [],
    student_data: studentData,
  } = req.body || {};

  try {
    const content = await runChatCompletion(
      [
        {
          role: 'system',
          content: createInterviewPrompt({
            stage: 'respond',
            mode,
            companyName,
            studentData,
            history,
            answer,
            questionIndex,
          }),
        },
      ],
      {
        temperature: 0.4,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }
    );

    const parsed = JSON.parse(content);
    return res.json({
      ...parsed,
      questionIndex: questionIndex + 1,
      provider: 'llm',
    });
  } catch (error) {
    console.error('Interview response fallback:', error.message);
    return res.json({
      ...buildFallbackInterviewTurn({ mode, answer, questionIndex }),
      provider: 'local',
    });
  }
});

app.post('/api/interview/summary', async (req, res) => {
  const { mode = 'hr', transcript = [], student_data: studentData } = req.body || {};

  try {
    const content = await runChatCompletion(
      [
        {
          role: 'system',
          content: `You are an interview coach. Analyze this mock interview transcript and return strict JSON:
{
  "mode": "string",
  "averageScore": number,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "nextSteps": ["..."]
}

Interview mode: ${mode}
Student data: ${JSON.stringify(studentData || {})}
Transcript: ${JSON.stringify(transcript)}

Keep each list to 3 items max and make it practical.`,
        },
      ],
      {
        temperature: 0.3,
        max_tokens: 350,
        response_format: { type: 'json_object' },
      }
    );

    return res.json({
      ...JSON.parse(content),
      provider: 'llm',
    });
  } catch (error) {
    console.error('Interview summary fallback:', error.message);
    return res.json({
      ...buildFallbackInterviewSummary({ mode, transcript }),
      provider: 'local',
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Trending News API
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/news/trending', async (req, res) => {
  try {
    const q = 'technology OR "job market" OR hiring OR software';
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 15,
        apiKey: '10e42da5ba1c47d3a88a9fc077a76403'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error.message);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
