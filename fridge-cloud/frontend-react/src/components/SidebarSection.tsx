import type { ReactNode } from 'react';

export function SidebarSection({ label, action, children }: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
      {children}
    </div>
  );
}
