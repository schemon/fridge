const muted = { color: '#555', fontSize: 13 };

export function FrameGrid({ sessionId, frames, prefix = '/sessions' }: {
  sessionId: string;
  frames: string[] | undefined;
  prefix?: string;
}) {
  if (!frames?.length) return <p style={muted}>No frames</p>;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 5 }}>
      {frames.map(f => (
        <a key={f} href={`${prefix}/${sessionId}/frames/${f}`} target="_blank" rel="noreferrer">
          <img
            src={`${prefix}/${sessionId}/frames/${f}?w=240&h=180`}
            alt={f}
            style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 3, background: '#1a1a1a', display: 'block' }}
          />
        </a>
      ))}
    </div>
  );
}
