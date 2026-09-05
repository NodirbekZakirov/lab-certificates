import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment, certificateHistory, verificationTypes, auditLog } from '@/lib/db/schema';
import { authenticateRequest, requireAllowed, authErrorResponse } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      photoUrl: equipment.photoUrl,
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

  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, certificateNumber, expiryDate, certificateFileUrl, certificateFileType, photoUrl } = body;

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

  // Архивируем старый сертификат в историю если изменились критичные данные
  if (
    (certificateNumber && certificateNumber !== existing.certificateNumber) ||
    (expiryDate && expiryDate !== existing.expiryDate)
  ) {
    await db.insert(certificateHistory).values({
      equipmentId: id,
      oldCertificateNumber: existing.certificateNumber,
      oldExpiryDate: existing.expiryDate,
      oldCertificateFileUrl: existing.certificateFileUrl,
      replacedBy: auth.user.telegramId,
    });
  }

  // Обновляем прибор
  const [updated] = await db
    .update(equipment)
    .set({
      name: name || existing.name,
      certificateNumber: certificateNumber !== undefined ? certificateNumber : existing.certificateNumber,
      expiryDate: expiryDate || existing.expiryDate,
      certificateFileUrl: certificateFileUrl !== undefined ? certificateFileUrl : existing.certificateFileUrl,
      certificateFileType: certificateFileType !== undefined ? certificateFileType : existing.certificateFileType,
      photoUrl: photoUrl !== undefined ? photoUrl : existing.photoUrl,
      updatedAt: new Date(),
      updatedBy: auth.user.telegramId,
    })
    .where(eq(equipment.id, id))
    .returning();

  await db.insert(auditLog).values({
    telegramId: auth.user.telegramId,
    action: 'UPDATE',
    entityType: 'equipment',
    entityId: id,
    entityName: updated.name,
    details: JSON.stringify(updated),
  });

  return NextResponse.json(updated);
}

// DELETE /api/equipment/[id] — удаление прибора
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authenticateRequest(request);
  if ('error' in auth) return authErrorResponse(auth);
  if (!requireAllowed(auth)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (auth.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const current = await db
    .select()
    .from(equipment)
    .where(eq(equipment.id, id))
    .limit(1);

  if (current.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete certificate history first to prevent foreign key errors
  await db.delete(certificateHistory).where(eq(certificateHistory.equipmentId, id));
  
  // Delete equipment
  await db.delete(equipment).where(eq(equipment.id, id));

  await db.insert(auditLog).values({
    telegramId: auth.user.telegramId,
    action: 'DELETE',
    entityType: 'equipment',
    entityId: id,
    entityName: current[0].name,
    details: JSON.stringify(current[0]),
  });

  return NextResponse.json({ success: true });
}
