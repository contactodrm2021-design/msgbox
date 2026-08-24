import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request) {
  const { name, content, file_url, file_name } = await request.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: '留言内容不能为空' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        name: name?.trim() || '匿名',
        content: content.trim(),
        file_url: file_url || null,
        file_name: file_name || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

// 点赞 / 取消点赞
export async function PATCH(request) {
  try {
    const { id, delta } = await request.json();

    if (!id || (delta !== 1 && delta !== -1)) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const { data: current, error: fetchError } = await supabase
      .from('messages')
      .select('likes')
      .eq('id', id)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: '留言不存在' }, { status: 404 });
    }

    const newLikes = Math.max(0, (current.likes || 0) + delta);

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
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }
}
