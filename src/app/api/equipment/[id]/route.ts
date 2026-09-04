import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment, certificateHistory, verificationTypes } from '@/lib/db/schema';
import { authenticateRequest, requireAllowed, authErrorResponse } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';

// GET /api/equipment/[id] — карточка одного прибора с историей
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
      createdAt: equipment.createdAt,
      updatedAt: equipment.updatedAt,
      updatedBy: equipment.updatedBy,
      verificationTypeNameRu: verificationTypes.nameRu,
      verificationTypeNameUz: verificationTypes.nameUz,
    })
    .from(equipment)
    .innerJoin(
      verificationTypes,
      eq(equipment.verificationTypeId, verificationTypes.id)
    )
    .where(eq(equipment.id, id))
    .limit(1);

  if (items.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // История сертификатов
  const history = await db
    .select()
    .from(certificateHistory)
    .where(eq(certificateHistory.equipmentId, id))
    .orderBy(desc(certificateHistory.replacedAt));

  return NextResponse.json({ ...items[0], history });
}

// PUT /api/equipment/[id] — обновление сертификата
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();
  const { name, certificateNumber, expiryDate, certificateFileUrl, certificateFileType } = body;

  // Получаем текущие данные
  const current = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id))
    .limit(1);

  if (current.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const existing = current[0];

  // Архивируем старый сертификат в историю
  await db.insert(certificateHistory).values({
    equipmentId: id,
    oldCertificateNumber: existing.certificateNumber,
    oldExpiryDate: existing.expiryDate,
    oldCertificateFileUrl: existing.certificateFileUrl,
    replacedBy: auth.user.telegramId,
  });

  // Обновляем прибор
  const [updated] = await db
    .update(equipment)
    .set({
      name: name || existing.name,
      certificateNumber: certificateNumber !== undefined ? certificateNumber : existing.certificateNumber,
      expiryDate: expiryDate || existing.expiryDate,
      certificateFileUrl: certificateFileUrl !== undefined ? certificateFileUrl : existing.certificateFileUrl,
      certificateFileType: certificateFileType !== undefined ? certificateFileType : existing.certificateFileType,
      updatedAt: new Date(),
      updatedBy: auth.user.telegramId,
    })
    .where(eq(equipment.id, id))
    .returning();

  return NextResponse.json(updated);
}
