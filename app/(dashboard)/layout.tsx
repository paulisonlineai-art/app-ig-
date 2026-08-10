import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase'
import KlarChat from '@/components/MokaChat'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileNav from '@/components/MobileNav'
import TopbarTitle from '@/components/dashboard/TopbarTitle'
import TopbarSync from '@/components/dashboard/TopbarSync'
import NotificationBell from '@/components/dashboard/NotificationBell'
import PageTransition from '@/components/dashboard/PageTransition'
import ThemeToggle from '@/components/ThemeToggle'
import type { NavSection } from '@/components/dashboard/SidebarBody'

const NAV_SECTIONS: NavSection[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Inicio', icon: 'Home' },
      { href: '/reels', label: 'Mis Reels', icon: 'Play' },
      { href: '/rayos-x', label: 'Análisis', icon: 'BarChart3' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { href: '/crear', label: 'Crear', icon: 'Sparkles' },
      { href: '/pipeline', label: 'Pipeline', icon: 'Kanban' },
      { href: '/calendario', label: 'Calendario', icon: 'Calendar' },
    ],
  },
  {
    label: 'Negocio',
    items: [
      { href: '/radar', label: 'Radar IG', icon: 'Target' },
      { href: '/llamadas', label: 'Llamadas', icon: 'Phone' },
      { href: '/clientes', label: 'Clientes', icon: 'Users' },
      { href: '/ventas', label: 'Ventas', icon: 'DollarSign' },
    ],
  },
]

const NAV_BOTTOM = [
  { href: '/marca', label: 'Mi Marca', icon: 'Fingerprint' },
  { href: '/configuracion', label: 'Configuración', icon: 'Settings' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value
  if (!accountId) redirect('/connect')

  const db = createServerSupabase()
  const [{ data: account }, { data: lastSync }] = await Promise.all([
    db.from('ig_accounts').select('username, profile_picture_url, followers_count').eq('id', accountId).single(),
    db.from('reels').select('synced_at').eq('account_id', accountId).order('synced_at', { ascending: false }).limit(1),
  ])

  const syncedAt = (lastSync as { synced_at: string }[] | null)?.[0]?.synced_at
  const syncLabel = syncedAt
    ? (() => {
        const diff = Date.now() - new Date(syncedAt).getTime()
        if (diff < 3600_000) return `hace ${Math.round(diff / 60_000)}m`
        if (diff < 86400_000) return `hace ${Math.round(diff / 3600_000)}h`
        return `hace ${Math.round(diff / 86400_000)}d`
      })()
    : null

  const sidebarProps = {
    accountId,
    username: account?.username,
    followersCount: account?.followers_count,
    sections: NAV_SECTIONS,
    bottomItems: NAV_BOTTOM,
  }

  return (
    <div className="dashboard-layout">
      <Sidebar {...sidebarProps} />
      <MobileNav {...sidebarProps} />

      <div className="dashboard-main">
        <header className="dash-topbar">
          <TopbarTitle />

          <div className="topbar-right">
            <TopbarSync initialLabel={syncLabel} />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <main className="dashboard-content">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <KlarChat />
    </div>
  )
}
