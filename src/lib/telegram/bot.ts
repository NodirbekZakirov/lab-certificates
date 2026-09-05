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

  bot.command('users', async (ctx) => {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const from = ctx.from;
    if (!from) return;

    // Сначала проверяем, является ли отправитель админом
    const sender = (
      await db
        .select()
        .from(users)
        .where(eq(users.telegramId, from.id))
        .limit(1)
    )[0];

    if (!sender || !sender.isAllowed || sender.role !== 'admin') {
      await ctx.reply('У вас нет прав администратора для использования этой команды.');
      return;
    }

    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      await ctx.reply('Список пользователей пуст.');
      return;
    }

    await ctx.reply('Список пользователей (нажмите на кнопку для управления):');

    for (const user of allUsers) {
      const name = user.firstName || user.username || String(user.telegramId);
      const status = user.isAllowed ? '✅ Доступ открыт' : '⛔️ Доступ закрыт';
      const role = user.role === 'admin' ? '👑 Админ' : '👤 Зритель';

      const keyboard = new InlineKeyboard()
        .text(user.isAllowed ? 'Закрыть доступ' : 'Открыть доступ', `toggle_access:${user.telegramId}`).row()
        .text(user.role === 'admin' ? 'Сделать зрителем' : 'Сделать админом', `toggle_role:${user.telegramId}`);

      await ctx.reply(`<b>${name}</b> (ID: ${user.telegramId})\n${status}\n${role}`, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    }
  });

  bot.on('callback_query:data', async (ctx) => {
    const { db } = await import('@/lib/db');
    const { users } = await import('@/lib/db/schema');
    const { eq } = await import('drizzle-orm');

    const from = ctx.from;
    const data = ctx.callbackQuery.data;

    // Сначала проверяем, является ли отправитель админом
    const sender = (
      await db
        .select()
        .from(users)
        .where(eq(users.telegramId, from.id))
        .limit(1)
    )[0];

    if (!sender || !sender.isAllowed || sender.role !== 'admin') {
      await ctx.answerCallbackQuery({ text: 'У вас нет прав.', show_alert: true });
      return;
    }

    if (data.startsWith('toggle_access:')) {
      const targetId = parseInt(data.split(':')[1]);
      if (targetId === from.id) {
        await ctx.answerCallbackQuery({ text: 'Вы не можете закрыть доступ самому себе.', show_alert: true });
        return;
      }

      const target = (await db.select().from(users).where(eq(users.telegramId, targetId)).limit(1))[0];
      if (target) {
        const newStatus = !target.isAllowed;
        await db.update(users).set({ isAllowed: newStatus }).where(eq(users.telegramId, targetId));
        await ctx.answerCallbackQuery({ text: `Доступ ${newStatus ? 'открыт' : 'закрыт'}` });
        
        // Обновляем сообщение
        const name = target.firstName || target.username || String(target.telegramId);
        const status = newStatus ? '✅ Доступ открыт' : '⛔️ Доступ закрыт';
        const role = target.role === 'admin' ? '👑 Админ' : '👤 Зритель';
        const keyboard = new InlineKeyboard()
          .text(newStatus ? 'Закрыть доступ' : 'Открыть доступ', `toggle_access:${target.telegramId}`).row()
          .text(target.role === 'admin' ? 'Сделать зрителем' : 'Сделать админом', `toggle_role:${target.telegramId}`);
        
        await ctx.editMessageText(`<b>${name}</b> (ID: ${target.telegramId})\n${status}\n${role}`, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
      }
    } else if (data.startsWith('toggle_role:')) {
      const targetId = parseInt(data.split(':')[1]);
      if (targetId === from.id) {
        await ctx.answerCallbackQuery({ text: 'Вы не можете изменить роль самому себе.', show_alert: true });
        return;
      }

      const target = (await db.select().from(users).where(eq(users.telegramId, targetId)).limit(1))[0];
      if (target) {
        const newRole = target.role === 'admin' ? 'viewer' : 'admin';
        await db.update(users).set({ role: newRole }).where(eq(users.telegramId, targetId));
        await ctx.answerCallbackQuery({ text: `Роль изменена на ${newRole === 'admin' ? 'Админ' : 'Зритель'}` });
        
        // Обновляем сообщение
        const name = target.firstName || target.username || String(target.telegramId);
        const status = target.isAllowed ? '✅ Доступ открыт' : '⛔️ Доступ закрыт';
        const role = newRole === 'admin' ? '👑 Админ' : '👤 Зритель';
        const keyboard = new InlineKeyboard()
          .text(target.isAllowed ? 'Закрыть доступ' : 'Открыть доступ', `toggle_access:${target.telegramId}`).row()
          .text(newRole === 'admin' ? 'Сделать зрителем' : 'Сделать админом', `toggle_role:${target.telegramId}`);
        
        await ctx.editMessageText(`<b>${name}</b> (ID: ${target.telegramId})\n${status}\n${role}`, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
      }
    }
  });
}
