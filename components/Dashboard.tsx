
import React, { useState, useMemo } from 'react';
import { ReviewStats, Subject, ReviewLog, QuestionType } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  stats: ReviewStats;
  dueBySubject: Record<string, number>;
  reviewLogs: ReviewLog[];
  reflections: Record<string, string>;
  onSaveReflection: (date: string, content: string) => void;
  onNavigate: (page: string, subject?: string, count?: number, type?: QuestionType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, dueBySubject, reviewLogs, reflections, onSaveReflection, onNavigate }) => {
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [randomSubject, setRandomSubject] = useState<string>('全科');
  const [exampleSubject, setExampleSubject] = useState<string>('全科');
  const [exampleCount, setExampleCount] = useState<number>(5);
  const [randomCount, setRandomCount] = useState<number>(5);

  // 日历状态管理
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const [selectedDayDetail, setSelectedDayDetail] = useState<{ date: string, logs: ReviewLog[] } | null>(null);
  const [editingReflection, setEditingReflection] = useState('');

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

      const dayLogs = reviewLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getDate() === date.getDate() &&
          logDate.getMonth() === date.getMonth() &&
          logDate.getFullYear() === date.getFullYear();
      });

      const totalCount = dayLogs.reduce((sum, log) => sum + log.count, 0);
      data.push({ name: dateStr, count: totalCount });
    }
    return data;
  }, [reviewLogs]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const days = [];

    // 补齐前面的空白
    const firstDayWeekday = firstDayOfMonth.getDay();
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // 填充当月日期
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const fullDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayLogs = reviewLogs.filter(log => {
        const d = new Date(log.timestamp);
        return d.getDate() === i && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      days.push({
        date: i,
        fullDate: fullDateStr,
        logs: dayLogs,
        hasReflection: !!reflections[fullDateStr]
      });
    }
    return days;
  }, [currentYear, currentMonth, reviewLogs, reflections]);

  const handleDayClick = (day: any) => {
    if (!day) return;
    setSelectedDayDetail({ date: day.fullDate, logs: day.logs });
    setEditingReflection(reflections[day.fullDate] || '');
  };

  const saveReflection = () => {
    if (selectedDayDetail) {
      onSaveReflection(selectedDayDetail.date, editingReflection);
      setSelectedDayDetail(null);
    }
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setCurrentDate(newDate);
  };

  const years = Array.from({ length: 10 }, (_, i) => 2024 + i);
  const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">
      {/* 顶部标题区 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">学习概览 👋</h1>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className={`p-1.5 rounded-full transition-all ${showGuide ? 'bg-google-blue text-white shadow-lg' : 'bg-blue-50 text-google-blue hover:bg-blue-100'}`}
              title="查看功能说明"
            >
              <span className="material-icons-round text-xl">auto_awesome</span>
            </button>
          </div>
          <p className="text-gray-500 mt-1 text-sm md:text-base font-medium">
            今日还有 <span className="text-google-blue font-black">{stats.todayReviewCount}</span> 道题待复习
          </p>
        </div>
        <button
          onClick={() => onNavigate('input')}
          className="hidden md:flex bg-google-blue hover:bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all items-center gap-2 transform active:scale-95"
        >
          <span className="material-icons-round">add_circle</span>
          录入题目
        </button>
      </div>

      {/* 使用指南面板 */}
      {showGuide && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-2xl animate-slide-up relative overflow-hidden">
          <div className="absolute top-4 right-6 z-50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowGuide(false);
              }}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all active:scale-90 cursor-pointer shadow-lg backdrop-blur-md flex items-center justify-center"
            >
              <span className="material-icons-round text-xl">close</span>
            </button>
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-icons-round">lightbulb</span>
              快速上手指南
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: 'camera_alt', title: '1. 智能录入', desc: '支持拍照上传和公式录入，建立数字化题库。', example: '拍下卷子上的数学压轴题。' },
                { icon: 'update', title: '2. 科学复习', desc: '基于艾宾浩斯曲线，在遗忘临界点自动安排复习。', example: '系统今天提醒你重做昨日做错的题。' },
                { icon: 'auto_stories', title: '3. 刷例题', desc: '随时开启专项练习，针对性攻克课本经典模型。', example: '考前抽10道物理例题快速过一遍。' },
                { icon: 'check_circle', title: '4. 错题清理', desc: '彻底学会的题目手动标记“掌握”，精简复习表。', example: '这题已懂5遍了，点击标记掌握。' },
                { icon: 'sync_alt', title: '5. 自动转化', desc: '刷例题若选“完全不会”，系统自动将其存入错题库。', example: '例题变错题，复习链路不断档。' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col h-full bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/10">
                  <span className="material-icons-round text-3xl mb-3 text-blue-200">{step.icon}</span>
                  <h3 className="font-black text-sm mb-2">{step.title}</h3>
                  <p className="text-[11px] text-blue-100/80 leading-relaxed flex-1">{step.desc}</p>
                  <div className="mt-4 bg-blue-500/30 p-2.5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-blue-200 font-bold italic">💡 例子：{step.example}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10">
            <span className="material-icons-round text-[180px]">auto_awesome</span>
          </div>
        </div>
      )}

      {/* 核心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-google-blue transition-all group overflow-hidden relative">
          {!showSubjectPicker ? (
            <div className="animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">今日待复习</p>
                  <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.todayReviewCount}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-2xl group-hover:bg-blue-100 transition-colors">
                  <span className="material-icons-round text-google-blue text-2xl">event_repeat</span>
                </div>
              </div>
              <button
                onClick={() => setShowSubjectPicker(true)}
                disabled={stats.todayReviewCount === 0}
                className={`mt-6 w-full py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${stats.todayReviewCount > 0
                  ? 'bg-google-blue text-white shadow-lg shadow-blue-100 hover:bg-blue-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
              >
                开始复习
                <span className="material-icons-round text-sm">play_arrow</span>
              </button>
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-800 text-sm font-black">选择复习科目</p>
                <button onClick={() => setShowSubjectPicker(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="material-icons-round text-lg">close</span>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('review', '全科')}
                  className="col-span-2 py-2 bg-google-blue text-white rounded-lg text-xs font-bold"
                >
                  全科复习 ({stats.todayReviewCount})
                </button>
                {Object.values(Subject).map(sub => (
                  <button
                    key={sub}
                    disabled={dueBySubject[sub] === 0}
                    onClick={() => onNavigate('review', sub)}
                    className={`py-2 rounded-lg text-[11px] font-bold border transition-all ${dueBySubject[sub] > 0
                      ? 'border-blue-100 bg-blue-50 text-google-blue'
                      : 'border-gray-50 bg-gray-50 text-gray-300 opacity-50'
                      }`}
                  >
                    {sub} ({dueBySubject[sub]})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-google-green transition-colors group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">已掌握题目</p>
              <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.masteredCount}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-2xl group-hover:bg-green-100 transition-colors">
              <span className="material-icons-round text-google-green text-2xl">verified</span>
            </div>
          </div>
          <div className="mt-8 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
            <div className="bg-google-green h-full rounded-full transition-all duration-1000" style={{ width: `${(stats.masteredCount / (stats.totalQuestions || 1)) * 100}%` }}></div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-2 text-right uppercase tracking-tighter">
            进度: {(stats.masteredCount / (stats.totalQuestions || 1) * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:border-google-yellow transition-colors group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">题库总量</p>
              <h3 className="text-4xl font-black text-gray-800 mt-1">{stats.totalQuestions}</h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-2xl group-hover:bg-yellow-100 transition-colors">
              <span className="material-icons-round text-google-yellow text-2xl text-opacity-80">folder_zip</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('bank')}
            className="mt-6 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all text-sm shadow-lg shadow-gray-200"
          >
            浏览错题库
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
            <span className="material-icons-round text-google-blue">show_chart</span>
            复习强度趋势
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4285F4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4285F4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#4285F4" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 升级后的复习日历卡片 */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col min-h-[440px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <span className="material-icons-round text-google-red">calendar_today</span>
              复习日历
            </h3>

            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-gray-800">
                <span className="material-icons-round text-sm">chevron_left</span>
              </button>

              <div className="flex items-center gap-1 px-2">
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
                  className="bg-transparent text-[11px] font-black border-none focus:ring-0 p-0 text-gray-800 cursor-pointer"
                >
                  {years.map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentDate(new Date(currentYear, parseInt(e.target.value), 1))}
                  className="bg-transparent text-[11px] font-black border-none focus:ring-0 p-0 text-gray-800 cursor-pointer"
                >
                  {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>

              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-gray-800">
                <span className="material-icons-round text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 flex-1">
            {['日', '一', '二', '三', '四', '五', '六'].map(w => (
              <div key={w} className="text-center text-[10px] font-black text-gray-300 py-2 uppercase">{w}</div>
            ))}
            {calendarDays.map((day, idx) => {
              const isToday = day?.date === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              const hasActivity = day && day.logs.length > 0;

              return (
                <div
                  key={idx}
                  onClick={() => day && handleDayClick(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all relative font-bold group
                    ${!day ? 'bg-transparent' : 'cursor-pointer hover:bg-gray-50'}
                    ${hasActivity ? 'bg-google-blue/10 text-google-blue' : 'text-gray-400'}
                    ${isToday ? 'ring-2 ring-google-red ring-inset bg-red-50 text-google-red' : ''}
                  `}
                >
                  {day?.date}
                  {hasActivity && (
                    <div className="absolute bottom-1 w-1 h-1 bg-google-blue rounded-full"></div>
                  )}
                  {day?.hasReflection && (
                    <div className="absolute top-1 right-1 w-1 h-1 bg-google-green rounded-full shadow-sm"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center px-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-google-blue rounded-full"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase">有复习</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-google-green rounded-full"></div>
                <span className="text-[9px] font-black text-gray-400 uppercase">有心得</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[9px] font-black text-google-blue border border-blue-100 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors uppercase"
            >
              回到今天
            </button>
          </div>
        </div>
      </div>

      {/* 快捷练习操作区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-blue-700 rounded-3xl p-8 text-white hover:shadow-2xl transition-all transform hover:-translate-y-2 relative overflow-hidden group h-56 flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-icons-round">auto_stories</span>
              <h3 className="text-xl font-black">金牌例题巩固</h3>
            </div>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-70">练习科目</label>
                  <select
                    value={exampleSubject}
                    onChange={e => setExampleSubject(e.target.value)}
                    className="w-full bg-white/10 border-none rounded-xl text-[11px] font-bold p-2 focus:ring-2 ring-white/30 cursor-pointer text-white"
                  >
                    <option value="全科" className="text-gray-800">全科</option>
                    {Object.values(Subject).map(s => <option key={s} value={s} className="text-gray-800">{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase opacity-70 flex justify-between">数量 <span>{exampleCount}</span></label>
                  <input
                    type="range" min="1" max="10" step="1"
                    value={exampleCount}
                    onChange={e => setExampleCount(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white mt-2"
                  />
                </div>
              </div>
              <button
                onClick={() => onNavigate('random_practice', exampleSubject, exampleCount, QuestionType.CLASS_EXAMPLE)}
                className="w-full bg-white text-blue-700 py-3 rounded-xl text-xs font-black shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                开启例题巩固 <span className="material-icons-round text-sm">rocket_launch</span>
              </button>
            </div>
          </div>
          <div className="absolute -top-8 -right-8 opacity-10 transform rotate-12 group-hover:rotate-45 transition-transform duration-700 pointer-events-none">
            <span className="material-icons-round text-[200px]">book</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all flex flex-col justify-between h-56 group relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-2.5 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-xl">shuffle</span>
              </div>
              <h3 className="text-xl font-black text-gray-800">错题专项训练 (Fixed)</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400">科目</label>
                <select
                  value={randomSubject}
                  onChange={e => setRandomSubject(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-xl text-[11px] font-bold p-2 focus:ring-2 ring-orange-100 cursor-pointer text-gray-800"
                >
                  <option value="全科">全科</option>
                  {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 flex justify-between">数量 <span>{exampleCount}</span></label>
                {/* Reuse update handler to sync the slider state, or utilize a new state if needed. 
                        Wait, I am using 'exampleCount' for both sliders in the user request's mind? 
                        No, I should use a separate state 'randomCount' for this card. 
                        Let's check if 'randomCount' exists. It does NOT in original code.
                        I will add 'randomCount' state to Dashboard component in a separate edit or just reuse exampleCount if user prefers, 
                        but good UX demands separate state.
                        
                        However, I cannot add state lines here easily without viewing the top of file.
                        I will assume I can add a state later or just use 'exampleCount' temporarily?
                        No, that's bad.
                        I'll use a local variable instruction for the top of the file in a separate edit.
                        For now, let's use a new variable name `randomCount` and I will add it to the state definition next. 
                    */}
                <input
                  type="range" min="1" max="10" step="1"
                  value={randomCount}
                  onChange={e => setRandomCount(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500 mt-2"
                />
              </div>
            </div>

            <button
              onClick={() => onNavigate('random_practice', randomSubject, randomCount, QuestionType.WRONG_QUESTION)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all"
            >
              开始错题攻克
            </button>
          </div>
          <div className="absolute -bottom-4 -right-4 text-gray-50 opacity-50 z-0 group-hover:text-orange-50 transition-colors pointer-events-none">
            <span className="material-icons-round text-[120px]">psychology_alt</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('bank')}
          className="bg-white rounded-3xl p-8 border border-gray-100 hover:shadow-xl transition-all flex flex-col justify-between h-56 group relative overflow-hidden cursor-pointer"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2.5 rounded-2xl text-green-600">
                <span className="material-icons-round text-xl">check_circle</span>
              </div>
              <h3 className="text-xl font-black text-gray-800">错题清理</h3>
            </div>
            <p className="text-gray-400 text-xs font-medium">去题库手动标记已完全掌握的题目，精简您的复习计划。</p>
          </div>
          <button className="relative z-10 w-full bg-gray-50 text-gray-600 py-3 rounded-xl text-xs font-black hover:bg-gray-100 mt-4">
            进入错题库管理
          </button>
        </div>
      </div>

      {/* 升级后的详情弹窗：包含复习记录和每日总结 */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            {/* 弹窗头部 */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div>
                <h4 className="text-xl font-black text-gray-800">日期详情</h4>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{selectedDayDetail.date}</p>
              </div>
              <button onClick={() => setSelectedDayDetail(null)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            {/* 弹窗内容区 */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1 hide-scrollbar">
              {/* 复习记录部分 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-icons-round text-google-blue text-sm">history</span>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">当日复习记录</h5>
                </div>
                {selectedDayDetail.logs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDayDetail.logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-blue-50/30 rounded-2xl border border-blue-50">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-google-blue shadow-sm">
                            <span className="material-icons-round text-sm">description</span>
                          </div>
                          <p className="font-black text-gray-800 text-xs">{log.subject}</p>
                        </div>
                        <span className="text-sm font-black text-google-blue">{log.count} <small className="text-[10px] font-bold">题</small></span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-300 font-bold italic text-xs bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">这一天没有安排复习</div>
                )}
              </section>

              {/* 每日感悟/总结部分 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-icons-round text-google-green text-sm">edit_note</span>
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">每日总结 / 心得感悟</h5>
                </div>
                <div className="relative">
                  <textarea
                    value={editingReflection}
                    onChange={(e) => setEditingReflection(e.target.value)}
                    placeholder="今天学到了什么？有什么难点攻克了？或者写下对明天的期待..."
                    className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-google-green/20 placeholder:text-gray-300"
                  />
                  <div className="absolute bottom-3 right-4 opacity-10 pointer-events-none">
                    <span className="material-icons-round text-4xl">favorite</span>
                  </div>
                </div>
              </section>
            </div>

            {/* 弹窗底部操作 */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="flex-1 py-3 bg-white text-gray-600 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveReflection}
                className="flex-[2] py-3 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-icons-round text-sm">save</span>
                保存今日心得
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
