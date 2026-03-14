import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUIZZES = [
  {
    id: 1,
    category: 'Data Structures',
    title: 'Array and String Basics',
    difficulty: 'Easy',
    questions: [
      {
        question: 'Which of the following sorting algorithms has the best worst-case time complexity?',
        options: ['Quick Sort', 'Merge Sort', 'Bubble Sort', 'Insertion Sort'],
        correct: 1,
      },
      {
        question: 'What is the time complexity of searching for an element in a balanced Binary Search Tree?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'],
        correct: 2,
      },
      {
        question: 'Which data structure follows the LIFO principle?',
        options: ['Queue', 'Tree', 'Stack', 'Graph'],
        correct: 2,
      }
    ]
  },
  {
    id: 2,
    category: 'System Design',
    title: 'Scaling and Databases',
    difficulty: 'Medium',
    questions: [
      {
        question: 'Which of the following is NOT a benefit of database sharding?',
        options: ['Improved read/write performance', 'High availability', 'Simplified joins across tables', 'Horizontal scaling'],
        correct: 2,
      },
      {
        question: 'What is a typical use case for a Redis cache?',
        options: ['Long-term data warehousing', 'Storing user session data', 'Complex analytical queries', 'Full-text search indexing'],
        correct: 1,
      }
    ]
  },
  {
    id: 3,
    category: 'CS Fundamentals',
    title: 'OS and Networks',
    difficulty: 'Hard',
    questions: [
      {
        question: 'What is the OSI layer responsible for routing?',
        options: ['Data Link Layer', 'Network Layer', 'Transport Layer', 'Application Layer'],
        correct: 1,
      },
      {
        question: 'In operating systems, what causes a deadlock?',
        options: ['Mutual Exclusion', 'Hold and Wait', 'No Preemption', 'All of the above'],
        correct: 3,
      }
    ]
  },
  {
    id: 4,
    category: 'DBMS',
    title: 'SQL & Normalization',
    difficulty: 'Medium',
    questions: [
      {
        question: 'What is the highest normal form among these where transitive dependencies are removed?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        correct: 2,
      },
      {
        question: 'Which SQL command is used to remove a table entirely from the database structure?',
        options: ['DELETE', 'TRUNCATE', 'DROP', 'REMOVE'],
        correct: 2,
      },
      {
        question: 'What property of a transaction guarantees that all operations occur or none do?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correct: 0,
      }
    ]
  },
  {
    id: 5,
    category: 'Core Concepts',
    title: 'Object Oriented Programming',
    difficulty: 'Easy',
    questions: [
      {
        question: 'Which OOP principle is demonstrated by using private variables with public getters and setters?',
        options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
        correct: 2,
      },
      {
        question: 'What type of inheritance is mathematically impossible to implement directly using classes in Java?',
        options: ['Single', 'Multilevel', 'Hierarchical', 'Multiple'],
        correct: 3,
      },
      {
        question: 'What is method overloading an example of?',
        options: ['Runtime Polymorphism', 'Compile-time Polymorphism', 'Encapsulation', 'Dynamic Binding'],
        correct: 1,
      }
    ]
  },
  {
    id: 6,
    category: 'Data Structures',
    title: 'Trees and Graphs',
    difficulty: 'Hard',
    questions: [
      {
        question: 'Which graph traversal algorithm intrinsically uses a Queue data structure?',
        options: ['Inorder', 'Preorder', 'Depth First Search (DFS)', 'Breadth First Search (BFS)'],
        correct: 3,
      },
      {
        question: 'What is the worst-case time complexity of finding a specific node in an unbalanced Binary Search Tree?',
        options: ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'],
        correct: 1,
      },
      {
        question: 'Which algorithm is used to find the shortest path in a graph with negative edge weights?',
        options: ['Dijkstra', 'Prim', 'Bellman-Ford', 'Kruskal'],
        correct: 2,
      }
    ]
  },
  {
    id: 7,
    category: 'Aptitude',
    title: 'Quantitative Ability',
    difficulty: 'Medium',
    questions: [
      {
        question: 'If a train 100m long passes a pole in 10s, what is its speed?',
        options: ['10 m/s', '20 m/s', '36 km/hr', 'Both A and C'],
        correct: 3,
      },
      {
        question: 'Worker A can complete a task in 10 days. Worker B can do it in 15 days. How long if they work together?',
        options: ['5 days', '6 days', '8 days', '12.5 days'],
        correct: 1,
      },
      {
        question: 'A shopkeeper sells an item at a 20% profit. If the cost price was $50, what is the selling price?',
        options: ['$40', '$55', '$60', '$70'],
        correct: 2,
      }
    ]
  },
  {
    id: 8,
    category: 'System Design',
    title: 'Microservices & APIs',
    difficulty: 'Hard',
    questions: [
      {
        question: 'Which architectural pattern is best used to prevent cascading failures in microservices?',
        options: ['Singleton', 'Circuit Breaker', 'Observer', 'Factory'],
        correct: 1,
      },
      {
        question: 'Which of the following HTTP methods is considered idempotent?',
        options: ['POST', 'PATCH', 'GET, PUT, and DELETE', 'OPTIONS and POST'],
        correct: 2,
      },
      {
        question: 'What is the primary role of an API Gateway?',
        options: ['Database storage', 'Client-side rendering', 'Routing, rate limiting, and auth', 'Compiling code'],
        correct: 2,
      }
    ]
  },
  {
    id: 9,
    category: 'Algorithms',
    title: 'Dynamic Programming',
    difficulty: 'Hard',
    questions: [
      {
        question: 'How does Dynamic Programming fundamentally differ from Divide and Conquer?',
        options: ['It uses less memory', 'It solves overlapping subproblems', 'It only works on arrays', 'It avoids recursion completely'],
        correct: 1,
      },
      {
        question: 'Which of the following problems is best solved using Dynamic Programming?',
        options: ['Binary Search', '0/1 Knapsack', 'Merge Sort', 'Job Sequencing with Deadlines'],
        correct: 1,
      },
      {
        question: 'What is the technique called where you solve a DP problem top-down by saving answers to subproblems?',
        options: ['Tabulation', 'Memoization', 'Iteration', 'Greedy Choice'],
        correct: 1,
      }
    ]
  }
];

const PlacementQuiz = () => {
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResults(false);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === activeQuiz.questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    if (currentQuestion + 1 < activeQuiz.questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setShowResults(true);
    }
  };

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'bg-emerald-500/20 text-emerald-400';
      case 'Medium': return 'bg-amber-500/20 text-amber-400';
      case 'Hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/5 text-gray-400';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-2 text-gray-200 drop-shadow-sm">Placement Quiz 🧠</h1>
      <p className="text-gray-400 mb-8 font-medium">Test your knowledge across CS fundamentals, DSA, and System Design.</p>

      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {QUIZZES.map((quiz) => (
            <div key={quiz.id} className="bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 border border-white/10 group cursor-pointer" onClick={() => startQuiz(quiz)}>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getDifficultyColor(quiz.difficulty)} mb-4 inline-block`}>
                {quiz.difficulty}
              </span>
              <h3 className="text-xl font-bold text-gray-200 mb-2 group-hover:text-red-600 transition-colors">{quiz.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{quiz.category}</p>
              <div className="flex items-center justify-between text-sm font-medium text-gray-400">
                <span>{quiz.questions.length} Questions</span>
                <span className="text-blue-500 group-hover:translate-x-1 transition-transform">Start →</span>
              </div>
            </div>
          ))}
        </div>
      ) : showResults ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 rounded-2xl p-10 text-center max-w-xl mx-auto border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>
          <h2 className="text-3xl font-bold mb-4 text-gray-200">Quiz Completed!</h2>
          <div className="w-32 h-32 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-6 border-4 border-blue-500/20">
            <span className="text-4xl font-extrabold text-blue-400">
              {score}/{activeQuiz.questions.length}
            </span>
          </div>
          <p className="text-lg text-gray-400 mb-8 font-medium">
            {score === activeQuiz.questions.length ? 'Perfect score! Placement ready! 🎉' : 
             score > activeQuiz.questions.length / 2 ? 'Great job! Keep practicing! 💪' : 
             'Needs review. Time to hit the books! 📚'}
          </p>
          <button onClick={() => setActiveQuiz(null)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/10">
            Back to Quizzes
          </button>
        </motion.div>
      ) : (
        <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white/5 rounded-2xl p-8 max-w-2xl mx-auto border border-white/10 relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/10">
            <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${((currentQuestion) / activeQuiz.questions.length) * 100}%` }}></div>
          </div>
          
          <div className="mb-8 mt-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Question {currentQuestion + 1} of {activeQuiz.questions.length}</span>
            <h2 className="text-2xl font-bold text-gray-200 mt-2">{activeQuiz.questions[currentQuestion].question}</h2>
          </div>

          <div className="space-y-3 mb-8">
            {activeQuiz.questions[currentQuestion].options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAnswer(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${
                  selectedAnswer === idx 
                    ? 'border-red-500 bg-red-500/10 text-red-400' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleAnswerSubmit}
              disabled={selectedAnswer === null}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                selectedAnswer !== null 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              {currentQuestion + 1 === activeQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PlacementQuiz;