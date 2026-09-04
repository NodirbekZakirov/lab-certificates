import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verificationTypes } from '@/lib/db/schema';
import { authenticateRequest, requireAllowed, authErrorResponse } from '@/lib/auth';
import { asc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/verification-types
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const types = await db
    .select()
    .from(verificationTypes)
    .orderBy(asc(verificationTypes.sortOrder));

  return NextResponse.json(types);
}

// POST /api/verification-types
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();
  const { nameRu, nameUz } = body;

  if (!nameRu || !nameUz) {
    return NextResponse.json(
      { error: 'nameRu and nameUz are required' },
      { status: 400 }
    );
  }

  // Определяем следующий sort_order
  const existing = await db
    .select({ sortOrder: verificationTypes.sortOrder })
    .from(verificationTypes)
    .orderBy(asc(verificationTypes.sortOrder));

  const nextOrder = existing.length > 0
    ? Math.max(...existing.map((e) => e.sortOrder)) + 1
    : 1;

  const [created] = await db
    .insert(verificationTypes)
    .values({
      nameRu,
      nameUz,
      sortOrder: nextOrder,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
