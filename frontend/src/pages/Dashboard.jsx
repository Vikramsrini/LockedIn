import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import LeetCodeStats from '../components/LeetCodeStats';
import AIChatbot from '../components/AIChatbot';
import FeatureGrid from '../components/FeatureGrid';
import Activities from './Activities';
import PlacementPlan from './PlacementPlan';
import PlacementQuiz from './PlacementQuiz';
import JobRoadmap from './JobRoadmap';
import JobTracker from './JobTracker';
import Trending from './Trending';
import Leaderboard from './Leaderboard';
import StudyRoom from './StudyRoom';
import SmartReminder from '../components/SmartReminder';
import { 
  LayoutDashboard, 
  Calendar, 
  PenTool, 
  Rocket, 
  BrainCircuit, 
  Map, 
  Briefcase, 
  TrendingUp, 
  Trophy, 
  Users, 
  LogOut 
} from 'lucide-react';

const getTodayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

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

// ═══════════════════════════════════════════════════════════════════════
// Dashboard Overview
// ═══════════════════════════════════════════════════════════════════════
const DashboardOverview = () => {
  const [studentData, setStudentData] = React.useState(null);
  const [loginMessage, setLoginMessage] = React.useState('');

  React.useEffect(() => {
    const data = localStorage.getItem('student_data');
    if (data) setStudentData(JSON.parse(data));
    setLoginMessage(localStorage.getItem('login_status_message') || '');
  }, []);

  const timetable = studentData?.timetable || [];
  const today = getTodayName();
  const todayClasses = timetable.filter(c => c.day === today);
  const uniqueSubjects = [...new Set(timetable.map(c => c.subject))].length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">
        {studentData?.name ? `Hey, ${studentData.name.split(' ')[0]}!` : 'Student Dashboard'}
      </h1>

      {loginMessage && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {loginMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 transition-all hover:border-white/20">
          <h3 className="text-gray-400 text-sm font-medium">Classes Today</h3>
          <p className="text-4xl font-bold mt-2 text-blue-400">{todayClasses.length}</p>
          <p className="text-xs text-gray-500 mt-1">{today}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 transition-all hover:border-white/20">
          <h3 className="text-gray-400 text-sm font-medium">Total Subjects</h3>
          <p className="text-4xl font-bold mt-2 text-purple-400">{uniqueSubjects}</p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 transition-all hover:border-white/20">
          <h3 className="text-gray-400 text-sm font-medium">LeetCode Streak</h3>
          <p className="text-4xl font-bold mt-2 text-orange-400">12 🔥</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col gap-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-bold mb-4 text-white">Classes Today ({today})</h2>
            <div className="space-y-3">
              {todayClasses.length > 0 ? todayClasses.map((c, i) => {
                const isActive = isCurrentClass(c.time);
                return (
                  <div key={i} className={`flex items-center justify-between p-4 rounded-lg transform transition-all duration-300 ${
                    isActive 
                      ? 'bg-red-500/10 border border-red-500/30 scale-[1.02]' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-bold ${isActive ? 'text-red-400' : 'text-white'}`}>{c.subject}</p>
                        {isActive && <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>}
                      </div>
                      <p className={`text-sm ${isActive ? 'text-red-400 font-medium' : 'text-gray-500'}`}>{c.time} {isActive && '(Ongoing)'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        isActive ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>{c.room || 'TBD'}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-gray-500">No classes scheduled for today. 🎉</p>}
            </div>
          </div>
          <SmartReminder timetable={timetable} />
        </div>
        <div className="flex flex-col gap-6">
          <LeetCodeStats />
        </div>
      </div>

      <div className="mt-8">
        <FeatureGrid
          theme="dark"
          eyebrow="Focus Toolkit"
          title="Built Into Your Dashboard"
          description="These features are available directly inside the portal so you can plan, execute, and track progress without switching contexts."
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Full Week Timetable View
// ═══════════════════════════════════════════════════════════════════════
const Timetable = () => {
  const [timetable, setTimetable] = React.useState([]);

  React.useEffect(() => {
    const data = localStorage.getItem('student_data');
    if (data) setTimetable(JSON.parse(data).timetable || []);
  }, []);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const today = getTodayName();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">My Timetable</h1>

      {days.map(day => {
        const classes = timetable.filter(c => c.day === day);
        if (classes.length === 0) return null;

        return (
          <div key={day} className="mb-6">
            <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
              day === today ? 'text-red-400' : 'text-gray-300'
            }`}>
              {day === today && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
              {day}
              {day === today && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">Today</span>}
            </h2>
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {classes.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-400 font-mono">{item.time}</td>
                      <td className="px-6 py-3 text-sm font-medium text-white">{item.subject}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{item.room || 'TBD'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Dashboard Shell (sidebar + routes)
// ═══════════════════════════════════════════════════════════════════════
const navItems = [
  { to: '/dashboard',            icon: <LayoutDashboard size={20} strokeWidth={1.5} />, label: 'Overview' },
  { to: '/dashboard/timetable',  icon: <Calendar size={20} strokeWidth={1.5} />, label: 'Timetable' },
  { to: '/dashboard/activities', icon: <PenTool size={20} strokeWidth={1.5} />, label: 'Activities' },
  { to: '/dashboard/placement',  icon: <Rocket size={20} strokeWidth={1.5} />, label: 'Placement Plan' },
  { to: '/dashboard/quiz',       icon: <BrainCircuit size={20} strokeWidth={1.5} />, label: 'Placement Quiz' },
  { to: '/dashboard/roadmap',    icon: <Map size={20} strokeWidth={1.5} />, label: 'Job Roadmap' },
  { to: '/dashboard/tracker',    icon: <Briefcase size={20} strokeWidth={1.5} />, label: 'Job Tracker' },
  { to: '/dashboard/trending',   icon: <TrendingUp size={20} strokeWidth={1.5} />, label: 'Trending' },
  { to: '/dashboard/leaderboard',icon: <Trophy size={20} strokeWidth={1.5} />, label: 'Leaderboard' },
  { to: '/dashboard/study-room', icon: <Users size={20} strokeWidth={1.5} />, label: 'Study Room' },
];

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleSignOut = () => {
    localStorage.removeItem('student_data');
    localStorage.removeItem('login_status_message');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-transparent">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white/3 backdrop-blur-md border-r border-white/10 flex flex-col z-20 transition-all duration-300 relative`}>
        <div className={`p-6 border-b border-white/10 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {isSidebarOpen ? (
            <div className="font-bold text-2xl tracking-tighter text-white">Locked<span className="text-red-500">In</span></div>
          ) : (
            <div className="font-bold text-2xl tracking-tighter text-red-500">L</div>
          )}
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors z-50 ${!isSidebarOpen ? 'absolute -right-3 top-7 bg-black border border-white/20 rounded-full w-7 h-7 flex items-center justify-center' : ''}`}
            title="Toggle Sidebar"
          >
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            )}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map(item => {
            const isActive = location.pathname === item.to ||
              (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

            return (
              <Link
                key={item.to}
                to={item.to}
                title={!isSidebarOpen ? item.label : ""}
                className={`flex items-center ${isSidebarOpen ? 'px-4' : 'justify-center'} py-3 font-medium rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 translate-x-1'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={`${isSidebarOpen ? 'mr-3' : ''} text-xl`}>{item.icon}</span> 
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className={`p-4 border-t border-white/10 flex ${!isSidebarOpen ? 'justify-center' : ''}`}>
          <button
            onClick={handleSignOut}
            title={!isSidebarOpen ? "Sign Out" : ""}
            className={`flex items-center ${isSidebarOpen ? 'w-full px-4' : 'justify-center'} py-3 font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 hover:translate-x-1`}
          >
            <span className={`${isSidebarOpen ? 'mr-3' : ''} grid place-items-center`}><LogOut size={20} strokeWidth={1.5} /></span>
            {isSidebarOpen && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto z-10 relative">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/placement" element={<PlacementPlan />} />
          <Route path="/quiz" element={<PlacementQuiz />} />
          <Route path="/roadmap" element={<JobRoadmap />} />
          <Route path="/tracker" element={<JobTracker />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/study-room" element={<StudyRoom />} />
        </Routes>
      </main>

      <div className="z-50 relative">
        <AIChatbot />
      </div>
    </div>
  );
};

export default Dashboard;
