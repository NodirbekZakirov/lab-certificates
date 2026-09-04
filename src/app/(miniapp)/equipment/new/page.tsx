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
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-16 w-full" />
        <div className="skeleton h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
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
        <h1 className="text-lg font-bold gradient-text mb-4">
          {t.equipment.addNew}
        </h1>
      </div>

      {successMessage && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-status-green-bg border border-status-green/20">
          <p className="text-sm text-status-green text-center font-medium">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-8">
        {/* Name */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.name}</label>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.equipment.namePlaceholder}
            required
          />
        </div>

        {/* Verification type */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.verificationType}</label>
          <select
            className="input-field"
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
        </div>

        {/* Certificate number */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.certificateNumber}</label>
          <input
            type="text"
            className="input-field"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder={t.equipment.certificateNumberPlaceholder}
          />
        </div>

        {/* Expiry date */}
        <div>
          <label className="block text-xs text-text-muted mb-2">{t.equipment.expiryDate}</label>
          <input
            type="date"
            className="input-field"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={saving || !name || !verificationTypeId || !expiryDate}
        >
          {saving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t.app.loading}
            </div>
          ) : (
            t.app.add
          )}
        </button>
      </form>
    </div>
  );
}
