-- 在 Supabase 的 SQL Editor 中执行：为留言添加 emoji 反应字段
-- 与 setup-admin.sql 一样，只需执行一次

ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_reactions ON messages USING gin (reactions);
