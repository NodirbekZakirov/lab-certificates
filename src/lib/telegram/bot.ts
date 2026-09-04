import { Bot, InlineKeyboard } from 'grammy';

const botToken = process.env.TELEGRAM_BOT_TOKEN || '0000000000:placeholder_token_for_build';
export const bot = new Bot(botToken);

// Не инициализируем обработчики при импорте — это делается отдельно
export function setupBotHandlers(appUrl: string) {
  bot.command('start', async (ctx) => {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const from = ctx.from;
    if (!from) return;
    const telegramId = from.id;

    // Upsert пользователя
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);

    if (existing.length === 0) {
      // Проверяем, есть ли в allow-list
      const allowedIds = process.env.INITIAL_ALLOWED_TELEGRAM_IDS?.split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !isNaN(id)) ?? [];

      await db.insert(users).values({
        telegramId,
        firstName: from.first_name || null,
        username: from.username || null,
        isAllowed: allowedIds.includes(telegramId),
      });
    }

    const user = (
      await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1)
    )[0];

    // Импортируем переводы
    const ruMessages = (await import('@/lib/i18n/ru.json')).default;
    const uzMessages = (await import('@/lib/i18n/uz.json')).default;
    const t = user.language === 'uz' ? uzMessages : ruMessages;

    const keyboard = new InlineKeyboard().webApp(
      t.bot.openApp,
      appUrl
    );

    if (user.isAllowed) {
      await ctx.reply(`${t.bot.welcome}\n\n${t.bot.welcomeAllowed}`, {
        reply_markup: keyboard,
      });
    } else {
      await ctx.reply(`${t.bot.welcome}\n\n${t.bot.welcomeNotAllowed}`);
    }
  });
}
