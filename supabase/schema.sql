-- ============================================
-- 智学云 (SmartRevise) Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- ============================================

-- 1. 题目表 (questions)
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  answer TEXT NOT NULL DEFAULT '',
  analysis TEXT,
  type TEXT NOT NULL DEFAULT 'WRONG_QUESTION',       -- 'WRONG_QUESTION' | 'CLASS_EXAMPLE'
  subject TEXT NOT NULL DEFAULT '数学',               -- '数学' | '物理' | '化学' | '英语' | '其他'
  source TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  last_review_date BIGINT NOT NULL DEFAULT 0,
  next_review_date BIGINT NOT NULL DEFAULT 0,
  mastery_level INT NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
  ef FLOAT DEFAULT 2.5,
  image TEXT,                                         -- base64 encoded
  ans_image TEXT,                                     -- base64 encoded
  is_from_example BOOLEAN DEFAULT FALSE
);

-- 2. 复习记录表 (review_logs)
CREATE TABLE IF NOT EXISTS review_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  subject TEXT NOT NULL DEFAULT ''
);

-- 3. 每日心得表 (reflections)
CREATE TABLE IF NOT EXISTS reflections (
  date TEXT PRIMARY KEY,                              -- 格式: YYYY-MM-DD
  content TEXT NOT NULL DEFAULT ''
);

-- 索引：加速按日期查询待复习题目
CREATE INDEX IF NOT EXISTS idx_questions_next_review ON questions (next_review_date);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions (subject);
CREATE INDEX IF NOT EXISTS idx_review_logs_timestamp ON review_logs (timestamp);

-- 允许匿名访问（如果你使用 RLS 请手动调整策略）
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- 公开读写策略（无鉴权模式）
CREATE POLICY "Allow all access on questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on review_logs" ON review_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access on reflections" ON reflections FOR ALL USING (true) WITH CHECK (true);
