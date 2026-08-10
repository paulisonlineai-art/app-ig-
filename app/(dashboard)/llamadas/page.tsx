import { Phone } from 'lucide-react'

export default function LlamadasPage() {
  return (
    <div>
      <h1 className="dash-greeting">Llamadas</h1>
      <p className="dash-subtitle" style={{ marginBottom: 32 }}>
        Gestioná tus llamadas de venta agendadas.
      </p>

      <div className="card empty-state">
        <Phone size={40} strokeWidth={1.5} color="var(--text-faint)" style={{ marginBottom: 16 }} />
        <p className="empty-state-title">Llamadas de venta — Próximamente</p>
        <p className="empty-state-desc">Esta sección está en construcción.</p>
      </div>
    </div>
  )
}
