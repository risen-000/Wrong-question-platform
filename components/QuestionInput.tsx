
import React, { useState, useRef } from 'react';
import { QuestionType, Subject } from '../types';
import MathDisplay from './MathDisplay';

interface QuestionInputProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ansImagePreview, setAnsImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ansInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [answer, setAnswer] = useState('');
  const [type, setType] = useState<QuestionType>(QuestionType.WRONG_QUESTION);
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [source, setSource] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isAns: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (isAns) setAnsImagePreview(base64String);
      else setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag('');
    }
  };

  const insertMath = (latex: string) => {
    setContent(prev => prev + ` $${latex}$ `);
  };

  const handleSave = () => {
    if (!content.trim() && !imagePreview) return alert("请输入题目内容或上传题目图片");
    onSave({
      content,
      answer,
      type,
      subject,
      tags,
      source,
      image: imagePreview,
      ansImage: ansImagePreview,
      createdAt: Date.now(),
      reviewCount: 0,
      lastReviewDate: 0,
      nextReviewDate: Date.now(),
      masteryLevel: 0,
      isMastered: false,
      ef: 2.5,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
          <span className="material-icons-round text-gray-600">arrow_back</span>
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">录入新题目</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab 导航保持原样 */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'camera' ? 'text-google-blue border-b-2 border-google-blue bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="material-icons-round text-lg">camera_alt</span>
            图片录入
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual' ? 'text-google-blue border-b-2 border-google-blue bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <span className="material-icons-round text-lg">edit</span>
            文字录入
          </button>
        </div>

        <div className="p-4 md:p-8 space-y-6">
          {/* 大图上传区域排版保持原样 */}
          {activeTab === 'camera' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-google-blue hover:bg-blue-50/30 transition-all min-h-[160px] flex flex-col justify-center"
              >
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e, false)} />
                {imagePreview ? (
                  <img src={imagePreview} className="max-h-32 mx-auto rounded-lg shadow-sm" />
                ) : (
                  <>
                    <span className="material-icons-round text-3xl text-gray-400 mb-2">add_a_photo</span>
                    <p className="text-gray-600 font-bold text-sm">上传题目照片</p>
                  </>
                )}
              </div>
              <div 
                onClick={() => ansInputRef.current?.click()}
                className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-google-blue hover:bg-blue-50/30 transition-all min-h-[160px] flex flex-col justify-center"
              >
                <input type="file" accept="image/*" ref={ansInputRef} className="hidden" onChange={(e) => handleFileChange(e, true)} />
                {ansImagePreview ? (
                  <img src={ansImagePreview} className="max-h-32 mx-auto rounded-lg shadow-sm" />
                ) : (
                  <>
                    <span className="material-icons-round text-3xl text-gray-400 mb-2">fact_check</span>
                    <p className="text-gray-600 font-bold text-sm">上传答案照片 (可选)</p>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">题目类型</label>
              <div className="flex gap-2">
                {[QuestionType.WRONG_QUESTION, QuestionType.CLASS_EXAMPLE].map(t => (
                  <button key={t} onClick={() => setType(t)} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${type === t ? 'border-google-blue bg-blue-50 text-google-blue' : 'border-gray-200 text-gray-500'}`}>
                    {t === QuestionType.WRONG_QUESTION ? '错题' : '例题'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">学科分类</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)} className="w-full border-gray-200 rounded-lg focus:ring-google-blue">
                {Object.values(Subject).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-bold text-gray-700">题目描述</label>
              <div className="flex gap-1">
                {['x^2', '\\frac{a}{b}', '\\sqrt{x}'].map(s => (
                  <button key={s} onClick={() => insertMath(s)} className="px-2 py-0.5 bg-gray-100 text-[10px] rounded hover:bg-gray-200 font-mono">{s}</button>
                ))}
              </div>
            </div>
            <textarea 
              value={content} onChange={(e) => setContent(e.target.value)} rows={4} 
              className="w-full border-gray-200 rounded-xl p-4 focus:ring-google-blue text-sm" 
              placeholder="在这里输入题目文字，公式请用 $ 包裹..." 
            />
            {content && <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-dashed text-sm"><MathDisplay text={content} /></div>}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">解析与答案</label>
            <textarea 
              value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} 
              className="w-full border-gray-200 rounded-xl p-4 focus:ring-google-blue text-sm" 
              placeholder="记录解题思路或答案..."
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm font-bold text-gray-400 flex items-center mr-2"><span className="material-icons-round text-sm mr-1">sell</span> 标签:</span>
            {tags.map(tag => (
              <span key={tag} className="bg-blue-100 text-google-blue px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
                #{tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))}><span className="material-icons-round text-[12px]">close</span></button>
              </span>
            ))}
            <input 
              type="text" value={currentTag} onChange={e => setCurrentTag(e.target.value)} onKeyDown={handleAddTag} 
              placeholder="+ 回车添加标签" className="border-none focus:ring-0 text-sm w-32 bg-transparent text-gray-400 italic"
            />
          </div>
        </div>
        
        <div className="p-4 md:p-6 bg-gray-50 border-t flex justify-end gap-3">
           <button onClick={onCancel} className="px-6 py-2 rounded-lg text-gray-600 font-bold">取消</button>
           <button onClick={handleSave} className="px-10 py-2 rounded-lg bg-google-blue text-white font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">保存到题库</button>
        </div>
      </div>
    </div>
  );
};

export default QuestionInput;
