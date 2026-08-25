'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('guest'); // guest | admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function guestEnter() {
    const n = name.trim();
    if (n) {
      try {
        localStorage.setItem('msgbox-nick', n);
      } catch {}
    }
    router.push('/');
  }

  async function adminLogin(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('邮箱和密码不能为空');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }
      router.push('/admin');
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="bg-decor">
        <div className="stars" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="auth-wrap">
        <div className="brand">merc · 留言箱</div>
        <h1 className="auth-title">进入留言箱</h1>
        <p className="auth-sub">匿名留言 · 自由表达</p>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'guest' ? 'active' : ''}`}
              onClick={() => setMode('guest')}
            >
              访客
            </button>
            <button
              className={`auth-tab ${mode === 'admin' ? 'active' : ''}`}
              onClick={() => setMode('admin')}
            >
              管理员
            </button>
          </div>

          {mode === 'guest' && (
            <div className="auth-body">
              <label className="label">昵称（可选）</label>
              <input
                className="input"
                type="text"
                placeholder="留空将随机生成「匿名旅人」"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
              />
              <button className="btn btn-primary" onClick={guestEnter}>
                进入留言墙
              </button>
              <p className="auth-hint">
                无需注册，留下名字即可。<br />
                想管理留言？切到「管理员」登录后台。
              </p>
            </div>
          )}

          {mode === 'admin' && (
            <form className="auth-body" onSubmit={adminLogin}>
              <label className="label">管理员邮箱</label>
              <input
                className="input"
                type="email"
                placeholder="super@merc.asia"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
              <label className="label">密码</label>
              <input
                className="input"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {error && <div className="status error">{error}</div>}
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? '登录中...' : '登录后台'}
              </button>
              <p className="auth-hint">
                后台地址 <b>/admin</b>，受服务端鉴权保护。
              </p>
            </form>
          )}
        </div>

        <div className="auth-foot">
          © merc · 留言箱 · <a href="https://merc.asia" target="_blank" rel="noreferrer">merc.asia</a>
        </div>
      </div>
    </>
  );
}
