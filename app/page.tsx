import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
          Moka
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 40, fontSize: 18 }}>
          Tu sistema de análisis de contenido de Instagram con IA
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            background: 'var(--accent)',
            color: 'white',
            padding: '14px 32px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 16,
            textDecoration: 'none',
          }}
        >
          Conectar Instagram →
        </Link>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left' }}>
          {[
            { icon: '📊', title: 'Analytics de Reels', desc: 'Multiplicadores, tasas de engagement, comparación vs promedio' },
            { icon: '🤖', title: 'IA por video', desc: 'Transcripción, análisis del hook, palabras por minuto' },
            { icon: '🕵️', title: 'Espía competidores', desc: 'Trackea automáticamente los reels de tus competidores' },
            { icon: '💰', title: 'Atribución de ventas', desc: 'Saber exactamente qué contenido te genera ventas' },
          ].map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{f.title}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
