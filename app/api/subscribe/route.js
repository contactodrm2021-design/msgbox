import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 邮箱订阅（品牌 footer 留存钩子）
export async function POST(request) {
  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
  }

  const { error } = await supabase
    .from('subscribers')
    .upsert({ email: email.trim().toLowerCase() }, { onConflict: 'email' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
