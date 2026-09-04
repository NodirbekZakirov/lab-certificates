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
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-bold gradient-text">
            {t.verificationTypes.title}
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-secondary text-sm"
          >
            {showForm ? t.app.cancel : t.verificationTypes.addNew}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-status-green-bg border border-status-green/20">
          <p className="text-sm text-status-green text-center font-medium">{successMessage}</p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mx-4 mb-4 glass-card p-4 space-y-3 animate-slide-up">
          <div>
            <label className="block text-xs text-text-muted mb-1">{t.verificationTypes.nameRu}</label>
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
            <label className="block text-xs text-text-muted mb-1">{t.verificationTypes.nameUz}</label>
            <input
              type="text"
              className="input-field"
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              placeholder={t.verificationTypes.nameUzPlaceholder}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? t.app.loading : t.app.add}
          </button>
        </form>
      )}

      {/* Types list */}
      <div className="px-4 space-y-3 pb-24">
        {types.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-text-secondary">{t.verificationTypes.empty}</p>
          </div>
        ) : (
          types.map((type, index) => (
            <div
              key={type.id}
              className="glass-card p-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-sm">
                  {type.sortOrder}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {language === 'uz' ? type.nameUz : type.nameRu}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {language === 'uz' ? type.nameRu : type.nameUz}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="nav-bar">
        <div className="flex justify-around items-center">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.home}</span>
          </Link>
          <Link href="/verification-types" className="flex flex-col items-center gap-1 p-2 text-accent">
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
