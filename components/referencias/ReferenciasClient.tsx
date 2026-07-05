'use client'
import { useState, useRef } from 'react'
import ReferenceCard from './ReferenceCard'

export default function ReferenciasClient({ references, accountId, brandDNA }: {
  references: any[]
  accountId: string
  brandDNA: string
}) {
  const [refs, setRefs] = useState(references)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('video/') && !file.name.endsWith('.mp4') && !file.name.endsWith('.mov')) {
      alert('Solo se aceptan archivos de video (MP4, MOV)')
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      alert('El video no puede superar 500MB')
      return
    }

    setUploading(true)
    setProgress('📤 Subiendo video...')

    const fd = new FormData()
    fd.append('video', file)

    try {
      const res = await fetch('/api/referencias/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { alert(data.error); return }

      setProgress('🎙 Transcribiendo audio con Whisper...')

      const transcribeRes = await fetch('/api/referencias/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: data.refId, filePath: data.filePath }),
      })
      const transcribeData = await transcribeRes.json()
      if (transcribeData.error) { alert(transcribeData.error); return }

      setProgress('🤖 Analizando estructura con Moka AI...')

      const analyzeRes = await fetch('/api/referencias/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refId: data.refId }),
      })
      const analyzed = await analyzeRes.json()
      if (analyzed.error) { alert(analyzed.error); return }

      setRefs(prev => [analyzed.ref, ...prev])
      setProgress('')
    } catch (e) {
      alert('Error al procesar el video')
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
              Arrastrá o hacé clic — MP4, MOV hasta 500MB
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
              Moka transcribe, analiza estructura y genera tu versión adaptada
            </div>
          </div>
        )}
      </div>

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
