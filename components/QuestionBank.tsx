
import React, { useState } from 'react';
import { Question, Subject, QuestionType } from '../types';
import MathDisplay from './MathDisplay';

interface QuestionBankProps {
  questions: Question[];
  onStartRandom: (count: number, subject?: string) => void;
  onDelete: (id: string) => void;
  onMaster: (id: string) => void;
}

// 简单的原生图片组件，避免 React onLoad 生命周期在 base64 上的 bug
const RawImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  if (!src) return <div className="text-[10px] text-gray-400">无图片数据</div>;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('图片加载严重错误, base64可能截断:', e);
        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="red">图片损坏</text></svg>';
      }}
    />
  );
};


const QuestionBank: React.FC<QuestionBankProps> = ({ questions, onStartRandom, onDelete, onMaster }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showRandomConfig, setShowRandomConfig] = useState(false);
  const [randomCount, setRandomCount] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredQuestions = questions.filter(q => {
    const contentStr = (q.content || '').trim();
    const hasImage = !!q.image;

    // 搜索逻辑：匹配内容、标签，或者如果搜“图片”且该题有图片
    const matchesSearch = contentStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.tags && q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      (searchTerm.toLowerCase() === '图片' && hasImage);

    const matchesSubject = selectedSubject === 'all' || q.subject === selectedSubject;
    const matchesType = filterType === 'all' ||
      (filterType === 'mastered' && q.isMastered) ||
      (filterType === 'learning' && !q.isMastered);

    return matchesSearch && matchesSubject && matchesType;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这道题目吗？删除后无法恢复。')) {
      onDelete(id);
    }
  };

  const handleMaster = (id: string) => {
    if (window.confirm('标记为已掌握后，该题目将暂时不再出现在日常复习队列中。确定吗？')) {
      onMaster(id);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto h-full flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-800">总题库 <span className="text-gray-400 text-lg font-normal ml-2">{questions.length} 题</span></h1>

        <div className="relative">
          <button
            onClick={() => setShowRandomConfig(!showRandomConfig)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2 active:scale-95"
          >
            <span className="material-icons-round">shuffle</span>
            随机刷题
          </button>

          {showRandomConfig && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-30 animate-fade-in">
              <h4 className="text-sm font-bold text-gray-800 mb-3">随机练习配置</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase">选择科目</label>
                  <select
                    value={selectedSubject === 'all' ? '全科' : selectedSubject}
                    onChange={e => setSelectedSubject(e.target.value === '全科' ? 'all' : e.target.value)}
                    className="w-full text-xs bg-gray-50 border-transparent rounded-lg mt-1"
                  >
                    <option value="全科">全科</option>
                    {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase flex justify-between">
                    数量 <span>{randomCount}</span>
                  </label>
                  <input
                    type="range" min="1" max="10"
                    value={randomCount}
                    onChange={e => setRandomCount(parseInt(e.target.value))}
                    className="w-full accent-orange-500 mt-1"
                  />
                </div>
                <button
                  onClick={() => {
                    onStartRandom(randomCount, selectedSubject === 'all' ? undefined : selectedSubject as Subject);
                    setShowRandomConfig(false);
                  }}
                  className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold"
                >
                  开始练习
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        {/* ... existing filters ... */}
        <div className="relative flex-1 w-full">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="搜索题目内容、标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-google-blue focus:ring-0 rounded-lg transition-all"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="bg-gray-50 border-transparent rounded-lg py-2 px-4 text-sm font-medium text-gray-600 focus:ring-0 focus:border-google-blue cursor-pointer"
        >
          <option value="all">所有学科</option>
          {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-50 border-transparent rounded-lg py-2 px-4 text-sm font-medium text-gray-600 focus:ring-0 focus:border-google-blue cursor-pointer"
        >
          <option value="all">所有状态</option>
          <option value="learning">学习中</option>
          <option value="mastered">已掌握</option>
        </select>
      </div>



      {/* List */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-20">
        {filteredQuestions.map(q => {
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} className={`bg-white rounded-xl border transition-all duration-300 group ${isExpanded ? 'border-blue-200 shadow-lg' : 'border-gray-100 hover:shadow-md'}`}>
              {/* Card Header */}
              <div className="p-5 cursor-pointer" onClick={() => toggleExpand(q.id)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${q.type === QuestionType.WRONG_QUESTION ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                      {q.type === QuestionType.WRONG_QUESTION ? '错题' : '例题'}
                    </span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.subject}</span>
                    {q.isMastered && (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded">
                        <span className="material-icons-round text-xs">check</span> 已掌握
                      </span>
                    )}
                    {q.image && (
                      <span className="flex items-center gap-1 text-blue-600 text-[10px] font-black bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        <span className="material-icons-round text-xs">image</span> 包含图片 {Math.round(q.image.length / 1024)}KB
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                    <span className={`material-icons-round text-gray-400 text-lg transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className={`flex-1 text-gray-800 ${isExpanded ? '' : 'line-clamp-3 text-sm'}`}>
                    <MathDisplay text={q.content?.trim() || (q.image ? " [图片题目] " : "无内容")} />
                  </div>
                  {!isExpanded && q.image && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                      <RawImage src={q.image} alt="缩略图" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {isExpanded && q.image && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center p-2">
                    <RawImage src={q.image} alt="题目图片" className="max-w-full max-h-[600px] object-contain" />
                  </div>
                )}
              </div>

              {/* Detail Panel */}
              {isExpanded && (
                <div className="border-t border-blue-50 mx-5 pt-4 pb-5 space-y-4 animate-fade-in">
                  <div className="bg-green-50/50 rounded-xl p-4 border border-green-100/50">
                    <h4 className="text-xs font-black text-green-700 uppercase mb-2 flex items-center gap-1">
                      <span className="material-icons-round text-sm">task_alt</span> 参考答案
                    </h4>
                    <div className="text-gray-800 text-sm leading-relaxed">
                      <MathDisplay text={q.answer || '未录入答案内容'} />
                    </div>
                    {q.ansImage && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-green-100 bg-white inline-block">
                        <RawImage src={q.ansImage} alt="答案图片" className="max-w-full max-h-80 object-contain" />
                      </div>
                    )}
                  </div>

                  {q.analysis && (
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                      <h4 className="text-xs font-black text-blue-700 uppercase mb-2 flex items-center gap-1">
                        <span className="material-icons-round text-sm">lightbulb</span> 解题思路
                      </h4>
                      <div className="text-gray-700 text-sm leading-relaxed">
                        <MathDisplay text={q.analysis} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                      {q.tags.map(t => (
                        <span key={t} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">#{t}</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-2">
                      <span>{q.source && `来自: ${q.source}`}</span>
                      <span>复习 {q.reviewCount} 次</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {!q.isMastered && (
                      <button onClick={(e) => { e.stopPropagation(); handleMaster(q.id); }} className="flex-1 text-xs font-bold text-google-green hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-green-100 flex items-center justify-center gap-1">
                        <span className="material-icons-round text-sm">verified</span> 标记掌握
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }} className="text-xs font-bold text-red-400 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors border border-red-100 flex items-center gap-1">
                      <span className="material-icons-round text-sm">delete_outline</span> 删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredQuestions.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <span className="material-icons-round text-4xl mb-2">search_off</span>
            <p>没有找到相关题目</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;
