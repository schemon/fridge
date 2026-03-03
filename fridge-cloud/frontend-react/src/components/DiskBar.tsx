import type { components } from '../fridge-api/schema';
import { fmtBytes } from '../utils';

type DiskUsage = components['schemas']['DiskUsage'];

export function DiskBar({ label, used_bytes, max_bytes, used_pct }: { label: string } & DiskUsage) {
  const pct = used_pct ?? 0;
  const barColor = pct >= 90 ? '#f44336' : pct >= 70 ? '#ff9800' : '#4caf50';
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
  );
}

export function DiskUsagePanel({ stats }: { stats: components['schemas']['Stats'] | undefined }) {
  if (!stats) return null;
  const { disk_usage_total, disk_usage_sessions, disk_usage_history } = stats;
  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e1e' }}>
      {disk_usage_total && <DiskBar label="total" {...disk_usage_total} />}
      {disk_usage_sessions && <DiskBar label="pending" {...disk_usage_sessions} />}
      {disk_usage_history && <DiskBar label="history" {...disk_usage_history} />}
    </div>
  );
}
