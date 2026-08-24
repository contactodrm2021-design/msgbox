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
