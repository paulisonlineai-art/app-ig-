import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Klar',
}

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px', fontFamily: 'var(--font-inter), system-ui, sans-serif', color: '#e0e0e0', lineHeight: 1.7 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Política de Privacidad</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Última actualización: 12 de septiembre de 2026</p>

      <Section title="1. Información que recopilamos">
        <p>Cuando conectás tu cuenta de Instagram a Klar, recopilamos:</p>
        <ul>
          <li>Tu nombre de usuario, nombre y foto de perfil de Instagram</li>
          <li>Métricas públicas de tus reels (vistas, likes, comentarios, compartidos, guardados)</li>
          <li>El contenido de tus publicaciones (captions, thumbnails)</li>
          <li>Un token de acceso proporcionado por Meta para acceder a tu información</li>
        </ul>
        <p>También recopilamos tu dirección de correo electrónico cuando te registrás con Google.</p>
      </Section>

      <Section title="2. Cómo usamos tu información">
        <ul>
          <li>Mostrar tus métricas de Instagram en el dashboard de Klar</li>
          <li>Generar análisis con inteligencia artificial sobre el rendimiento de tus reels</li>
          <li>Detectar reels de prueba (trial) y calcular multiplicadores de rendimiento</li>
          <li>Mejorar nuestro servicio y la experiencia de usuario</li>
        </ul>
      </Section>

      <Section title="3. Almacenamiento y seguridad">
        <p>Tu información se almacena de forma segura en servidores de Supabase (infraestructura de AWS). Los tokens de acceso de Instagram se almacenan encriptados y se renuevan automáticamente. Nunca almacenamos tu contraseña de Instagram.</p>
      </Section>

      <Section title="4. Compartir información">
        <p>No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:</p>
        <ul>
          <li>Proveedores de servicios necesarios para operar Klar (Supabase, Vercel, Anthropic para análisis AI)</li>
          <li>Cuando sea requerido por ley</li>
        </ul>
      </Section>

      <Section title="5. Tus derechos">
        <p>Podés en cualquier momento:</p>
        <ul>
          <li>Desconectar tu cuenta de Instagram desde la configuración de Klar</li>
          <li>Solicitar la eliminación de todos tus datos enviando un email a paulisonlineai@gmail.com</li>
          <li>Revocar el acceso de Klar desde la configuración de tu cuenta de Instagram</li>
        </ul>
      </Section>

      <Section title="6. Eliminación de datos">
        <p>Cuando desconectás tu cuenta o solicitás la eliminación de datos, eliminamos toda tu información de nuestros servidores dentro de 30 días, incluyendo métricas, análisis y tokens de acceso.</p>
      </Section>

      <Section title="7. Contacto">
        <p>Si tenés preguntas sobre esta política de privacidad, escribinos a <a href="mailto:paulisonlineai@gmail.com" style={{ color: '#F7007C' }}>paulisonlineai@gmail.com</a>.</p>
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#fff' }}>{title}</h2>
      {children}
    </section>
  )
}
