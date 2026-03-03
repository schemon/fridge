export function TxSummary({ tx_summary }: { tx_summary?: Record<string, number> }) {
  const adds = tx_summary?.ADD || 0;
  const removes = tx_summary?.REMOVE || 0;
  if (!adds && !removes) return null;
  return (
    <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      {adds > 0 && <span style={{ color: '#4caf50', fontSize: 11, fontWeight: 600 }}>[+{adds}]</span>}
      {removes > 0 && <span style={{ color: '#f44336', fontSize: 11, fontWeight: 600 }}>[-{removes}]</span>}
    </span>
  );
}
