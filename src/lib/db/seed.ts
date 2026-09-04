import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Seed script — загружает начальные данные в БД:
 * - 3 типа проверки (Поверка, Калибровка, Аттестация)
 * - 70 приборов из DOCX-файлов лаборатории
 * - Пользователи из INITIAL_ALLOWED_TELEGRAM_IDS
 *
 * Запуск: npx tsx src/lib/db/seed.ts
 */
async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log('🌱 Seeding database...');

  // ─── 1. Типы проверки ──────────────────────────────────────────────────────
  const [poverka, kalibrovka, attestatsiya] = await db
    .insert(schema.verificationTypes)
    .values([
      { nameRu: 'Поверка', nameUz: 'Qiyoslash', sortOrder: 1 },
      { nameRu: 'Калибровка', nameUz: 'Kalibrovka', sortOrder: 2 },
      { nameRu: 'Аттестация', nameUz: 'Attestatsiya', sortOrder: 3 },
    ])
    .returning();

  console.log('✅ Verification types created');

  // ─── 2. Оборудование: Поверка (файл 1) ────────────────────────────────────
  const poverkaEquipment = [
    { name: 'Весоизмерительное устройство неавтоматического действия', expiry: '2025-08-22' },
    { name: 'Весы CAUX(120) сер D303700150', expiry: '2025-08-22' },
    { name: 'UV-1900i сер А12536051958', expiry: '2025-08-20' },
    { name: 'Весы ME-204A сер 10722116441', expiry: '2025-08-22' },
    { name: 'Весы ME-410 сер 2384222Z3', expiry: '2025-08-22' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой ser:YE23BBH0005229', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой Ser: YE241BJ0000015', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой Ser: YM23ABA0021953', expiry: '2025-08-25' },
    { name: 'Термометр жидкостной стеклянный ТЛ-2 Ser: 644', expiry: '2025-08-27' },
    { name: 'Термометр жидкостной стеклянный ТЛ-2 Ser: 221', expiry: '2025-08-27' },
    { name: 'Термометр сопротивления с цифровой индикацией DMT-427 Ser: 220765528', expiry: '2025-08-27' },
    { name: 'Термостат жидкостный (Водяная баня) DK-98-IIA Ser: SL-002', expiry: '2025-08-20' },
    { name: 'Цифровой термогигрометр HTC-2 ser:1', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:2', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:3', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:4', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:5', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:6', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:7', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:9', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:8', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:10', expiry: '2025-08-15' },
    { name: 'Кондуктометр FiveEasy F30 Ser:140682593', expiry: '2025-08-27' },
    { name: 'pH-метр FiveEasy F20 С235727511', expiry: '2025-08-27' },
    { name: 'Гемотологик контрол "BK-6190" 0800508190669', expiry: '2025-08-26' },
    { name: '"Humalyzer Primus" biokimyoviy analizator №602828', expiry: '2025-08-26' },
    { name: 'IPP 110 turdagi incubator V419-0418', expiry: '2025-08-25' },
    { name: 'CB 56 turdagi CO2 Inkubator 20230000012753', expiry: '2025-08-25' },
    { name: 'Agilent 1260 Infinity 2 №DEAE304172', expiry: '2025-08-25' },
  ];

  await db.insert(schema.equipment).values(
    poverkaEquipment.map((e) => ({
      name: e.name,
      verificationTypeId: poverka.id,
      expiryDate: e.expiry,
    }))
  );
  console.log(`✅ ${poverkaEquipment.length} items seeded for Поверка`);

  // ─── 3. Оборудование: Калибровка (файл 2) ─────────────────────────────────
  const kalibrovkaEquipment = [
    { name: 'Весоизмерительное устройство неавтоматического действия', cert: 'UZ-04/350-2025', expiry: '2025-08-22' },
    { name: 'Весы CAUX(120) сер D303700150', cert: 'UZ-04/352-2025', expiry: '2025-08-22' },
    { name: 'UV-1900i сер А12536051958', cert: 'UZ-09/550-2025', expiry: '2025-08-20' },
    { name: 'Весы ME-204A сер 10722116441', cert: 'UZ-04/349-2025', expiry: '2025-08-22' },
    { name: 'Весы ME-410 сер 2384222Z3', cert: 'UZ-04/351-2025', expiry: '2025-08-22' },
    { name: 'Колба мерная 10 ml', cert: 'UZ-06/2035-2025', expiry: '2025-08-20' },
    { name: 'Колба мерная 20 ml', cert: 'UZ-06/2036-2025', expiry: '2025-08-20' },
    { name: 'Колба мерная 25 ml', cert: 'UZ-06/2037-2025', expiry: '2025-08-20' },
    { name: 'Колба мерная 50 ml', cert: 'UZ-06/2038-2025', expiry: '2025-08-20' },
    { name: 'Колба мерная 100 ml', cert: 'UZ-06/2039-2025', expiry: '2025-08-20' },
    { name: 'Колба мерная 250 ml', cert: 'UZ-06/2040-2025', expiry: '2025-08-20' },
    { name: 'Набор гирь', cert: 'UZ-14/623-2025', expiry: '2025-08-25' },
    { name: 'Пипетка градуированная 1 ml', cert: 'UZ-06/2046-2025', expiry: '2025-08-20' },
    { name: 'Пипетка градуированная 2 ml', cert: 'UZ-06/2047-2025', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой ser:YE23BBH0005229', cert: 'UZ-14/627-2025', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой Ser: YE241BJ0000015', cert: 'UZ-14/624-2025', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой Ser: YM23ABA0021953', cert: 'UZ-14/626-2025', expiry: '2025-08-25' },
    { name: 'Поршневая пипетка-дозатор с воздушной подушкой Ser: YM239BA0017406', cert: 'UZ-14/625-2025', expiry: '2025-08-25' },
    { name: 'Термометр жидкостной стеклянный ТЛ-2 Ser: 644', cert: 'Uz-09T/1500-2025', expiry: '2025-08-25' },
    { name: 'Термометр жидкостной стеклянный ТЛ-2 Ser: 221', cert: 'Uz-09T/1499-2025', expiry: '2025-08-27' },
    { name: 'Термометр сопротивления с цифровой индикацией DMT-427 Ser: 220765528', cert: 'UZ-09T/1501-2025', expiry: '2025-08-27' },
    { name: 'Цилиндр мерный "1-100-1" класс цена деления 1,00 ml Ser: № 469', cert: 'UZ-06/2044-2025', expiry: '2025-08-20' },
    { name: 'Цилиндр мерный "2-25-1" класс цена деления 0,50 ml Ser: № 471', cert: 'UZ-06/2042-2025', expiry: '2025-08-20' },
    { name: 'Цилиндр мерный "2-50-1" класс цена деления 1,00 ml Ser: № 470', cert: 'UZ-06/2043-2025', expiry: '2025-08-20' },
    { name: 'Цилиндр мерный 1-250-1" класс цена деления 2,00 ml Ser: № 468', cert: 'UZ-06/2045-2025', expiry: '2025-08-20' },
    { name: 'Цифровой термогигрометр HTC-2 ser:1', cert: 'UZ-09T/1487-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:2', cert: 'UZ-09T/1488-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:3', cert: 'UZ-09T/1489-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:4', cert: 'UZ-09T/1490-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:5', cert: 'UZ-09T/1491-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:6', cert: 'UZ-09T/1492-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:7', cert: 'UZ-09T/1493-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:9', cert: 'UZ-09T/1495-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:8', cert: 'UZ-09T/1494-2025', expiry: '2025-08-15' },
    { name: 'Цифровой термогигрометр HTC-2 ser:10', cert: 'UZ-09T/1496-2025', expiry: '2025-08-15' },
    { name: 'Кондуктометр FiveEasy F30 Ser:140682593', cert: 'UZ 09/564-2025', expiry: '2025-08-27' },
    { name: 'pH-метр FiveEasy F20 С235727511', cert: 'UZ-09/565-2025', expiry: '2025-08-27' },
    { name: 'Пипетка градуированная "1-1-2-10" класс 1 цена деления 0,10 мл №472', cert: 'UZ-06/2049-2025', expiry: '2025-08-20' },
    { name: 'Пипетка градуированная "1-2-1-5" класс 1 цена деления 0,05 мл №473', cert: 'UZ-06/2048-2025', expiry: '2025-08-20' },
  ];

  await db.insert(schema.equipment).values(
    kalibrovkaEquipment.map((e) => ({
      name: e.name,
      verificationTypeId: kalibrovka.id,
      certificateNumber: e.cert,
      expiryDate: e.expiry,
    }))
  );
  console.log(`✅ ${kalibrovkaEquipment.length} items seeded for Калибровка`);

  // ─── 4. Оборудование: Аттестация (файл 3) ─────────────────────────────────
  const attestatsiyaEquipment = [
    { name: 'IPP 110 turdagi incubator V419-0418', cert: '1069892-2025', expiry: '2025-08-25' },
    { name: 'CB 56 turdagi CO2 Inkubator 20230000012753', cert: '1069894-2025', expiry: '2025-08-25' },
  ];

  await db.insert(schema.equipment).values(
    attestatsiyaEquipment.map((e) => ({
      name: e.name,
      verificationTypeId: attestatsiya.id,
      certificateNumber: e.cert,
      expiryDate: e.expiry,
    }))
  );
  console.log(`✅ ${attestatsiyaEquipment.length} items seeded for Аттестация`);

  // ─── 5. Пользователи из allow-list ────────────────────────────────────────
  const allowedIds = process.env.INITIAL_ALLOWED_TELEGRAM_IDS?.split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id)) ?? [];

  if (allowedIds.length > 0) {
    await db.insert(schema.users).values(
      allowedIds.map((id) => ({
        telegramId: id,
        isAllowed: true,
      }))
    );
    console.log(`✅ ${allowedIds.length} allowed users seeded`);
  }

  console.log('🎉 Seeding complete!');
  console.log(`   Total: ${poverkaEquipment.length + kalibrovkaEquipment.length + attestatsiyaEquipment.length} equipment items`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
