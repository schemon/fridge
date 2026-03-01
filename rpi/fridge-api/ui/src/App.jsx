import { useState, useEffect, useCallback } from 'react'

function fmtBytes(bytes) {
  if (bytes == null) return '?'
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${(bytes / 1e3).toFixed(1)} KB`
}

function DiskBar({ label, used_bytes, max_bytes, used_pct }) {
  const pct = used_pct ?? 0
  const barColor = pct >= 90 ? '#f44336' : pct >= 70 ? '#ff9800' : '#4caf50'
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 3 }}>
        <span>{label}</span>
        <span>{fmtBytes(used_bytes)} / {fmtBytes(max_bytes)} ({used_pct != null ? `${used_pct}%` : '?'})</span>
      </div>
      <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function DiskUsage({ stats }) {
  if (!stats) return null
  const { disk_usage_total, disk_usage_sessions, disk_usage_history } = stats
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e' }}>
      <DiskBar label="total"   {...disk_usage_total} />
      <DiskBar label="pending" {...disk_usage_sessions} />
      <DiskBar label="history" {...disk_usage_history} />
    </div>
  )
}

const STATE_COLOR = {
  done:               '#4caf50',
  failed:             '#f44336',
  frames_extracting:  '#ff9800',
  frames_done:        '#2196f3',
}

function Badge({ state }) {
  const bg = STATE_COLOR[state] ?? '#555'
  return (
    <span style={{ background: bg, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
      {state ?? 'pending'}
    </span>
  )
}

function SessionRow({ session, isSelected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(session)}
      style={{
        padding: '10px 14px',
        cursor: 'pointer',
        background: isSelected ? '#152030' : 'transparent',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
      }}
    >
      <Badge state={session.status?.state} />
      <span style={{ fontFamily: 'monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {session.session_id}
      </span>
    </div>
  )
}

function FrameStrip({ sessionId, frames, prefix = '/sessions' }) {
  if (!frames?.length) return <p style={muted}>No frames</p>
  return (
    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '6px 0' }}>
      {frames.map(f => (
        <img
          key={f}
          src={`${prefix}/${sessionId}/frames/${f}`}
          alt={f}
          style={{ height: 72, borderRadius: 3, flexShrink: 0, background: '#1a1a1a' }}
        />
      ))}
    </div>
  )
}

function TxRow({ tx }) {
  const color = tx.type === 'ADD' ? '#4caf50' : tx.type === 'REMOVE' ? '#f44336' : '#888'
  const pct = tx.confidence != null ? `${Math.round(tx.confidence * 100)}%` : null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13 }}>
      <span style={{ color, fontWeight: 700, width: 65, flexShrink: 0 }}>{tx.type}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.item?.label ?? tx.tx_id}
      </span>
      {pct && <span style={muted}>{pct}</span>}
    </div>
  )
}

function SessionDetail({ sessionId, prefix = '/sessions' }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setDetail(null)
    fetch(`${prefix}/${sessionId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId, prefix])

  if (loading) return <p style={muted}>Loading…</p>
  if (!detail)  return <p style={{ color: '#f44336' }}>Failed to load session</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Badge state={detail.status?.state} />
        <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{detail.session_id}</span>
      </div>

      {Object.keys(detail.meta ?? {}).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Meta</SectionLabel>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(detail.meta).map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, color: '#aaa' }}>
                <span style={{ color: '#666' }}>{k}: </span>{v}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Frames ({detail.frames.length})</SectionLabel>
        <FrameStrip sessionId={sessionId} frames={detail.frames} prefix={prefix} />
      </div>

      <div>
        <SectionLabel>Transactions ({detail.transactions.length})</SectionLabel>
        {detail.transactions.length === 0
          ? <p style={muted}>None</p>
          : detail.transactions.map(tx => <TxRow key={tx.tx_id} tx={tx} />)
        }
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
      {children}
    </div>
  )
}

function SidebarSection({ label, action, children }) {
  return (
    <div>
      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

const muted = { color: '#555', fontSize: 13 }

const HISTORY_PREVIEW = 10

function HistoryPage({ history, onSelect }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>All history ({history.length})</SectionLabel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
        {history.map(s => (
          <div
            key={s.session_id}
            onClick={() => onSelect(s)}
            style={{
              padding: '10px 12px',
              background: '#111',
              border: '1px solid #1e1e1e',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Badge state={s.status?.state} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.session_id}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const [sessions, setSessions] = useState([])
  const [history, setHistory]   = useState([])
  const [stats, setStats]       = useState(null)
  const [rightPane, setRightPane] = useState(null)  // null | { type:'detail', session, prefix } | { type:'history' }
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/sessions').then(r => r.json()),
      fetch('/history').then(r => r.json()),
      fetch('/stats').then(r => r.json()),
    ])
      .then(([sessions, history, stats]) => {
        setSessions(sessions); setHistory(history); setStats(stats); setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const selectSession = (session, prefix) => setRightPane({ type: 'detail', session, prefix })
  const showAllHistory = () => setRightPane({ type: 'history' })

  const historyPreview = history.slice(0, HISTORY_PREVIEW)

  return (
    <div style={{ display: 'flex', height: '100vh' }}>

      {/* Sidebar */}
      <div style={{ width: 280, borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '14px 14px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>fridge</span>
          <button onClick={refresh} style={{ background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: 4, padding: '3px 9px', cursor: 'pointer', fontSize: 11 }}>
            refresh
          </button>
        </div>
        <DiskUsage stats={stats} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <p style={{ ...muted, padding: 14 }}>Loading…</p>}
          {error   && <p style={{ color: '#f44336', padding: 14, fontSize: 13 }}>{error}</p>}
          {!loading && !error && (
            <>
              <SidebarSection label={`Pending (${sessions.length})`}>
                {sessions.length === 0
                  ? <p style={{ ...muted, padding: '4px 14px 10px' }}>Empty</p>
                  : sessions.map(s => (
                    <SessionRow
                      key={s.session_id}
                      session={s}
                      isSelected={rightPane?.type === 'detail' && rightPane.session.session_id === s.session_id && rightPane.prefix === '/sessions'}
                      onSelect={s => selectSession(s, '/sessions')}
                    />
                  ))}
              </SidebarSection>
              <SidebarSection
                label={`History (${history.length})`}
                action={history.length > HISTORY_PREVIEW && (
                  <span
                    onClick={showAllHistory}
                    style={{ fontSize: 10, color: rightPane?.type === 'history' ? '#90caf9' : '#888', cursor: 'pointer' }}
                  >
                    show all →
                  </span>
                )}
              >
                {history.length === 0
                  ? <p style={{ ...muted, padding: '4px 14px 10px' }}>Empty</p>
                  : historyPreview.map(s => (
                    <SessionRow
                      key={s.session_id}
                      session={s}
                      isSelected={rightPane?.type === 'detail' && rightPane.session.session_id === s.session_id && rightPane.prefix === '/history'}
                      onSelect={s => selectSession(s, '/history')}
                    />
                  ))
                }
              </SidebarSection>
            </>
          )}
        </div>
      </div>

      {/* Right pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {rightPane?.type === 'detail' && (
          <>
            {rightPane.back && (
              <button
                onClick={() => setRightPane(rightPane.back)}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: '0 0 16px 0', display: 'block' }}
              >
                ← back
              </button>
            )}
            <SessionDetail sessionId={rightPane.session.session_id} prefix={rightPane.prefix} />
          </>
        )}
        {rightPane?.type === 'history' && (
          <HistoryPage history={history} onSelect={s => setRightPane({ type: 'detail', session: s, prefix: '/history', back: { type: 'history' } })} />
        )}
        {!rightPane && <p style={muted}>Select a session</p>}
      </div>
    </div>
  )
}
