
// 本系统已切换为非 AI 驱动模式
// 所有的题目解析和类似题寻找均通过本地算法和标签匹配完成

/**
 * 模拟查找相似题目 (基于标签匹配逻辑)
 */
export const findSimilarInBank = (currentQuestionId: string, allQuestions: any[]) => {
  const current = allQuestions.find(q => q.id === currentQuestionId);
  if (!current) return [];
  
  return allQuestions.filter(q => 
    q.id !== currentQuestionId && 
    q.subject === current.subject &&
    q.tags.some((t: string) => current.tags.includes(t))
  ).slice(0, 2);
};

/**
 * SM-2 间隔重复算法实现
 * @param quality 评分 (0-5)
 * @param lastInterval 上次间隔
 * @param lastEF 上次易混淆因子
 */
export const calculateNextReview = (quality: number, lastInterval: number, lastEF: number) => {
  let interval: number;
  let ef = lastEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) ef = 1.3;

  if (quality < 3) {
    interval = 1; // 如果没记住，明天重来
  } else {
    if (lastInterval === 0) interval = 1;
    else if (lastInterval === 1) interval = 6;
    else interval = Math.round(lastInterval * ef);
  }

  return {
    interval,
    ef,
    nextReviewDate: Date.now() + interval * 24 * 60 * 60 * 1000
  };
};
