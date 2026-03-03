import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { components } from '../fridge-api/schema';
import { $api } from '../fridge-api/client';
import { Sidebar, type RightPane } from './Sidebar';
import { SessionDetail } from './SessionDetail';
import { HistoryPage } from './HistoryPage';

type SessionSummary = components['schemas']['SessionSummary'];

const muted = { color: '#555', fontSize: 13 };

export function FridgeApp() {
  const [rightPane, setRightPane] = useState<RightPane>(null);
  const queryClient = useQueryClient();

  const sessionsQuery = $api.useQuery("get", "/sessions");
  const historyQuery = $api.useQuery("get", "/history");
  const statsQuery = $api.useQuery("get", "/stats");

  const loading = sessionsQuery.isLoading || historyQuery.isLoading;
  const error = (sessionsQuery.error as Error | null)?.message || (historyQuery.error as Error | null)?.message || null;

  const sessions = sessionsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const stats = statsQuery.data;

  const refresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const selectSession = (session: SessionSummary, prefix: string) =>
    setRightPane({ type: 'detail', session, prefix });

  const showAllHistory = () => setRightPane({ type: 'history' });

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        sessions={sessions}
        history={history}
        stats={stats}
        rightPane={rightPane}
        loading={loading}
        error={error}
        onSelectSession={selectSession}
        onShowAllHistory={showAllHistory}
        onRefresh={refresh}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {rightPane?.type === 'detail' && (
          <>
            {rightPane.back && (
              <button
                onClick={() => setRightPane(rightPane.back!)}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 12, padding: '0 0 16px 0', display: 'block' }}
              >
                ← back
              </button>
            )}
            <SessionDetail sessionId={rightPane.session.session_id!} prefix={rightPane.prefix} />
          </>
        )}
        {rightPane?.type === 'history' && (
          <HistoryPage
            history={history}
            onSelect={s => setRightPane({ type: 'detail', session: s, prefix: '/history', back: { type: 'history' } })}
          />
        )}
        {!rightPane && <p style={muted}>Select a session</p>}
      </div>
    </div>
  );
}
