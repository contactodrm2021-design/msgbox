import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentAdmin, can } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// 删除留言（仅管理员）
export async function DELETE(request) {
  const admin = getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

  if (!can(admin.role, 'delete')) {
    return NextResponse.json({ error: '当前角色无权删除留言' }, { status: 403 });
  }

  let id;
  try {
    ({ id } = await request.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!id) {
    return NextResponse.json({ error: '缺少留言 id' }, { status: 400 });
  }

  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// 拉取全部留言（后台用，管理员鉴权）
export async function GET() {
  const admin = getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
