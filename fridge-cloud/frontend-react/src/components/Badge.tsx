const STATE_COLOR: Record<string, string> = {
  done: '#4caf50',
  failed: '#f44336',
  frames_extracting: '#ff9800',
  frames_done: '#2196f3',
};

export function Badge({ state }: { state: string | undefined }) {
  const bg = STATE_COLOR[state ?? ''] ?? '#555';
  return (
    <span style={{ background: bg, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
      {state ?? 'pending'}
    </span>
  );
}
