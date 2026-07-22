import { cookies } from 'next/headers'
import { createServerSupabase } from '@/lib/supabase'
import ContentPipeline from '@/components/contenido/ContentPipeline'

const STAGES = [
  { id: 'idea', label: 'Ideas', color: '#7c3aed' },
  { id: 'ready_to_record', label: 'Listo para grabar', color: '#2563eb' },
  { id: 'raw_recorded', label: 'Video crudo', color: '#d97706' },
  { id: 'editing', label: 'En edición', color: '#db2777' },
  { id: 'ready_to_publish', label: 'Listo para publicar', color: '#059669' },
  { id: 'published', label: 'Publicado', color: '#374151' },
]

export default async function PipelinePage() {
  const cookieStore = await cookies()
  const accountId = cookieStore.get('ig_account_id')?.value!

  const db = createServerSupabase()
  const { data: pieces } = await db
    .from('content_pieces')
    .select('*')
    .eq('account_id', accountId)
    .order('position')

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 2 }}>Pipeline</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Organizá tu contenido desde la idea hasta la publicación.
        </p>
      </div>

      <ContentPipeline pieces={pieces || []} stages={STAGES} accountId={accountId} />
    </div>
  )
}
