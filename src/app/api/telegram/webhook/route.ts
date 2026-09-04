import { NextRequest, NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { bot, setupBotHandlers } from '@/lib/telegram/bot';

// Инициализируем обработчики бота один раз
const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
setupBotHandlers(appUrl);

const handleUpdate = webhookCallback(bot, 'std/http');

export async function POST(request: NextRequest) {
  // Проверяем секрет вебхука
  const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret || secretToken !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    return await handleUpdate(request);
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
