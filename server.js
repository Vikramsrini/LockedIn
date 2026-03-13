import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import TIMETABLE from './timetableData.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
    });

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