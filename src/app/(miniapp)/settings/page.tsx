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
      <div className="p-5 space-y-5">
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
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
          <h1 className="text-2xl font-bold gradient-text tracking-tight mb-2">
            {t.settings.title}
          </h1>
        </div>

        {successMessage && (
          <div className="mx-5 mb-5 p-3 rounded-xl bg-status-green-bg border border-status-green/30 animate-slide-up shadow-sm">
            <p className="text-sm text-status-green text-center font-bold tracking-wide">{successMessage}</p>
          </div>
        )}

        <div className="px-5 space-y-5 pb-28 responsive-grid">
          {/* Language */}
          <div className="glass-card p-6 animate-slide-up delay-100">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-[15px] font-bold text-text-primary tracking-tight">{t.settings.language}</h3>
                <p className="text-xs text-text-muted mt-1 font-medium">
                  {language === 'ru' ? 'Русский' : "O'zbekcha"}
                </p>
              </div>
              <div className="lang-switch w-full">
                <button
                  className={`flex-1 ${language === 'ru' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('ru')}
                >
                  RU
                </button>
                <button
                  className={`flex-1 ${language === 'uz' ? 'active' : ''}`}
                  onClick={() => handleLanguageChange('uz')}
                >
                  UZ
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="glass-card p-6 animate-slide-up delay-200">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <h3 className="text-[15px] font-bold text-text-primary tracking-tight">{t.settings.notifications}</h3>
                <p className="text-xs text-text-muted mt-1 font-medium leading-relaxed">
                  {user?.notificationsEnabled ? t.settings.notificationsOn : t.settings.notificationsOff}
                </p>
              </div>
              <button
                className={`toggle-switch shrink-0 ${user?.notificationsEnabled ? 'active' : ''}`}
                onClick={handleNotificationsToggle}
                disabled={saving}
              />
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="glass-card p-6 animate-slide-up delay-300">
              <h3 className="text-[15px] font-bold text-text-primary tracking-tight mb-4">
                {language === 'uz' ? "Foydalanuvchi ma'lumotlari" : 'Информация'}
              </h3>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between items-center pb-3 border-b border-border/50">
                  <span className="text-text-muted font-medium">Telegram ID</span>
                  <span className="text-text-secondary font-mono bg-bg-secondary px-2 py-1 rounded-md">{user.telegramId}</span>
                </div>
                {user.firstName && (
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-text-muted font-medium">{language === 'uz' ? 'Ism' : 'Имя'}</span>
                    <span className="text-text-secondary font-medium">{user.firstName}</span>
                  </div>
                )}
                {user.username && (
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted font-medium">Username</span>
                    <span className="text-text-secondary font-medium">@{user.username}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Export Reports */}
          {user && (
            <div className="glass-card p-6 animate-slide-up delay-400">
              <div className="mb-4">
                <h3 className="text-[15px] font-bold text-text-primary tracking-tight">
                  {language === 'uz' ? 'Hisobotlar' : 'Отчеты'}
                </h3>
                <p className="text-xs text-text-muted mt-1 font-medium leading-relaxed">
                  {language === 'uz' ? "Hisobot bot orqali yuboriladi" : "Отчет будет отправлен вам в чат с ботом"}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2 rounded-xl border border-border shadow-sm active:scale-95"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.exportReport({ telegramId: user.telegramId, format: 'excel', language });
                      setSuccessMessage(language === 'uz' ? 'Hisobot yuborildi!' : 'Отчет отправлен в чат!');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (e) {
                      alert('Error exporting');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="8" y1="13" x2="16" y2="13"></line>
                    <line x1="8" y1="17" x2="16" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span className="text-[13px] font-bold">Excel</span>
                </button>
                <button
                  className="flex-1 btn-secondary py-3 flex items-center justify-center gap-2 rounded-xl border border-border shadow-sm active:scale-95"
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await api.exportReport({ telegramId: user.telegramId, format: 'pdf', language });
                      setSuccessMessage(language === 'uz' ? 'Hisobot yuborildi!' : 'Отчет отправлен в чат!');
                      setTimeout(() => setSuccessMessage(''), 3000);
                    } catch (e) {
                      alert('Error exporting');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"></path>
                  </svg>
                  <span className="text-[13px] font-bold">PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="glass-card p-6 animate-slide-up delay-500">
              <h3 className="text-[15px] font-bold text-text-primary tracking-tight mb-4">
                Администрирование
              </h3>
              <Link href="/audit" className="flex items-center justify-between p-4 rounded-xl bg-bg-secondary hover:bg-bg-card-hover transition-colors border border-border group active:scale-95 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-text-primary group-hover:text-accent transition-colors">Журнал действий</div>
                    <div className="text-xs font-medium text-text-muted mt-0.5">История изменений в системе</div>
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted group-hover:text-accent transition-colors">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="nav-dock-container">
        <div className="nav-dock">
          <Link href="/" className="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.home}</span>
          </Link>
          <Link href="/verification-types" className="nav-item">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.types}</span>
          </Link>
          <div className="nav-item active">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wide">{t.nav.settings}</span>
          </div>
        </div>
      </nav>
    </>
  );
}
