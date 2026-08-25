'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

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

const REACTIONS = ['❤️', '🔥', '😂', '🤔', '👀'];
const EMOJIS = ['😀', '😂', '🥰', '😎', '🤔', '😭', '😡', '👍', '👏', '🙏', '💖', '🔥', '🌟', '🌈', '🍀', '🎉', '🐱', '🌙', '✨', '💤'];
const REACTIONS_KEY = 'msgbox-reactions';

const FESTIVAL_TEMPLATES = [
  { icon: '🧧', label: '新年', text: '🧧 新年快乐！这一年的烦恼都留在去年吧，愿新的一年里，你我都能被温柔以待。' },
  { icon: '💗', label: '情人节', text: '💗 今天是情人节，想对那个说不清的人说一句：其实，我有在偷偷想你。' },
  { icon: '🎂', label: '生日', text: '🎂 祝我生日快乐。不指望谁记得，但还是要认真许个愿——健康，自由，和一点点好运。' },
  { icon: '🌕', label: '中秋', text: '🌕 月圆人团圆。今晚的月亮替我，寄给远方那个暂时见不到的人。' },
  { icon: '🎃', label: '万圣节', text: '🎃 不给糖就捣蛋！今晚可以假装是另一个自己，去说平时不敢说的话。' },
  { icon: '🎄', label: '圣诞', text: '🎄 圣诞快乐。愿所有等待都有回音，愿所有孤单都被温柔接住。' },
  { icon: '🌟', label: '许愿', text: '🌟 如果流星愿意听，我想许一个关于「被理解」的愿望。' },
  { icon: '☕', label: '日常', text: '☕ 今天也只是平平无奇的一天，但还好，有这个地方可以让我说说话。' },
];

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

function isAudioUrl(url) {
  if (!url) return false;
  return /\.(mp3|wav|ogg|webm|m4a|aac|flac)(\?|#|$)/i.test(url) ||
    /cloudinary\.com.*\/video\/upload/i.test(url);
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

function totalReactions(m) {
  const r = m.reactions || {};
  return Object.values(r).reduce((a, b) => a + (b || 0), 0);
}

function parseTags(str) {
  if (!str) return [];
  return Array.from(
    new Set(
      str
        .split(/[#,\s]+/)
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean)
    )
  ).slice(0, 8);
}

// 轻量 Markdown 渲染：先转义防 XSS，再支持粗体/斜体/行内代码/自动链接
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function renderMarkdown(text) {
  if (!text) return '';
  let s = escapeHtml(text);
  s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [filePreview, setFilePreview] = useState(null);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [userReactions, setUserReactions] = useState({});
  const [lightbox, setLightbox] = useState(null);
  const [showTop, setShowTop] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('new'); // 'new' | 'hot'
  const [activeTags, setActiveTags] = useState(new Set());
  const [showEmoji, setShowEmoji] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [recording, setRecording] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const contentRef = useRef(null);

  const displayName = name.trim() || '匿名';

  useEffect(() => {
    fetchMessages();
    try {
      setUserReactions(JSON.parse(localStorage.getItem(REACTIONS_KEY) || '{}'));
    } catch {
      /* 忽略本地存储异常 */
    }
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    const onMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      const decor = document.querySelector('.bg-decor');
      if (decor) decor.style.transform = `translate(${x * -18}px, ${y * -18}px)`;
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMove);
    };
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
    if (!content.trim() && !file) return;

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
        body: JSON.stringify({
          name,
          content: content.trim(),
          file_url: fileUrl,
          file_name: uploadedFileName,
          tags: parseTags(tagsInput),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus({ type: 'error', text: data.error });
        return;
      }

      const newMsg = await res.json();
      setMessages([newMsg, ...messages]);
      setContent('');
      setTagsInput('');
      clearFile();
      setStatus({ type: 'success', text: '留言成功 ✨' });
    } catch {
      setStatus({ type: 'error', text: '发送失败' });
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(parentId) {
    const text = replyText.trim();
    if (!text) return;
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content: text, parent_id: parentId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setStatus({ type: 'error', text: d.error || '回复失败' });
        return;
      }
      const newMsg = await res.json();
      setMessages([newMsg, ...messages]);
      setReplyText('');
      setReplyTarget(null);
    } catch {
      setStatus({ type: 'error', text: '回复发送失败' });
    }
  }

  async function toggleReaction(id, emoji) {
    const prev = userReactions[id];
    const nextState = { ...userReactions };
    const ops = [];
    if (prev) ops.push({ reaction: prev, action: 'remove' });
    if (prev !== emoji) ops.push({ reaction: emoji, action: 'add' });

    if (prev === emoji) delete nextState[id];
    else nextState[id] = emoji;
    setUserReactions(nextState);
    try {
      localStorage.setItem(REACTIONS_KEY, JSON.stringify(nextState));
    } catch {
      /* 忽略本地存储异常 */
    }

    try {
      let updated;
      for (const op of ops) {
        const res = await fetch('/api/messages', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...op }),
        });
        if (res.ok) updated = await res.json();
      }
      if (updated) {
        setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, reactions: updated.reactions } : m)));
      }
    } catch {
      setUserReactions(userReactions);
      try {
        localStorage.setItem(REACTIONS_KEY, JSON.stringify(userReactions));
      } catch {
        /* 忽略 */
      }
      setStatus({ type: 'error', text: '操作失败，请稍后再试' });
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      if (isImageUrl(f.name) && typeof URL !== 'undefined' && URL.createObjectURL) {
        setFilePreview(URL.createObjectURL(f));
      } else {
        setFilePreview(null);
      }
    }
  }

  function clearFile() {
    setFile(null);
    setFileName('');
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleInspiration() {
    const insp = INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)];
    setContent((prev) => (prev.trim() ? `${prev}\n${insp}` : insp));
  }

  function insertEmoji(em) {
    setContent((prev) => prev + em);
    setShowEmoji(false);
    contentRef.current?.focus();
  }

  function applyTemplate(text) {
    setContent((prev) => (prev.trim() ? `${prev}\n${text}` : text));
    setShowTemplates(false);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        const f = new File([blob], `voice_${Date.now()}.webm`, { type: blob.type });
        setFile(f);
        setFileName('🎤 语音留言');
        setFilePreview(null);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setStatus({ type: 'error', text: '无法访问麦克风，请检查浏览器权限' });
    }
  }

  function stopRecording() {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
    setRecording(false);
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    setSubscribeStatus(null);
    const email = subscribeEmail.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setSubscribeStatus({ type: 'error', text: '邮箱格式不正确' });
      return;
    }
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribeStatus({ type: 'success', text: '订阅成功，记得常回来看看 🌙' });
        setSubscribeEmail('');
      } else {
        const d = await res.json().catch(() => ({}));
        setSubscribeStatus({ type: 'error', text: d.error || '订阅失败' });
      }
    } catch {
      setSubscribeStatus({ type: 'error', text: '网络错误' });
    }
  }

  const todayCount = messages.filter((m) => isToday(m.created_at)).length;
  const totalText = messages.length >= 50 ? '50+' : messages.length;

  const allTags = useMemo(() => {
    const counts = {};
    for (const m of messages) {
      for (const t of m.tags || []) counts[t] = (counts[t] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [messages]);

  const visible = useMemo(() => {
    let arr = messages;
    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (m) =>
          (m.content || '').toLowerCase().includes(q) ||
          (m.name || '').toLowerCase().includes(q) ||
          (m.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTags.size > 0) {
      arr = arr.filter((m) => (m.tags || []).some((t) => activeTags.has(t)));
    }
    if (sort === 'hot') {
      arr = [...arr].sort((a, b) => totalReactions(b) - totalReactions(a));
    }
    return arr;
  }, [messages, query, sort, activeTags]);

  const topLevel = visible.filter((m) => !m.parent_id);
  const childrenOf = (id) => messages.filter((m) => m.parent_id === id);

  function toggleTag(t) {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function renderAttachment(msg) {
    if (isImageUrl(msg.file_url)) {
      return (
        <img
          className="message-image"
          src={msg.file_url}
          alt={msg.file_name || '附件图片'}
          loading="lazy"
          onClick={() => setLightbox(msg.file_url)}
        />
      );
    }
    if (isAudioUrl(msg.file_url)) {
      return (
        <audio className="message-audio" src={msg.file_url} controls preload="metadata" />
      );
    }
    if (msg.file_url) {
      return (
        <a className="file-link" href={msg.file_url} target="_blank" rel="noopener noreferrer">
          📎 <span>{msg.file_name || '附件'}</span>
        </a>
      );
    }
    return null;
  }

  function renderMessage(msg, index, isReply) {
    const img = isImageUrl(msg.file_url);
    const myReaction = userReactions[msg.id];
    const children = isReply ? [] : childrenOf(msg.id);
    return (
      <div
        key={msg.id}
        className={`message-item ${isReply ? 'message-reply' : ''}`}
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
        </div>

        {msg.content && (
          <div
            className="message-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        )}

        {renderAttachment(msg)}

        {msg.tags && msg.tags.length > 0 && (
          <div className="msg-tags">
            {msg.tags.map((t) => (
              <span key={t} className="msg-tag" onClick={() => toggleTag(t)}>
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="message-actions">
          <div className="reactions">
            {REACTIONS.map((em) => {
              const c = (msg.reactions && msg.reactions[em]) || 0;
              return (
                <button
                  type="button"
                  key={em}
                  className={`react-btn ${myReaction === em ? 'active' : ''}`}
                  onClick={() => toggleReaction(msg.id, em)}
                >
                  <span className="react-emoji">{em}</span>
                  {c > 0 && <span className="react-count">{c}</span>}
                </button>
              );
            })}
          </div>
          {!isReply && (
            <button
              type="button"
              className="reply-toggle"
              onClick={() => {
                setReplyTarget(replyTarget === msg.id ? null : msg.id);
                setReplyText('');
              }}
            >
              💬 回复
            </button>
          )}
        </div>

        {replyTarget === msg.id && (
          <div className="reply-box">
            <textarea
              className="input reply-input"
              placeholder={`以「${displayName}」身份匿名回复…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={1000}
            />
            <div className="reply-actions">
              <button type="button" className="btn-ghost" onClick={() => setReplyTarget(null)}>
                取消
              </button>
              <button
                type="button"
                className="btn-ghost reply-send"
                disabled={!replyText.trim()}
                onClick={() => sendReply(msg.id)}
              >
                发送回复
              </button>
            </div>
          </div>
        )}

        {children.length > 0 && (
          <div className="reply-list">
            {children.map((c, i) => renderMessage(c, i, true))}
          </div>
        )}
      </div>
    );
  }

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
          <h1 className="title-font">
            <span className="title-emoji">💌</span>
            留言箱
          </h1>
          <p className="subtitle">匿名留言 · 自由表达</p>
          <a className="admin-entry" href="/login">🔐 管理员入口</a>
          <a className="admin-entry" href="/drift" style={{ marginLeft: 8 }}>🫧 漂流瓶</a>
          <a className="admin-entry" href="/calendar" style={{ marginLeft: 8 }}>📅 心情日历</a>
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
                <div className="label-tools">
                  <button type="button" className="btn-ghost" onClick={handleInspiration}>
                    🎲 灵感
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowTemplates((v) => !v)}
                  >
                    🎴 模板
                  </button>
                  <button
                    type="button"
                    className={`btn-ghost ${showEmoji ? 'active' : ''}`}
                    onClick={() => setShowEmoji((v) => !v)}
                  >
                    😊 表情
                  </button>
                </div>
              </div>

              {showTemplates && (
                <div className="template-drawer">
                  {FESTIVAL_TEMPLATES.map((t) => (
                    <button
                      type="button"
                      key={t.label}
                      className="template-chip"
                      onClick={() => applyTemplate(t.text)}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              )}

              {showEmoji && (
                <div className="emoji-picker">
                  {EMOJIS.map((em) => (
                    <button type="button" key={em} className="emoji-item" onClick={() => insertEmoji(em)}>
                      {em}
                    </button>
                  ))}
                </div>
              )}

              <div className="textarea-wrap">
                <textarea
                  ref={contentRef}
                  className="input"
                  placeholder="说点什么...（支持 **粗体** *斜体* `代码` 与链接，也试试 🎴 节日模板）"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                />
                <span
                  className={`char-counter ${
                    content.length >= 2000 ? 'at-limit' : content.length >= 1800 ? 'near-limit' : ''
                  }`}
                >
                  {content.length} / 2000
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="label">标签（可选，用空格或 # 分隔，便于筛选）</label>
              <input
                className="input"
                type="text"
                placeholder="例如：树洞 表白 提问"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                maxLength={60}
              />
            </div>

            <div className="form-group">
              <label className="label">附件 / 语音（可选，最大 10MB）</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-input"
                accept="image/*,audio/*"
              />
              <div
                className={`file-upload-area ${file ? 'has-file' : ''}`}
                onClick={() => !file && !recording && document.getElementById('file-input').click()}
              >
                {filePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="file-preview" src={filePreview} alt="预览" />
                ) : (
                  <span className="file-upload-icon">{file ? '📎' : '📤'}</span>
                )}
                {file ? (
                  fileName
                ) : recording ? (
                  <span className="recording">● 录音中…点击停止</span>
                ) : (
                  '点击选择图片 / 音频'
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
              <button
                type="button"
                className={`btn-ghost record-btn ${recording ? 'recording-on' : ''}`}
                onClick={recording ? stopRecording : startRecording}
                style={{ marginTop: 8 }}
              >
                {recording ? '■ 停止录音' : '🎤 录制语音留言'}
              </button>
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || (!content.trim() && !file)}
            >
              {loading ? '发送中...' : '✨ 发送留言'}
            </button>
          </form>

          {status && <div className={`status ${status.type}`}>{status.text}</div>}
        </div>

        {!loadingMessages && (
          <div className="wall-toolbar">
            <input
              className="tool-search"
              placeholder="🔍 搜索内容 / 昵称 / 标签"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="tool-sort">
              <button
                type="button"
                className={sort === 'new' ? 'active' : ''}
                onClick={() => setSort('new')}
              >
                最新
              </button>
              <button
                type="button"
                className={sort === 'hot' ? 'active' : ''}
                onClick={() => setSort('hot')}
              >
                最热
              </button>
            </div>
          </div>
        )}

        {!loadingMessages && allTags.length > 0 && (
          <div className="tag-filters">
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                className={`tag-filter ${activeTags.has(t) ? 'active' : ''}`}
                onClick={() => toggleTag(t)}
              >
                #{t}
              </button>
            ))}
            {activeTags.size > 0 && (
              <button type="button" className="tag-filter clear" onClick={() => setActiveTags(new Set())}>
                清除筛选 ✕
              </button>
            )}
          </div>
        )}

        {loadingMessages ? (
          <div className="loading">
            <div className="spinner" />
            正在收取留言...
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌙</span>
            {messages.length === 0
              ? '还没有留言，来做第一个留下足迹的人吧'
              : '没有匹配的留言'}
          </div>
        ) : (
          <>
            <div className="list-title">留言墙</div>
            {topLevel.map((msg, index) => renderMessage(msg, index, false))}
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

      <footer className="brand-footer">
        <span>以 <b>merc</b> 之名 · 自由表达 ✨</span>
        <a href="https://merc.asia" target="_blank" rel="noopener noreferrer">merc.asia ↗</a>
      </footer>

      <div className="subscribe-bar">
        <span className="subscribe-label">📮 想收到每周精选？</span>
        <form className="subscribe-form" onSubmit={handleSubscribe}>
          <input
            className="subscribe-input"
            type="email"
            placeholder="你的邮箱"
            value={subscribeEmail}
            onChange={(e) => setSubscribeEmail(e.target.value)}
          />
          <button className="subscribe-btn" type="submit">订阅</button>
        </form>
        {subscribeStatus && (
          <div className={`subscribe-status ${subscribeStatus.type}`}>{subscribeStatus.text}</div>
        )}
      </div>
    </>
  );
}
