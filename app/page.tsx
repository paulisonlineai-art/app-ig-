'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
// No external images needed — inline CSS mockups

const STRIPE_LINK = '#'
const STRIPE_LINK_MONTHLY = '#'
const SPOTS_TOTAL = 30
const SPOTS_TAKEN = 4

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el) } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useScrollReveal()
  return (
    <div ref={ref} className={`scroll-reveal ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  )
}

function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.unobserve(el)
      const dur = 1200
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / dur, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.5 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{val}{suffix}</span>
}

const CheckSvg = <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
const XSvg = <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/></svg>

export default function LandingPage() {
  const spotsLeft = SPOTS_TOTAL - SPOTS_TAKEN

  return (
    <div className="landing-page">
      {/* ─── Nav ─── */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="klar-logo">K</span>
            <span className="klar-wordmark">klar</span>
          </div>
          <div className="nav-actions">
            <Link href="/connect" className="nav-link-login">Iniciar sesión</Link>
            <a href="#pricing" className="nav-cta">Unirme</a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero-section">
        <div className="hero-fade" style={{ animationDelay: '0s' }}>
          <div className="hero-badge">
            <span className="pulse-dot" />
            {spotsLeft} cupos de Founding Member
          </div>
        </div>
        <div className="hero-fade" style={{ animationDelay: '0.15s' }}>
          <h1 className="hero-title">
            Deja de adivinar.<br />
            <span className="gradient-text">Empieza a saber.</span>
          </h1>
        </div>
        <div className="hero-fade" style={{ animationDelay: '0.3s' }}>
          <p className="hero-subtitle">
            Klar detecta el segundo exacto donde se va la gente, predice viralidad antes de publicar, y atribuye cada venta al reel que la generó.
          </p>
        </div>
        <div className="hero-fade" style={{ animationDelay: '0.45s' }}>
          <div className="hero-cta-group">
            <a href={STRIPE_LINK} className="cta-button-primary">
              Ser Founding Member — $99/año
            </a>
            <span className="hero-cta-sub">
              $8.25/mes · Después sube a $29/mes
            </span>
          </div>
        </div>
      </section>

      {/* ─── Platform mockup ─── */}
      <section className="screenshot-section">
        <Reveal>
          <div className="mockup-browser">
            <div className="mockup-topbar">
              <div className="mockup-dots">
                <span className="mockup-dot" style={{ background: '#ff5f57' }} />
                <span className="mockup-dot" style={{ background: '#febc2e' }} />
                <span className="mockup-dot" style={{ background: '#28c840' }} />
              </div>
              <div className="mockup-url">app.klar.la</div>
            </div>
            <div className="mockup-content" style={{ padding: '24px 28px', background: '#000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>Dashboard</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Últimos 30 días · 12 reels</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, border: '1px solid #333', background: '#141414', color: '#fff' }}>30 días ▾</span>
                  <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: '#F7007C', color: '#fff' }}>⟳ Sincronizar</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { l: 'VISTAS', v: '24.8K', c: '↑ 34.2%' },
                  { l: 'ENGAGEMENT', v: '5.2%', c: '↑ 12.8%' },
                  { l: 'COMENTARIOS', v: '187', c: '↑ 28.1%' },
                  { l: 'GUARDADOS', v: '342', c: '↑ 45.6%' },
                ].map(k => (
                  <div key={k.l} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.06em', color: '#888', marginBottom: 6 }}>{k.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{k.v}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#059669', marginTop: 3 }}>{k.c}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Vistas por reel</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                    {[45,72,38,90,55,65,82,48,95,60,70,100].map((h,i) => (
                      <div key={i} style={{ flex: 1, height: `${h}%`, background: '#F7007C', borderRadius: '3px 3px 0 0', opacity: 0.7 + (h/333) }} />
                    ))}
                  </div>
                </div>
                <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Engagement trend</div>
                  <svg viewBox="0 0 400 80" style={{ width: '100%', height: 80 }} preserveAspectRatio="none">
                    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F7007C" stopOpacity="0.3"/><stop offset="100%" stopColor="#F7007C" stopOpacity="0"/></linearGradient></defs>
                    <path d="M0,60 Q50,50 100,52 T200,35 T300,25 T400,15 L400,80 L0,80Z" fill="url(#lg)"/>
                    <path d="M0,60 Q50,50 100,52 T200,35 T300,25 T400,15" fill="none" stroke="#F7007C" strokeWidth="2"/>
                    <circle cx="400" cy="15" r="3" fill="#F7007C"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── Stats ─── */}
      <section className="stats-section">
        <Reveal>
          <div className="stats-grid">
            {[
              { num: 47, suffix: '%', label: 'Retención promedio donde la gente se va' },
              { num: 3, suffix: 'x', label: 'Más rápido que analizar a mano' },
              { num: 82, suffix: '%', label: 'Precisión prediciendo viralidad' },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-number">
                  <AnimatedNumber target={s.num} suffix={s.suffix} />
                </div>
                <div className="stat-desc">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ─── El problema ─── */}
      <section className="narrative-section">
        <Reveal>
          <div className="section-label">El problema</div>
        </Reveal>
        <div className="narrative-stack">
          {[
            'Publicas reels todos los días.',
            'Le metes horas a la edición.',
            'Llegas a la noche...',
            'Y otra vez 200 views.',
            'No sabes qué funciona.',
            'No sabes por qué la gente se va.',
            'No sabes qué contenido genera ventas.',
          ].map((line, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className={`narrative-line ${i >= 3 ? 'narrative-muted' : ''}`}>{line}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── La solución ─── */}
      <section className="narrative-section">
        <Reveal>
          <div className="section-label" style={{ color: 'var(--accent)' }}>La solución</div>
        </Reveal>
        <div className="narrative-stack">
          {[
            'Una herramienta que te diga exactamente por qué.',
            'Que detecte dónde se van tus viewers.',
            'Que prediga si tu video va a pegar.',
            'Que atribuya cada venta a un reel.',
            'Decisiones con datos. No con feelings.',
          ].map((line, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p className="narrative-line narrative-bright">{line}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="features-section">
        <Reveal>
          <div className="section-label">Funcionalidades</div>
          <h2 className="section-heading">
            <span className="gradient-text">Klar</span> te da el control sobre tu contenido
          </h2>
        </Reveal>

        <div className="features-grid">
          {/* Detector de caída */}
          <Reveal delay={0}>
            <div className="feature-card">
              <div className="feature-card-text">
                <div className="feature-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
                <h3 className="feature-title">Detector de caída</h3>
                <p className="feature-desc">Analiza la retención frame por frame y marca el segundo exacto donde tu audiencia deja de ver.</p>
              </div>
              <div className="feature-card-img" style={{ background: '#0a0a0a', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: '#141414', borderRadius: 8, padding: '10px 12px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' as const, fontWeight: 700 }}>Retención</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>47%</div>
                  </div>
                  <div style={{ flex: 1, background: '#141414', borderRadius: 8, padding: '10px 12px', textAlign: 'center' as const }}>
                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' as const, fontWeight: 700 }}>Mayor caída</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#F7007C' }}>3s</div>
                  </div>
                </div>
                <svg viewBox="0 0 300 80" style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
                  <path d="M0,5 Q30,6 50,10 T100,25 T130,50 T160,52 T200,58 T240,65 T280,72 L300,75 L300,80 L0,80Z" fill="rgba(247,0,124,0.15)"/>
                  <path d="M0,5 Q30,6 50,10 T100,25 T130,50 T160,52 T200,58 T240,65 T280,72 L300,75" fill="none" stroke="#F7007C" strokeWidth="2"/>
                  <circle cx="130" cy="50" r="4" fill="#F7007C" stroke="#000" strokeWidth="2"/>
                </svg>
                <div style={{ marginTop: 8 }}>
                  {[
                    { t: '0:03', d: 'Hook débil', p: 38, c: '#ef4444' },
                    { t: '0:08', d: 'Transición', p: 12, c: '#f59e0b' },
                  ].map(x => (
                    <div key={x.t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#F7007C', width: 32 }}>{x.t}</span>
                      <span style={{ fontSize: 10, color: '#aaa', flex: 1 }}>{x.d} — {x.p}%</span>
                      <div style={{ width: 60, height: 4, background: '#222', borderRadius: 2 }}><div style={{ width: `${x.p}%`, height: '100%', background: x.c, borderRadius: 2 }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Predictor de viralidad */}
          <Reveal delay={0.12}>
            <div className="feature-card">
              <div className="feature-card-text">
                <div className="feature-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg></div>
                <h3 className="feature-title">Predictor de viralidad</h3>
                <p className="feature-desc">Analiza tu guión y te da un score de 0-100 antes de grabar. Te dice qué mejorar.</p>
              </div>
              <div className="feature-card-img" style={{ background: '#0a0a0a', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                    <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="32" cy="32" r="27" fill="none" stroke="#1a1a1a" strokeWidth="5"/>
                      <circle cx="32" cy="32" r="27" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" strokeDasharray="135.1" strokeDashoffset="27"/>
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#22c55e' }}>78</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>Bueno</div>
                    <div style={{ fontSize: 10, color: '#888' }}>Potencial viral alto</div>
                  </div>
                </div>
                {[
                  { n: 'Hook', s: 9, c: '#22c55e' },
                  { n: 'Estructura', s: 8, c: '#22c55e' },
                  { n: 'CTA', s: 6, c: '#f59e0b' },
                  { n: 'Valor', s: 8.5, c: '#22c55e' },
                ].map(x => (
                  <div key={x.n} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontSize: 11, color: '#888', width: 60 }}>{x.n}</span>
                    <div style={{ flex: 1, height: 4, background: '#222', borderRadius: 2 }}><div style={{ width: `${x.s * 10}%`, height: '100%', background: x.c, borderRadius: 2 }} /></div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: x.c, width: 30, textAlign: 'right' as const }}>{x.s}/10</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Espía de competidores */}
          <Reveal delay={0.24}>
            <div className="feature-card">
              <div className="feature-card-text">
                <div className="feature-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                <h3 className="feature-title">Espía de competidores</h3>
                <p className="feature-desc">Trackea hasta 5 competidores. Qué publican, cuándo, qué retención tienen.</p>
              </div>
              <div className="feature-card-img" style={{ background: '#0a0a0a', borderRadius: 10, padding: '16px 18px' }}>
                {[
                  { u: '@marketingpro', f: '125K', e: '4.8%', bg: 'linear-gradient(135deg,#667eea,#764ba2)' },
                  { u: '@creadordigital', f: '89K', e: '6.2%', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
                  { u: '@socialmentor', f: '210K', e: '3.1%', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
                ].map(x => (
                  <div key={x.u} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: x.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{x.u[1].toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{x.u}</div>
                      <div style={{ fontSize: 10, color: '#888' }}>{x.f} seguidores</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>{x.e}</div>
                      <div style={{ fontSize: 9, color: '#888' }}>Eng. Rate</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                  {['52.4K', '38.1K', '29.7K'].map(v => (
                    <div key={v} style={{ flex: 1, background: '#141414', borderRadius: 6, padding: '8px 6px', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 10, color: '#aaa', marginBottom: 2 }}>▶</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mini-features-grid">
          {[
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
              title: 'Atribución de ventas',
              desc: 'Conecta Stripe y descubre qué reel genera cada venta.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
              title: 'IA por video',
              desc: 'Transcripción automática, análisis del hook, sugerencias de mejora.',
            },
            {
              icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
              title: 'Ideas con IA',
              desc: 'Ideas de contenido basadas en lo que funciona en tu nicho.',
            },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="mini-feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="mini-feature-title">{f.title}</h3>
                <p className="mini-feature-desc">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Before / After ─── */}
      <section className="ba-section">
        <Reveal>
          <div className="section-label">El cambio</div>
          <h2 className="section-heading">Tu Instagram antes y después de Klar</h2>
        </Reveal>
        <div className="ba-grid">
          <Reveal delay={0.1}>
            <div className="ba-card ba-before">
              <span className="ba-label">Sin Klar</span>
              {[
                'Publicas y cruzas los dedos',
                'No sabes dónde se va la gente',
                '"Creo que este hook funciona"',
                'Tu competencia crece y no entiendes por qué',
                'Haces ventas pero no sabes qué contenido las genera',
                'Editas por horas para 200 views',
              ].map((t, i) => (
                <div key={i} className="ba-item">
                  <span className="ba-x">{XSvg}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="ba-card ba-after">
              <span className="ba-label">Con Klar</span>
              {[
                'Sabes exactamente qué funciona y qué no',
                'Ves el segundo donde se van tus viewers',
                'IA te da un score antes de grabar',
                'Trackeas a 5 competidores y ves sus patrones',
                'Cada venta se atribuye al reel que la generó',
                'Decisiones con datos, no con feelings',
              ].map((t, i) => (
                <div key={i} className="ba-item">
                  <span className="ba-check">{CheckSvg}</span>
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="steps-section">
        <div className="steps-inner">
          <Reveal>
            <div className="section-label">3 pasos</div>
            <h2 className="section-heading">Así funciona</h2>
          </Reveal>
          {[
            { n: '1', title: 'Conectas tu Instagram', desc: '30 segundos. Klar empieza a analizar tus reels automáticamente.' },
            { n: '2', title: 'Klar analiza todo', desc: 'Retención, hooks, transcripción, competencia. IA en minutos, no en horas.' },
            { n: '3', title: 'Decisiones con datos', desc: 'Sabes qué funciona, qué no, y qué publicar mañana.' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="step-card">
                <div className="step-number">{s.n}</div>
                <div>
                  <h3 className="step-title">{s.title}</h3>
                  <p className="step-desc">{s.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── Es para ti si ─── */}
      <section className="forti-section">
        <div className="forti-inner">
          <Reveal>
            <h2 className="section-heading">Klar es para ti si...</h2>
            <p className="forti-sub">Para creadores que van en serio con su contenido.</p>
          </Reveal>
          <div className="forti-list">
            {[
              'Ya publicas en Instagram y quieres dejar de adivinar',
              'Vendes algo y quieres saber qué contenido genera ventas',
              'Quieres entender qué hace tu competencia',
              'Te frustra editar por horas y tener 200 views',
              'Quieres decisiones basadas en datos, no en feelings',
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="check-item">
                  <div className="check-icon">{CheckSvg}</div>
                  <span>{item}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-inner">
          <Reveal>
            <div className="spots-badge">
              <span className="pulse-dot" />
              {spotsLeft} cupos restantes
            </div>
            <h2 className="section-heading">Elige tu plan</h2>
            <p className="pricing-sub">Mismo acceso. Mismo poder. Tú eliges cómo pagar.</p>
          </Reveal>

          <Reveal>
            <div className="pricing-grid">
              {/* Monthly */}
              <div className="pricing-card pricing-card-secondary">
                <div className="pricing-tier">Mensual</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$29</span>
                  <span className="pricing-period">/mes</span>
                </div>
                <div className="pricing-note">$348/año · Sin compromiso</div>
                <div className="pricing-features">
                  {['Análisis ilimitado de reels', 'Predictor de viralidad con IA', 'Espía de hasta 5 competidores', 'Atribución de ventas (Stripe)', 'Generador de ideas con IA', 'Soporte directo con el creador'].map((f, i) => (
                    <div key={i} className="pricing-feature">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={STRIPE_LINK_MONTHLY} className="pricing-cta-secondary">
                  Elegir mensual
                </a>
              </div>

              {/* Annual */}
              <div className="pricing-card pricing-card-primary">
                <div className="pricing-accent-bar" />
                <div className="pricing-best">Mejor precio</div>
                <div className="pricing-tier" style={{ color: 'var(--accent)' }}>Founding Member · Anual</div>
                <div className="pricing-price">
                  <span className="pricing-amount">$99</span>
                  <span className="pricing-period">/año</span>
                </div>
                <div className="pricing-note">
                  <strong style={{ color: 'var(--accent)' }}>$8.25/mes</strong> · Ahorras 72%
                  <br />
                  <span style={{ textDecoration: 'line-through', opacity: 0.4 }}>$348/año pagando mensual</span>
                </div>
                <div className="pricing-features">
                  {['Análisis ilimitado de reels', 'Predictor de viralidad con IA', 'Espía de hasta 5 competidores', 'Atribución de ventas (Stripe)', 'Generador de ideas con IA', 'Soporte directo con el creador', 'Todas las features futuras', 'Precio congelado para siempre'].map((f, i) => (
                    <div key={i} className="pricing-feature">
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M2 6.5L4.5 9L10 3" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href={STRIPE_LINK} className="cta-button-primary" style={{ display: 'block', width: '100%', textAlign: 'center' }}>
                  Ser Founding Member
                </a>
                <div className="pricing-stripe-note">Pago seguro con Stripe · Cancelas cuando quieras</div>
              </div>
            </div>
          </Reveal>

          <div className="progress-wrap">
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${(SPOTS_TAKEN / SPOTS_TOTAL) * 100}%` }} />
            </div>
            <div className="progress-label">{SPOTS_TAKEN} de {SPOTS_TOTAL} cupos de Founding Member tomados</div>
          </div>
        </div>
      </section>

      {/* ─── Founder story ─── */}
      <section className="story-section">
        <div className="story-inner">
          <Reveal>
            <div className="section-label">Fundador</div>
            <div className="story-card">
              <h2 className="story-title">Klar lo construí yo. Solo.</h2>
              <div className="story-text">
                <p>Tengo 17 años. Empecé con dropshipping, me di cuenta de que estaba construyendo algo que no me representaba, y pivoté a IA.</p>
                <p>Klar nació porque yo mismo necesitaba entender por qué mis reels no funcionaban. Probé todas las herramientas de analytics que existen y ninguna me decía <strong>por qué</strong> — solo me mostraban números.</p>
                <p>Entonces la construí yo. Con IA. Sin equipo. Y ahora la estoy abriendo a los primeros 30 creadores que quieran dejar de adivinar.</p>
                <p className="story-highlight">Como Founding Member tienes acceso directo a mí.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="faq-section">
        <div className="faq-inner">
          <Reveal>
            <h2 className="section-heading">Preguntas frecuentes</h2>
          </Reveal>
          <div className="faq-list">
            {[
              { q: '¿Necesito saber de tecnología?', a: 'No. Conectas tu Instagram y Klar hace todo.' },
              { q: '¿Funciona para cualquier nicho?', a: 'Sí. Coach, marca personal, ecommerce — si publicas reels, Klar es para ti.' },
              { q: '¿Qué pasa cuando se llenen los 30 cupos?', a: 'El precio sube a $29/mes. Los Founding Members mantienen $99/año para siempre.' },
              { q: '¿Puedo cancelar?', a: 'Sí. Pero si cancelas y vuelves, pagas el precio nuevo.' },
              { q: '¿Es seguro conectar mi Instagram?', a: 'Solo leemos métricas públicas. No publicamos nada ni guardamos tu contraseña.' },
              { q: '¿Cuánto tarda?', a: '5 minutos y ya tienes el análisis de tus últimos reels.' },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <details className="faq-item">
                  <summary className="faq-question">
                    {item.q}
                    <span className="faq-plus">+</span>
                  </summary>
                  <p className="faq-answer">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="final-cta-section">
        <Reveal>
          <h2 className="final-cta-title">
            Disponible ahora.
          </h2>
          <a href={STRIPE_LINK} className="cta-button-primary" style={{ fontSize: 17, padding: '16px 40px' }}>
            Ser Founding Member — $99/año
          </a>
          <div className="final-cta-sub">
            Quedan {spotsLeft} cupos · Pago seguro con Stripe
          </div>
        </Reveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="klar-logo">K</span>
          <span className="klar-wordmark">klar</span>
        </div>
        <p>Inteligencia para tu contenido de Instagram</p>
        <p style={{ marginTop: 4 }}>© 2026 Klar. Hecho con IA por Paulis.</p>
      </footer>
    </div>
  )
}
