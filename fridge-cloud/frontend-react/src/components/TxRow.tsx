import type { components } from '../fridge-api/schema';

type Transaction = components['schemas']['Transaction'];

const muted = { color: '#555', fontSize: 13 };

export function TxRow({ tx }: { tx: Transaction }) {
  const color = tx.type === 'ADD' ? '#4caf50' : tx.type === 'REMOVE' ? '#f44336' : '#888';
  const pct = tx.confidence != null ? `${Math.round(tx.confidence * 100)}%` : null;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13 }}>
      <span style={{ color, fontWeight: 700, width: 65, flexShrink: 0 }}>{tx.type}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {tx.item?.label ?? tx.tx_id}
      </span>
      {pct && <span style={muted}>{pct}</span>}
    </div>
  );
}
