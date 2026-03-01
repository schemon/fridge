import { useState, useEffect, useCallback } from 'react'

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

function FrameStrip({ sessionId, frames }) {
  if (!frames?.length) return <p style={muted}>No frames</p>
  return (
    <div style={{ display: 'flex', gap: 5, overflowX: 'auto', padding: '6px 0' }}>
      {frames.map(f => (
        <img
          key={f}
          src={`/sessions/${sessionId}/frames/${f}`}
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

function SessionDetail({ sessionId }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setDetail(null)
    fetch(`/sessions/${sessionId}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

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
        <FrameStrip sessionId={sessionId} frames={detail.frames} />
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

const muted = { color: '#555', fontSize: 13 }

export default function App() {
  const [sessions, setSessions] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const refresh = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch('/sessions')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  useEffect(() => { refresh() }, [refresh])

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
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <p style={{ ...muted, padding: 14 }}>Loading…</p>}
          {error   && <p style={{ color: '#f44336', padding: 14, fontSize: 13 }}>{error}</p>}
          {!loading && !error && sessions.length === 0 && <p style={{ ...muted, padding: 14 }}>No sessions</p>}
          {sessions.map(s => (
            <SessionRow
              key={s.session_id}
              session={s}
              isSelected={selected?.session_id === s.session_id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* Detail pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {selected
          ? <SessionDetail sessionId={selected.session_id} />
          : <p style={muted}>Select a session</p>
        }
      </div>
    </div>
  )
}
