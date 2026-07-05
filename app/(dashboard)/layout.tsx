import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import MokaChat from '@/components/MokaChat'
import NavLink from '@/components/NavLink'

const NAV_TOP = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/reels', label: 'Reels', icon: '▶' },
  { href: '/historias', label: 'Historias', icon: '◎' },
  { href: '/competidores', label: 'Competencia', icon: '⚡' },
  { href: '/audiencia', label: 'Tu audiencia', icon: '👥' },
  { href: '/ventas', label: 'Ventas', icon: '$' },
  { href: '/contenido', label: 'Mesa de trabajo', icon: '✏' },
  { href: '/ideas', label: 'Moka AI', icon: '🤖' },
  { href: '/referencias', label: 'Referencias', icon: '🎬' },
]

const NAV_BOTTOM = [
  { href: '/marca', label: 'ADN de Marca', icon: '◈' },
  { href: '/configuracion', label: 'Settings', icon: '⚙' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) redirect('/connect')

  const db = createServerSupabase()
  const [{ data: account }, { data: reels30d }] = await Promise.all([
    db.from('ig_accounts').select('username, profile_picture_url, followers_count').eq('id', accountId).single(),
    db.from('reels').select('views').eq('account_id', accountId).gte('timestamp', new Date(Date.now() - 30 * 864e5).toISOString()),
  ])

  const totalViews = (reels30d || []).reduce((s: number, r: any) => s + r.views, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 230,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Profile */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            {account?.profile_picture_url
              ? <img src={account.profile_picture_url} style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--accent-light)' }} alt="" />
              : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
            }
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{account?.username || 'Mi cuenta'}</div>
              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>powered by Moka</div>
            </div>
          </div>

          {/* Quick stats in header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Seguidores', value: account?.followers_count ? (account.followers_count >= 1000 ? `${(account.followers_count/1000).toFixed(1)}K` : account.followers_count) : '—' },
              { label: 'Views 30d', value: totalViews >= 1000 ? `${(totalViews/1000).toFixed(0)}K` : totalViews || '—' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 4 }}>
            {NAV_TOP.map(item => <NavLink key={item.href} {...item} />)}
          </div>
        </nav>

        {/* Bottom nav */}
        <div style={{ padding: '8px 10px 12px', borderTop: '1px solid var(--border)' }}>
          {NAV_BOTTOM.map(item => <NavLink key={item.href} {...item} />)}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top header bar */}
        <header style={{
          height: 52,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
        }}>
          {account?.profile_picture_url && (
            <img src={account.profile_picture_url} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />
          )}
          <span style={{ fontSize: 13, fontWeight: 700 }}>{account?.username}</span>

          <div style={{ display: 'flex', gap: 20, marginLeft: 16 }}>
            {[
              { icon: '👁', label: 'VIEWS', value: totalViews >= 1000000 ? `${(totalViews/1000000).toFixed(1)}M` : totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}K` : totalViews || '0' },
              { icon: '👥', label: 'FOLLOWERS', value: account?.followers_count ? `${(account.followers_count/1000).toFixed(1)}K` : '—' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>🎯 Moka</div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '28px 28px' }}>
          {children}
        </main>
      </div>

      <MokaChat />
    </div>
  )
}
