'use client'
import { useState, useRef } from 'react'
import { createAuthBrowserClient } from '@/lib/supabase-browser'
import ReferenceCard from './ReferenceCard'

const BUCKET = 'reference-videos'

export default function ReferenciasClient({ references, accountId, brandDNA }: {
  references: any[]
  accountId: string
  brandDNA: string
}) {
  const [refs, setRefs] = useState(references)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    setError('')
    if (!file.type.startsWith('video/') && !file.name.endsWith('.mp4') && !file.name.endsWith('.mov')) {
      setError('Solo se aceptan archivos de video (MP4, MOV)')
      return
    }
    if (file.size > 200 * 1024 * 1024) {
      setError('El video no puede superar 200MB')
      return
    }

    setUploading(true)
    setProgress('📤 Subiendo video...')

    try {
      const res = await fetch('/api/referencias/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, fileSize: file.size }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }

      // Upload the video bytes straight to Supabase Storage — never through
      // a Vercel function, which caps request bodies well below video size.
      const supabase = createAuthBrowserClient()
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(data.filePath, data.token, file)
      if (uploadError) { setError(uploadError.message); return }

      setProgress('🎙 Transcribiendo audio con Whisper...')

      const transcribeRes = await fetch('/api/referencias/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: data.refId }),
      })
      const transcribeData = await transcribeRes.json()
      if (transcribeData.error) { setError(transcribeData.error); return }

      setProgress('🤖 Analizando estructura con Moka AI...')

      const analyzeRes = await fetch('/api/referencias/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: data.refId }),
      })
      const analyzed = await analyzeRes.json()
      if (analyzed.error) { setError(analyzed.error); return }

      setRefs(prev => [analyzed.ref, ...prev])
      setProgress('')
    } catch (e: any) {
      setError(e.message || 'Error al procesar el video')
      setProgress('')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {/* Upload zone */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--accent)' : uploading ? 'var(--border)' : 'var(--border-strong)'}`,
          borderRadius: 16,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragOver ? 'var(--accent-light)' : 'var(--surface)',
          transition: 'all 0.2s',
          marginBottom: 28,
        }}
      >
        <input ref={fileRef} type="file" accept="video/*" onChange={onFileChange} style={{ display: 'none' }} />

        {uploading ? (
          <div>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Procesando video...</div>
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{progress}</div>
            <div style={{ marginTop: 16, height: 4, background: 'var(--surface-2)', borderRadius: 2, maxWidth: 300, margin: '16px auto 0' }}>
              <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: progress.includes('Subiendo') ? '25%' : progress.includes('Transcrib') ? '60%' : '85%', transition: 'width 0.5s' }} />
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Subí un video de referencia</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
              Arrastrá o hacé clic — MP4, MOV hasta 200MB (idealmente menos de 25MB para transcribir)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Moka transcribe, analiza estructura y genera tu versión adaptada
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--danger)', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* References list */}
      {refs.length === 0 && !uploading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No hay videos de referencia todavía</p>
          <p style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 4 }}>Subí el primer video para empezar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {refs.map((ref: any) => (
            <ReferenceCard key={ref.id} ref_={ref} brandDNA={brandDNA} />
          ))}
        </div>
      )}
    </div>
  )
}
