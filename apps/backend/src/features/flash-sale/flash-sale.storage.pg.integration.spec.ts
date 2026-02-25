import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FlashSaleStoragePg } from './flash-sale.storage.pg';
import { DatabaseModule } from '../../platform/database/database.module';
import { PrismaService } from '../../platform/database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('FlashSaleStoragePg Integration', () => {
    let prisma: PrismaService;
    let storage: FlashSaleStoragePg;
    let pgContainer: StartedPostgreSqlContainer;
    let module: TestingModule;

    beforeAll(async () => {
        pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
            .withDatabase('flash_flow_storage_test')
            .withUsername('test')
            .withPassword('test')
            .start();

        const databaseUrl = pgContainer.getConnectionUri();
        await execAsync(`npx prisma db push --url="${databaseUrl}"`);

        module = await Test.createTestingModule({
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                    load: [() => ({ DATABASE_URL: databaseUrl })],
                }),
                DatabaseModule,
            ],
            providers: [FlashSaleStoragePg],
        }).compile();

        prisma = module.get(PrismaService);
        storage = module.get(FlashSaleStoragePg);
    }, 60_000);

    afterAll(async () => {
        if (module) await module.close();
        if (pgContainer) await pgContainer.stop();
    });

    beforeEach(async () => {
        await prisma.purchase.deleteMany();
        await prisma.flashSale.deleteMany();
    });

    it('should throw ALREADY_PURCHASED if user tries to buy twice in same transaction bypass', async () => {
        const sale = await prisma.flashSale.create({
            data: {
                productName: 'Integration Test',
                totalStock: 10,
                remainingStock: 10,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600_000),
            },
        });

        await storage.createPurchase(sale.id, 'user1');

        // This direct call skips service-level checks, hitting the storage check
        await expect(storage.createPurchase(sale.id, 'user1')).rejects.toThrow('ALREADY_PURCHASED');
    });

    it('should throw SOLD_OUT if stock is 0 in DB', async () => {
        const sale = await prisma.flashSale.create({
            data: {
                productName: 'Sold Out Integration',
                totalStock: 10,
                remainingStock: 0,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600_000),
            },
        });

        await expect(storage.createPurchase(sale.id, 'user1')).rejects.toThrow('SOLD_OUT');
    });

    it('should throw SOLD_OUT if another transaction steals the last item', async () => {
        const sale = await prisma.flashSale.create({
            data: {
                productName: 'Race Integration',
                totalStock: 1,
                remainingStock: 1,
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600_000),
            },
        });

        // First one succeeds
        await storage.createPurchase(sale.id, 'user1');

        // Second one should fail with SOLD_OUT because remainingStock is now 0
        await expect(storage.createPurchase(sale.id, 'user2')).rejects.toThrow('SOLD_OUT');
    });
});
