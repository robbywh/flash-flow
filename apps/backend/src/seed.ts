/**
 * Seed script — creates a flash sale for local development.
 *
 * Usage: npm run seed
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from 'dotenv';

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('✅ Connecting to database...');

  const now = new Date();
  const endTime = new Date(now.getTime() + 30 * 60 * 1000);

  const existing = await prisma.flashSale.findFirst({
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    await prisma.flashSale.update({
      where: { id: existing.id },
      data: {
        startTime: now,
        endTime: endTime,
        remainingStock: existing.totalStock,
      },
    });
    console.log(
      `🔄 Updated existing sale to be active now (ends ${endTime.toLocaleTimeString()})`,
    );
  } else {
    await prisma.flashSale.create({
      data: {
        productName: 'Limited Edition Mechanical Keyboard',
        totalStock: 100,
        remainingStock: 100,
        startTime: now,
        endTime: endTime,
      },
    });
    console.log(
      '🎉 Created flash sale: "Limited Edition Mechanical Keyboard" (100 units)',
    );
    console.log(`⏰ Active from NOW until ${endTime.toLocaleTimeString()}`);
  }

  await prisma.$disconnect();
  await pool.end();
  console.log('✅ Seed complete');
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
