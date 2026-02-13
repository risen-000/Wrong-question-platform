
import React, { useState } from 'react';
import { Question, QuestionType } from '../types';
import MathDisplay from './MathDisplay';
import { calculateNextReview } from '../services/geminiService';

interface ReviewSessionProps {
  questions: Question[];
  onComplete: (results: { id: string, quality: number, nextReviewDate: number, ef: number }[]) => void;
  onExit: () => void;
  title?: string;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ questions, onComplete, onExit, title = "间隔重复复习" }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleRate = (quality: number) => {
    // 质量评分约定：100 表示用户手动选择“完全掌握”
    let nextReviewDate: number;
    let ef: number;

    if (quality === 100) {
      nextReviewDate = Date.now() + 365 * 24 * 60 * 60 * 1000;
      ef = 2.5;
    } else {
      // 算法参数处理
      const currentEF = (currentQuestion as any).ef || 2.5;
      const currentInterval = currentQuestion.reviewCount === 0 ? 0 : 
        Math.round((currentQuestion.nextReviewDate - currentQuestion.lastReviewDate) / (24*60*60*1000));
      
      const calcResult = calculateNextReview(quality, currentInterval, currentEF);
      nextReviewDate = calcResult.nextReviewDate;
      ef = calcResult.ef;
    }

    const newResults = [...sessionResults, { 
      id: currentQuestion.id, 
      quality,
      nextReviewDate,
      ef
    }];
    setSessionResults(newResults);

    if (currentIndex < questions.length - 1) {
      setShowAnswer(false);
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      onComplete(newResults);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons-round text-4xl text-gray-300">task_alt</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">所有任务已完成</h2>
        <p className="text-gray-400 mt-2">太棒了！该科目的复习任务已经全部清空。</p>
        <button onClick={onExit} className="mt-8 bg-google-blue text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95">返回首页</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white animate-fade-in">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-google-blue">
          <span className="material-icons-round text-5xl">emoji_events</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">今日复习达成！</h2>
        <p className="text-gray-500 mt-2 mb-8">算法已根据你的反馈生成了新的记忆排期。</p>
        <button onClick={onExit} className="bg-gray-800 text-white px-12 py-3 rounded-full font-bold">查看学习进度</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
            <button onClick={onExit} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"><span className="material-icons-round">close</span></button>
            <div className="h-1.5 w-32 md:w-64 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-google-blue transition-all duration-500" style={{ width: `${((currentIndex) / questions.length) * 100}%` }}></div>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="flex items-center gap-2">
           {currentQuestion.isFromExample && (
             <span className="text-[9px] font-black text-white px-2 py-0.5 bg-google-red rounded-lg uppercase">例题转错题</span>
           )}
           <div className="text-[11px] font-black text-google-blue px-3 py-1 bg-blue-50 rounded-lg uppercase tracking-tighter">{currentQuestion.subject}</div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col min-h-0 overflow-hidden">
         <div className="flex-1 p-6 md:p-10 overflow-y-auto hide-scrollbar">
            <div className="flex justify-between items-start mb-8">
                <div className="flex gap-2">
                    {currentQuestion.tags.map(tag => (
                         <span key={tag} className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">#{tag}</span>
                    ))}
                </div>
                {showAnswer && (
                  <button 
                    onClick={() => handleRate(100)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-green-50 text-google-green rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100"
                  >
                    <span className="material-icons-round text-sm">check_circle</span>
                    这题我彻底会了
                  </button>
                )}
            </div>

            <div className="space-y-6">
                {(currentQuestion as any).image && (
                  <div className="rounded-2xl overflow-hidden border border-gray-50 shadow-sm inline-block">
                    <img src={(currentQuestion as any).image} alt="Question" className="max-h-80 object-contain" />
                  </div>
                )}
                <div className="text-xl md:text-2xl text-gray-800 font-medium leading-relaxed">
                    <MathDisplay text={currentQuestion.content} />
                </div>
            </div>
            
            {showAnswer && (
                <div className="mt-12 pt-12 border-t border-dashed border-gray-100 animate-slide-up space-y-6">
                    <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">答案解析</h3>
                    {(currentQuestion as any).ansImage && (
                      <div className="rounded-2xl overflow-hidden border border-orange-50 shadow-sm inline-block">
                        <img src={(currentQuestion as any).ansImage} alt="Answer" className="max-h-80 object-contain" />
                      </div>
                    )}
                    <div className="text-lg text-gray-700 leading-relaxed bg-blue-50/20 p-6 rounded-3xl border border-blue-50/50">
                        <MathDisplay text={currentQuestion.answer || "未录入详细解析"} />
                    </div>
                </div>
            )}
         </div>

         {/* Footer Controls */}
         <div className="p-6 bg-white border-t border-gray-50 z-10">
            {!showAnswer ? (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="w-full bg-google-blue text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
                >
                  <span className="material-icons-round">visibility</span>
                  显示解析与答案
                </button>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleRate(1)} className="group bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all active:scale-95">
                        <span className="material-icons-round text-2xl group-hover:scale-110 transition-transform">sentiment_very_dissatisfied</span>
                        <span className="text-[10px] uppercase font-black">{currentQuestion.type === QuestionType.CLASS_EXAMPLE ? '不会，转为错题' : '完全忘了'}</span>
                    </button>
                    <button onClick={() => handleRate(3)} className="group bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all active:scale-95">
                        <span className="material-icons-round text-2xl group-hover:scale-110 transition-transform">sentiment_neutral</span>
                        <span className="text-[10px] uppercase font-black">模糊不清</span>
                    </button>
                    <button onClick={() => handleRate(5)} className="group bg-green-50 hover:bg-green-100 text-green-600 py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all active:scale-95">
                        <span className="material-icons-round text-2xl group-hover:scale-110 transition-transform">sentiment_very_satisfied</span>
                        <span className="text-[10px] uppercase font-black">轻松掌握</span>
                    </button>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default ReviewSession;
