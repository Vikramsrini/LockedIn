import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Roadmap Generation Rules
const generateRoadmap = (jobTitle) => {
  const title = jobTitle.toLowerCase();
  
  if (title.includes('frontend') || title.includes('ui') || title.includes('react')) {
    return [
      { id: 1, title: 'Internet Fundamentals', desc: 'How the web works, HTTP/DNS, Browsers', duration: '1 Week', status: 'pending' },
      { id: 2, title: 'HTML, CSS & JavaScript', desc: 'Semantic HTML, Flexbox/Grid, ES6+, DOM Manipulation', duration: '3 Weeks', status: 'pending' },
      { id: 3, title: 'Version Control', desc: 'Git, GitHub, Branching strategies', duration: '1 Week', status: 'pending' },
      { id: 4, title: 'Frontend Framework (React)', desc: 'Components, Hooks, State Management (Redux/Zustand)', duration: '4 Weeks', status: 'pending' },
      { id: 5, title: 'CSS Architecture & Tools', desc: 'Tailwind CSS, SASS, CSS-in-JS', duration: '2 Weeks', status: 'pending' },
      { id: 6, title: 'Build Tools & Testing', desc: 'Vite, Webpack, Jest, React Testing Library', duration: '2 Weeks', status: 'pending' },
      { id: 7, title: 'Web Performance & Security', desc: 'Lighthouse, Core Web Vitals, XSS/CSRF', duration: '1 Week', status: 'pending' },
    ];
  }
  
  if (title.includes('backend') || title.includes('node') || title.includes('java ') || title.includes('server')) {
    return [
      { id: 1, title: 'Internet & OS Basics', desc: 'Networking, Terminal, POSIX basics', duration: '1 Week', status: 'pending' },
      { id: 2, title: 'Programming Language', desc: 'Deep dive into Python, Java, Go, or Node.js', duration: '3 Weeks', status: 'pending' },
      { id: 3, title: 'Relational Databases', desc: 'SQL, PostgreSQL/MySQL, Normalization, ACID', duration: '2 Weeks', status: 'pending' },
      { id: 4, title: 'APIs & Architecture', desc: 'REST, GraphQL, gRPC, Microservices basics', duration: '2 Weeks', status: 'pending' },
      { id: 5, title: 'NoSQL & Caching', desc: 'MongoDB, Redis, Memcached', duration: '1 Week', status: 'pending' },
      { id: 6, title: 'Security & Auth', desc: 'OAuth, JWT, Hashing, Web Security', duration: '1 Week', status: 'pending' },
      { id: 7, title: 'Message Brokers & CI/CD', desc: 'Kafka/RabbitMQ, Docker, GitHub Actions', duration: '2 Weeks', status: 'pending' },
    ];
  }

  if (title.includes('data') || title.includes('machine learning') || title.includes('ai')) {
    return [
      { id: 1, title: 'Mathematics Foundation', desc: 'Linear Algebra, Calculus, Statistics & Probability', duration: '4 Weeks', status: 'pending' },
      { id: 2, title: 'Python & Data Libraries', desc: 'Pandas, NumPy, Matplotlib, Scikit-Learn', duration: '3 Weeks', status: 'pending' },
      { id: 3, title: 'Data Preprocessing', desc: 'Cleaning, Feature Engineering, EDA', duration: '2 Weeks', status: 'pending' },
      { id: 4, title: 'Classical Machine Learning', desc: 'Regression, Classification, Clustering algorithms', duration: '4 Weeks', status: 'pending' },
      { id: 5, title: 'Deep Learning Foundation', desc: 'Neural Networks, PyTorch/TensorFlow', duration: '3 Weeks', status: 'pending' },
      { id: 6, title: 'Specialization (NLP/CV)', desc: 'Transformers, CNNs, HuggingFace', duration: '3 Weeks', status: 'pending' },
      { id: 7, title: 'MLOps & Deployment', desc: 'Docker, FastAPI, Model Serving', duration: '2 Weeks', status: 'pending' },
    ];
  }

  // Default Fallback
  return [
    { id: 1, title: 'Core Computer Science', desc: 'Data Structures & Algorithms, OS, Networks', duration: '4 Weeks', status: 'pending' },
    { id: 2, title: 'Primary Language Mastery', desc: 'Deep understanding of one main language (C++, Java, Python)', duration: '3 Weeks', status: 'pending' },
    { id: 3, title: 'Version Control & Tools', desc: 'Git, Terminal, IDE Proficiency', duration: '1 Week', status: 'pending' },
    { id: 4, title: 'Project Development', desc: 'Building a CRUD application end-to-end', duration: '4 Weeks', status: 'pending' },
    { id: 5, title: 'System Design Basics', desc: 'Scalability, Load Balancing, Databases', duration: '2 Weeks', status: 'pending' },
    { id: 6, title: 'Interview Preparation', desc: 'LeetCode, Mock Interviews, Resume Building', duration: '3 Weeks', status: 'pending' },
  ];
};

const JobRoadmap = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [currentJob, setCurrentJob] = useState('');

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    
    setIsGenerating(true);
    setRoadmap(null);
    setCurrentJob(jobTitle);

    // Simulate API delay for dramatic effect
    setTimeout(() => {
      setRoadmap(generateRoadmap(jobTitle));
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Job Role Roadmap Generator</h1>
        <p className="text-gray-500">Enter your target role and get a structured execution plan.</p>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-8 rounded-2xl mb-10 max-w-2xl mx-auto border border-white/10 shadow-xl">
        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="e.g. Frontend Engineer, Data Scientist, SDE..."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-white placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={isGenerating || !jobTitle.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center min-w-[160px]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/5 border-t-white rounded-full animate-spin" />
                Planning...
              </span>
            ) : (
              'Generate Path'
            )}
          </button>
        </form>
        <div className="mt-4 flex gap-2 flex-wrap justify-center">
          {['Frontend Developer', 'Backend Engineer', 'Data Scientist', 'DevOps'].map(tag => (
            <button
              key={tag}
              onClick={() => setJobTitle(tag)}
              className="text-xs bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-500/30 transition-colors border border-indigo-500/20"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Roadmap Visualization */}
      <AnimatePresence>
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-200">Your Path to <span className="text-indigo-600 capitalize">{currentJob}</span></h2>
              <p className="text-gray-500 mt-2">Estimated Time: {roadmap.length * 2} - {roadmap.length * 3} Weeks</p>
            </div>

            <div className="relative border-l-4 border-indigo-500/30 md:border-l-0 md:before:absolute md:before:border-l-4 md:before:border-indigo-500/30 md:before:h-full md:before:left-1/2 md:before:-ml-[2px] ml-4 md:ml-0 space-y-12 pb-12">
              {roadmap.map((step, index) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row'} flex-col md:justify-center w-full clear-both`}
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[-11px] md:left-1/2 md:-ml-[12px] w-6 h-6 rounded-full bg-black border-4 border-indigo-500 z-10"></div>

                  {/* Content Box */}
                  <div className={`w-full md:w-[45%] ml-6 md:ml-0 ${index % 2 === 0 ? 'md:mr-auto md:pr-8 md:text-right' : 'md:ml-auto md:pl-8 text-left'}`}>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-shadow relative group">
                      <div className={`absolute top-0 ${index % 2 === 0 ? 'right-0 rounded-tr-2xl rounded-bl-2xl' : 'left-0 rounded-tl-2xl rounded-br-2xl'} bg-indigo-500/20 text-indigo-400 px-4 py-1 text-xs font-bold`}>
                        Phase {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-gray-200 mt-4 mb-2 group-hover:text-indigo-600 transition-colors">{step.title}</h3>
                      <p className="text-gray-400 text-sm mb-4">{step.desc}</p>
                      
                      <div className={`flex items-center gap-4 ${index % 2 === 0 ? 'md:justify-end' : 'justify-start'}`}>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          ⏳ {step.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Completion Indicator */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: roadmap.length * 0.15 + 0.3 }}
              className="mt-8 flex justify-center"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3">
                <span>🎯</span>
                Ready for Real Interviews!
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default JobRoadmap;
