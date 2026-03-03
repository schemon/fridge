import type { components } from '../fridge-api/schema';
import { timeAgo } from '../utils';
import { TxSummary } from './TxSummary';
import { SectionLabel } from './SidebarSection';

type SessionSummary = components['schemas']['SessionSummary'];

export function HistoryPage({ history, onSelect }: {
  history: SessionSummary[];
  onSelect: (s: SessionSummary) => void;
}) {
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
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, color: '#aaa' }}>{timeAgo(s.session_id ?? '')}</span>
            <TxSummary tx_summary={s.tx_summary} />
          </div>
        ))}
      </div>
    </div>
  );
}
