'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type EquipmentItem } from '@/lib/api-client';
import Link from 'next/link';

interface GroupedEquipment {
  typeId: string;
  typeName: string;
  items: (EquipmentItem & { daysLeft: number })[];
  isExpanded: boolean;
}

export default function HomePage() {
  const { t, language } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await api.getEquipment();
      setEquipment(data);
      // Expand all groups by default
      const typeIds = new Set(data.map((e) => e.verificationTypeId));
      setExpandedGroups(typeIds);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grouped = useMemo(() => {
    const filtered = searchQuery
      ? equipment.filter((e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : equipment;

    const groups = new Map<string, GroupedEquipment>();

    for (const item of filtered) {
      if (!groups.has(item.verificationTypeId)) {
        groups.set(item.verificationTypeId, {
          typeId: item.verificationTypeId,
          typeName:
            language === 'uz'
              ? item.verificationTypeNameUz
              : item.verificationTypeNameRu,
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

    // Sort items within each group by urgency
    for (const group of groups.values()) {
      group.items.sort((a, b) => a.daysLeft - b.daysLeft);
    }

    return Array.from(groups.values()).sort(
      (a, b) =>
        (a.items[0]?.verificationTypeSortOrder ?? 0) -
        (b.items[0]?.verificationTypeSortOrder ?? 0)
    );
  }, [equipment, searchQuery, language, expandedGroups]);

  const toggleGroup = (typeId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(typeId)) {
        next.delete(typeId);
      } else {
        next.add(typeId);
      }
      return next;
    });
  };

  const stats = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    let ok = 0;

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
  }, [equipment]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-12 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold gradient-text">
            {t.equipment.title}
          </h1>
          <div className="flex gap-2">
            <Link href="/settings" className="p-2 rounded-xl bg-bg-secondary hover:bg-bg-card transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass-card p-3 text-center" style={{ borderColor: stats.expired > 0 ? 'rgba(255,23,68,0.3)' : undefined }}>
            <div className="text-2xl font-bold text-status-red">{stats.expired}</div>
            <div className="text-xs text-text-muted mt-1">{t.equipment.overdue}</div>
          </div>
          <div className="glass-card p-3 text-center" style={{ borderColor: stats.expiring > 0 ? 'rgba(255,214,0,0.3)' : undefined }}>
            <div className="text-2xl font-bold text-status-yellow">{stats.expiring}</div>
            <div className="text-xs text-text-muted mt-1">{t.equipment.expiring}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-2xl font-bold text-status-green">{stats.ok}</div>
            <div className="text-xs text-text-muted mt-1">OK</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            className="input-field pl-10"
            placeholder={t.app.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment list grouped by verification type */}
      <div className="px-4 space-y-3 pb-4">
        {grouped.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-3xl mb-3">📋</div>
            <p className="text-text-secondary">{searchQuery ? t.app.noResults : t.equipment.noCertificates}</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.typeId} className="glass-card overflow-hidden">
              {/* Group header */}
              <button
                className="section-header w-full"
                onClick={() => toggleGroup(group.typeId)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    {group.typeName}
                  </span>
                  <span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded-full">
                    {group.items.length}
                  </span>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-text-muted transition-transform duration-300 ${
                    expandedGroups.has(group.typeId) ? 'rotate-180' : ''
                  }`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Items */}
              {expandedGroups.has(group.typeId) && (
                <div className="px-3 pb-3 space-y-2 animate-fade-in">
                  {group.items.map((item) => (
                    <EquipmentCard key={item.id} item={item} language={language} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB - Add new equipment */}
      <Link
        href="/equipment/new"
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full btn-primary flex items-center justify-center shadow-lg animate-pulse-glow z-40"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        <div className="flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.home}</span>
          </Link>
          <Link href="/verification-types" className="flex flex-col items-center gap-1 p-2 text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.types}</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 p-2 text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.settings}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

function EquipmentCard({
  item,
  language,
}: {
  item: EquipmentItem & { daysLeft: number };
  language: string;
}) {
  const { t } = useTranslation();

  let statusClass: string;
  let statusText: string;
  let dotClass: string;
  let badgeClass: string;

  if (item.daysLeft < 0) {
    statusClass = 'text-status-red';
    dotClass = 'status-red';
    badgeClass = 'badge-red';
    statusText = language === 'uz'
      ? `${Math.abs(item.daysLeft)} kunga muddati o'tgan`
      : `Просрочено на ${Math.abs(item.daysLeft)} дн.`;
  } else if (item.daysLeft === 0) {
    statusClass = 'text-status-red';
    dotClass = 'status-red';
    badgeClass = 'badge-red';
    statusText = t.equipment.today;
  } else if (item.daysLeft <= 30) {
    statusClass = 'text-status-yellow';
    dotClass = 'status-yellow';
    badgeClass = 'badge-yellow';
    statusText = `${item.daysLeft} ${language === 'uz' ? 'kun qoldi' : 'дн.'}`;
  } else {
    statusClass = 'text-status-green';
    dotClass = 'status-green';
    badgeClass = 'badge-green';
    statusText = `${item.daysLeft} ${language === 'uz' ? 'kun qoldi' : 'дн.'}`;
  }

  return (
    <Link
      href={`/equipment/${item.id}`}
      className="block p-3 rounded-xl bg-bg-primary/50 hover:bg-bg-primary/80 transition-all duration-200 border border-transparent hover:border-accent/20"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1.5">
          <span className={`status-dot ${dotClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {item.name}
          </h3>
          {item.certificateNumber && (
            <p className="text-xs text-text-muted mt-0.5 truncate">
              № {item.certificateNumber}
            </p>
          )}
          <p className="text-xs text-text-muted mt-0.5">
            {new Date(item.expiryDate).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <div className={`badge ${badgeClass} whitespace-nowrap`}>
          {statusText}
        </div>
      </div>
    </Link>
  );
}
