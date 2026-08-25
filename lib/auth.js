import { cookies } from 'next/headers';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'crypto';

// 会话密钥：生产环境务必用强随机值，并通过环境变量注入
const SECRET = process.env.ADMIN_SESSION_SECRET || 'dev-insecure-secret-change-me';
export const ADMIN_COOKIE = 'msgbox_admin';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 天（秒）

// ===== 角色权限矩阵 =====
// super_admin: 站长（全部权限）
// moderator:   内容审核（可查看 / 删除，不可管理账号）
// analyst:     数据分析（仅查看 / 导出，不可删除 / 管理账号）
export const ROLE_PERMISSIONS = {
  super_admin: { view: true, delete: true, manageAccounts: true, export: true },
  moderator: { view: true, delete: true, manageAccounts: false, export: true },
  analyst: { view: true, delete: false, manageAccounts: false, export: true },
};

export function can(role, action) {
  return Boolean(ROLE_PERMISSIONS[role]?.[action]);
}

// ===== 密码哈希（scrypt，无需额外依赖）=====
export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');
    scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt}:${derived.toString('hex')}`);
    });
  });
}

export function verifyPassword(password, stored) {
  return new Promise((resolve) => {
    if (!stored || !stored.includes(':')) return resolve(false);
    const [salt, key] = stored.split(':');
    scrypt(password, salt, 64, (err, derived) => {
      if (err) return resolve(false);
      try {
        resolve(timingSafeEqual(Buffer.from(key, 'hex'), derived));
      } catch {
        resolve(false);
      }
    });
  });
}

// ===== 签名会话 Cookie =====
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expected = createHmac('sha256', SECRET).update(body).digest('base64url');
  let sigOk = false;
  try {
    sigOk = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return null;
  }
  if (!sigOk) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(admin) {
  return sign({
    email: admin.email,
    role: admin.role,
    name: admin.display_name || admin.email,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
}

export function verifySessionToken(token) {
  return unsign(token);
}

// 在服务端组件 / 路由处理器中读取当前登录管理员
export function getCurrentAdmin() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
