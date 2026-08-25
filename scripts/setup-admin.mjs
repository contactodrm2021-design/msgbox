// 初始化默认管理员账号
// 用法（在项目根目录）：
//   node scripts/setup-admin.mjs
// 前置：已执行 setup-admin.sql 建表；.env.local 中已配置 Supabase 变量
//
// 默认账号（上线前务必修改密码，或删除示例账号）：
//   super@merc.asia   站长        MercAdmin#2026
//   mod@merc.asia      内容审核    MercMod#2026
//   analyst@merc.asia 数据分析    MercAnalyst#2026

import { createClient } from '@supabase/supabase-js';
import { randomBytes, scrypt } from 'crypto';
import fs from 'fs';
import path from 'path';

// 读取 .env.local（不依赖 dotenv）
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

const defaults = [
  { email: 'super@merc.asia',  password: 'MercAdmin#2026',   role: 'super_admin', display_name: '站长' },
  { email: 'mod@merc.asia',     password: 'MercMod#2026',     role: 'moderator',   display_name: '内容审核' },
  { email: 'analyst@merc.asia', password: 'MercAnalyst#2026', role: 'analyst',     display_name: '数据分析' },
];

for (const a of defaults) {
  const password_hash = await hashPassword(a.password);
  const { error } = await supabase
    .from('admins')
    .upsert(
      { email: a.email, password_hash, role: a.role, display_name: a.display_name },
      { onConflict: 'email' }
    );
  if (error) {
    console.error(`✗ 创建失败 ${a.email}: ${error.message}`);
  } else {
    console.log(`✓ 已创建/更新 ${a.email} (${a.role})`);
  }
}
