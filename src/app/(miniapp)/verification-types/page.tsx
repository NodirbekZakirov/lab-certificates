'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type VerificationType } from '@/lib/api-client';
import Link from 'next/link';

export default function VerificationTypesPage() {
  const { t, language } = useTranslation();
  const [types, setTypes] = useState<VerificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nameRu, setNameRu] = useState('');
  const [nameUz, setNameUz] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const data = await api.getVerificationTypes();
      setTypes(data);
    } catch (err) {
      console.error('Failed to load types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameRu || !nameUz) return;

    setSaving(true);
    try {
      await api.createVerificationType({ nameRu, nameUz });
      setSuccessMessage(t.verificationTypes.created);
      setNameRu('');
      setNameUz('');
      setShowForm(false);
      await loadTypes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to create type:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="responsive-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="p-5 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent transition-colors mb-5 bg-bg-secondary px-4 py-2 rounded-xl border border-border w-fit active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="text-[13px] font-bold tracking-wide uppercase">{t.app.back}</span>
        </Link>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold gradient-text tracking-tight">
            {t.verificationTypes.title}
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-[13px] px-4 py-2 rounded-xl border border-border shadow-sm active:scale-95"
          >
            {showForm ? t.app.cancel : t.verificationTypes.addNew}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mx-5 mb-5 p-3 rounded-xl bg-status-green-bg border border-status-green/30 animate-slide-up shadow-sm">
          <p className="text-sm text-status-green text-center font-bold tracking-wide">{successMessage}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mx-5 mb-6 glass-card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1">{t.verificationTypes.nameRu}</label>
            <input
              type="text"
              className="input-field"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder={t.verificationTypes.nameRuPlaceholder}
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-text-muted mb-2 ml-1">{t.verificationTypes.nameUz}</label>
            <input
              type="text"
              className="input-field"
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              placeholder={t.verificationTypes.nameUzPlaceholder}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-2" disabled={saving}>
            {saving ? t.app.loading : t.app.add}
          </button>
        </form>
      )}

      <div className="px-5 space-y-4 pb-28 responsive-grid">
        {types.length === 0 ? (
          <div className="glass-card p-10 text-center animate-fade-in border-dashed">
            <p className="text-text-secondary font-medium">{t.verificationTypes.empty}</p>
          </div>
        ) : (
          types.map((type, index) => (
            <div
              key={type.id}
              className="glass-card p-5 animate-slide-up hover:scale-[1.02] transition-transform cursor-default"
              style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-bg-secondary flex items-center justify-center text-accent font-bold text-[15px] border border-border shadow-inner">
                  {type.sortOrder}
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-text-primary tracking-tight">
                    {language === 'uz' ? type.nameUz : type.nameRu}
                  </h3>
                  <p className="text-[13px] text-text-muted font-medium mt-0.5">
                    {language === 'uz' ? type.nameRu : type.nameUz}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <nav className="nav-dock-container">
        <div className="nav-dock">
          <Link href="/" className="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.home}</span>
          </Link>
          <div className="nav-item active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.types}</span>
          </div>
          <Link href="/settings" className="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.settings}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
