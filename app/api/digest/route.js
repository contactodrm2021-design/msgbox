import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const REACTIONS = ['❤️', '🔥', '😂', '🤔', '👀'];

function dayKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

// 本地规则生成的「周报 / 精选」摘要（无需任何外部 LLM 密钥）
// 如需更自然的语言，可在此接入 LLM：把 stats 作为 prompt 喂给模型即可
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') === 'week' ? 'week' : 'all';

  const { data, error } = await supabase
    .from('messages')
    .select('content, created_at, reactions, tags');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = data || [];
  const now = Date.now();
  const since = period === 'week' ? now - 7 * 86400000 : 0;
  const msgs = period === 'week' ? all.filter((m) => new Date(m.created_at).getTime() >= since) : all;

  const total = msgs.length;
  let totalReactions = 0;
  const reactionCount = {};
  const byDay = {};
  const tagCount = {};

  for (const m of msgs) {
    const r = m.reactions || {};
    for (const k of Object.keys(r)) {
      const c = Number(r[k]) || 0;
      totalReactions += c;
      reactionCount[k] = (reactionCount[k] || 0) + c;
    }
    const dk = dayKey(m.created_at);
    byDay[dk] = (byDay[dk] || 0) + 1;
    for (const t of m.tags || []) {
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }

  const topReaction =
    Object.entries(reactionCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const busiestDay =
    Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const activeDays = Object.keys(byDay).length;
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, c]) => ({ tag: t, count: c }));

  // 规则生成摘要文案
  const scope = period === 'week' ? '过去 7 天' : '全部时间';
  let summary = '';
  if (total === 0) {
    summary = `${scope}还没有新留言，去首页留下第一条吧 🌙`;
  } else {
    const parts = [];
    parts.push(`${scope}共收到 ${total} 条留言`);
    if (totalReactions > 0) parts.push(`累计 ${totalReactions} 次表情互动`);
    if (topReaction) parts.push(`大家最爱用 ${topReaction} 表达`);
    if (busiestDay) parts.push(`${busiestDay} 是最热闹的一天`);
    if (activeDays > 0) parts.push(`覆盖了 ${activeDays} 个有故事的日夜`);
    if (topTags.length) parts.push(`高频话题：${topTags.map((t) => '#' + t.tag).join(' ')}`);
    summary = parts.join('，') + '。';
  }

  return NextResponse.json({
    period,
    total,
    totalReactions,
    topReaction,
    busiestDay,
    activeDays,
    topTags,
    summary,
    byDay,
  });
}
