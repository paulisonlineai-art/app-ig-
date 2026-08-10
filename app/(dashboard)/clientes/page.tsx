import { Users } from 'lucide-react'

export default function ClientesPage() {
  return (
    <div>
      <h1 className="dash-greeting">Clientes</h1>
      <p className="dash-subtitle" style={{ marginBottom: 32 }}>
        Gestioná tu base de clientes.
      </p>

      <div className="card empty-state">
        <Users size={40} strokeWidth={1.5} color="var(--text-faint)" style={{ marginBottom: 16 }} />
        <p className="empty-state-title">Gestión de clientes — Próximamente</p>
        <p className="empty-state-desc">Esta sección está en construcción.</p>
      </div>
    </div>
  )
}
