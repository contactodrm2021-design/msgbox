'use client';

import { useState, useEffect, useCallback } from 'react';

function avatarFor(name) {
  const grads = ['#667eea,#764ba2', '#f093fb,#f5576c', '#4facfe,#00f2fe', '#43e97b,#38f9d7', '#fa709a,#fee140', '#a18cd1,#fbc2eb'];
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return `linear-gradient(135deg, ${grads[h % grads.length]})`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export default function DriftPage() {
  const [messages, setMessages] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setMessages(arr);
        setLoading(false);
        if (arr.length === 0) setEmpty(true);
        else pickRandom(arr);
      })
      .catch(() => {
        setLoading(false);
        setEmpty(true);
      });
  }, []);

  function pickRandom(arr) {
    const pool = arr && arr.length ? arr : messages;
    if (!pool.length) return;
    const idx = Math.floor(Math.random() * pool.length);
    setCurrent(pool[idx]);
  }

  function nextBottle() {
    if (!messages.length) return;
    let next = current;
    if (messages.length > 1) {
      while (next === current) {
        next = messages[Math.floor(Math.random() * messages.length)];
      }
    }
    setCurrent(next);
  }

  return (
    <div className="drift-page">
      <div className="bg-decor">
        <div className="stars" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <div className="container">
        <header>
          <h1 className="title-font">🫧 漂流瓶</h1>
          <p className="subtitle">捞起一条陌生的心声</p>
          <a className="admin-entry" href="/">← 返回留言墙</a>
        </header>

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            正在海上漂流…
          </div>
        ) : empty ? (
          <div className="empty-state">
            <span className="empty-icon">🌊</span>
            海面暂时空空如也，去留言墙投下第一个瓶子吧
          </div>
        ) : current ? (
          <div className="bottle-card">
            <div className="bottle-wave" />
            <div className="bottle-note">
              <div className="message-header">
                <div className="avatar" style={{ background: avatarFor(current.name || '匿名') }}>
                  {(current.name || '匿名').charAt(0)}
                </div>
                <div className="message-meta">
                  <span className="message-name">{current.name || '匿名'}</span>
                  <span className="message-time">{timeAgo(current.created_at)}</span>
                </div>
              </div>
              <div className="message-content" style={{ marginTop: '0.8rem', fontSize: '1.05rem' }}>
                {current.content ? escapeHtml(current.content) : '（一条语音漂流瓶）'}
              </div>
              {current.file_url && /\.(png|jpe?g|gif|webp|avif|svg)/i.test(current.file_url) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="message-image" src={current.file_url} alt="附件" style={{ marginTop: '0.8rem' }} />
              )}
            </div>
            <button className="btn btn-primary" onClick={nextBottle} style={{ marginTop: '1.4rem' }}>
              🌊 再捞一个
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
