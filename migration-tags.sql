-- 为留言添加「标签」与「回复嵌套」支持
-- 在 Supabase 的 SQL Editor 中执行一次

-- 标签：用于分类 / 筛选（如 #树洞 #表白 #提问）
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_tags ON messages USING gin (tags);

-- 父留言 id：用于匿名回复嵌套（回复某条留言）
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_parent ON messages(parent_id);
