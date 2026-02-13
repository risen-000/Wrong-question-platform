
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import QuestionInput from './components/QuestionInput';
import ReviewSession from './components/ReviewSession';
import QuestionBank from './components/QuestionBank';
import ReviewOverview from './components/ReviewOverview';
import Login from './components/Login';
import { Question, QuestionType, Subject, ReviewStats, ReviewLog } from './types';
import * as dataService from './services/dataService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// ==================== 主应用组件 (仅已审核用户可见) ====================
// 将业务逻辑提取到独立组件，确保 Hooks 执行顺序一致
const MainAuthenticatedApp: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [reviewQueue, setReviewQueue] = useState<Question[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('全科');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [questionsData, logsData, reflectionsData] = await Promise.all([
        dataService.fetchQuestions(),
        dataService.fetchReviewLogs(),
        dataService.fetchReflections(),
      ]);
      setQuestions(questionsData);
      setReviewLogs(logsData);
      setReflections(reflectionsData);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats: ReviewStats = useMemo(() => {
    const now = Date.now();
    const dueQuestions = questions.filter(q => !q.isMastered && q.nextReviewDate <= now).length;
    return {
      totalQuestions: questions.length,
      masteredCount: questions.filter(q => q.isMastered).length,
      todayReviewCount: dueQuestions,
      streakDays: reviewLogs.length > 0 ? 1 : 0,
    };
  }, [questions, reviewLogs]);

  const dueBySubject = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = Date.now();
    Object.values(Subject).forEach(s => {
      counts[s] = questions.filter(q => q.subject === s && !q.isMastered && q.nextReviewDate <= now).length;
    });
    return counts;
  }, [questions]);

  const handleSaveQuestion = useCallback(async (newQuestionData: any) => {
    const newQuestion: Question = {
      ...newQuestionData,
      id: Date.now().toString(),
    };
    setQuestions(prev => [newQuestion, ...prev]);
    setCurrentPage('bank');

    const success = await dataService.addQuestion(newQuestion);
    if (!success) {
      setQuestions(prev => prev.filter(q => q.id !== newQuestion.id));
      alert('保存题目失败，请重试');
    }
  }, []);

  const handleDeleteQuestion = useCallback(async (id: string) => {
    const backup = questions.find(q => q.id === id);
    setQuestions(prev => prev.filter(q => q.id !== id));

    const success = await dataService.deleteQuestion(id);
    if (!success && backup) {
      setQuestions(prev => [backup, ...prev]);
      alert('删除失败，请重试');
    }
  }, [questions]);

  const handleMasterQuestion = useCallback(async (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isMastered: true, masteryLevel: 5 } : q));

    const question = questions.find(q => q.id === id);
    if (question) {
      const updated = { ...question, isMastered: true, masteryLevel: 5 };
      const success = await dataService.updateQuestion(updated);
      if (!success) {
        setQuestions(prev => prev.map(q => q.id === id ? question : q));
        alert('操作失败，请重试');
      }
    }
  }, [questions]);

  const handleSaveReflection = useCallback(async (date: string, content: string) => {
    setReflections(prev => ({ ...prev, [date]: content }));
    await dataService.upsertReflection(date, content);
  }, []);

  const handleReviewComplete = useCallback(async (results: any[]) => {
    const updatedQuestions = questions.map(q => {
      const result = results.find(r => r.id === q.id);
      if (result) {
        let newIsMastered = q.isMastered;
        let newType = q.type;
        let newIsFromExample = q.isFromExample;

        if (result.quality === 100) {
          newIsMastered = true;
        } else {
          newIsMastered = result.quality >= 5 && q.reviewCount > 3;
          if (q.type === QuestionType.CLASS_EXAMPLE && result.quality === 1) {
            newType = QuestionType.WRONG_QUESTION;
            newIsFromExample = true;
          }
        }

        return {
          ...q,
          type: newType,
          isFromExample: newIsFromExample,
          reviewCount: q.reviewCount + 1,
          lastReviewDate: Date.now(),
          nextReviewDate: result.quality === 100 ? Date.now() + 365 * 24 * 60 * 60 * 1000 : result.nextReviewDate,
          masteryLevel: result.quality === 100 ? 5 : result.quality,
          ef: result.ef,
          isMastered: newIsMastered
        };
      }
      return q;
    });

    const newLog: ReviewLog = {
      timestamp: Date.now(),
      count: results.length,
      subject: activeSubject
    };

    setQuestions(updatedQuestions);
    setReviewLogs(prev => [newLog, ...prev].slice(0, 100));
    setCurrentPage('dashboard');

    const changedQuestions = updatedQuestions.filter(q => results.some(r => r.id === q.id));
    await Promise.all([
      dataService.updateQuestions(changedQuestions),
      dataService.addReviewLog(newLog),
    ]);
  }, [questions, activeSubject]);


  const startReviewSession = (subjectFilter?: string, typeFilter?: QuestionType, countLimit?: number) => {
    const now = Date.now();
    let pool = questions.filter(q => !q.isMastered);

    if (typeFilter === QuestionType.CLASS_EXAMPLE) {
      pool = pool.filter(q => q.type === QuestionType.CLASS_EXAMPLE);
    } else {
      pool = pool.filter(q => q.nextReviewDate <= now);
      if (typeFilter) {
        pool = pool.filter(q => q.type === typeFilter);
      }
    }

    if (subjectFilter && subjectFilter !== '全科') {
      pool = pool.filter(q => q.subject === subjectFilter);
    }

    pool = pool.sort(() => Math.random() - 0.5);

    if (countLimit) {
      pool = pool.slice(0, countLimit);
    }

    setActiveSubject(subjectFilter || (typeFilter === QuestionType.CLASS_EXAMPLE ? '例题专项' : '混合'));
    setReviewQueue(pool);
    setCurrentPage('review_active');
  };

  const startRandomReview = (subjectFilter: string, count: number, typeFilter?: QuestionType) => {
    let pool = [...questions];

    // 按学科筛选
    if (subjectFilter !== '全科') {
      pool = pool.filter(q => q.subject === subjectFilter);
    }

    // 按类型筛选 (错题 vs 例题)
    if (typeFilter) {
      pool = pool.filter(q => q.type === typeFilter);
    }

    // 随机打乱并截取
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count);

    const title = typeFilter === QuestionType.CLASS_EXAMPLE
      ? '金牌例题巩固'
      : (typeFilter === QuestionType.WRONG_QUESTION ? '错题专项训练' : '随机练习');

    setActiveSubject(subjectFilter === '全科' ? title : `${subjectFilter} - ${title}`);
    setReviewQueue(shuffled);
    setCurrentPage('review_active');
  };

  let content;
  switch (currentPage) {
    case 'input':
      content = <QuestionInput onSave={handleSaveQuestion} onCancel={() => setCurrentPage('dashboard')} />;
      break;
    case 'bank':
      content = <QuestionBank
        questions={questions}
        onStartRandom={(count, sub) => startRandomReview(sub || '全科', count)}
        onDelete={handleDeleteQuestion}
        onMaster={handleMasterQuestion}
      />;
      break;
    case 'review':
      content = <ReviewOverview
        questions={questions}
        onStartReview={startReviewSession}
      />;
      break;
    case 'review_active':
      content = <ReviewSession
        questions={reviewQueue}
        onComplete={handleReviewComplete}
        onExit={() => setCurrentPage('dashboard')}
        title={activeSubject}
      />;
      break;
    case 'dashboard':
    default:
      content = <Dashboard
        stats={stats}
        dueBySubject={dueBySubject}
        reviewLogs={reviewLogs}
        reflections={reflections}
        onSaveReflection={handleSaveReflection}
        onNavigate={(p, sub, count, type) => {
          if (p === 'review') startReviewSession(sub, type, count);
          else if (p === 'random_practice') startRandomReview(sub || '全科', count || 5, type);
          else setCurrentPage(p);
        }}
      />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-google-blue rounded-full mb-4"></div>
          <p className="text-gray-400 text-xs font-bold">正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans text-gray-900">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 ml-0 md:ml-64 pb-20 md:pb-0">
        {content}
      </main>
    </div>
  );
};


const AppContent: React.FC = () => {
  const { session, status, signOut } = useAuth();

  // 如果正在加载 Auth 状态
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-google-blue rounded-full mb-4"></div>
          <p className="text-gray-400 text-xs font-bold">正在验证身份...</p>
        </div>
      </div>
    );
  }

  // 如果未登录，显示登录页
  if (!session || status === 'unauthenticated') {
    return <Login />;
  }

  // 如果已登录但未审核通过
  if (status === 'pending_approval') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-sm text-center">
          <div className="w-20 h-20 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons-round text-4xl">hourglass_empty</span>
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">等待审核</h2>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            您的账号正在等待管理员审核。请稍候再试或联系管理员催办。
          </p>
          <button
            onClick={signOut}
            className="w-full py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  // 已认证且已审核 -> 渲染主应用
  return <MainAuthenticatedApp />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
