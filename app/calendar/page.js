'use client';

import { useState, useEffect, useMemo } from 'react';

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const { cells, total, busiest, maxCount } = useMemo(() => {
    const counts = {};
    for (const m of messages) {
      const k = dayKey(m.created_at);
      counts[k] = (counts[k] || 0) + 1;
    }
    const total = messages.length;
    let maxCount = 0;
    let busiest = null;
    for (const [k, c] of Object.entries(counts)) {
      if (c > maxCount) {
        maxCount = c;
        busiest = k;
      }
    }
    // 构建过去 119 天（17 周）的格子，按周排列
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (17 * 7 - 1));
    for (let i = 0; i < 17 * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const k = dayKey(d);
      days.push({ key: k, date: d, count: counts[k] || 0 });
    }
    return { cells: days, total, busiest, maxCount };
  }, [messages]);

  function level(c) {
    if (c <= 0) return 0;
    if (maxCount <= 1) return 1;
    const r = c / maxCount;
    if (r > 0.66) return 4;
    if (r > 0.33) return 3;
    if (r > 0) return 2;
    return 1;
  }

  // 按周分列（每列 7 天）
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="calendar-page">
      <div className="bg-decor">
        <div className="stars" />
        <div className="orb orb-1" />
        <div className="orb orb-3" />
      </div>
      <div className="container">
        <header>
          <h1 className="title-font">📅 心情日历</h1>
          <p className="subtitle">每一天的悄悄话，都算数</p>
          <a className="admin-entry" href="/">← 返回留言墙</a>
        </header>

        <div className="card">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              正在整理日历…
            </div>
          ) : (
            <>
              <div className="cal-stats">
                <span className="stat-chip">📨 共 <b>{total}</b> 条</span>
                {busiest && (
                  <span className="stat-chip">
                    🔥 最热闹 <b>{busiest}</b>（{maxCount} 条）
                  </span>
                )}
              </div>

              <div className="heatmap-wrap">
                <div className="heatmap">
                  {weeks.map((w, wi) => (
                    <div className="heat-col" key={wi}>
                      {w.map((d) => (
                        <div
                          key={d.key}
                          className={`heat-cell l${level(d.count)}`}
                          onMouseEnter={() => setHover({ ...d })}
                          onMouseLeave={() => setHover(null)}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="heat-legend">
                  少
                  <span className="heat-cell l0" />
                  <span className="heat-cell l1" />
                  <span className="heat-cell l2" />
                  <span className="heat-cell l3" />
                  <span className="heat-cell l4" />
                  多
                </div>
              </div>

              <div className="heat-tip">
                {hover
                  ? `${hover.key} · ${hover.count} 条留言`
                  : '把鼠标移到格子上查看每天的留言数'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
