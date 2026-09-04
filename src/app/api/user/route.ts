import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { authenticateRequest, authErrorResponse } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/user — данные текущего пользователя
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);

  return NextResponse.json(auth.user);
}

// PUT /api/user — обновление настроек пользователя (язык, уведомления)
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.language && ['ru', 'uz'].includes(body.language)) {
    updates.language = body.language;
  }

  if (typeof body.notificationsEnabled === 'boolean') {
    updates.notificationsEnabled = body.notificationsEnabled;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.telegramId, auth.user.telegramId))
    .returning();

  return NextResponse.json({
    telegramId: updated.telegramId,
    firstName: updated.firstName,
    username: updated.username,
    language: updated.language,
    isAllowed: updated.isAllowed,
    notificationsEnabled: updated.notificationsEnabled,
  });
}
