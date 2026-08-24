'use client';

import { useState, useEffect, useRef } from 'react';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #ff9a9e, #fad0c4)',
  'linear-gradient(135deg, #5ee7df, #b490ca)',
];

const INSPIRATIONS = [
  '今天遇到的最有趣的一件事是什么？',
  '最近在单曲循环的一首歌，为什么喜欢它？',
  '如果明天就是世界末日，今晚你想做什么？',
  '说一个你从未告诉过别人的小秘密～',
  '最近有什么让你感到幸福的小事？',
  '给一年后的自己留一句话吧。',
  '推荐一部最近看过的电影或剧！',
  '描述一下今天的天空。',
  '你最想念的一个人是谁？',
  '随便写点什么，反正没人知道你是谁 🎭',
];

const LIKED_KEY = 'msgbox-liked';

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function avatarFor(name) {
  return AVATAR_GRADIENTS[hashString(name) % AVATAR_GRADIENTS.length];
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return '刚刚';
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} 天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
}

function fullTime(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(url);
}

function formatSize(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [lightbox, setLightbox] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const fileInputRef = useRef(null);

  const displayName = name.trim() || '匿名';

  useEffect(() => {
    fetchMessages();
    try {
      setLikedIds(new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')));
    } catch {
      /* 忽略本地存储异常 */
    }
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setStatus({ type: 'error', text: '加载留言失败' });
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setStatus(null);

    let fileUrl = null;
    let uploadedFileName = null;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          setStatus({ type: 'error', text: uploadData.error });
          setLoading(false);
          return;
        }

        fileUrl = uploadData.url;
        uploadedFileName = uploadData.name;
      } catch {
        setStatus({ type: 'error', text: '文件上传失败' });
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, file_url: fileUrl, file_name: uploadedFileName }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ type: 'error', text: data.error });
        return;
      }

      const newMsg = await res.json();
      setMessages([newMsg, ...messages]);
      setContent('');
      clearFile();
      setStatus({ type: 'success', text: '留言成功 ✨' });
    } catch {
      setStatus({ type: 'error', text: '发送失败' });
    } finally {
      setLoading(false);
    }
  }

  function toggleLike(id) {
    const liked = likedIds.has(id);
    const delta = liked ? -1 : 1;

    const nextLiked = new Set(likedIds);
    if (liked) {
      nextLiked.delete(id);
    } else {
      nextLiked.add(id);
    }
    setLikedIds(nextLiked);
    try {
      localStorage.setItem(LIKED_KEY, JSON.stringify([...nextLiked]));
    } catch {
      /* 忽略本地存储异常 */
    }

    const prevMessages = messages;
    setMessages(
      messages.map((m) => (m.id === id ? { ...m, likes: Math.max(0, (m.likes || 0) + delta) } : m))
    );

    fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, delta }),
    }).then((res) => {
      if (!res.ok) throw new Error('like failed');
    }).catch(() => {
      setMessages(prevMessages);
      const rollback = new Set(likedIds);
      setLikedIds(rollback);
      try {
        localStorage.setItem(LIKED_KEY, JSON.stringify([...rollback]));
      } catch {
        /* 忽略 */
      }
      setStatus({ type: 'error', text: '点赞失败，请先执行数据库升级（见 README）' });
    });
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  }

  function clearFile() {
    setFile(null);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleInspiration() {
    const insp = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setContent((prev) => (prev.trim() ? `${prev}\n${insp}` : insp));
  }

  const todayCount = messages.filter((m) => isToday(m.created_at)).length;
  const totalText = messages.length >= 50 ? '50+' : messages.length;

  return (
    <>
      <div className="bg-decor">
        <div className="stars" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="container">
        <header>
          <h1>
            <span className="title-emoji">💌</span>
            留言箱
          </h1>
          <p className="subtitle">匿名留言 · 自由表达</p>
          {!loadingMessages && (
            <div className="stats">
              <span className="stat-chip">
                💬 共 <b>{totalText}</b> 条留言
              </span>
              <span className="stat-chip">
                🌙 今日 <b>{todayCount}</b> 条
              </span>
            </div>
          )}
        </header>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">昵称（可选）</label>
              <div className="name-row">
                <div
                  className="avatar avatar-preview"
                  style={{ background: avatarFor(displayName) }}
                >
                  {displayName.charAt(0)}
                </div>
                <input
                  className="input"
                  type="text"
                  placeholder="匿名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label className="label" style={{ marginBottom: 0 }}>
                  留言内容 *
                </label>
                <button type="button" className="btn-ghost" onClick={handleInspiration}>
                  🎲 灵感
                </button>
              </div>
              <div className="textarea-wrap">
                <textarea
                  className="input"
                  placeholder="说点什么..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                  required
                />
                <span
                  className={`char-counter ${
                    content.length >= 2000
                      ? 'at-limit'
                      : content.length >= 1800
                        ? 'near-limit'
                        : ''
                  }`}
                >
                  {content.length} / 2000
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="label">附件（可选，最大 10MB）</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
              />
              <div
                className={`file-upload-area ${file ? 'has-file' : ''}`}
                onClick={() => !file && document.getElementById('file-input').click()}
              >
                <span className="file-upload-icon">{file ? '📎' : '📤'}</span>
                {file ? (
                  fileName
                ) : (
                  '点击选择文件'
                )}
                {file && (
                  <button
                    type="button"
                    className="file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                  >
                    ✕
                  </button>
                )}
                {file && <div className="file-meta">{formatSize(file.size)}</div>}
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading || !content.trim()}>
              {loading ? '发送中...' : '✨ 发送留言'}
            </button>
          </form>

          {status && <div className={`status ${status.type}`}>{status.text}</div>}
        </div>

        {loadingMessages ? (
          <div className="loading">
            <div className="spinner" />
            正在收取留言...
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌙</span>
            还没有留言，来做第一个留下足迹的人吧
          </div>
        ) : (
          <>
            <div className="list-title">留言墙</div>
            {messages.map((msg, index) => {
              const liked = likedIds.has(msg.id);
              const img = isImageUrl(msg.file_url);
              return (
                <div
                  key={msg.id}
                  className="message-item"
                  style={{ animationDelay: `${Math.min(index * 0.06, 0.6)}s` }}
                >
                  <div className="message-header">
                    <div className="avatar" style={{ background: avatarFor(msg.name || '匿名') }}>
                      {(msg.name || '匿名').charAt(0)}
                    </div>
                    <div className="message-meta">
                      <span className="message-name">{msg.name || '匿名'}</span>
                      <span className="message-time" title={fullTime(msg.created_at)}>
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`like-btn ${liked ? 'liked' : ''}`}
                      onClick={() => toggleLike(msg.id)}
                    >
                      {liked ? '❤️' : '🤍'} {msg.likes || 0}
                    </button>
                  </div>

                  <div className="message-content">{msg.content}</div>

                  {img ? (
                    <img
                      className="message-image"
                      src={msg.file_url}
                      alt={msg.file_name || '附件图片'}
                      loading="lazy"
                      onClick={() => setLightbox(msg.file_url)}
                    />
                  ) : (
                    msg.file_url && (
                      <a
                        className="file-link"
                        href={msg.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 <span>{msg.file_name || '附件'}</span>
                      </a>
                    )
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {showTop && (
        <button
          type="button"
          className="to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="回到顶部"
        >
          ↑
        </button>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="预览" />
          <span className="lightbox-hint">点击任意处关闭</span>
        </div>
      )}
    </>
  );
}
