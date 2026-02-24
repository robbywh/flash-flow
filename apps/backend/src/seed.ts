/**
 * Seed script — creates a flash sale for local development.
 * Clears old purchases and Redis stock so stress tests start fresh.
 *
 * Usage: npm run seed
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import Redis from 'ioredis';
import { config } from 'dotenv';

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const redisHost = process.env.REDIS_HOST ?? 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);
const redis = new Redis({ host: redisHost, port: redisPort });

async function seed() {
    console.log('✅ Connecting to database...');

    const now = new Date();
    const endTime = new Date(now.getTime() + 30 * 60 * 1000);

    // 1. Clear old purchases so stress test userIds don't collide
    const deleted = await prisma.purchase.deleteMany({});
    if (deleted.count > 0) {
        console.log(`🧹 Cleared ${deleted.count} old purchases`);
    }

    const existing = await prisma.flashSale.findFirst({
        orderBy: { createdAt: 'desc' },
    });

    if (existing) {
        // 2. Reset stock and make sale active
        await prisma.flashSale.update({
            where: { id: existing.id },
            data: {
                startTime: now,
                endTime: endTime,
                remainingStock: existing.totalStock,
            },
        });

        // 3. Clear Redis stock key so the service re-initializes from DB
        await redis.del(`flash_sale:stock:${existing.id}`);

        console.log(
            `🔄 Updated existing sale to be active now (ends ${endTime.toLocaleTimeString()})`,
        );
        console.log(`📦 Stock reset to ${existing.totalStock} units`);
    } else {
        const sale = await prisma.flashSale.create({
            data: {
                productName: 'Limited Edition Mechanical Keyboard',
                totalStock: 100,
                remainingStock: 100,
                startTime: now,
                endTime: endTime,
            },
        });
        console.log(
            `🎉 Created flash sale: "${sale.productName}" (${sale.totalStock} units)`,
        );
        console.log(`⏰ Active from NOW until ${endTime.toLocaleTimeString()}`);
    }

    await redis.quit();
    await prisma.$disconnect();
    await pool.end();
    console.log('✅ Seed complete');
}

seed().catch(async (err) => {
    console.error('❌ Seed failed:', err);
    await redis.quit();
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
});

