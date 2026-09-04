'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type VerificationType } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewEquipmentPage() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const [types, setTypes] = useState<VerificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [verificationTypeId, setVerificationTypeId] = useState('');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await api.getVerificationTypes();
      setTypes(data);
      if (data.length > 0) {
        setVerificationTypeId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !verificationTypeId || !expiryDate) return;

    setSaving(true);
    try {
      await api.createEquipment({
        name,
        verificationTypeId,
        certificateNumber: certificateNumber || undefined,
        expiryDate,
      });
      setSuccessMessage(t.equipment.created);
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err) {
      console.error('Failed to create:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="skeleton h-20 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-28">
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
        <h1 className="text-2xl font-bold gradient-text tracking-tight mb-4">
          {t.equipment.addNew}
        </h1>
      </div>

      {successMessage && (
        <div className="mx-5 mb-5 p-3 rounded-xl bg-status-green-bg border border-status-green/30 animate-slide-up shadow-sm">
          <p className="text-sm text-status-green text-center font-bold tracking-wide">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-5 space-y-5 max-w-2xl mx-auto">
        {/* Name */}
        <div className="animate-slide-up delay-100">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.name}</label>
          <input
            type="text"
            className="input-field shadow-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.equipment.namePlaceholder}
            required
          />
        </div>

        {/* Verification type */}
        <div className="animate-slide-up delay-200">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.verificationType}</label>
          <div className="relative">
            <select
              className="input-field shadow-sm appearance-none pr-10"
              value={verificationTypeId}
              onChange={(e) => setVerificationTypeId(e.target.value)}
              required
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {language === 'uz' ? type.nameUz : type.nameRu}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
        </div>

        {/* Certificate number */}
        <div className="animate-slide-up delay-300">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.certificateNumber}</label>
          <input
            type="text"
            className="input-field shadow-sm"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder={t.equipment.certificateNumberPlaceholder}
          />
        </div>

        {/* Expiry date */}
        <div className="animate-slide-up delay-300">
          <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1 uppercase tracking-wider">{t.equipment.expiryDate}</label>
          <input
            type="date"
            className="input-field shadow-sm block w-full"
            style={{ colorScheme: 'dark' }}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>

        <div className="pt-2 animate-slide-up delay-300">
          <button
            type="submit"
            className="btn-primary w-full shadow-lg"
            disabled={saving || !name || !verificationTypeId || !expiryDate}
          >
            {saving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t.app.loading}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                {t.app.add}
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
