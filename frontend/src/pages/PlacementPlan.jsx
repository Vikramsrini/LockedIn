import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, Zap, TrendingUp, BookOpen, Code, Brain, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';

const DAY_START_MINUTES = 8 * 60;
const DAY_END_MINUTES = 18 * 60;

function parseAcademicTime(timeStr) {
  const value = timeStr?.trim();
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem) {
    if (meridiem === 'AM' && hours === 12) hours = 0;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + minutes;
  }

  if (hours >= 1 && hours <= 6) {
    hours += 12;
  }

  return hours * 60 + minutes;
}

function formatAcademicTime(totalMinutes) {
  const normalizedHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = normalizedHours >= 12 ? 'PM' : 'AM';
  const hours12 = normalizedHours % 12 || 12;

  return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function formatDuration(durationMinutes) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

function parseClassWindow(timeStr) {
  const [startText, endText] = timeStr.split(' - ').map(part => part.trim());
  const startMinutes = parseAcademicTime(startText);
  const endMinutes = parseAcademicTime(endText);

  if (startMinutes == null || endMinutes == null) {
    return null;
  }

  return {
    startMinutes,
    endMinutes,
    startLabel: formatAcademicTime(startMinutes),
    endLabel: formatAcademicTime(endMinutes),
  };
}

function buildFreeWindow(day, fromMinutes, toMinutes, type) {
  const durationMinutes = toMinutes - fromMinutes;

  if (durationMinutes <= 30) {
    return null;
  }

  return {
    day,
    from: formatAcademicTime(fromMinutes),
    to: formatAcademicTime(toMinutes),
    durationMinutes,
    durationLabel: formatDuration(durationMinutes),
    type,
  };
}

function getPrepSuggestion(window, index) {
  // Under 45 min: Quick wins for core subjects & aptitude
  const quickTasks = [
    { task: 'DBMS Quick Revision (Indexing, Transactions)', category: 'Interview Prep', impact: '15 min interview questions covered' },
    { task: 'OS Fundamentals (Processes, Threads, Memory)', category: 'Interview Prep', impact: '10-12 OS interview questions covered' },
    { task: 'Aptitude Round: Solve 5 logical reasoning problems', category: 'Aptitude', impact: '+5 problems, accuracy boost' },
    { task: '5 CNNotes Review (TCP/IP, DNS, HTTP)', category: 'Interview Prep', impact: '8-10 networking questions covered' },
  ];

  // 45-90 min: Focused DSA + System Design
  const focusedTasks = [
    { task: 'DSA Block: Arrays & Strings (2 medium LeetCode)', category: 'LeetCode', impact: '2 problems solved, pattern mastered' },
    { task: 'Dynamic Programming (1 medium + 1 hard LeetCode)', category: 'LeetCode', impact: '2 problems solved, pattern recognition +1' },
    { task: 'System Design Basics (Load Balancing, Caching)', category: 'System Design', impact: '1 design concept ready for interviews' },
    { task: 'Mock Interview Round (Coding + DSA Q&A)', category: 'Mock Interview', impact: 'Full round simulation, feedback noted' },
    { task: 'Graph Problems (BFS, DFS, Topological Sort)', category: 'LeetCode', impact: '2 graph problems solved' },
  ];

  // 90+ min: Deep work - projects + comprehensive prep
  const deepWorkTasks = [
    { task: 'Full DSA Block (3-4 LeetCode problems + patterns)', category: 'LeetCode', impact: '30-40 interview questions covered via patterns' },
    { task: 'Project Milestone: Build feature + test + document', category: 'Resume Project', impact: '1 project milestone complete for resume' },
    { task: 'Full Mock Interview (60min coding + 30min HR)', category: 'Mock Interview', impact: 'Complete interview simulation with feedback' },
    { task: 'System Design Deep Dive (Database Sharding, Cache)', category: 'System Design', impact: '1 system design case fully prepared' },
    { task: 'Company-Specific Preparation (Past Papers + Pattern)', category: 'Company Prep', impact: '1 company pattern fully understood' },
  ];

  if (window.durationMinutes <= 45) {
    return quickTasks[index % quickTasks.length];
  }

  if (window.durationMinutes <= 90) {
    return focusedTasks[index % focusedTasks.length];
  }

  return deepWorkTasks[index % deepWorkTasks.length];
}

function calculateProgressMetrics(freeWindows) {
  if (freeWindows.length === 0) {
    return { weeklyHours: 0, estimatedDays: 0, weeklyProgress: 0 };
  }

  const totalMinutesPerWeek = freeWindows.reduce((sum, w) => sum + w.durationMinutes, 0);
  const weeklyHours = totalMinutesPerWeek / 60;

  // Placement readiness milestones (estimates)
  const PLACEMENT_HOURS_NEEDED = 120; // Total hours for solid placement readiness
  const CURRENT_PREP_HOURS = 0; // Assume starting from 0
  const REMAINING_HOURS = Math.max(0, PLACEMENT_HOURS_NEEDED - CURRENT_PREP_HOURS);

  // Calculate weeks and days to reach placement goal
  const weeksNeeded = weeklyHours > 0 ? Math.ceil(REMAINING_HOURS / weeklyHours) : 999;
  const daysNeeded = weeksNeeded * 7;

  // Weekly progress percentage (relative to 120 hours target)
  const weeklyProgress = Math.min(100, Math.round((weeklyHours / PLACEMENT_HOURS_NEEDED) * 100));

  return {
    weeklyHours: weeklyHours.toFixed(1),
    estimatedDays: daysNeeded,
    weeklyProgress,
    weeklyMinutes: totalMinutesPerWeek,
  };
}

// ── Analyze timetable to find free windows ──────────────────────────────
function analyzeSchedule(timetable) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const freeWindows = [];

  days.forEach(day => {
    const classes = timetable
      .filter(c => c.day === day)
      .map(entry => ({ ...entry, window: parseClassWindow(entry.time) }))
      .filter(entry => entry.window)
      .sort((a, b) => a.window.startMinutes - b.window.startMinutes);

    if (classes.length === 0) {
      const fullDayWindow = buildFreeWindow(day, DAY_START_MINUTES, DAY_END_MINUTES, 'full');
      if (fullDayWindow) {
        freeWindows.push(fullDayWindow);
      }
      return;
    }

    const first = classes[0].window;
    const last = classes[classes.length - 1].window;

    // Morning gap
    const morningWindow = buildFreeWindow(day, DAY_START_MINUTES, first.startMinutes, 'morning');
    if (morningWindow) {
      freeWindows.push(morningWindow);
    }

    // Between-class gaps
    for (let i = 0; i < classes.length - 1; i++) {
      const endCurr = classes[i].window.endMinutes;
      const startNext = classes[i + 1].window.startMinutes;
      const gapWindow = buildFreeWindow(day, endCurr, startNext, 'gap');

      if (gapWindow) {
        freeWindows.push(gapWindow);
      }
    }

    // Evening gap
    const eveningWindow = buildFreeWindow(day, last.endMinutes, DAY_END_MINUTES, 'evening');
    if (eveningWindow) {
      freeWindows.push(eveningWindow);
    }
  });

  return freeWindows;
}

// ── Generate subject-specific recommendations based on actual courses ───
function getPlacementRecommendations(timetable) {
  const subjects = [...new Set(timetable.map(c => c.subject))];
  const recs = [];

  subjects.forEach(sub => {
    const lower = sub.toLowerCase();

    if (lower.includes('data science')) {
      recs.push({
        subject: sub,
        icon: Brain,
        color: 'from-violet-500 to-purple-600',
        skills: ['Python (Pandas, NumPy, Scikit-learn)', 'SQL & Data Wrangling', 'Statistics & Probability', 'ML Algorithms (Regression, Classification)'],
        projects: ['Build a movie recommendation engine', 'Kaggle competition portfolio', 'Data visualization dashboard'],
        leetcode: ['Two Sum', 'Merge Intervals', 'Top K Frequent Elements'],
        companies: ['Google', 'Amazon', 'Microsoft', 'Flipkart'],
      });
    }

    if (lower.includes('cloud') && lower.includes('devops')) {
      recs.push({
        subject: sub,
        icon: Zap,
        color: 'from-cyan-500 to-blue-600',
        skills: ['Docker & Kubernetes', 'CI/CD Pipelines (Jenkins, GitHub Actions)', 'AWS / GCP / Azure fundamentals', 'Terraform & Infrastructure as Code'],
        projects: ['Deploy a microservices app on K8s', 'Build a CI/CD pipeline for a web app', 'AWS Certified Cloud Practitioner'],
        leetcode: ['Design HashSet', 'LRU Cache', 'Design Twitter'],
        companies: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Zoho'],
      });
    }

    if (lower.includes('software engineering')) {
      recs.push({
        subject: sub,
        icon: Code,
        color: 'from-emerald-500 to-teal-600',
        skills: ['Design Patterns (Singleton, Observer, Factory)', 'Agile & Scrum methodology', 'UML Diagrams & System Design', 'Version Control (Git advanced)'],
        projects: ['Contribute to open source on GitHub', 'Build a full-stack MERN/MEAN app', 'Create a system design portfolio'],
        leetcode: ['LRU Cache', 'Min Stack', 'Design Parking System'],
        companies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Zoho'],
      });
    }

    if (lower.includes('fog computing')) {
      recs.push({
        subject: sub,
        icon: TrendingUp,
        color: 'from-amber-500 to-orange-600',
        skills: ['Edge Computing concepts', 'IoT Protocols (MQTT, CoAP)', 'Distributed Systems', 'Latency optimization'],
        projects: ['IoT sensor data pipeline', 'Edge computing prototype with Raspberry Pi', 'Fog vs Cloud latency benchmark'],
        leetcode: ['Network Delay Time', 'Course Schedule', 'Number of Islands'],
        companies: ['Cisco', 'Intel', 'IBM', 'Qualcomm'],
      });
    }

    if (lower.includes('cloud product') && lower.includes('platform')) {
      recs.push({
        subject: sub,
        icon: Briefcase,
        color: 'from-rose-500 to-red-600',
        skills: ['Cloud Architecture Design', 'SaaS/PaaS/IaaS models', 'API Design & Management', 'Product lifecycle management'],
        projects: ['Design a cloud-native SaaS product', 'API gateway implementation', 'Cloud cost optimization report'],
        leetcode: ['Design Underground System', 'Time Based Key-Value Store', 'Snapshot Array'],
        companies: ['Salesforce', 'ServiceNow', 'Google Cloud', 'Oracle'],
      });
    }
  });

  return recs;
}

// ── Placement Roadmap phases ────────────────────────────────────────────
const ROADMAP = [
  {
    phase: 'Phase 1',
    title: 'Foundation (Weeks 1-4)',
    color: 'border-blue-500',
    dot: 'bg-blue-500',
    tasks: [
      'Master DSA basics: Arrays, Strings, Linked Lists, Stacks, Queues',
      'Solve 50 Easy LeetCode problems',
      'Build strong resume with projects from coursework',
      'Create LinkedIn and GitHub profiles',
    ],
  },
  {
    phase: 'Phase 2',
    title: 'Intermediate (Weeks 5-8)',
    color: 'border-emerald-500',
    dot: 'bg-emerald-500',
    tasks: [
      'DSA: Trees, Graphs, Dynamic Programming, Backtracking',
      'Solve 30 Medium LeetCode problems',
      'Start 1-2 significant portfolio projects',
      'Practice aptitude and verbal reasoning (TCS, Infosys pattern)',
    ],
  },
  {
    phase: 'Phase 3',
    title: 'Advanced (Weeks 9-12)',
    color: 'border-purple-500',
    dot: 'bg-purple-500',
    tasks: [
      'System Design fundamentals (Load Balancer, DB Sharding, Caching)',
      'Solve 20 Hard LeetCode problems',
      'Mock interviews (Pramp, InterviewBit)',
      'Prepare HR questions and behavioral stories (STAR method)',
    ],
  },
  {
    phase: 'Phase 4',
    title: 'Placement Ready (Weeks 13+)',
    color: 'border-red-500',
    dot: 'bg-red-500',
    tasks: [
      'Company-specific preparation (past papers, patterns)',
      'Daily 2-3 problem solving maintaining variety',
      'Group discussions and presentation skills',
      'Apply to off-campus drives and internships',
    ],
  },
];

const PlacementPlan = () => {
  const [timetable, setTimetable] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [activeRec, setActiveRec] = useState(0);

  useEffect(() => {
    const data = localStorage.getItem('student_data');
    if (data) setTimetable(JSON.parse(data).timetable || []);
    const saved = localStorage.getItem('lockedin_placement_progress');
    if (saved) setCompletedTasks(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('lockedin_placement_progress', JSON.stringify(completedTasks));
  }, [completedTasks]);

  const freeWindows = analyzeSchedule(timetable);
  const metrics = calculateProgressMetrics(freeWindows);
  const prepWindows = freeWindows.map((window, index) => ({
    ...window,
    suggestion: getPrepSuggestion(window, index),
  }));
  const recommendations = getPlacementRecommendations(timetable);

  const toggleTask = (phaseIdx, taskIdx) => {
    const key = `${phaseIdx}-${taskIdx}`;
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalTasks = ROADMAP.reduce((s, p) => s + p.tasks.length, 0);
  const doneCount = Object.values(completedTasks).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-1">Placement Plan</h1>
      <p className="text-gray-500 text-sm mb-8">Personalized roadmap based on your current subjects and schedule.</p>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Target size={18} className="text-red-500" /> Overall Progress</h3>
          <span className="text-sm font-bold text-red-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8 }}
            className="h-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{doneCount} of {totalTasks} tasks completed</p>
      </div>

      {/* Free time analysis & progress projection */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-8">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Your Free Windows for Prep</h3>
        
        {prepWindows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-100">
            {/* Metric: Weekly Hours */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Weekly Prep Hours</p>
              <p className="text-2xl font-bold text-blue-700">{metrics.weeklyHours}h</p>
              <p className="text-xs text-gray-600 mt-1">{metrics.weeklyMinutes} minutes available</p>
            </div>

            {/* Metric: Days to Placement Ready */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Road to Placement Ready</p>
              <p className="text-2xl font-bold text-emerald-700">{metrics.estimatedDays} days</p>
              <p className="text-xs text-gray-600 mt-1">at current prep pace</p>
            </div>

            {/* Metric: Weekly Progress */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-100">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Weekly Progress</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-purple-700">{metrics.weeklyProgress}%</p>
                <p className="text-xs text-gray-600 mb-1">of total goal</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
                  style={{ width: `${metrics.weeklyProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4">Only slots longer than 30 minutes are counted. Each one below is matched with a specific prep activity:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prepWindows.slice(0, 9).map((w, i) => (
            <div key={i} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{w.day}</p>
                  <p className="text-xs text-gray-500">{w.from} → {w.to}</p>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{w.durationLabel}</span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">{w.suggestion.task}</p>
                  <p className="text-[11px] text-gray-500 mt-1">📌 {w.suggestion.category}</p>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-[11px] text-emerald-700 font-medium">✓ {w.suggestion.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {prepWindows.length === 0 && (
          <p className="text-sm text-gray-500">No free block longer than 30 minutes was found in your current timetable.</p>
        )}
      </div>

      {/* Subject-specific recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><BookOpen size={18} className="text-purple-500" /> Course-Specific Placement Prep</h3>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {recommendations.map((rec, idx) => {
              const Icon = rec.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveRec(idx)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeRec === idx ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon size={16} />
                  {rec.subject.length > 25 ? rec.subject.substring(0, 25) + '...' : rec.subject}
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          {recommendations[activeRec] && (
            <motion.div
              key={activeRec}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Key Skills to Build</h4>
                  <div className="space-y-2">
                    {recommendations[activeRec].skills.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <ChevronRight size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Project Ideas</h4>
                  <div className="space-y-2">
                    {recommendations[activeRec].projects.map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Zap size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">LeetCode Problems</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations[activeRec].leetcode.map((l, i) => (
                      <a
                        key={i}
                        href={`https://leetcode.com/problems/${l.toLowerCase().replace(/\s+/g, '-')}/`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors"
                      >
                        {l}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Target Companies</h4>
                  <div className="flex flex-wrap gap-2">
                    {recommendations[activeRec].companies.map((c, i) => (
                      <span key={i} className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-full font-semibold">{c}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Placement Roadmap */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> 12-Week Placement Roadmap</h3>

        <div className="space-y-8">
          {ROADMAP.map((phase, phaseIdx) => (
            <div key={phaseIdx} className={`border-l-4 ${phase.color} pl-5 relative`}>
              <div className={`absolute -left-2.5 top-0 w-5 h-5 rounded-full ${phase.dot} border-4 border-white`} />
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">{phase.phase}</h4>
              <h3 className="text-lg font-bold text-gray-800 mt-1 mb-3">{phase.title}</h3>
              <div className="space-y-2">
                {phase.tasks.map((task, taskIdx) => {
                  const key = `${phaseIdx}-${taskIdx}`;
                  const done = completedTasks[key];
                  return (
                    <button
                      key={taskIdx}
                      onClick={() => toggleTask(phaseIdx, taskIdx)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        done ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <CheckCircle2 size={18} className={`flex-shrink-0 mt-0.5 ${done ? 'text-emerald-500' : 'text-gray-300'}`} />
                      <span className={`text-sm ${done ? 'text-emerald-700 line-through' : 'text-gray-700'}`}>{task}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlacementPlan;
