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
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-32 w-full" />
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="p-4 text-center">
        <p className="text-text-secondary">{t.app.error}</p>
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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="p-4 pb-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-sm">{t.app.back}</span>
        </Link>
      </div>

      {/* Main card */}
      <div className="px-4 space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-lg font-bold text-text-primary flex-1 mr-3">
              {equipment.name}
            </h1>
            <div className={`badge ${badgeClass} whitespace-nowrap`}>
              {statusText}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-32">{t.equipment.verificationType}</span>
              <span className="text-sm text-text-primary font-medium">{typeName}</span>
            </div>

            {equipment.certificateNumber && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted w-32">{t.equipment.certificateNumber}</span>
                <span className="text-sm text-text-primary font-mono">{equipment.certificateNumber}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-32">{t.equipment.expiryDate}</span>
              <span className={`text-sm font-semibold ${statusClass}`}>
                {new Date(equipment.expiryDate).toLocaleDateString('ru-RU')}
              </span>
            </div>
          </div>

          {/* Certificate file preview */}
          {equipment.certificateFileUrl && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-text-muted mb-2">{t.equipment.certificateFile}</p>
              {equipment.certificateFileType === 'image' ? (
                <a
                  href={equipment.certificateFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-border hover:border-accent transition-colors"
                >
                  <img
                    src={equipment.certificateFileUrl}
                    alt="Certificate"
                    className="w-full h-48 object-cover"
                  />
                </a>
              ) : (
                <a
                  href={equipment.certificateFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-card transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-sm text-accent">{t.equipment.viewCertificate}</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Update button */}
        <Link
          href={`/equipment/${id}/edit`}
          className="btn-primary w-full text-center block"
        >
          {t.equipment.updateCertificate}
        </Link>

        {/* Certificate history */}
        {equipment.history && equipment.history.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">
              {t.equipment.certificateHistory}
            </h2>
            <div className="space-y-3">
              {equipment.history.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-bg-primary/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    {h.oldCertificateNumber && (
                      <span className="text-xs font-mono text-text-secondary">
                        № {h.oldCertificateNumber}
                      </span>
                    )}
                    {h.oldExpiryDate && (
                      <span className="text-xs text-text-muted">
                        {new Date(h.oldExpiryDate).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-muted">
                    {t.equipment.replacedAt}: {new Date(h.replacedAt).toLocaleDateString('ru-RU')}
                  </div>
                  {h.oldCertificateFileUrl && (
                    <a
                      href={h.oldCertificateFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline mt-1 inline-block"
                    >
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
