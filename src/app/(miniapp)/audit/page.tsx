'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type AuditLogItem, type UserData } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuditLogPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await api.getUser();
      setUser(userData);
      
      if (userData.role !== 'admin') {
        router.push('/');
        return;
      }

      const logData = await api.getAuditLogs();
      setLogs(logData);
    } catch (err) {
      console.error('Failed to load data:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (user?.role !== 'admin') return null;

  return (
    <div className="animate-fade-in pb-28">
      <div className="p-5 pb-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-5 bg-bg-secondary px-4 py-2 rounded-xl border border-border w-fit active:scale-95 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[13px] font-bold tracking-wide uppercase">{t.app.back}</span>
        </Link>
        <h1 className="text-2xl font-bold gradient-text tracking-tight mb-4">
          Журнал действий
        </h1>
      </div>

      <div className="px-5 space-y-4">
        {logs.length === 0 ? (
          <div className="glass-card p-10 text-center animate-fade-in border-dashed">
            <p className="text-text-secondary font-medium">Журнал пуст</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="glass-card p-4 animate-slide-up hover:border-accent/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                    log.action === 'CREATE' ? 'bg-status-green/10 text-status-green border border-status-green/20' :
                    log.action === 'UPDATE' ? 'bg-status-yellow/10 text-status-yellow border border-status-yellow/20' :
                    log.action === 'DELETE' ? 'bg-status-red/10 text-status-red border border-status-red/20' :
                    'bg-bg-secondary text-text-muted border border-border'
                  }`}>
                    {log.action}
                  </span>
                  <span className="text-xs font-mono text-text-muted bg-bg-secondary px-2 py-0.5 rounded-md border border-border">
                    {log.entityType}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-text-muted">
                  {new Date(log.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>
              
              <div className="mb-3">
                <p className="text-[15px] font-bold text-text-primary leading-tight">
                  {log.entityName || `ID: ${log.entityId}`}
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-[10px]">
                  {log.userFirstName ? log.userFirstName[0].toUpperCase() : '@'}
                </div>
                <span className="font-medium">
                  {log.userFirstName || log.userUsername || log.telegramId}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
