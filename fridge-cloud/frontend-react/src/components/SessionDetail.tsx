import { $api } from '../fridge-api/client';
import { timeAgo } from '../utils';
import { Badge } from './Badge';
import { TxRow } from './TxRow';
import { FrameGrid } from './FrameGrid';
import { SectionLabel } from './SidebarSection';

const muted = { color: '#555', fontSize: 13 };

export function SessionDetail({ sessionId, prefix = '/sessions' }: {
  sessionId: string;
  prefix?: string;
}) {
  const path = prefix === '/history' ? '/history/{id}' as const : '/sessions/{id}' as const;
  const { data: detail, isLoading, error } = $api.useQuery("get", path, {
    params: { path: { id: sessionId } },
  });

  if (isLoading) return <p style={muted}>Loading...</p>;
  if (error || !detail) return <p style={{ color: '#f44336' }}>Failed to load session</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1e1e1e' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Badge state={detail.status?.state} />
            <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{detail.session_id}</span>
          </div>
          <div style={{ fontSize: 12, color: '#555' }}>{timeAgo(detail.session_id ?? '')}</div>
        </div>
        {(detail.frames?.length ?? 0) > 0 && (
          <img
            src={`${prefix}/${sessionId}/gif`}
            alt="session animation"
            style={{ width: 200, borderRadius: 4, flexShrink: 0, background: '#1a1a1a' }}
          />
        )}
      </div>

      {Object.keys(detail.meta ?? {}).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Meta</SectionLabel>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {Object.entries(detail.meta!).map(([k, v]) => (
              <span key={k} style={{ fontSize: 12, color: '#aaa' }}>
                <span style={{ color: '#666' }}>{k}: </span>{v}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Transactions ({detail.transactions?.length ?? 0})</SectionLabel>
        {!detail.transactions?.length
          ? <p style={muted}>None</p>
          : detail.transactions.map(tx => <TxRow key={tx.tx_id} tx={tx} />)
        }
      </div>

      <div>
        <SectionLabel>Frames ({detail.frames?.length ?? 0})</SectionLabel>
        <FrameGrid sessionId={sessionId} frames={detail.frames} prefix={prefix} />
      </div>
    </div>
  );
}
