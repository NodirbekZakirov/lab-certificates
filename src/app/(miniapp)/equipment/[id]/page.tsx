'use client';

import { useEffect, useState, use } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type EquipmentDetail } from '@/lib/api-client';
import Link from 'next/link';

export default function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t, language } = useTranslation();
  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
  }, [id]);

  const loadEquipment = async () => {
    try {
      const data = await api.getEquipmentById(id);
      setEquipment(data);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-5 text-center mt-20">
        <div className="w-16 h-16 mx-auto bg-bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-text-secondary font-medium">{t.app.error}</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(equipment.expiryDate);
  expiryDate.setHours(0, 0, 0, 0);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusClass: string;
  let statusText: string;
  let badgeClass: string;

  if (daysLeft < 0) {
    statusClass = 'text-status-red';
    badgeClass = 'badge-red';
    statusText = language === 'uz'
      ? `${Math.abs(daysLeft)} kunga muddati o'tgan`
      : `Просрочено на ${Math.abs(daysLeft)} дн.`;
  } else if (daysLeft === 0) {
    statusClass = 'text-status-red';
    badgeClass = 'badge-red';
    statusText = t.equipment.today;
  } else if (daysLeft <= 30) {
    statusClass = 'text-status-yellow';
    badgeClass = 'badge-yellow';
    statusText = `${daysLeft} ${language === 'uz' ? 'kun qoldi' : 'дн. осталось'}`;
  } else {
    statusClass = 'text-status-green';
    badgeClass = 'badge-green';
    statusText = `${daysLeft} ${language === 'uz' ? 'kun qoldi' : 'дн. осталось'}`;
  }

  const typeName = language === 'uz'
    ? equipment.verificationTypeNameUz
    : equipment.verificationTypeNameRu;

  return (
    <div className="animate-fade-in pb-28">
      {/* Header */}
      <div className="p-5 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-5 bg-bg-secondary px-4 py-2 rounded-xl border border-border w-fit active:scale-95 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[13px] font-bold tracking-wide uppercase">{t.app.back}</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="px-5 space-y-5 max-w-2xl mx-auto">
        <div className="glass-card p-6 shadow-md animate-slide-up">
          <div className="flex items-start justify-between mb-5">
            <h1 className="text-xl font-bold text-text-primary leading-snug flex-1 mr-4 tracking-tight">
              {equipment.name}
            </h1>
            <div className={`badge ${badgeClass} whitespace-nowrap shadow-sm`}>
              {statusText}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 pb-4 border-b border-border/50">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.equipment.verificationType}</span>
              <span className="text-[15px] text-text-primary font-medium">{typeName}</span>
            </div>

            {equipment.certificateNumber && (
              <div className="flex flex-col gap-1.5 pb-4 border-b border-border/50">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.equipment.certificateNumber}</span>
                <span className="text-[15px] text-text-primary font-mono bg-bg-secondary px-2 py-1 rounded-md w-fit border border-border/50">{equipment.certificateNumber}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 pb-4 border-b border-border/50">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t.equipment.expiryDate}</span>
              <span className={`text-[15px] font-bold ${statusClass} flex items-center gap-2`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {new Date(equipment.expiryDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>

          {/* Certificate file preview */}
          {equipment.certificateFileUrl && (
            <div className="mt-5 pt-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">{t.equipment.certificateFile}</p>
              {equipment.certificateFileType === 'image' ? (
                <a
                  href={equipment.certificateFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden border-2 border-border hover:border-accent transition-colors shadow-sm group relative"
                >
                  <img
                    src={equipment.certificateFileUrl}
                    alt="Certificate"
                    className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-sm border border-white/30 flex items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                      </svg>
                      Увеличить
                    </span>
                  </div>
                </a>
              ) : (
                <a
                  href={equipment.certificateFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-2xl bg-bg-secondary hover:bg-bg-card transition-colors border border-border shadow-sm active:scale-95"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <span className="text-[15px] font-bold text-text-primary">{t.equipment.viewCertificate}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Update button */}
        <div className="animate-slide-up delay-100">
          <Link
            href={`/equipment/${id}/edit`}
            className="btn-primary w-full shadow-lg"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            {t.equipment.updateCertificate}
          </Link>
        </div>

        {/* Certificate history */}
        {equipment.history && equipment.history.length > 0 && (
          <div className="glass-card p-6 animate-slide-up delay-200">
            <h2 className="text-[15px] font-bold text-text-primary mb-4 tracking-tight">
              {t.equipment.certificateHistory}
            </h2>
            <div className="space-y-4">
              {equipment.history.map((h) => (
                <div
                  key={h.id}
                  className="p-4 rounded-2xl bg-bg-secondary border border-border relative overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-border/50"></div>
                  <div className="flex items-center justify-between mb-2">
                    {h.oldCertificateNumber ? (
                      <span className="text-xs font-mono font-bold text-text-secondary bg-bg-primary px-2 py-1 rounded-md border border-border/50">
                        № {h.oldCertificateNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted font-medium">-</span>
                    )}
                    {h.oldExpiryDate && (
                      <span className="text-xs font-medium text-text-muted flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        {new Date(h.oldExpiryDate).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium text-text-muted mt-2 mb-2 uppercase tracking-wide">
                    {t.equipment.replacedAt}: {new Date(h.replacedAt).toLocaleDateString('ru-RU')}
                  </div>
                  {h.oldCertificateFileUrl && (
                    <a
                      href={h.oldCertificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors mt-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {t.equipment.viewCertificate}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
