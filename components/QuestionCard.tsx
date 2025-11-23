import React, { useState, useEffect } from 'react';
import { QuestionData, Language } from '../types';
import { Eye, EyeOff, Lightbulb, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface QuestionCardProps {
  data: Partial<QuestionData>;
  loading: boolean;
  language: Language;
  isStreaming?: boolean;
  index?: number;
}

const LABELS = {
  [Language.English]: {
    loading: "Generating problem...",
    problem: "Problem",
    showHint: "Show Hint",
    hideHint: "Hide Hint",
    showSolution: "Reveal Solution",
    hideSolution: "Hide Solution",
    hintTitle: "Hint",
    solutionTitle: "Solution",
    takeawayTitle: "Key Takeaway",
    streamingHint: "Generating hint...",
    streamingSolution: "Deriving solution..."
  },
  [Language.Chinese]: {
    loading: "正在生成题目...",
    problem: "问题",
    showHint: "显示提示",
    hideHint: "隐藏提示",
    showSolution: "显示解答",
    hideSolution: "隐藏解答",
    hintTitle: "提示",
    solutionTitle: "解答",
    takeawayTitle: "核心要点",
    streamingHint: "正在生成提示...",
    streamingSolution: "正在推导解答..."
  }
};

const QuestionCard: React.FC<QuestionCardProps> = ({ data, loading, language, isStreaming, index }) => {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const texts = LABELS[language] || LABELS[Language.English];

  // Reset state when title changes (new question)
  useEffect(() => {
    if (data?.title) {
      setShowHint(false);
      setShowSolution(false);
    }
  }, [data?.title]);

  if (loading && !data.title) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center min-h-[250px] animate-pulse">
        <div className="flex items-center gap-2 mb-4">
           <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{texts.problem} {index}</span>
        </div>
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">{texts.loading}</p>
      </div>
    );
  }

  const hasHint = !!data.hint && data.hint.length > 0;
  const hasSolution = !!data.solution && data.solution.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden transition-all duration-500 ease-in-out">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 px-8 py-6 border-b border-slate-100 relative">
        {index && (
          <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-bl-xl">
             {texts.problem} {index}
          </div>
        )}
        <h2 className="text-xl font-bold text-slate-800 tracking-tight pr-12">
          {data.title || <span className="animate-pulse bg-slate-200 rounded w-1/2 h-6 block"></span>}
        </h2>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="prose prose-slate max-w-none min-h-[60px]">
          {data.questionText ? (
             <div className="text-lg text-slate-700 leading-relaxed math-text">
               <ReactMarkdown
                 remarkPlugins={[remarkMath]}
                 rehypePlugins={[rehypeKatex]}
               >
                 {data.questionText}
               </ReactMarkdown>
               {isStreaming && <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-blink"></span>}
             </div>
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-100 pt-6">
          <button
            onClick={() => setShowHint(!showHint)}
            disabled={!hasHint}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors
              ${hasHint 
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' 
                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }
            `}
          >
            {isStreaming && !hasHint ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
               <Lightbulb size={18} />
            )}
            {isStreaming && !hasHint ? texts.streamingHint : (showHint ? texts.hideHint : texts.showHint)}
          </button>

          <button
            onClick={() => setShowSolution(!showSolution)}
            disabled={!hasSolution}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ml-auto transition-colors
              ${hasSolution
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
              }
            `}
          >
            {isStreaming && !hasSolution ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
               showSolution ? <EyeOff size={18} /> : <Eye size={18} />
            )}
             {isStreaming && !hasSolution ? texts.streamingSolution : (showSolution ? texts.hideSolution : texts.showSolution)}
          </button>
        </div>

        {/* Hint Section */}
        {showHint && hasHint && (
          <div className="mt-6 bg-amber-50/50 border border-amber-100 rounded-xl p-5 animate-fadeIn">
            <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-2">
              <Lightbulb size={16} /> {texts.hintTitle}
            </h4>
            <div className="text-slate-700 prose prose-sm max-w-none">
               <ReactMarkdown
                 remarkPlugins={[remarkMath]}
                 rehypePlugins={[rehypeKatex]}
               >
                 {data.hint || ''}
               </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Solution Section */}
        {showSolution && hasSolution && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-6 animate-fadeIn">
            <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <BookOpen size={16} /> {texts.solutionTitle}
            </h4>
            <div className="text-slate-800 math-text leading-relaxed prose prose-slate max-w-none">
               <ReactMarkdown
                 remarkPlugins={[remarkMath]}
                 rehypePlugins={[rehypeKatex]}
               >
                 {data.solution || ''}
               </ReactMarkdown>
            </div>
            
            {data.keyTakeaway && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} /> {texts.takeawayTitle}
                    </h4>
                    <p className="text-slate-600 text-sm italic">
                        {data.keyTakeaway}
                    </p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionCard;