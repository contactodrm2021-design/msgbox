'use client';

import { useState } from 'react';

function totalReactions(m) {
  const r = m.reactions || {};
  return Object.values(r).reduce((a, b) => a + (b || 0), 0);
}

function csvField(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminExport({ messages, canExport }) {
  const [done, setDone] = useState(null);

  function exportCsv() {
    if (!canExport) return;
    const header = ['id', '昵称', '内容', '标签', '反应数', '创建时间'];
    const rows = messages.map((m) => [
      m.id,
      m.name || '匿名',
      m.content || '',
      (m.tags || []).join('|'),
      totalReactions(m),
      m.created_at,
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvField).join(',')).join('\n');
    download(`msgbox-export-${Date.now()}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
    setDone('CSV 已导出');
  }

  function exportJson() {
    if (!canExport) return;
    download(
      `msgbox-export-${Date.now()}.json`,
      JSON.stringify(messages, null, 2),
      'application/json'
    );
    setDone('JSON 已导出');
  }

  if (!canExport) {
    return (
      <div className="admin-section">
        <h3 className="admin-h3">📤 数据导出</h3>
        <p className="role-note">当前角色（数据分析）仅可查看，导出权限归站长 / 审核。</p>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h3 className="admin-h3">📤 数据导出</h3>
      <p className="admin-sub" style={{ marginBottom: '0.8rem' }}>
        共 <b>{messages.length}</b> 条留言，可导出为 CSV（Excel 友好）或 JSON。
      </p>
      <div className="admin-actions">
        <button className="btn-ghost" onClick={exportCsv}>⬇ 导出 CSV</button>
        <button className="btn-ghost" onClick={exportJson}>⬇ 导出 JSON</button>
        {done && <span className="role-note">{done}</span>}
      </div>
    </div>
  );
}
