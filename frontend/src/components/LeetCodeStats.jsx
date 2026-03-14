import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { apiUrl } from '../services/api';

const LeetCodeStats = () => {
  const [dailyProblem, setDailyProblem] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [username, setUsername] = useState('markiv');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dailyOption, statsOption] = await Promise.allSettled([
          axios.get(apiUrl('/api/leetcode/daily')),
          axios.get(apiUrl(`/api/leetcode/user/${username}`))
        ]);
        if (dailyOption.status === 'fulfilled') setDailyProblem(dailyOption.value.data);
        if (statsOption.status === 'fulfilled') setUserStats(statsOption.value.data.stats);
      } catch (error) {
        console.error("Unexpected error fetching LeetCode data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [username]);

  if (loading) return <div className="animate-pulse bg-white/5 h-64 rounded-xl border border-white/10"></div>;

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-white">
          <span className="text-orange-400">LeetCode</span> Analytics
        </h2>
        <span className="text-sm bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-medium">Top 5%</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Problem */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Daily Challenge</h3>
            {dailyProblem && (
              <a href={dailyProblem.url} target="_blank" rel="noreferrer" className="text-xs text-orange-400 font-medium hover:underline flex items-center gap-0.5">
                View on LeetCode ↗
              </a>
            )}
          </div>
          {dailyProblem ? (
            <div className="space-y-3">
              <a href={dailyProblem.url} target="_blank" rel="noreferrer" className="font-bold text-lg text-white line-clamp-2 hover:text-orange-400 transition-colors block">
                {dailyProblem.title}
              </a>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                  dailyProblem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                  dailyProblem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {dailyProblem.difficulty}
                </span>
                <span className="text-xs text-gray-500">{dailyProblem.date}</span>
              </div>
              <a href={dailyProblem.url} target="_blank" rel="noreferrer" className="mt-4 inline-block w-full text-center py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors border border-white/10">
                Solve Now
              </a>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Could not load daily challenge.</p>
          )}
        </div>

        {/* User Stats */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Problem Stats</h3>
          {userStats ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400 font-medium">Easy</span>
                <span className="text-sm font-bold text-green-400">{userStats.Easy || 0}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.min((userStats.Easy / 200) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-400 font-medium">Medium</span>
                <span className="text-sm font-bold text-yellow-400">{userStats.Medium || 0}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.min((userStats.Medium / 150) * 100, 100)}%` }}></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-400 font-medium">Hard</span>
                <span className="text-sm font-bold text-red-400">{userStats.Hard || 0}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((userStats.Hard / 50) * 100, 100)}%` }}></div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Could not load stats.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeetCodeStats;
