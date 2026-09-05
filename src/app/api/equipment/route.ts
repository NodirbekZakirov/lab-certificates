import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment, verificationTypes, auditLog } from '@/lib/db/schema';
import { authenticateRequest, requireAllowed, authErrorResponse } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/equipment — список всех приборов с типами проверки
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const items = await db
    .select({
      id: equipment.id,
      name: equipment.name,
      verificationTypeId: equipment.verificationTypeId,
      certificateNumber: equipment.certificateNumber,
      expiryDate: equipment.expiryDate,
      certificateFileUrl: equipment.certificateFileUrl,
      certificateFileType: equipment.certificateFileType,
      photoUrl: equipment.photoUrl,
      updatedAt: equipment.updatedAt,
      verificationTypeNameRu: verificationTypes.nameRu,
      verificationTypeNameUz: verificationTypes.nameUz,
      verificationTypeSortOrder: verificationTypes.sortOrder,
    })
    .from(equipment)
    .innerJoin(
      verificationTypes,
      eq(equipment.verificationTypeId, verificationTypes.id)
    )
    .orderBy(
      asc(verificationTypes.sortOrder),
      asc(equipment.expiryDate)
    );

  return NextResponse.json(items);
}

// POST /api/equipment — добавление нового прибора
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, verificationTypeId, certificateNumber, expiryDate, certificateFileUrl, certificateFileType, photoUrl } = body;

  if (!name || !verificationTypeId || !expiryDate) {
    return NextResponse.json(
      { error: 'name, verificationTypeId, and expiryDate are required' },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(equipment)
    .values({
      name,
      verificationTypeId,
      certificateNumber: certificateNumber || null,
      expiryDate,
      certificateFileUrl: certificateFileUrl || null,
      certificateFileType: certificateFileType || null,
      photoUrl: photoUrl || null,
      updatedBy: auth.user.telegramId,
    })
    .returning();

  await db.insert(auditLog).values({
    telegramId: auth.user.telegramId,
    action: 'CREATE',
    entityType: 'equipment',
    entityId: created.id,
    entityName: created.name,
    details: JSON.stringify(created),
  });

  return NextResponse.json(created, { status: 201 });
}
