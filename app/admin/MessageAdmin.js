'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const REACTIONS = ['❤️', '🔥', '😂', '🤔', '👀'];

function timeStr(dateStr) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

function totalReactions(m) {
  const r = m.reactions || {};
  return Object.values(r).reduce((a, b) => a + (b || 0), 0);
}

function isImageUrl(url) {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|#|$)/i.test(url);
}

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

export default function MessageAdmin({ messages, canDelete }) {
  const router = useRouter();
  const [list, setList] = useState(messages);
  const [busyId, setBusyId] = useState(null);

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!confirm('确定删除这条留言？此操作不可恢复。')) return;
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d.error || '删除失败');
        return;
      }
      setList((l) => l.filter((m) => m.id !== id));
    } catch {
      alert('网络错误');
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <div>
      <div className="admin-actions" style={{ marginBottom: '1rem' }}>
        <button className="btn-ghost" onClick={handleLogout}>退出登录</button>
        {!canDelete && <span className="role-note">当前为「数据分析」角色，仅可查看</span>}
      </div>

      {list.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🌙</span>
          暂无留言
        </div>
      ) : (
        <div className="admin-list">
          {list.map((msg) => (
            <div className="message-item admin-item" key={msg.id}>
              <div className="message-header">
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
                  {(msg.name || '匿').charAt(0)}
                </div>
                <div className="message-meta">
                  <span className="message-name">{msg.name || '匿名'}</span>
                  <span className="message-time">{timeStr(msg.created_at)}</span>
                </div>
                {canDelete && (
                  <button
                    className="admin-del"
                    disabled={busyId === msg.id}
                    onClick={() => handleDelete(msg.id)}
                  >
                    {busyId === msg.id ? '删除中…' : '删除'}
                  </button>
                )}
              </div>

              <div
                className="message-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />

              <div className="reactions">
                {REACTIONS.map((em) => {
                  const c = (msg.reactions && msg.reactions[em]) || 0;
                  return c > 0 ? (
                    <span key={em} className="react-chip">{em} {c}</span>
                  ) : null;
                })}
                {totalReactions(msg) === 0 && <span className="react-chip faint">暂无反应</span>}
              </div>

              {isImageUrl(msg.file_url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="message-image" src={msg.file_url} alt={msg.file_name || '附件'} loading="lazy" />
              ) : msg.file_url ? (
                <a className="file-link" href={msg.file_url} target="_blank" rel="noreferrer">
                  📎 <span>{msg.file_name || '附件'}</span>
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
