import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, createSessionToken, ADMIN_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let email, password;
  try {
    ({ email, password } = await request.json());
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('admins')
    .select('email, password_hash, role, display_name')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  const ok = await verifyPassword(password, data.password_hash);
  if (!ok) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 });
  }

  const token = createSessionToken(data);
  const res = NextResponse.json({
    ok: true,
    admin: { email: data.email, role: data.role, name: data.display_name },
  });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
