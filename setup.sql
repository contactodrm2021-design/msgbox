-- 在 Supabase 的 SQL Editor 中执行以下语句

-- 创建留言表
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '匿名',
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 按时间倒序索引
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);

-- 开启 RLS（行级安全）
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "允许公开读取" ON messages
  FOR SELECT USING (true);

-- 允许所有人插入（因为是留言箱，允许匿名）
CREATE POLICY "允许公开插入" ON messages
  FOR INSERT WITH CHECK (true);
