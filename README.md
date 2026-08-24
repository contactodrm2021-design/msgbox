# 留言箱 - 部署指南

## ⚠️ 老项目升级（v2 点赞功能）

如果之前已部署过，只需在 Supabase 的 SQL Editor 中执行 `migration.sql`：

```sql
ALTER TABLE messages ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
```

## 第一步：注册账号

1. **Vercel** → vercel.com（用 GitHub 登录）
2. **Supabase** → supabase.com（已创建项目）
3. **Cloudinary** → cloudinary.com（注册即可，不需要银行卡）

## 第二步：配置 Cloudinary

1. 注册后进入 Dashboard
2. 记下三个值：
   - **Cloud Name**（Dashboard 顶部）
   - **API Key**（Settings → Access Keys）
   - **API Secret**（同上，点显示复制）

## 第三步：部署到 Vercel

1. 在 GitHub 创建仓库，上传 msgbox 目录所有文件
2. Vercel → Import → 选择该仓库
3. 在 Vercel 项目的 Settings → Environment Variables 添加：

```
NEXT_PUBLIC_SUPABASE_URL=https://merosorsgeyowfbekwbr.supabase.co
SUPABASE_SERVICE_KEY=你的service_role_key
CLOUDINARY_CLOUD_NAME=你的cloud_name
CLOUDINARY_API_KEY=你的api_key
CLOUDINARY_API_SECRET=你的api_secret
```

4. 点击 Deploy

## 第四步：绑定域名

1. 在 Vercel 项目 → Settings → Domains
2. 添加你的域名
3. 按提示在域名服务商添加 DNS 记录

完成！
