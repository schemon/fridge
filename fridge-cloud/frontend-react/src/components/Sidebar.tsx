import type { components } from '../fridge-api/schema';
import { DiskUsagePanel } from './DiskBar';
import { SessionRow } from './SessionRow';
import { SidebarSection } from './SidebarSection';

type SessionSummary = components['schemas']['SessionSummary'];

const muted = { color: '#555', fontSize: 13 };
const HISTORY_PREVIEW = 10;

export type RightPane =
  | null
  | { type: 'detail'; session: SessionSummary; prefix: string; back?: RightPane }
  | { type: 'history' };

export function Sidebar({ sessions, history, stats, rightPane, loading, error, onSelectSession, onShowAllHistory, onRefresh }: {
  sessions: SessionSummary[];
  history: SessionSummary[];
  stats: components['schemas']['Stats'] | undefined;
  rightPane: RightPane;
  loading: boolean;
  error: string | null;
  onSelectSession: (s: SessionSummary, prefix: string) => void;
  onShowAllHistory: () => void;
  onRefresh: () => void;
}) {
  const historyPreview = history.slice(0, HISTORY_PREVIEW);

  return (
    <div style={{ width: 280, borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 14px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>fridge</span>
        <button onClick={onRefresh} style={{ background: 'none', border: '1px solid #333', color: '#aaa', borderRadius: 4, padding: '3px 9px', cursor: 'pointer', fontSize: 11 }}>
          refresh
        </button>
      </div>
      <DiskUsagePanel stats={stats} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <p style={{ ...muted, padding: 14 }}>Loading...</p>}
        {error && <p style={{ color: '#f44336', padding: 14, fontSize: 13 }}>{error}</p>}
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
                    onSelect={s => onSelectSession(s, '/sessions')}
                  />
                ))}
            </SidebarSection>
            <SidebarSection
              label={`History (${history.length})`}
              action={history.length > HISTORY_PREVIEW ? (
                <span
                  onClick={onShowAllHistory}
                  style={{ fontSize: 10, color: rightPane?.type === 'history' ? '#90caf9' : '#888', cursor: 'pointer' }}
                >
                  show all →
                </span>
              ) : undefined}
            >
              {history.length === 0
                ? <p style={{ ...muted, padding: '4px 14px 10px' }}>Empty</p>
                : historyPreview.map(s => (
                  <SessionRow
                    key={s.session_id}
                    session={s}
                    isSelected={rightPane?.type === 'detail' && rightPane.session.session_id === s.session_id && rightPane.prefix === '/history'}
                    onSelect={s => onSelectSession(s, '/history')}
                  />
                ))
              }
            </SidebarSection>
          </>
        )}
      </div>
    </div>
  );
}
