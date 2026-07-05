'use client'
import { useState } from 'react'

const FIELDS = [
  { key: 'niche', label: 'Tu nicho', placeholder: 'Ej: Marketing digital para coaches y consultores hispanohablantes' },
  { key: 'offer', label: '¿Qué vendés?', placeholder: 'Ej: Programa de mentoría de 3 meses para escalar a $10K/mes' },
  { key: 'audience', label: '¿A quién le hablás?', placeholder: 'Ej: Emprendedores con negocio propio que quieren vender por Instagram sin depender de ads' },
  { key: 'content_strategy', label: 'Estrategia de contenido actual', placeholder: 'Ej: 1 reel de reputación por día + 3 trial reels por día, enfocado en guardados' },
  { key: 'tested_what_works', label: '¿Qué funcionó en los últimos 3 meses?', placeholder: 'Ej: Reels con paso a paso específico, casos de éxito de clientes, críticas al mercado' },
  { key: 'tested_what_failed', label: '¿Qué no funcionó?', placeholder: 'Ej: Videos muy largos (+3 min), hablar muy rápido, contenido muy genérico' },
  { key: 'competitors', label: 'Competidores principales', placeholder: 'Ej: @cuenta1, @cuenta2 — ellos tienen audiencia similar pero diferente tono' },
  { key: 'voice', label: 'Tu tono y voz', placeholder: 'Ej: Directo, sin rodeos, basado en datos y casos reales. No uso motivación vacía.' },
  { key: 'goals', label: 'Objetivo de contenido', placeholder: 'Ej: Generar 50+ prospectos calificados por mes que me escriban preguntando por la mentoría' },
]

export default function BrandDNAClient({ accountId, initial }: { accountId: string; initial: any }) {
  const [fields, setFields] = useState<Record<string, string>>(initial?.fields || {})
  const [freeform, setFreeform] = useState(initial?.content || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<'guided' | 'free'>('guided')

  const save = async () => {
    setSaving(true)
    const content = tab === 'guided'
      ? FIELDS.map(f => `**${f.label}:**\n${fields[f.key] || '(Sin completar)'}`).join('\n\n')
      : freeform

    try {
      await fetch('/api/brand/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, fields }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--surface-2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['guided', '📋 Guiado'], ['free', '✏️ Libre']].map(([t, l]) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              padding: '7px 16px', borderRadius: 7, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--shadow-sm)' : 'none',
            }}
          >{l}</button>
        ))}
      </div>

      {tab === 'guided' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FIELDS.map(f => (
            <div key={f.key} className="card" style={{ padding: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 8 }}>{f.label}</label>
              <textarea
                value={fields[f.key] || ''}
                onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                rows={2}
                style={{ width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            Escribí libremente todo sobre tu marca, audiencia, estrategia y contexto. Esta información va directamente a la IA de Moka.
          </p>
          <textarea
            value={freeform}
            onChange={e => setFreeform(e.target.value)}
            placeholder="Describí tu marca, a quién le hablás, qué vendés, qué funcionó, qué no funcionó, cuál es tu diferencial..."
            rows={16}
            style={{ width: '100%', resize: 'vertical', fontSize: 13, lineHeight: 1.7 }}
          />
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary"
          style={{ padding: '12px 28px', fontSize: 14 }}
        >
          {saving ? 'Guardando...' : '💾 Guardar ADN de Marca'}
        </button>
        {saved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>✓ Guardado. Moka ya usa este contexto.</span>}
      </div>
    </div>
  )
}
