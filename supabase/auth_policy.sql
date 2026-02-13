-- ============================================
-- 智学云 (SmartRevise) Auth & RLS 策略
-- 包含用户状态管理 (Pending/Approved)
-- ============================================

-- 1. 创建用户档案表 (user_profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 自动创建档案 Trigger
-- 当 auth.users 新增用户时，自动插入 user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, status)
  VALUES (new.id, new.email, 'pending');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. 添加 user_id 到现有业务表 (如果尚未存在)
-- 注意：执行前请确保表已清空，或者手动处理现有数据的归属
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='user_id') THEN
    ALTER TABLE questions ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='review_logs' AND column_name='user_id') THEN
    ALTER TABLE review_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reflections' AND column_name='user_id') THEN
    ALTER TABLE reflections ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    
    -- 修复 Reflections 主键：从 date -> (user_id, date)
    -- 首先删除旧主键 (假设主键名为 reflections_pkey)
    ALTER TABLE reflections DROP CONSTRAINT IF EXISTS reflections_pkey;
    -- 添加新联合主键
    ALTER TABLE reflections ADD PRIMARY KEY (user_id, date);
  END IF;
END $$;

-- 4. 启用 RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略定义

-- user_profiles: 
-- 用户只能看自己的档案
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
-- 只有管理员能修改 status (这里简化为: 谁都不能改，只能通过 Supabase Dashboard 改)
-- 如果需要通过 API 改，需要额外的 admin 角色逻辑

-- questions:
-- 只能查自己的
CREATE POLICY "Users can view own questions" ON questions
  FOR SELECT USING (auth.uid() = user_id);
-- 只能插自己的 (自动附带 user_id)
CREATE POLICY "Users can insert own questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 只能改自己的
CREATE POLICY "Users can update own questions" ON questions
  FOR UPDATE USING (auth.uid() = user_id);
-- 只能删自己的
CREATE POLICY "Users can delete own questions" ON questions
  FOR DELETE USING (auth.uid() = user_id);

-- review_logs: (同上)
CREATE POLICY "Users can view own logs" ON review_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs" ON review_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- reflections: (同上)
CREATE POLICY "Users can view own reflections" ON reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON reflections
  FOR UPDATE USING (auth.uid() = user_id);
