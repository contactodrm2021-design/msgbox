import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  const { name, content, file_url, file_name, tags, parent_id } = await request.json();

  const hasContent = content && content.trim();
  const hasFile = file_url && file_url.trim();

  // 纯语音留言允许没有文字内容，但必须带附件；其余至少要有文字或附件其一
  if (!hasContent && !hasFile) {
    return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 });
  }

  const cleanTags = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 8)
    : [];

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        name: name?.trim() || '匿名',
        content: hasContent ? content.trim() : null,
        file_url: hasFile ? file_url.trim() : null,
        file_name: file_name || null,
        tags: cleanTags,
        parent_id: parent_id || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// 点赞 / 取消点赞 / emoji 反应
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少留言 id' }, { status: 400 });
    }

    // 多表情反应（新增能力）
    if (body.reaction && (body.action === 'add' || body.action === 'remove')) {
      const { data: cur, error: fe } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', id)
        .single();

      if (fe || !cur) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 });
      }

      const map = { ...(cur.reactions || {}) };
      const count = map[body.reaction] || 0;
      const next = body.action === 'add' ? count + 1 : Math.max(0, count - 1);
      if (next <= 0) delete map[body.reaction];
      else map[body.reaction] = next;

      const { data, error } = await supabase
        .from('messages')
        .update({ reactions: map })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    // 兼容旧版 likes 字段
    if (body.delta === 1 || body.delta === -1) {
      const { data: current, error: fetchError } = await supabase
        .from('messages')
        .select('likes')
        .eq('id', id)
        .single();

      if (fetchError || !current) {
        return NextResponse.json({ error: '留言不存在' }, { status: 404 });
      }

      const newLikes = Math.max(0, (current.likes || 0) + body.delta);

      const { data, error } = await supabase
        .from('messages')
        .update({ likes: newLikes })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: '参数错误' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
}
