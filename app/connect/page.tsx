import { Suspense } from 'react'
import ConnectClient from './connect-client'

export default function ConnectPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Cargando...</div>
        </div>
      }
    >
      <ConnectClient />
    </Suspense>
  )
}
