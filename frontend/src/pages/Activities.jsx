import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Flame, BookOpen, Dumbbell, Code, Coffee, Zap, Brain, MonitorPlay, FileText, Target, TrendingUp } from 'lucide-react';

const CATEGORIES = [
  { key: 'dsa',      label: 'DSA',           icon: Code,        color: 'bg-cyan-500',    light: 'bg-cyan-50 text-cyan-700' },
  { key: 'leetcode', label: 'LeetCode',      icon: Zap,         color: 'bg-orange-500',  light: 'bg-orange-50 text-orange-700' },
  { key: 'system',   label: 'System Design', icon: Brain,       color: 'bg-purple-500',  light: 'bg-purple-50 text-purple-700' },
  { key: 'interview',label: 'Mock Interview',icon: MonitorPlay, color: 'bg-red-500',     light: 'bg-red-50 text-red-700' },
  { key: 'aptitude', label: 'Aptitude',      icon: BookOpen,    color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
  { key: 'resume',   label: 'Resume/Project',icon: FileText,    color: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700' },
  { key: 'fitness',  label: 'Fitness',       icon: Dumbbell,    color: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700' },
  { key: 'personal', label: 'Personal',      icon: Coffee,      color: 'bg-pink-500',    light: 'bg-pink-50 text-pink-700' },
];

const QUICK_TEMPLATES = [
  { label: '2 LeetCode (Easy)',        category: 'leetcode', duration: 30,  desc: 'Solve 2 easy problems' },
  { label: '1 LeetCode (Medium)',      category: 'leetcode', duration: 45,  desc: 'Solve 1 medium problem' },
  { label: 'DSA Session (1 hour)',     category: 'dsa',      duration: 60,  desc: 'Study & solve DSA problems' },
  { label: 'System Design (30 min)',   category: 'system',   duration: 30,  desc: 'Learn one design concept' },
  { label: 'Full Mock Interview',      category: 'interview',duration: 90,  desc: 'Full technical round simulation' },
  { label: 'Aptitude Test (30 min)',   category: 'aptitude', duration: 30,  desc: 'Solve aptitude questions' },
  { label: 'Resume/Project Work',      category: 'resume',   duration: 45,  desc: 'Work on portfolio project' },
  { label: 'Quick Study Break',        category: 'personal', duration: 15,  desc: 'Light reading & stretch' },
];

const STORAGE_KEY = 'lockedin_activities';
const WEEKLY_GOAL_MINUTES = 360; // 6 hours per week

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'dsa', duration: 30, notes: '' });
  const [viewMode, setViewMode] = useState('today'); // 'today', 'week', 'analytics'

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setActivities(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const getWeekStats = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekActivities = activities.filter(a => {
      const actDate = new Date(a.createdAt);
      return actDate >= weekStart && actDate <= weekEnd && a.completed;
    });
    
    const weekMinutes = weekActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    return { weekActivities, weekMinutes, weekProgress: Math.round((weekMinutes / WEEKLY_GOAL_MINUTES) * 100) };
  };

  const getStreak = () => {
    let streak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    const sortedByDate = [...activities]
      .filter(a => a.completed)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    for (const activity of sortedByDate) {
      const actDate = new Date(activity.createdAt);
      actDate.setHours(0, 0, 0, 0);
      
      if (actDate.getTime() === checkDate.getTime() || actDate.getTime() === new Date(checkDate.getTime() - 86400000).getTime()) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getCategoryStats = () => {
    const stats = {};
    CATEGORIES.forEach(cat => stats[cat.key] = 0);
    
    activities
      .filter(a => a.completed)
      .forEach(a => {
        if (stats[a.category] !== undefined) {
          stats[a.category] += a.duration || 0;
        }
      });
    
    return stats;
  };

  const addActivity = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const newActivity = {
      id: Date.now(),
      ...form,
      completed: false,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
    setActivities(prev => [newActivity, ...prev]);
    setForm({ title: '', category: 'dsa', duration: 30, notes: '' });
    setShowAdd(false);
  };

  const addTemplateActivity = (template) => {
    const newActivity = {
      id: Date.now(),
      title: template.label,
      category: template.category,
      duration: template.duration,
      notes: template.desc,
      completed: false,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const toggleComplete = (id) => {
    setActivities(prev =>
      prev.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
    );
  };

  const deleteActivity = (id) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const todayActivities = activities.filter(a => a.date === todayStr);
  const completedToday = todayActivities.filter(a => a.completed).length;
  const totalMinutesToday = todayActivities.filter(a => a.completed).reduce((s, a) => s + (a.duration || 0), 0);
  
  const { weekMinutes, weekProgress } = getWeekStats();
  const streak = getStreak();
  const categoryStats = getCategoryStats();
  const totalMinutes = Object.values(categoryStats).reduce((s, m) => s + m, 0);

  return (
    <div className="p-6 w-full max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activities</h1>
          <p className="text-gray-500 text-sm mt-1">Track placement prep, LeetCode, mock interviews, and progress toward your goal.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={18} /> Add Activity
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[
          { key: 'today', label: 'Today', icon: Clock },
          { key: 'week', label: 'This Week', icon: TrendingUp },
          { key: 'analytics', label: 'Analytics', icon: Target },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              viewMode === tab.key
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase">Today Completed</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{completedToday}/{todayActivities.length}</p>
          <p className="text-xs text-gray-400 mt-1">{totalMinutesToday} min</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase">Week Progress</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{weekProgress}%</p>
          <p className="text-xs text-gray-400 mt-1">{weekMinutes}/{WEEKLY_GOAL_MINUTES} min</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase">Total Hours</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{(totalMinutes / 60).toFixed(1)}h</p>
          <p className="text-xs text-gray-400 mt-1">{activities.filter(a => a.completed).length} completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase">Streak 🔥</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{streak} days</p>
          <p className="text-xs text-gray-400 mt-1">Keep it going!</p>
        </div>
      </div>

      {/* Quick Template Buttons */}
      {!showAdd && viewMode === 'today' && (
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Quick Add</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => addTemplateActivity(template)}
                className="px-3 py-2 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-gray-300 rounded-lg text-xs font-medium text-gray-700 transition-all hover:shadow-sm"
              >
                ⚡ {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addActivity}
            className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Solve 3 LeetCode problems"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.slice(0, 4).map(cat => (
                    <button
                      type="button"
                      key={cat.key}
                      onClick={() => setForm({ ...form, category: cat.key })}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        form.category === cat.key ? cat.light + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Any additional details..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg">Add</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Today View */}
      {viewMode === 'today' && (
        <div className="space-y-3">
          {todayActivities.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Clock size={48} className="mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No activities today</p>
              <p className="text-sm">Click "Add Activity" or use a quick template to get started.</p>
            </div>
          )}
          <AnimatePresence>
            {todayActivities.map(activity => {
              const cat = CATEGORIES.find(c => c.key === activity.category) || CATEGORIES[0];
              const CatIcon = cat.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className={`flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm transition-all ${
                    activity.completed ? 'opacity-60 bg-emerald-50' : 'hover:border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => toggleComplete(activity.id)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      activity.completed ? 'bg-emerald-500 text-white' : 'border-2 border-gray-300 text-transparent hover:border-emerald-400'
                    }`}
                  >
                    <Check size={16} />
                  </button>
                  <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0`}>
                    <CatIcon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-gray-800 ${activity.completed ? 'line-through' : ''}`}>{activity.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.light}`}>{cat.label}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{activity.duration} min</span>
                    </div>
                    {activity.notes && <p className="text-xs text-gray-500 mt-1">📝 {activity.notes}</p>}
                  </div>
                  <button onClick={() => deleteActivity(activity.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
            <h3 className="font-bold text-gray-800 mb-3">Week Goal Progress</h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all"
                style={{ width: `${Math.min(100, weekProgress)}%` }}
              />
            </div>
            <p className="text-sm text-gray-700 mt-3">{weekMinutes} / {WEEKLY_GOAL_MINUTES} minutes ({weekProgress}%)</p>
          </div>

          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp size={40} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activities yet this week</p>
              </div>
            ) : (
              activities.map(activity => {
                const cat = CATEGORIES.find(c => c.key === activity.category) || CATEGORIES[0];
                const CatIcon = cat.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center gap-3 bg-white rounded-lg border border-gray-100 p-3 ${
                      activity.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0`}>
                      <CatIcon size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-gray-800 ${activity.completed ? 'line-through' : ''}`}>{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.date} • {activity.duration} min</p>
                    </div>
                    {activity.completed && <div className="text-emerald-600 font-bold">✓</div>}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Time by Category</h3>
            <div className="space-y-3">
              {CATEGORIES.map(cat => {
                const minutes = categoryStats[cat.key] || 0;
                const hours = (minutes / 60).toFixed(1);
                const percentage = totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0;
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                        <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">{hours}h ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${cat.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Achievements</h3>
            <div className="space-y-3">
              {streak >= 1 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <Flame size={24} className="text-orange-500" />
                  <div>
                    <p className="font-semibold text-orange-900">{streak}-Day Streak</p>
                    <p className="text-xs text-orange-700">Keep it up!</p>
                  </div>
                </div>
              )}
              {totalMinutes >= 120 && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Zap size={24} className="text-emerald-500" />
                  <div>
                    <p className="font-semibold text-emerald-900">120 Min Milestone</p>
                    <p className="text-xs text-emerald-700">2 hours of prep done!</p>
                  </div>
                </div>
              )}
              {totalMinutes >= 360 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Target size={24} className="text-blue-500" />
                  <div>
                    <p className="font-semibold text-blue-900">6 Hour Achiever</p>
                    <p className="text-xs text-blue-700">Weekly goal reached!</p>
                  </div>
                </div>
              )}
              {activities.filter(a => a.completed).length >= 10 && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <TrendingUp size={24} className="text-purple-500" />
                  <div>
                    <p className="font-semibold text-purple-900">10 Activities Done</p>
                    <p className="text-xs text-purple-700">Consistency is key!</p>
                  </div>
                </div>
              )}
              {activities.filter(a => a.completed).length === 0 && (
                <p className="text-center text-gray-400 py-8">Complete activities to unlock achievements!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
