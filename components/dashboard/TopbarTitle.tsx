'use client'
import { usePathname } from 'next/navigation'

const LABELS: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/reels': 'Mis Reels',
  '/rayos-x': 'Análisis',
  '/crear': 'Crear',
  '/pipeline': 'Pipeline',
  '/calendario': 'Calendario',
  '/radar': 'Radar IG',
  '/llamadas': 'Llamadas',
  '/clientes': 'Clientes',
  '/ventas': 'Ventas',
  '/marca': 'Mi Marca',
  '/configuracion': 'Configuración',
}

export default function TopbarTitle() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const rootPath = `/${segments[0] || 'dashboard'}`
  const rootLabel = LABELS[rootPath] || 'Klar'
  const hasDetail = segments.length > 1

  return (
    <div className="topbar-title">
      <span>{rootLabel}</span>
      {hasDetail && (
        <>
          <span className="topbar-title-sep">/</span>
          <span className="topbar-title-detail">Detalle</span>
        </>
      )}
    </div>
  )
}
