import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import KlarChat from '@/components/MokaChat'
import NavLink from '@/components/NavLink'
import LogoutButton from '@/components/LogoutButton'
import MobileNav from '@/components/MobileNav'
import ThemeToggle from '@/components/ThemeToggle'
import ProfileAvatar from '@/components/ProfileAvatar'

const NAV_TOP = [
  { href: '/dashboard', label: 'Inicio', icon: '⊞' },
  { href: '/reels', label: 'Mis Reels', icon: '▶' },
  { href: '/rayos-x', label: 'Análisis', icon: '📊' },
  { href: '/crear', label: 'Crear', icon: '✨' },
  { href: '/espia', label: 'Espía', icon: '👁' },
  { href: '/calendario', label: 'Calendario', icon: '📅' },
  { href: '/ventas', label: 'Ventas', icon: '💰' },
]

const NAV_BOTTOM = [
  { href: '/marca', label: 'Mi Marca', icon: '◈' },
  { href: '/configuracion', label: 'Configuración', icon: '⚙' },
]

function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

function SidebarContent({ account, accountId }: { account: any; accountId: string }) {
  return (
    <>
      {/* Profile */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ProfileAvatar accountId={accountId} username={account?.username} size={34} border="2px solid var(--accent-light)" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{account?.username || 'cuenta'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 500 }}>
              {account?.followers_count ? formatK(account.followers_count) + ' seguidores' : 'Klar'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }} aria-label="Navegación principal">
        {NAV_TOP.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px 10px 12px', borderTop: '1px solid var(--border)' }}>
        {NAV_BOTTOM.map(item => <NavLink key={item.href} {...item} />)}
        <LogoutButton />
      </div>
    </>
  )
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) redirect('/connect')

  const db = createServerSupabase()
  const [{ data: account }, { data: reels30d }, { data: lastSync }] = await Promise.all([
    db.from('ig_accounts').select('username, profile_picture_url, followers_count').eq('id', accountId).single(),
    db.from('reels').select('views,likes,comments,shares,saves').eq('account_id', accountId).gte('timestamp', new Date(Date.now() - 30 * 864e5).toISOString()),
    db.from('reels').select('synced_at').eq('account_id', accountId).order('synced_at', { ascending: false }).limit(1),
  ])

  const r30 = reels30d || []
  const totalViews = r30.reduce((s: number, x: any) => s + x.views, 0)
  const totalInteractions = r30.reduce((s: number, x: any) => s + x.likes + x.comments + x.shares + x.saves, 0)
  const engRate = totalViews > 0 ? ((totalInteractions / totalViews) * 100).toFixed(1) : '0'

  const syncedAt = (lastSync as any)?.[0]?.synced_at
  const syncLabel = syncedAt
    ? (() => {
        const diff = Date.now() - new Date(syncedAt).getTime()
        if (diff < 3600_000) return `hace ${Math.round(diff / 60_000)}m`
        if (diff < 86400_000) return `hace ${Math.round(diff / 3600_000)}h`
        return `hace ${Math.round(diff / 86400_000)}d`
      })()
    : null

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <SidebarContent account={account} accountId={accountId} />
      </aside>

      <MobileNav>
        <SidebarContent account={account} accountId={accountId} />
      </MobileNav>

      <div className="dashboard-main">
        {/* Header with always-visible KPIs */}
        <header className="dash-topbar">
          <ProfileAvatar accountId={accountId} username={account?.username} size={26} />
          <span className="dash-topbar-user">@{account?.username}</span>

          <div className="dash-topbar-right">
            <div className="dash-topbar-kpis">
              <div className="dash-topbar-kpi">
                <span className="dash-topbar-kpi-value">{formatK(totalViews)}</span>
                <span className="dash-topbar-kpi-label">Views</span>
              </div>
              <div className="dash-topbar-kpi">
                <span className="dash-topbar-kpi-value">{formatK(account?.followers_count || 0)}</span>
                <span className="dash-topbar-kpi-label">Followers</span>
              </div>
              <div className="dash-topbar-kpi">
                <span className="dash-topbar-kpi-value">{engRate}%</span>
                <span className="dash-topbar-kpi-label">Eng. Rate</span>
              </div>
            </div>
            {syncLabel && (
              <span className="dash-topbar-sync">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                {syncLabel}
              </span>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="dashboard-content">
          {children}
        </main>
      </div>

      <KlarChat />
    </div>
  )
}
