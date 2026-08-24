-- v2 升级：点赞功能
-- 在 Supabase 的 SQL Editor 中执行一次即可
-- （API 使用 service_role 密钥，会绕过 RLS，因此无需新增策略）

ALTER TABLE messages ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
