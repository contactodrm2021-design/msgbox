import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentAdmin, can } from '@/lib/auth';
import MessageAdmin from './MessageAdmin';
import AdminExport from './AdminExport';
import AdminDigest from './AdminDigest';

export const dynamic = 'force-dynamic';

const ROLE_LABEL = {
  super_admin: '站长',
  moderator: '内容审核',
  analyst: '数据分析',
};

export default async function AdminPage() {
  const admin = getCurrentAdmin();
  if (!admin) {
    redirect('/login?next=/admin');
  }

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="container">
        <div className="status error">加载留言失败：{error.message}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="bg-decor">
        <div className="stars" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="container">
        <header className="admin-header">
          <div>
            <h1 className="admin-h1">🛡️ 管理后台</h1>
            <p className="admin-sub">
              登录身份：<b>{admin.name}</b> · {ROLE_LABEL[admin.role] || admin.role}
            </p>
          </div>
          <div className="admin-actions">
            <a className="btn-ghost" href="/" target="_blank" rel="noreferrer">查看站点</a>
          </div>
        </header>

        <div className="admin-stats">
          <span className="stat-chip">📨 共 <b>{messages.length}</b> 条留言</span>
        </div>

        <MessageAdmin messages={messages || []} canDelete={can(admin.role, 'delete')} />

        <AdminExport messages={messages || []} canExport={can(admin.role, 'export')} />

        <AdminDigest />
      </div>
    </div>
  );
}
