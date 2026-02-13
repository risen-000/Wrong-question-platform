
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMsg({ type: 'success', text: '注册成功！请等待管理员后代审核通过后即可登录。' });
            }
        } catch (error: any) {
            setMsg({ type: 'error', text: error.message || '操作失败，请重试' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-google-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                            <span className="material-icons-round text-white text-3xl">school</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800">智学云</h1>
                        <p className="text-gray-400 text-sm font-bold mt-1">SmartRevise</p>
                    </div>

                    <div className="flex bg-gray-50 p-1.5 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(true); setMsg(null); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            登录
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(false); setMsg(null); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            注册
                        </button>
                    </div>

                    {msg && (
                        <div className={`p-4 rounded-xl text-xs font-bold mb-6 flex items-start gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                            }`}>
                            <span className="material-icons-round text-sm translate-y-0.5">
                                {msg.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <div>{msg.text}</div>
                        </div>
                    )}

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 ml-1">邮箱</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-google-blue focus:ring-0 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                                placeholder="您的邮箱地址"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase mb-1.5 ml-1">密码</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                                className="w-full bg-gray-50 border-transparent focus:bg-white focus:border-google-blue focus:ring-0 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 transition-all placeholder:font-medium"
                                placeholder="至少 6 位字符"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-google-blue text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-600 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="material-icons-round animate-spin text-sm">refresh</span>
                            ) : (
                                <span className="material-icons-round text-sm">login</span>
                            )}
                            {isLogin ? '立即登录' : '提交注册'}
                        </button>
                    </form>

                    {!isLogin && (
                        <p className="text-[10px] text-center text-gray-400 mt-6 px-4 leading-relaxed">
                            注册即代表同意我们的服务条款。新账号需管理员审核通过后方可使用。
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
