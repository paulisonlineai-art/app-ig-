export interface ActivityItem {
  id: string
  caption: string | null
  timestamp: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 3600_000) return `hace ${Math.max(1, Math.round(diff / 60_000))}m`
  if (diff < 86400_000) return `hace ${Math.round(diff / 3600_000)}h`
  return `hace ${Math.round(diff / 86400_000)}d`
}

export default function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin actividad reciente.</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {items.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0' }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--primary)',
              marginTop: 6,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>
              Publicaste un nuevo reel
              {item.caption && (
                <span style={{ color: 'var(--text-muted)' }}> — &ldquo;{item.caption.slice(0, 60)}{item.caption.length > 60 ? '…' : ''}&rdquo;</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {relativeTime(item.timestamp)}
          </span>
        </div>
      ))}
    </div>
  )
}
