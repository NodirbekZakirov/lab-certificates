import {
  pgTable,
  text,
  boolean,
  timestamp,
  date,
  integer,
  bigint,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// ─── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  telegramId: bigint('telegram_id', { mode: 'number' }).primaryKey(),
  firstName: text('first_name'),
  username: text('username'),
  language: text('language').notNull().default('ru'),
  isAllowed: boolean('is_allowed').notNull().default(false),
  role: text('role').notNull().default('viewer'), // 'admin' | 'viewer'
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Verification Types (справочник типов проверки) ─────────────────────────
export const verificationTypes = pgTable('verification_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameRu: text('name_ru').notNull(),
  nameUz: text('name_uz').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Equipment (приборы) ────────────────────────────────────────────────────
export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  verificationTypeId: uuid('verification_type_id')
    .notNull()
    .references(() => verificationTypes.id),
  certificateNumber: text('certificate_number'),
  expiryDate: date('expiry_date').notNull(),
  certificateFileUrl: text('certificate_file_url'),
  certificateFileType: text('certificate_file_type'), // 'image' | 'pdf'
  photoUrl: text('photo_url'), // Фотография самого прибора
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: bigint('updated_by', { mode: 'number' }).references(
    () => users.telegramId
  ),
});

// ─── Certificate History (архив предыдущих сертификатов) ────────────────────
export const certificateHistory = pgTable('certificate_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  equipmentId: uuid('equipment_id')
    .notNull()
    .references(() => equipment.id),
  oldCertificateNumber: text('old_certificate_number'),
  oldExpiryDate: date('old_expiry_date'),
  oldCertificateFileUrl: text('old_certificate_file_url'),
  replacedAt: timestamp('replaced_at').notNull().defaultNow(),
  replacedBy: bigint('replaced_by', { mode: 'number' })
    .notNull()
    .references(() => users.telegramId),
});

// ─── Sent Notifications (защита от повторной отправки) ──────────────────────
export const sentNotifications = pgTable(
  'sent_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    telegramId: bigint('telegram_id', { mode: 'number' })
      .notNull()
      .references(() => users.telegramId),
    notificationDate: date('notification_date').notNull(),
  },
  (table) => [
    uniqueIndex('unique_notification_per_day').on(
      table.telegramId,
      table.notificationDate
    ),
  ]
);

// ─── Audit Log (Журнал действий) ────────────────────────────────────────────
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramId: bigint('telegram_id', { mode: 'number' })
    .notNull()
    .references(() => users.telegramId),
  action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  entityType: text('entity_type').notNull(), // 'equipment', 'verification_type', 'user'
  entityId: text('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  details: text('details'), // JSON string with details of changes
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
