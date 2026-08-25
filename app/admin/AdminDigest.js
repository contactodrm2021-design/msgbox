'use client';

import { useState, useEffect } from 'react';

export default function AdminDigest() {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/digest?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  return (
    <div className="admin-section">
      <h3 className="admin-h3">✨ 每周精选 / 周报</h3>
      <div className="admin-actions" style={{ marginBottom: '0.8rem' }}>
        <button
          className={`btn-ghost ${period === 'all' ? 'active' : ''}`}
          onClick={() => setPeriod('all')}
        >
          全部
        </button>
        <button
          className={`btn-ghost ${period === 'week' ? 'active' : ''}`}
          onClick={() => setPeriod('week')}
        >
          过去 7 天
        </button>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: '1.5rem' }}>
          <div className="spinner" />
        </div>
      ) : data?.error ? (
        <div className="status error">{data.error}</div>
      ) : data ? (
        <>
          <div className="digest-summary">{data.summary}</div>
          <div className="cal-stats" style={{ marginTop: '0.9rem' }}>
            <span className="stat-chip">📨 <b>{data.total}</b> 条</span>
            <span className="stat-chip">💞 <b>{data.totalReactions}</b> 次互动</span>
            {data.topReaction && (
              <span className="stat-chip">😍 最受欢迎 <b>{data.topReaction}</b></span>
            )}
            {data.busiestDay && (
              <span className="stat-chip">🔥 最热闹 <b>{data.busiestDay}</b></span>
            )}
          </div>
          {data.topTags?.length > 0 && (
            <div className="msg-tags" style={{ marginTop: '0.8rem' }}>
              {data.topTags.map((t) => (
                <span key={t.tag} className="msg-tag">#{t.tag} · {t.count}</span>
              ))}
            </div>
          )}
          <p className="auth-hint" style={{ marginTop: '0.8rem', textAlign: 'left' }}>
            为本地规则自动生成；如需更自然的语言，可在 <code>/api/digest</code> 接入 LLM。
          </p>
        </>
      ) : null}
    </div>
  );
}
