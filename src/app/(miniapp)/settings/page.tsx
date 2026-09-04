'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { api, type UserData } from '@/lib/api-client';
import Link from 'next/link';

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const data = await api.getUser();
      setUser(data);
    } catch (err) {
      console.error('Failed to load user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: 'ru' | 'uz') => {
    setLanguage(lang);
    setSaving(true);
    try {
      const updated = await api.updateUser({ language: lang });
      setUser(updated);
      showSuccess();
    } catch (err) {
      console.error('Failed to update language:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationsToggle = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await api.updateUser({
        notificationsEnabled: !user.notificationsEnabled,
      });
      setUser(updated);
      showSuccess();
    } catch (err) {
      console.error('Failed to update notifications:', err);
    } finally {
      setSaving(false);
    }
  };

  const showSuccess = () => {
    setSuccessMessage(t.settings.saved);
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
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
          {t.settings.title}
        </h1>
      </div>

      {successMessage && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-status-green-bg border border-status-green/20 animate-fade-in">
          <p className="text-sm text-status-green text-center font-medium">{successMessage}</p>
        </div>
      )}

      <div className="px-4 space-y-4 pb-24">
        {/* Language */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{t.settings.language}</h3>
              <p className="text-xs text-text-muted mt-1">
                {language === 'ru' ? 'Русский' : "O'zbekcha"}
              </p>
            </div>
            <div className="lang-switch">
              <button
                className={language === 'ru' ? 'active' : ''}
                onClick={() => handleLanguageChange('ru')}
              >
                RU
              </button>
              <button
                className={language === 'uz' ? 'active' : ''}
                onClick={() => handleLanguageChange('uz')}
              >
                UZ
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{t.settings.notifications}</h3>
              <p className="text-xs text-text-muted mt-1">
                {user?.notificationsEnabled ? t.settings.notificationsOn : t.settings.notificationsOff}
              </p>
            </div>
            <button
              className={`toggle-switch ${user?.notificationsEnabled ? 'active' : ''}`}
              onClick={handleNotificationsToggle}
              disabled={saving}
            />
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              {language === 'uz' ? "Foydalanuvchi ma'lumotlari" : 'Информация'}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Telegram ID</span>
                <span className="text-text-secondary font-mono">{user.telegramId}</span>
              </div>
              {user.firstName && (
                <div className="flex justify-between">
                  <span className="text-text-muted">{language === 'uz' ? 'Ism' : 'Имя'}</span>
                  <span className="text-text-secondary">{user.firstName}</span>
                </div>
              )}
              {user.username && (
                <div className="flex justify-between">
                  <span className="text-text-muted">Username</span>
                  <span className="text-text-secondary">@{user.username}</span>
                </div>
              )}
            </div>
          </div>
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
          <Link href="/verification-types" className="flex flex-col items-center gap-1 p-2 text-text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
            </svg>
            <span className="text-[10px] font-medium">{t.nav.types}</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 p-2 text-accent">
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
