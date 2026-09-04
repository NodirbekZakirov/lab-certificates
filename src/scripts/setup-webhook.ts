import 'dotenv/config';

/**
 * Скрипт для настройки вебхука Telegram-бота.
 *
 * Запуск: npm run setup:webhook
 *
 * Перед запуском убедитесь, что в .env.local заданы:
 *   TELEGRAM_BOT_TOKEN
 *   TELEGRAM_WEBHOOK_SECRET
 *   NEXT_PUBLIC_APP_URL
 */
async function setupWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!botToken || !webhookSecret || !appUrl) {
    console.error('❌ Missing environment variables:');
    if (!botToken) console.error('   - TELEGRAM_BOT_TOKEN');
    if (!webhookSecret) console.error('   - TELEGRAM_WEBHOOK_SECRET');
    if (!appUrl) console.error('   - NEXT_PUBLIC_APP_URL');
    process.exit(1);
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  console.log(`🔗 Setting webhook to: ${webhookUrl}`);

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/setWebhook`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: webhookSecret,
        allowed_updates: ['message', 'callback_query'],
      }),
    }
  );

  const result = await response.json();

  if (result.ok) {
    console.log('✅ Webhook set successfully!');
    console.log(`   URL: ${webhookUrl}`);
  } else {
    console.error('❌ Failed to set webhook:', result);
  }

  // Также получим информацию о боте
  const meResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getMe`
  );
  const meResult = await meResponse.json();

  if (meResult.ok) {
    console.log(`\n🤖 Bot info:`);
    console.log(`   Username: @${meResult.result.username}`);
    console.log(`   Name: ${meResult.result.first_name}`);
  }

  // Установим команды бота
  const commandsResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/setMyCommands`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          {
            command: 'start',
            description: 'Запустить бота / Botni ishga tushirish',
          },
        ],
      }),
    }
  );

  const commandsResult = await commandsResponse.json();
  if (commandsResult.ok) {
    console.log('✅ Bot commands set successfully!');
  }

  // Установим menu button (Web App button)
  const menuResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/setChatMenuButton`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: '📱 Приложение',
          web_app: {
            url: appUrl,
          },
        },
      }),
    }
  );

  const menuResult = await menuResponse.json();
  if (menuResult.ok) {
    console.log('✅ Menu button set successfully!');
    console.log(`   Web App URL: ${appUrl}`);
  } else {
    console.error('❌ Failed to set menu button:', menuResult);
  }
}

setupWebhook().catch(console.error);
