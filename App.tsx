import React, { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Sparkles, AlertCircle, Zap, Search } from 'lucide-react';
import { Difficulty, Topic, QuestionData, Language, Model } from './types';
import { streamQuestion } from './services/geminiService';
import Selector from './components/Selector';
import QuestionCard from './components/QuestionCard';

const BATCH_SIZE = 6;

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [topic, setTopic] = useState<Topic>(Topic.Probability);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [language, setLanguage] = useState<Language>(Language.English);
  const [model, setModel] = useState<Model>(Model.Flash);
  
  // ACTIVE QUESTIONS (Currently Displayed)
  const [activeQuestions, setActiveQuestions] = useState<Partial<QuestionData>[]>([]);
  const [activeLoading, setActiveLoading] = useState<boolean[]>(Array(BATCH_SIZE).fill(false));
  
  // BUFFER QUESTIONS (Pre-loading in background)
  const [bufferQuestions, setBufferQuestions] = useState<Partial<QuestionData>[]>([]);
  // To avoid double-fetching, we track if buffer is currently being filled
  const [isBufferLoading, setIsBufferLoading] = useState(false);
  // Track if buffer is "ready" (all 6 have enough content to be shown)
  const [isBufferReady, setIsBufferReady] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Helper to generate a batch of questions
  const generateBatch = async (
    isForeground: boolean, // If true, updates Active state. If false, updates Buffer.
    targetTopic: Topic,
    targetCustomTopic: string,
    targetDifficulty: Difficulty,
    targetLanguage: Language,
    targetModel: Model
  ) => {
    const numberOfQuestions = BATCH_SIZE;
    
    if (isForeground) {
      setActiveLoading(Array(BATCH_SIZE).fill(true));
      setActiveQuestions(Array(BATCH_SIZE).fill({})); // Clear current
    } else {
      setIsBufferLoading(true);
      setIsBufferReady(false);
      setBufferQuestions(Array(BATCH_SIZE).fill({}));
    }

    const promises = Array.from({ length: numberOfQuestions }).map(async (_, index) => {
      try {
        await streamQuestion(
          targetTopic, 
          targetCustomTopic,
          targetDifficulty, 
          targetLanguage, 
          targetModel, 
          (partialData) => {
            if (isForeground) {
              setActiveQuestions((prev) => {
                const newQ = [...prev];
                newQ[index] = { ...newQ[index], ...partialData };
                return newQ;
              });
            } else {
              setBufferQuestions((prev) => {
                const newQ = [...prev];
                newQ[index] = { ...newQ[index], ...partialData };
                return newQ;
              });
            }
        });
      } catch (err) {
        console.error(`Error generating question ${index + 1}`, err);
      } finally {
        if (isForeground) {
          setActiveLoading((prev) => {
            const newS = [...prev];
            newS[index] = false;
            return newS;
          });
        }
      }
    });

    await Promise.all(promises);
    
    if (!isForeground) {
      setIsBufferLoading(false);
      setIsBufferReady(true);
      console.log("Buffer ready!");
    }
  };

  const handleGenerate = async () => {
    setError(null);
    
    // Case 1: We have a ready buffer matching current settings
    if (isBufferReady && bufferQuestions.length === BATCH_SIZE) {
      console.log("Swapping buffer to active...");
      // Swap buffer to active
      setActiveQuestions(bufferQuestions);
      setActiveLoading(Array(BATCH_SIZE).fill(false));
      
      // Clear buffer flags
      setIsBufferReady(false);
      setBufferQuestions([]);
      
      // Trigger refill of buffer immediately
    } else {
      // Case 2: Buffer not ready or empty -> Generate directly to Active
      console.log("Buffer empty, generating directly...");
      await generateBatch(true, topic, customTopic, difficulty, language, model);
    }
  };

  // Effect: Refill Buffer whenever Active Questions are populated and stable
  useEffect(() => {
    const hasActive = activeQuestions.some(q => q.title);
    const isActiveLoading = activeLoading.some(l => l);
    
    // If we have active questions, they aren't loading, and buffer is empty/not loading...
    if (hasActive && !isActiveLoading && !isBufferLoading && !isBufferReady) {
       console.log("Triggering background preload...");
       generateBatch(false, topic, customTopic, difficulty, language, model);
    }
  }, [activeQuestions, activeLoading, isBufferLoading, isBufferReady, topic, customTopic, difficulty, language, model]);


  // If user changes settings, invalidate buffer
  useEffect(() => {
    setIsBufferReady(false);
    setBufferQuestions([]);
    setIsBufferLoading(false); 
  }, [topic, customTopic, difficulty, language, model]);

  const isAnyActiveLoading = activeLoading.some(state => state);
  const hasQuestions = activeQuestions.some(q => q.title || q.questionText);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quant<span className="text-indigo-600">Prep</span> AI
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {isBufferLoading && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-indigo-400 animate-pulse bg-indigo-50 px-3 py-1 rounded-full">
                 <Zap size={14} />
                 {language === Language.Chinese ? '后台正在预加载下一组...' : 'Pre-loading next set...'}
              </div>
            )}
            <div className="text-sm font-medium text-slate-500 hidden sm:block">
              Powered by Gemini
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2">
               <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                 {language === Language.Chinese ? '主题' : 'Topic'}
               </h3>
               
               {/* Topic Selector */}
               <div className="mb-4">
                 <div className="flex flex-wrap gap-2">
                    {Object.values(Topic).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setTopic(t);
                          setCustomTopic(""); // Clear custom topic if they pick a preset
                        }}
                        className={`
                          px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border
                          ${
                            (topic === t && !customTopic)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }
                        `}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
               </div>

               {/* Custom Topic Input */}
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   <Search size={16} className="text-slate-400" />
                 </div>
                 <input
                   type="text"
                   value={customTopic}
                   onChange={(e) => setCustomTopic(e.target.value)}
                   placeholder={language === Language.Chinese 
                     ? "或输入自定义主题 (例如: 蒙特卡洛模拟, 马尔可夫链)" 
                     : "Or type a custom topic (e.g., Monte Carlo, Markov Chains)"}
                   className={`
                     w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all
                     ${customTopic ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-200 bg-slate-50'}
                   `}
                 />
               </div>
            </div>

            <div>
                <Selector<Difficulty>
                    title="Difficulty" 
                    options={Object.values(Difficulty) as Difficulty[]} 
                    selected={difficulty} 
                    onChange={setDifficulty} 
                />
            </div>
            
            <div className="space-y-6">
                <Selector<Language>
                    title="Language" 
                    options={Object.values(Language) as Language[]} 
                    selected={language} 
                    onChange={setLanguage} 
                />
                <Selector<Model>
                    title="Model" 
                    options={Object.values(Model) as Model[]} 
                    selected={model} 
                    onChange={setModel} 
                />
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-6">
            <button
              onClick={handleGenerate}
              disabled={isAnyActiveLoading}
              className={`
                flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white shadow-md transition-all
                ${isAnyActiveLoading
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                }
              `}
            >
              {isAnyActiveLoading ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles size={18} />
                  {/* Label changes if buffer is ready to indicate speed */}
                  {isBufferReady 
                    ? (language === Language.Chinese ? '显示下一组 (已就绪)' : 'Show Next Set (Ready)') 
                    : (language === Language.Chinese ? '生成题目' : 'Generate Questions')}
                </>
              )}
            </button>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="max-w-3xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* Questions List */}
        <div className="space-y-8">
          {/* Initial State / Placeholder */}
          {!hasQuestions && !isAnyActiveLoading && (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
               <h3 className="text-xl font-medium text-slate-400">
                  {language === Language.Chinese ? '准备好开始练习了吗？' : 'Ready to practice?'}
               </h3>
               <p className="text-slate-400 mt-2">
                  {language === Language.Chinese ? '选择你的偏好并点击生成' : 'Select your preferences and click generate'}
               </p>
            </div>
          )}

          {/* Render Cards */}
          {(hasQuestions || isAnyActiveLoading) && activeQuestions.map((q, idx) => (
            <QuestionCard 
              key={idx}
              index={idx + 1}
              data={q} 
              loading={activeLoading[idx]} 
              language={language} 
              isStreaming={activeLoading[idx]}
            />
          ))}
        </div>

      </main>
    </div>
  );
};

export default App;