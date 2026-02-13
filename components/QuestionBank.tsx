
import React, { useState } from 'react';
import { Question, Subject, QuestionType } from '../types';
import MathDisplay from './MathDisplay';

interface QuestionBankProps {
  questions: Question[];
  onStartRandom: (count: number, subject?: string) => void;
  onDelete: (id: string) => void;
  onMaster: (id: string) => void;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions, onStartRandom, onDelete, onMaster }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showRandomConfig, setShowRandomConfig] = useState(false);
  const [randomCount, setRandomCount] = useState(5);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
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
        {filteredQuestions.map(q => (
            <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group relative">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 text-xs font-bold rounded ${q.type === QuestionType.WRONG_QUESTION ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                             {q.type === QuestionType.WRONG_QUESTION ? '错题' : '例题'}
                         </span>
                         {q.isFromExample && (
                             <span className="text-[9px] font-black text-google-red border border-red-100 bg-red-50 px-2 py-0.5 rounded uppercase">原例题转化</span>
                         )}
                         <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{q.subject}</span>
                         {q.isMastered && (
                             <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded">
                                 <span className="material-icons-round text-xs">check</span> 已掌握
                             </span>
                         )}
                    </div>
                    <div className="flex items-center gap-3">
                        {!q.isMastered && (
                          <button 
                            onClick={() => handleMaster(q.id)}
                            className="text-xs font-bold text-google-green hover:bg-green-50 px-3 py-1 rounded-lg transition-colors border border-transparent hover:border-green-100"
                          >
                             标记掌握
                          </button>
                        )}
                        <span className="text-xs text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</span>
                        <button 
                            onClick={() => handleDelete(q.id)}
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                            title="删除题目"
                        >
                            <span className="material-icons-round text-lg">delete_outline</span>
                        </button>
                    </div>
                </div>
                
                <div className="text-gray-800 mb-4 line-clamp-3">
                    <MathDisplay text={q.content} />
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
                        {q.tags.map(t => (
                            <span key={t} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">#{t}</span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="material-icons-round text-sm">repeat</span>
                        复习 {q.reviewCount} 次
                    </div>
                </div>
            </div>
        ))}
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
