import { db } from './src/lib/db';
import { equipment, verificationTypes, users, sentNotifications } from './src/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const now = new Date();
  const tashkentOffset = 5 * 60; // минут
  const tashkentTime = new Date(now.getTime() + tashkentOffset * 60 * 1000);
  const today = tashkentTime.toISOString().split('T')[0]; // YYYY-MM-DD

  const thirtyDaysLater = new Date(tashkentTime);
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const maxDate = thirtyDaysLater.toISOString().split('T')[0];

  console.log('Today:', today);
  console.log('Max Date:', maxDate);

  const expiringEquipment = await db
    .select({
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      expiryDate: equipment.expiryDate,
    })
    .from(equipment)
    .innerJoin(
      verificationTypes,
      eq(equipment.verificationTypeId, verificationTypes.id)
    )
    .where(lte(equipment.expiryDate, maxDate));

  console.log('Expiring equipment count:', expiringEquipment.length);
  if (expiringEquipment.length > 0) {
    console.log(expiringEquipment);
  }

  const allowedUsers = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.isAllowed, true),
        eq(users.notificationsEnabled, true)
      )
    );

  console.log('Allowed users with notifications:', allowedUsers.length);
  if (allowedUsers.length > 0) {
    console.log(allowedUsers.map(u => ({ id: u.telegramId, name: u.firstName })));
  }

  for (const user of allowedUsers) {
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
    
    console.log(`Already sent to ${user.telegramId} today?`, alreadySent.length > 0);
  }
}

run().catch(console.error).finally(() => process.exit(0));
