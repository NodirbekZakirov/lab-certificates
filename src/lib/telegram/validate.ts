import crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  hash: string;
  queryId?: string;
  raw: string;
}

/**
 * Валидация Telegram initData по алгоритму из документации:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * 1. Сортировать все параметры кроме hash по алфавиту
 * 2. Сформировать data_check_string (key=value\n...)
 * 3. secret_key = HMAC-SHA256("WebAppData", bot_token)
 * 4. hash = HMAC-SHA256(secret_key, data_check_string)
 * 5. Сравнить с переданным hash
 */
export function validateInitData(initData: string, botToken: string): ValidatedInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) return null;

    // Проверка auth_date не старше 1 часа
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 3600) return null; // данные старше 1 часа

    // Формируем data_check_string
    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') {
        dataCheckArr.push(`${key}=${value}`);
      }
    });
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Вычисляем HMAC
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) return null;

    // Парсим user
    const userStr = params.get('user');
    if (!userStr) return null;

    const user: TelegramUser = JSON.parse(decodeURIComponent(userStr));

    return {
      user,
      authDate,
      hash,
      queryId: params.get('query_id') || undefined,
      raw: initData,
    };
  } catch {
    return null;
  }
}
