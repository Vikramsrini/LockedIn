import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiUrl } from '../services/api';

const STEPS = [
  { key: 'launch',     label: 'Launching browser...' },
  { key: 'navigate',   label: 'Connecting to SRM Academia...' },
  { key: 'iframe',     label: 'Waiting for login portal...' },
  { key: 'email',      label: 'Entering credentials...' },
  { key: 'password',   label: 'Submitting password...' },
  { key: 'signin',     label: 'Signing in...' },
  { key: 'loggedin',   label: 'Login successful! Fetching data...' },
  { key: 'timetable',  label: 'Navigating to My Time Table...' },
  { key: 'extracting', label: 'Extracting course data...' },
  { key: 'unified',    label: 'Fetching unified timetable...' },
  { key: 'slotmap',    label: 'Mapping slots to schedule...' },
  { key: 'done',       label: 'All done! Loading your dashboard...' },
];

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const eventSourceRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setCurrentStep(null);
    setCompletedSteps([]);

    // Generate session ID for SSE
    const sessionId = crypto.randomUUID();

    // Start SSE listener for progress updates
    const evtSource = new EventSource(apiUrl(`/api/auth/login/status/${sessionId}`));
    eventSourceRef.current = evtSource;

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.step === 'error') {
          setError(data.message);
          return;
        }
        setCurrentStep(data);
        setCompletedSteps(prev => {
          if (prev.some(s => s.step === data.step)) return prev;
          return [...prev, data];
        });
      } catch (_) { /* ignore parse errors */ }
    };

    evtSource.onerror = () => {
      evtSource.close();
    };

    try {
      const response = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, sessionId }),
      });

      const data = await response.json();

      // Close SSE
      evtSource.close();
      eventSourceRef.current = null;

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('student_data', JSON.stringify(data.student_data));
        localStorage.setItem('login_status_message', data.message || 'Login successful.');
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      evtSource.close();
      setError('Could not connect to the authentication server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Find position of current step in the STEPS array
  const currentStepIdx = currentStep
    ? STEPS.findIndex(s => s.key === currentStep.step)
    : -1;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Login with your SRM NetID to continue.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Progress Steps */}
        {loading && completedSteps.length > 0 && (
          <div className="mb-6 space-y-2">
            {completedSteps.map((step, idx) => {
              const isLatest = idx === completedSteps.length - 1;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 text-sm ${
                    isLatest ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {isLatest ? (
                    <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : (
                    <span className="text-green-400 flex-shrink-0">✓</span>
                  )}
                  <span>{step.message}</span>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                NetID / Email
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-600"
                placeholder="ab1234@srmist.edu.in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg shadow-lg flex justify-center items-center transition-all"
            >
              Connect to Academia
            </button>
          </form>
        )}

        {loading && completedSteps.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="w-8 h-8 border-2 border-white/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Connecting to server...</p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-500">
          Your credentials are securely sent to the API. We do not store your password.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
