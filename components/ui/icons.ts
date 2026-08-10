import {
  Home,
  Play,
  BarChart3,
  Sparkles,
  Kanban,
  Eye,
  Calendar,
  DollarSign,
  Fingerprint,
  Settings,
  Users,
  Phone,
  Target,
  Bell,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

export {
  Home,
  Play,
  BarChart3,
  Sparkles,
  Kanban,
  Eye,
  Calendar,
  DollarSign,
  Fingerprint,
  Settings,
  Users,
  Phone,
  Target,
  Bell,
  LogOut,
}

export type { LucideIcon }

/** Sidebar nav icon lookup, keyed to the Spanish nav labels. */
export const NAV_ICONS = {
  inicio: Home,
  reels: Play,
  analisis: BarChart3,
  crear: Sparkles,
  pipeline: Kanban,
  espia: Eye,
  calendario: Calendar,
  ventas: DollarSign,
  marca: Fingerprint,
  configuracion: Settings,
  clientes: Users,
  llamadas: Phone,
  radar: Target,
  notificaciones: Bell,
  salir: LogOut,
} as const

export type NavIconKey = keyof typeof NAV_ICONS
