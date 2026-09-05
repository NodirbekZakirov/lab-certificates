import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { equipment, verificationTypes, users, sentNotifications } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import { Bot, InlineKeyboard } from 'grammy';
import ruMessages from '@/lib/i18n/ru.json';
import uzMessages from '@/lib/i18n/uz.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET /api/cron/notify — ежедневная рассылка уведомлений
export async function GET(request: NextRequest) {
  // Проверка секрета cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isTest = request.nextUrl.searchParams.get('test') === 'true';

  if (!isTest && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'https://lab-certificates.vercel.app'; // Fallback for safety

  if (!botToken || !appUrl) {
    console.error('Missing bot token or app URL', { hasBotToken: !!botToken, appUrl });
    return NextResponse.json(
      { error: 'Missing bot token or app URL' },
      { status: 500 }
    );
  }

  const bot = new Bot(botToken);

  // Сегодняшняя дата (UTC+5 Ташкент)
  const now = new Date();
  const tashkentOffset = 5 * 60; // минут
  const tashkentTime = new Date(now.getTime() + tashkentOffset * 60 * 1000);
  const today = tashkentTime.toISOString().split('T')[0]; // YYYY-MM-DD

  // Дата через 30 дней
  const thirtyDaysLater = new Date(tashkentTime);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const maxDate = thirtyDaysLater.toISOString().split('T')[0];

  // Получаем все приборы с expiry_date <= today + 30 дней
  const expiringEquipment = await db
    .select({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      expiryDate: equipment.expiryDate,
      certificateNumber: equipment.certificateNumber,
      verificationTypeId: equipment.verificationTypeId,
      verificationTypeNameRu: verificationTypes.nameRu,
      verificationTypeNameUz: verificationTypes.nameUz,
      verificationTypeSortOrder: verificationTypes.sortOrder,
    })
    .from(equipment)
    .innerJoin(
      verificationTypes,
      eq(equipment.verificationTypeId, verificationTypes.id)
    )
    .where(lte(equipment.expiryDate, maxDate))
    .orderBy(verificationTypes.sortOrder, equipment.expiryDate);

  if (expiringEquipment.length === 0) {
    return NextResponse.json({ message: 'No expiring equipment', sent: 0 });
  }

  // Получаем всех разрешённых пользователей с включёнными уведомлениями
  const allowedUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.isAllowed, true),
        eq(users.notificationsEnabled, true)
      )
    );

  let sentCount = 0;

  for (const user of allowedUsers) {
    // Проверка: уже отправляли сегодня?
    const alreadySent = await db
      .select()
      .from(sentNotifications)
      .where(
        and(
          eq(sentNotifications.telegramId, user.telegramId),
          eq(sentNotifications.notificationDate, today)
        )
      )
      .limit(1);

    if (alreadySent.length > 0) continue;

    // Формируем сводку
    const t = user.language === 'uz' ? uzMessages : ruMessages;
    const message = formatDigest(expiringEquipment, today, user.language, t);

    try {
      const keyboard = new InlineKeyboard().webApp(
        t.notifications.openApp,
        appUrl
      );

      await bot.api.sendMessage(user.telegramId, message, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      // Записываем отправку
      await db.insert(sentNotifications).values({
        telegramId: user.telegramId,
        notificationDate: today,
      });

      sentCount++;
    } catch (error) {
      console.error(`Failed to send to ${user.telegramId}:`, error);
    }
  }

  return NextResponse.json({
    message: `Notifications sent`,
    sent: sentCount,
    equipmentCount: expiringEquipment.length,
  });
}

interface EquipmentItem {
  equipmentName: string;
  expiryDate: string;
  certificateNumber: string | null;
  verificationTypeNameRu: string;
  verificationTypeNameUz: string;
  verificationTypeSortOrder: number;
}

function formatDigest(
  items: EquipmentItem[],
  today: string,
  language: string,
  t: typeof ruMessages
): string {
  const todayDate = new Date(today);
  const lines: string[] = [t.notifications.digestTitle, ''];

  // Группировка по типу проверки
  const grouped = new Map<string, EquipmentItem[]>();
  for (const item of items) {
    const typeName = language === 'uz'
      ? item.verificationTypeNameUz
      : item.verificationTypeNameRu;
    if (!grouped.has(typeName)) {
      grouped.set(typeName, []);
    }
    grouped.get(typeName)!.push(item);
  }

  for (const [typeName, typeItems] of grouped) {
    lines.push(`<b>${typeName}:</b>`);

    for (const item of typeItems) {
      const expiryDate = new Date(item.expiryDate);
      const diffTime = expiryDate.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let emoji: string;
      let status: string;

      if (diffDays < 0) {
        emoji = '🔴';
        status = language === 'uz'
          ? `${Math.abs(diffDays)} kunga muddati o'tgan`
          : `просрочен на ${Math.abs(diffDays)} дн.`;
      } else if (diffDays === 0) {
        emoji = '🔴';
        status = language === 'uz' ? 'bugun muddati tugaydi' : 'истекает сегодня';
      } else if (diffDays <= 7) {
        emoji = '🔴';
        status = language === 'uz'
          ? `${diffDays} kun qoldi`
          : `осталось ${diffDays} дн.`;
      } else if (diffDays <= 30) {
        emoji = '🟡';
        status = language === 'uz'
          ? `${diffDays} kun qoldi`
          : `осталось ${diffDays} дн.`;
      } else {
        emoji = '🟢';
        status = language === 'uz'
          ? `${diffDays} kun qoldi`
          : `осталось ${diffDays} дн.`;
      }

      lines.push(`${emoji} ${item.equipmentName} — ${status}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}
