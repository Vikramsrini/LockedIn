import React, { useState, useEffect } from 'react';

// ── Helper: check if class is currently ongoing ─────────────────────────
const isCurrentClass = (timeStr) => {
  if (!timeStr) return false;
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return false;
  
  const parseToMins = (t) => {
    let [h, m] = t.split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12;
    return h * 60 + m;
  };

  const startMins = parseToMins(parts[0]);
  const endMins = parseToMins(parts[1]);
  
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  return currentMins >= startMins && currentMins <= endMins;
};

// ── Helper: check if class is upcoming soon (next 30 mins) ──────────────
const isUpcomingSoon = (timeStr) => {
  if (!timeStr) return false;
  const parts = timeStr.split(' - ');
  if (parts.length !== 2) return false;
  
  const parseToMins = (t) => {
    let [h, m] = t.split(':').map(Number);
    if (h >= 1 && h <= 7) h += 12;
    return h * 60 + m;
  };

  const startMins = parseToMins(parts[0]);
  
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  return startMins > currentMins && startMins - currentMins <= 30;
};

const SmartReminder = ({ timetable = [] }) => {
  const [reminders, setReminders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute to keep reminders fresh
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 1. Static/Mock Reminders
    const baseReminders = [
      { id: 1, text: 'Complete LeetCode Daily Challenge', type: 'coding', icon: '💻', status: 'pending' },
      { id: 2, text: 'Review Data Science notes', type: 'study', icon: '📚', status: 'pending' },
    ];

    // 2. Dynamic Timetable Reminders (Live Real-Time Sync)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = timetable.filter(c => c.day === today);
    
    const activeClassReminders = [];
    
    todayClasses.forEach((c) => {
      // Find currently ongoing class
      if (isCurrentClass(c.time)) {
        activeClassReminders.push({
          id: `ongoing-${c.subject}`,
          text: `LIVE NOW: ${c.subject} (${c.room})`,
          type: 'ongoing class',
          icon: '🔴',
          status: 'live'
        });
      }
      // Find class starting in next 30 min
      else if (isUpcomingSoon(c.time)) {
        activeClassReminders.push({
          id: `upcoming-${c.subject}`,
          text: `Upcoming: ${c.subject} at ${c.time.split(' - ')[0]} (${c.room})`,
          type: 'starting soon',
          icon: '⏳',
          status: 'urgent'
        });
      }
    });

    if (activeClassReminders.length > 0) {
      setReminders([...activeClassReminders, ...baseReminders]);
    } else {
      // No active or upcoming class, show normal scheduled classes for today if any
      const nextClass = todayClasses.find(c => {
         const startHourMins = c.time.split(' - ')[0].split(':').map(Number);
         let h = startHourMins[0];
         if (h >= 1 && h <= 7) h += 12;
         return (h * 60 + startHourMins[1]) > (new Date().getHours() * 60 + new Date().getMinutes());
      });

      if (nextClass) {
        setReminders([{
          id: 'class-1',
          text: `Later Today: ${nextClass.subject} at ${nextClass.time} (${nextClass.room})`,
          type: 'schedule',
          icon: '🏛️',
          status: 'pending'
        }, ...baseReminders]);
      } else {
        setReminders(baseReminders);
      }
    }

  }, [timetable, currentTime]); // Re-run when time changes

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <span className="text-indigo-500">🔔</span> Smart Reminders
        </h2>
        <span className="text-xs font-semibold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
          {reminders.length} Active
        </span>
      </div>

      <div className="space-y-3">
        {reminders.length > 0 ? reminders.map((rem) => (
          <div 
            key={rem.id} 
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:-translate-y-0.5 ${
              rem.status === 'live' ? 'bg-red-50 border-red-200 shadow-md shadow-red-100/50 animate-pulse' :
              rem.status === 'urgent' ? 'bg-orange-50/50 border-orange-100 hover:border-orange-200' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50 hover:border-gray-200'
            }`}
          >
            <div className={`text-2xl mt-0.5 ${rem.status === 'live' ? 'animate-bounce' : ''}`}>{rem.icon}</div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                rem.status === 'live' ? 'text-red-900' :
                rem.status === 'urgent' ? 'text-orange-900' : 'text-gray-800'
              }`}>
                {rem.text}
              </p>
              <div className="flex justify-between items-center mt-3">
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  rem.status === 'live' ? 'text-red-600' :
                  rem.status === 'urgent' ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {rem.type}
                </span>
                <button className={`text-xs px-2.5 py-1.5 rounded-lg text-white font-medium transition-colors ${
                  rem.status === 'live' ? 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200' :
                  rem.status === 'urgent' ? 'bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200' : 'bg-indigo-500 hover:bg-indigo-600 shadow-sm shadow-indigo-200'
                }`}>
                  {rem.status === 'live' ? 'Focus Mode' : rem.status === 'urgent' ? 'Join Soon' : 'Mark Done'}
                </button>
              </div>
            </div>
          </div>
        )) : (
           <p className="text-sm text-gray-400">You're all caught up for now. 🎉</p>
        )}
      </div>
    </div>
  );
};

export default SmartReminder;
