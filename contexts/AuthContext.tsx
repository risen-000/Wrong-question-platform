
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

type AuthStatus = 'loading' | 'pending_approval' | 'approved' | 'unauthenticated';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    status: AuthStatus;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    status: 'loading',
    signOut: async () => { },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');

    useEffect(() => {
        // 1. 获取初始 Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserStatus(session.user.id);
            } else {
                setStatus('unauthenticated');
            }
        });

        // 2. 监听 Auth 变化
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                checkUserStatus(session.user.id);
            } else {
                setStatus('unauthenticated');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserStatus = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('status')
                .eq('id', userId)
                .single();

            if (error || !data) {
                // 如果没有 profile，可能是 trigger 还没跑完，或者旧数据
                // 默认暂定 pending
                console.warn('Profile fetch error or empty:', error);
                setStatus('pending_approval');
                return;
            }

            if (data.status === 'approved') {
                setStatus('approved');
            } else {
                setStatus('pending_approval');
            }
        } catch (err) {
            console.error(err);
            setStatus('pending_approval');
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setStatus('unauthenticated');
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, status, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
