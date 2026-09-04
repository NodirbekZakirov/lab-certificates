'use client';

import { useEffect, useState, useCallback } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { setInitData, api, type UserData } from '@/lib/api-client';

// Telegram WebApp script
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            username?: string;
            language_code?: string;
          };
          auth_date?: number;
          hash?: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        colorScheme: 'dark' | 'light';
        platform: string;
        version: string;
      };
    };
  }
}

export default function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccessDenied, setIsAccessDenied] = useState(false);

  useEffect(() => {
    const initTelegramApp = async () => {
      try {
        // Ждём загрузки Telegram WebApp
        const tg = window.Telegram?.WebApp;

        if (tg) {
          tg.ready();
          tg.expand();
          tg.setHeaderColor('#0f0f1a');
          tg.setBackgroundColor('#0f0f1a');

          if (tg.initData) {
            setInitData(tg.initData);
          }
        }

        // Для разработки в обычном браузере без Telegram
        if (!tg?.initData && process.env.NODE_ENV === 'development') {
          console.warn('No Telegram initData found — running in development mode');
          setInitData('dev-mock');
        }

        // Загружаем данные пользователя
        try {
          const userData = await api.getUser();
          setUser(userData);

          if (!userData.isAllowed) {
            setIsAccessDenied(true);
          }
        } catch (err: any) {
          if (err.message === 'Access denied' || err.message?.includes('403')) {
            setIsAccessDenied(true);
          } else {
            setError(err.message);
          }
        }

        setIsReady(true);
      } catch (err: any) {
        setError(err.message);
        setIsReady(true);
      }
    };

    initTelegramApp();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
        <div className="glass-card p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Ошибка
          </h2>
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isAccessDenied) {
    return (
      <I18nProvider initialLanguage="ru">
        <AccessDeniedScreen />
      </I18nProvider>
    );
  }

  return (
    <I18nProvider initialLanguage={(user?.language as 'ru' | 'uz') || 'ru'}>
      <div className="min-h-screen bg-bg-primary pb-20">
        {children}
      </div>
    </I18nProvider>
  );
}

function AccessDeniedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="glass-card p-8 text-center max-w-sm animate-slide-up">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-text-primary mb-3">
          Доступ ограничен
        </h2>
        <p className="text-text-secondary text-sm leading-relaxed">
          У вас нет доступа к этому приложению. Обратитесь к администратору лаборатории.
        </p>
        <div className="mt-6 p-3 rounded-xl bg-bg-secondary text-text-muted text-xs">
          Kirish cheklangan. Laboratoriya administratoriga murojaat qiling.
        </div>
      </div>
    </div>
  );
}
