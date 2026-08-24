'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const res = await fetch('/api/messages');
      const data = await res.json();
      setMessages(data);
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
      setFile(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus({ type: 'success', text: '留言成功' });
    } catch {
      setStatus({ type: 'error', text: '发送失败' });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="container">
      <h1>留言箱</h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">昵称（可选）</label>
            <input
              className="input"
              type="text"
              placeholder="匿名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label className="label">留言内容 *</label>
            <textarea
              className="input"
              placeholder="说点什么..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={2000}
              required
            />
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
              onClick={() => document.getElementById('file-input').click()}
            >
              {fileName || '点击选择文件'}
            </div>
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading || !content.trim()}>
            {loading ? '发送中...' : '发送留言'}
          </button>
        </form>

        {status && <div className={`status ${status.type}`}>{status.text}</div>}
      </div>

      {loadingMessages ? (
        <div className="loading">加载中...</div>
      ) : messages.length === 0 ? (
        <div className="loading">暂无留言，来做第一个吧</div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className="message-item">
            <span className="message-name">{msg.name}</span>
            <span className="message-time">{formatTime(msg.created_at)}</span>
            <div className="message-content">{msg.content}</div>
            {msg.file_url && (
              <a className="file-link" href={msg.file_url} target="_blank" rel="noopener noreferrer">
                📎 {msg.file_name || '附件'}
              </a>
            )}
          </div>
        ))
      )}
    </div>
  );
}
