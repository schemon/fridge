import type { components } from '../fridge-api/schema';
import { timeAgo } from '../utils';
import { TxSummary } from './TxSummary';

type SessionSummary = components['schemas']['SessionSummary'];

export function SessionRow({ session, isSelected, onSelect }: {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: (s: SessionSummary) => void;
}) {
  return (
    <div
      onClick={() => onSelect(session)}
      style={{
        padding: '9px 14px',
        cursor: 'pointer',
        background: isSelected ? '#152030' : 'transparent',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {timeAgo(session.session_id ?? '')}
      </span>
      <TxSummary tx_summary={session.tx_summary} />
    </div>
  );
}
