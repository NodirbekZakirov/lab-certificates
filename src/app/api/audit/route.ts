import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditLog, users } from '@/lib/db/schema';
import { authenticateRequest, requireAllowed, authErrorResponse } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  
  if (!requireAllowed(auth) || auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const logs = await db
    .select({
      id: auditLog.id,
      telegramId: auditLog.telegramId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      entityName: auditLog.entityName,
      details: auditLog.details,
      createdAt: auditLog.createdAt,
      userFirstName: users.firstName,
      userUsername: users.username,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.telegramId, users.telegramId))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return NextResponse.json(logs);
}
