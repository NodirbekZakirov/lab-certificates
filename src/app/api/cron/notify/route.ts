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
  const debugInfo: any = {
    allowedUsersCount: allowedUsers.length,
    users: [],
  };

  for (const user of allowedUsers) {
    const userDebug: any = { telegramId: user.telegramId };
    debugInfo.users.push(userDebug);

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

    userDebug.alreadySent = alreadySent.length > 0;

    if (!isTest && alreadySent.length > 0) {
      continue;
    }

    // Формируем сводку (может быть разбита на несколько частей)
    const t = user.language === 'uz' ? uzMessages : ruMessages;
    const chunks = formatDigest(expiringEquipment, today, user.language, t);

    try {
      const keyboard = new InlineKeyboard().webApp(
        t.notifications.openApp,
        appUrl
      );

      // Отправляем сообщения по частям
      for (let i = 0; i < chunks.length; i++) {
        const options: any = { parse_mode: 'HTML' };
        // Добавляем кнопку "Открыть приложение" только к последнему сообщению
        if (i === chunks.length - 1) {
          options.reply_markup = keyboard;
        }

        await bot.api.sendMessage(user.telegramId, chunks[i], options);
      }

      userDebug.success = true;

      // Записываем отправку только если не тест или уже не было отправлено
      if (alreadySent.length === 0) {
        await db.insert(sentNotifications).values({
          telegramId: user.telegramId,
          notificationDate: today,
        });
      }

      sentCount++;
    } catch (error: any) {
      userDebug.error = error.message || String(error);
      console.error(`Failed to send to ${user.telegramId}:`, error);
    }
  }

  return NextResponse.json({
    message: `Notifications sent`,
    sent: sentCount,
    equipmentCount: expiringEquipment.length,
    debug: debugInfo,
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
): string[] {
  const todayDate = new Date(today);
  const chunks: string[] = [];
  let currentChunk = `${t.notifications.digestTitle}\n\n`;

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
    let typeBlock = `<b>${typeName}:</b>\n`;

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

      const line = `${emoji} ${item.equipmentName} — ${status}\n`;

      if (currentChunk.length + typeBlock.length + line.length > 3500) {
        chunks.push(currentChunk.trim());
        currentChunk = typeBlock + line;
        typeBlock = '';
      } else {
        typeBlock += line;
      }
    }

    currentChunk += typeBlock + '\n';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
