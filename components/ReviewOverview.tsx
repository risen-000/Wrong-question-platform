
import React, { useMemo, useState } from 'react';
import { Question, Subject, QuestionType } from '../types';

interface ReviewOverviewProps {
  questions: Question[];
  onStartReview: (subject?: string, type?: QuestionType) => void;
}

const ReviewOverview: React.FC<ReviewOverviewProps> = ({ questions, onStartReview }) => {
  const [showLogicModal, setShowLogicModal] = useState(false);
  const now = Date.now();

  // 数据计算
  const subjectStats = useMemo(() => {
    return Object.values(Subject).map(s => {
      const subQuestions = questions.filter(q => q.subject === s);
      const dueCount = subQuestions.filter(q => !q.isMastered && q.nextReviewDate <= now).length;
      const totalCount = subQuestions.length;
      const masteryAvg = subQuestions.length > 0
        ? subQuestions.reduce((sum, q) => sum + (q.masteryLevel || 0), 0) / subQuestions.length
        : 0;

      return { subject: s, dueCount, totalCount, masteryAvg };
    });
  }, [questions, now]);

  const totalDue = useMemo(() => questions.filter(q => !q.isMastered && q.nextReviewDate <= now).length, [questions, now]);

  const masteryDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0]; // 0-1 (新题/生疏), 2-3 (熟悉), 4-5 (掌握), 已熟练
    questions.forEach(q => {
      if (q.isMastered) dist[3]++;
      else if (q.masteryLevel >= 4) dist[2]++;
      else if (q.masteryLevel >= 2) dist[1]++;
      else dist[0]++;
    });
    return dist;
  }, [questions]);

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* 顶部标题与说明按钮 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight">复习中心</h1>
            <button
              onClick={() => setShowLogicModal(true)}
              className="mt-1 p-1 text-gray-300 hover:text-google-blue transition-colors"
              title="了解复习逻辑"
            >
              <span className="material-icons-round text-xl">help_outline</span>
            </button>
          </div>
          <p className="text-gray-400 mt-1 font-medium">基于艾宾浩斯曲线，专注攻克薄弱环节</p>
        </div>
        {totalDue > 0 && (
          <button
            onClick={() => onStartReview('全科')}
            className="w-full md:w-auto px-8 py-3 bg-google-blue text-white rounded-2xl font-bold shadow-xl shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="material-icons-round">bolt</span>
            开始全部到期任务 ({totalDue})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：掌握程度分布 */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <span className="material-icons-round text-sm">analytics</span>
            掌握度分布
          </h3>
          <div className="space-y-4">
            {[
              { label: '生疏/新题', count: masteryDistribution[0], color: 'bg-red-400' },
              { label: '正在记忆', count: masteryDistribution[1], color: 'bg-yellow-400' },
              { label: '基本掌握', count: masteryDistribution[2], color: 'bg-blue-400' },
              { label: '牢固掌握', count: masteryDistribution[3], color: 'bg-green-500' },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-800">{item.count} 题</span>
                </div>
                <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden">
                  <div
                    className={`${item.color} h-full transition-all duration-1000`}
                    style={{ width: `${(item.count / (questions.length || 1)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] text-google-blue font-black uppercase mb-1">小贴士</p>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">优先复习“生疏”类题目，可以最有效提升整体掌握率。</p>
          </div>
        </div>

        {/* 右侧：学科雷达列表 */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
            <span className="material-icons-round text-sm">assignment_late</span>
            待复习学科
          </h3>
          {subjectStats.map(stat => (
            <div key={stat.subject} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${stat.dueCount > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-50 text-gray-300'}`}>
                  {stat.subject.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{stat.subject}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                    <span>总计 {stat.totalCount} 题</span>
                    <span>•</span>
                    <span className={stat.dueCount > 0 ? 'text-orange-500 font-bold' : ''}>
                      {stat.dueCount} 题待复习
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:block text-right">
                  <p className="text-[10px] text-gray-300 font-black uppercase">平均掌握度</p>
                  <p className="text-sm font-bold text-gray-600">{(stat.masteryAvg * 20).toFixed(0)}%</p>
                </div>
                <button
                  disabled={stat.dueCount === 0}
                  onClick={() => onStartReview(stat.subject)}
                  className={`p-3 rounded-2xl transition-all ${stat.dueCount > 0 ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 active:scale-90' : 'bg-gray-50 text-gray-200 cursor-not-allowed'}`}
                >
                  <span className="material-icons-round">play_arrow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 专项过滤复习 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl border border-red-100 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-2xl text-red-500 shadow-sm">
              <span className="material-icons-round text-2xl">warning</span>
            </div>
            <div>
              <h4 className="font-bold text-red-800">错题专项训练</h4>
              <p className="text-xs text-red-600/70 mt-1">仅复习录入的错误题目</p>
            </div>
          </div>
          <button
            onClick={() => onStartReview(undefined, QuestionType.WRONG_QUESTION)}
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-colors"
          >
            开始
          </button>
        </div>

        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 flex items-center justify-between">
          <div className="flex gap-4">
            <div className="bg-white p-3 rounded-2xl text-blue-500 shadow-sm">
              <span className="material-icons-round text-2xl">auto_stories</span>
            </div>
            <div>
              <h4 className="font-bold text-blue-800">金牌例题巩固</h4>
              <p className="text-xs text-blue-600/70 mt-1">深度温习课上经典例题</p>
            </div>
          </div>
          <button
            onClick={() => onStartReview(undefined, QuestionType.CLASS_EXAMPLE)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
          >
            开始
          </button>
        </div>
      </div>

      {/* 复习逻辑说明弹窗 */}
      {showLogicModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-google-blue rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <span className="material-icons-round text-white text-2xl">psychology</span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-gray-800">复习逻辑是如何工作的？</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">SM-2 间隔重复算法科普</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogicModal(false)}
                className="p-2 hover:bg-white rounded-full transition-colors text-gray-400"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* 第一部分：核心概念 */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-round text-google-blue">show_chart</span>
                    <h5 className="font-bold text-gray-800">遗忘曲线</h5>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    人类的记忆在刚学完时最强，但随后会迅速衰减。我们的系统会在你<b>即将忘记</b>的那一刻提醒你复习，通过多次干预将短期记忆转化为长期记忆。
                  </p>
                </div>
                <div className="flex-1 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-icons-round text-google-green">update</span>
                    <h5 className="font-bold text-gray-800">动态间隔</h5>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    复习间隔不是固定的。如果你对一道题感到“轻松掌握”，下一次见面的时间会<b>成倍拉长</b>；如果“完全忘了”，明天就会再次出现。
                  </p>
                </div>
              </div>

              {/* 第二部分：反馈权重 */}
              <div>
                <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-icons-round text-google-yellow">thumbs_up_down</span>
                  你的反馈如何影响系统？
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-red-100 p-4 rounded-2xl bg-red-50/30">
                    <p className="text-xs font-black text-red-500 uppercase mb-2">完全忘了</p>
                    <p className="text-sm text-gray-600">重置记忆周期，系统会认定这属于新题，明天必须再次复习。</p>
                  </div>
                  <div className="border border-yellow-100 p-4 rounded-2xl bg-yellow-50/30">
                    <p className="text-xs font-black text-yellow-600 uppercase mb-2">模糊不清</p>
                    <p className="text-sm text-gray-600">间隔小幅增加，系统会频繁安排该题，直到你彻底熟悉。</p>
                  </div>
                  <div className="border border-green-100 p-4 rounded-2xl bg-green-50/30">
                    <p className="text-xs font-black text-green-600 uppercase mb-2">轻松掌握</p>
                    <p className="text-sm text-gray-600">间隔大幅拉长，让你可以腾出精力去攻克那些不会的题。</p>
                  </div>
                </div>
              </div>

              {/* 第三部分：记忆阶梯图解 */}
              <div className="bg-gray-900 text-white p-6 rounded-3xl relative overflow-hidden">
                <div className="relative z-10">
                  <h5 className="font-bold mb-4">记忆进阶阶梯</h5>
                  <div className="flex justify-between items-end gap-2 h-20">
                    <div className="flex-1 bg-white/10 h-[20%] rounded-t-lg flex flex-col items-center justify-end pb-2">
                      <span className="text-[10px] font-bold">1天</span>
                    </div>
                    <div className="flex-1 bg-white/20 h-[40%] rounded-t-lg flex flex-col items-center justify-end pb-2">
                      <span className="text-[10px] font-bold">6天</span>
                    </div>
                    <div className="flex-1 bg-white/40 h-[65%] rounded-t-lg flex flex-col items-center justify-end pb-2">
                      <span className="text-[10px] font-bold">15天</span>
                    </div>
                    <div className="flex-1 bg-google-blue h-[100%] rounded-t-lg flex flex-col items-center justify-end pb-2">
                      <span className="material-icons-round text-xs mb-1">star</span>
                      <span className="text-[10px] font-bold">持久</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] text-gray-400 text-center italic">经过 4-5 次高质量复习，题目将被标记为“已掌握”并移出活跃复习队列。</p>
                </div>
                <div className="absolute top-0 right-0 opacity-10">
                  <span className="material-icons-round text-[120px]">timeline</span>
                </div>
              </div>
            </div>

            <div className="p-8 bg-gray-50 flex justify-center">
              <button
                onClick={() => setShowLogicModal(false)}
                className="px-12 py-3 bg-gray-800 text-white rounded-2xl font-bold active:scale-95 transition-transform"
              >
                懂了，开始高效复习
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewOverview;
