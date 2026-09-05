'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type EquipmentItem, type UserData } from '@/lib/api-client';
import Link from 'next/link';

interface GroupedEquipment {
  typeId: string;
  typeName: string;
  items: (EquipmentItem & { daysLeft: number })[];
  isExpanded: boolean;
}

type StatusFilter = 'all' | 'valid' | 'expiring' | 'expired';

export default function HomePage() {
  const { t, language } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [equipData, userData] = await Promise.all([
        api.getEquipment(),
        api.getUser().catch(() => null)
      ]);
      setEquipment(equipData);
      setUser(userData);
      const typeIds = new Set(equipData.map((e) => e.verificationTypeId));
      setExpandedGroups(typeIds);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = useMemo(() => {
    const filtered = equipment.filter((e) => {
      if (searchQuery) {
        const match = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.certificateNumber && e.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!match) return false;
      }

      if (statusFilter !== 'all') {
        const expiryDate = new Date(e.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (statusFilter === 'expired' && daysLeft > 0) return false;
        if (statusFilter === 'expiring' && (daysLeft <= 0 || daysLeft > 30)) return false;
        if (statusFilter === 'valid' && daysLeft <= 30) return false;
      }

      return true;
    });

    const groups = new Map<string, GroupedEquipment>();

    for (const item of filtered) {
      if (!groups.has(item.verificationTypeId)) {
        groups.set(item.verificationTypeId, {
          typeId: item.verificationTypeId,
          typeName: language === 'uz' ? item.verificationTypeNameUz : item.verificationTypeNameRu,
          items: [],
          isExpanded: expandedGroups.has(item.verificationTypeId),
        });
      }

      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      groups.get(item.verificationTypeId)!.items.push({
        ...item,
        daysLeft,
      });
    }

    for (const group of groups.values()) {
      group.items.sort((a, b) => a.daysLeft - b.daysLeft);
    }

    return Array.from(groups.values()).sort(
      (a, b) => (a.items[0]?.verificationTypeSortOrder ?? 0) - (b.items[0]?.verificationTypeSortOrder ?? 0)
    );
  }, [equipment, searchQuery, statusFilter, language, expandedGroups, today]);

  const toggleGroup = (typeId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) next.delete(typeId);
      else next.add(typeId);
      return next;
    });
  };

  const stats = useMemo(() => {
    let expired = 0, expiring = 0, ok = 0;
    for (const item of equipment) {
      const expiryDate = new Date(item.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const diffTime = expiryDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) expired++;
      else if (daysLeft <= 30) expiring++;
      else ok++;
    }
    return { expired, expiring, ok, total: equipment.length };
  }, [equipment, today]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-14 w-full" />
        <div className="responsive-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in">
        <div className="p-5 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text tracking-tight">
                {t.equipment.title}
              </h1>
              <p className="text-sm text-text-muted mt-1 font-medium">Всего приборов: {stats.total}</p>
            </div>
            <Link href="/settings" className="p-2.5 rounded-2xl bg-bg-secondary hover:bg-bg-card-hover border border-border transition-all hover:scale-105 active:scale-95 shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="glass-card p-4 text-center delay-100 animate-fade-in" style={{ borderColor: stats.expired > 0 ? 'rgba(239, 68, 68, 0.3)' : undefined, background: stats.expired > 0 ? 'rgba(239, 68, 68, 0.05)' : undefined }}>
              <div className={`text-2xl font-bold mb-1 ${stats.expired > 0 ? 'text-status-red' : 'text-text-primary'}`}>{stats.expired}</div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">{t.equipment.overdue}</div>
            </div>
            <div className="glass-card p-4 text-center delay-200 animate-fade-in" style={{ borderColor: stats.expiring > 0 ? 'rgba(245, 158, 11, 0.3)' : undefined, background: stats.expiring > 0 ? 'rgba(245, 158, 11, 0.05)' : undefined }}>
              <div className={`text-2xl font-bold mb-1 ${stats.expiring > 0 ? 'text-status-yellow' : 'text-text-primary'}`}>{stats.expiring}</div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">{t.equipment.expiring}</div>
            </div>
            <div className="glass-card p-4 text-center delay-300 animate-fade-in">
              <div className="text-2xl font-bold text-status-green mb-1">{stats.ok}</div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-text-muted">ОК</div>
            </div>
          </div>

          <div className="relative mb-4 animate-slide-up">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="input-field pl-12 h-12 shadow-sm"
              placeholder={t.app.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 mb-2 scrollbar-hide animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-semibold transition-all ${statusFilter === 'all' ? 'bg-text-primary text-bg-primary shadow-sm' : 'bg-bg-secondary text-text-muted hover:bg-bg-card-hover border border-border'}`}
            >
              Все
            </button>
            <button 
              onClick={() => setStatusFilter('expired')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-semibold transition-all ${statusFilter === 'expired' ? 'bg-status-red/10 text-status-red border border-status-red/30' : 'bg-bg-secondary text-text-muted hover:bg-bg-card-hover border border-border'}`}
            >
              🔴 Просрочены
            </button>
            <button 
              onClick={() => setStatusFilter('expiring')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-semibold transition-all ${statusFilter === 'expiring' ? 'bg-status-yellow/10 text-status-yellow border border-status-yellow/30' : 'bg-bg-secondary text-text-muted hover:bg-bg-card-hover border border-border'}`}
            >
              🟡 Скоро
            </button>
            <button 
              onClick={() => setStatusFilter('valid')}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-semibold transition-all ${statusFilter === 'valid' ? 'bg-status-green/10 text-status-green border border-status-green/30' : 'bg-bg-secondary text-text-muted hover:bg-bg-card-hover border border-border'}`}
            >
              🟢 В норме
            </button>
          </div>
        </div>

        <div className="px-5 space-y-6 pb-8">
          {grouped.length === 0 ? (
            <div className="glass-card p-10 text-center animate-fade-in border-dashed">
              <div className="w-16 h-16 mx-auto bg-bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <p className="text-text-secondary font-medium">{searchQuery || statusFilter !== 'all' ? 'Ничего не найдено' : t.equipment.noCertificates}</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.typeId} className="animate-slide-up">
                <button
                  className="section-header group"
                  onClick={() => toggleGroup(group.typeId)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-bold text-text-primary group-hover:text-accent transition-colors">
                      {group.typeName}
                    </span>
                    <span className="text-xs font-bold text-text-muted bg-bg-secondary px-2.5 py-1 rounded-full border border-border">
                      {group.items.length}
                    </span>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center border border-border transition-all duration-300 ${expandedGroups.has(group.typeId) ? 'rotate-180 bg-accent/10 border-accent/20 text-accent' : 'text-text-muted'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${expandedGroups.has(group.typeId) ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="responsive-grid px-1 pb-2">
                      {group.items.map((item) => (
                        <EquipmentCard key={item.id} item={item} language={language} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {user?.role === 'admin' && (
        <Link
          href="/equipment/new"
          className="fixed bottom-[100px] right-5 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-[#8b5cf6] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.6)] animate-pulse-glow z-40 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </Link>
      )}

      <nav className="nav-dock-container">
        <div className="nav-dock">
          <Link href="/" className="nav-item active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.home}</span>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/verification-types" className="nav-item">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="text-[10px] font-bold tracking-wide">{t.nav.types}</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function EquipmentCard({ item, language }: { item: EquipmentItem & { daysLeft: number }; language: string }) {
  const { t } = useTranslation();

  let dotClass: string;
  let badgeClass: string;
  let statusText: string;

  if (item.daysLeft < 0) {
    dotClass = 'status-red';
    badgeClass = 'badge-red';
    statusText = language === 'uz' ? `${Math.abs(item.daysLeft)} kun o'tgan` : `Просрочено на ${Math.abs(item.daysLeft)} дн.`;
  } else if (item.daysLeft === 0) {
    dotClass = 'status-red';
    badgeClass = 'badge-red';
    statusText = t.equipment.today;
  } else if (item.daysLeft <= 30) {
    dotClass = 'status-yellow';
    badgeClass = 'badge-yellow';
    statusText = `${item.daysLeft} ${language === 'uz' ? 'kun' : 'дн.'}`;
  } else {
    dotClass = 'status-green';
    badgeClass = 'badge-green';
    statusText = `${item.daysLeft} ${language === 'uz' ? 'kun' : 'дн.'}`;
  }

  return (
    <Link
      href={`/equipment/${item.id}`}
      className="block p-4 rounded-[20px] bg-bg-card hover:bg-bg-card-hover transition-all duration-200 border border-border hover:border-accent/30 hover:shadow-lg active:scale-95"
    >
      <div className="flex items-start gap-4">
        {item.photoUrl ? (
          <div className="flex-shrink-0 relative">
            <img 
              src={item.photoUrl} 
              alt={item.name} 
              className="w-12 h-12 rounded-full object-cover border border-border shadow-sm"
            />
            <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-bg-card ${dotClass.replace('status-', 'bg-status-')}`} />
          </div>
        ) : (
          <div className="mt-1 flex-shrink-0">
            <span className={`status-dot ${dotClass}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-text-primary leading-tight line-clamp-2 mb-1">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {item.certificateNumber && (
              <span className="text-xs font-mono text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-md border border-border">
                № {item.certificateNumber}
              </span>
            )}
            <span className="text-xs font-medium text-text-muted flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
        <div className={`badge ${badgeClass} whitespace-nowrap self-start mt-0.5`}>
          {statusText}
        </div>
      </div>
    </Link>
  );
}
