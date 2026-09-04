import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram/validate';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthenticatedUser {
  telegramId: number;
  firstName: string | null;
  username: string | null;
  language: string;
  isAllowed: boolean;
  notificationsEnabled: boolean;
}

/**
 * Извлекает и валидирует пользователя из initData Telegram.
 * Возвращает null если невалидно или пользователь не в allow-list.
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { error: string; status: number }> {
  const initData = request.headers.get('x-telegram-init-data');

  // В режиме разработки разрешаем тестировать прямо в обычном браузере без Telegram
  if ((!initData || initData === 'dev-mock') && process.env.NODE_ENV === 'development') {
    const allowedIds = process.env.INITIAL_ALLOWED_TELEGRAM_IDS?.split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id)) ?? [];
    const devId = allowedIds[0] || 1340447911;

    let user = (
      await db
        .select()
        .from(users)
        .where(eq(users.telegramId, devId))
        .limit(1)
    )[0];

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          telegramId: devId,
          firstName: 'Admin (Dev)',
          username: 'admin',
          isAllowed: true,
        })
        .returning();
      user = created;
    }

    return {
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        language: user.language,
        isAllowed: user.isAllowed,
        notificationsEnabled: user.notificationsEnabled,
      },
    };
  }

  if (!initData) {
    return { error: 'Missing initData', status: 401 };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { error: 'Server configuration error', status: 500 };
  }

  const validated = validateInitData(initData, botToken);
  if (!validated) {
    return { error: 'Invalid initData', status: 401 };
  }

  // Ищем или создаём пользователя
  let user = (
    await db
      .select()
      .from(users)
      .where(eq(users.telegramId, validated.user.id))
      .limit(1)
  )[0];

  if (!user) {
    // Проверяем allow-list
    const allowedIds = process.env.INITIAL_ALLOWED_TELEGRAM_IDS?.split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id)) ?? [];

    const rows = await db
      .insert(users)
      .values({
        telegramId: validated.user.id,
        firstName: validated.user.first_name || null,
        username: validated.user.username || null,
        isAllowed: allowedIds.includes(validated.user.id),
      })
      .returning();
    user = rows[0];
  }

  return {
    user: {
      telegramId: user.telegramId,
      firstName: user.firstName,
      username: user.username,
      language: user.language,
      isAllowed: user.isAllowed,
      notificationsEnabled: user.notificationsEnabled,
    },
  };
}

/**
 * Helper: возвращает 403 для неавторизованных пользователей
 */
export function requireAllowed(
  result: Awaited<ReturnType<typeof authenticateRequest>>
): result is { user: AuthenticatedUser } {
  if ('error' in result) return false;
  return result.user.isAllowed;
}

export function authErrorResponse(
  result: { error: string; status: number }
): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status });
}
