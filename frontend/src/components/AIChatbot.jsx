import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../services/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I am your Academic Ai Assistant. Ask me anything about your timetable, LeetCode, or doubts.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsTyping(true);

    try {
      const studentData = localStorage.getItem('student_data');
      const response = await axios.post(apiUrl('/api/chatbot/ask'), {
        message: userMessage.text,
        context: 'User is on the main Dashboard.',
        student_data: studentData ? JSON.parse(studentData) : null,
        history: nextMessages.map((entry) => ({
          role: entry.role,
          text: entry.text,
        })),
      });
      
      setMessages(prev => [...prev, { role: 'assistant', text: response.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Oops, I encountered an error connecting to the server.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.button 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all text-white font-bold z-50 group border border-white/30 backdrop-blur-md overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        </motion.button>
      )}

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              filter: 'blur(0px)',
              width: isMaximized ? '95vw' : '400px',
              height: isMaximized ? '90vh' : '600px',
              bottom: isMaximized ? '5vh' : '24px',
              right: isMaximized ? '2.5vw' : '24px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed max-h-[95vh] max-w-[95vw] glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/40 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-white/40 backdrop-blur-md border-b border-white/30 p-5 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 z-0"></div>
              <div className="flex items-center gap-3 z-10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner text-white">
                  ✨
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">AI Assistant</h3>
                  <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 z-10">
                <button 
                  onClick={() => setIsMaximized(!isMaximized)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 transition-colors text-gray-600 shadow-sm"
                  title={isMaximized ? "Restore down" : "Maximize"}
                >
                  {isMaximized ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-red-500 hover:text-white transition-colors text-gray-500 font-bold shadow-sm"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-transparent to-white/20 custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center mr-2 flex-shrink-0 text-xs shadow-sm">
                      🤖
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm shadow-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-indigo-500/20' 
                      : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/50 rounded-bl-sm shadow-black/5'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex justify-start items-end"
                >
                   <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center mr-2 text-xs">
                      🤖
                   </div>
                   <div className="bg-white/80 backdrop-blur-sm text-gray-500 px-4 py-3 rounded-2xl rounded-bl-sm border border-white/50 shadow-sm flex gap-1 items-center h-[44px]">
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                   </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/40">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask me anything..."
                  className="w-full bg-white/80 border border-indigo-100/50 rounded-full pl-5 pr-14 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner text-gray-700 placeholder-gray-400 font-medium"
                />
                <button 
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-1.5 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-40 disabled:bg-gray-400 hover:bg-indigo-700 hover:scale-105 transition-all shadow-md active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400 font-medium">Responses generated by Open Source AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
