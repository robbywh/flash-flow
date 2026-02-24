/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../platform/database/database.module';
import { RedisModule, REDIS_CLIENT } from '../../platform/redis/redis.module';
import { FlashSaleModule } from './flash-sale.module';
import { PrismaService } from '../../platform/database/prisma.service';
import type { App } from 'supertest/types';
import Redis from 'ioredis';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('FlashSale E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redisClient: Redis;
  let pgContainer: StartedPostgreSqlContainer;
  let redisContainer: StartedRedisContainer;

  // 120s timeout for downloading images on first run
  beforeAll(async () => {
    // 1. Start Testcontainers
    pgContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('flash_flow_test')
      .withUsername('test')
      .withPassword('test')
      .start();

    redisContainer = await new RedisContainer('redis:7-alpine').start();

    const databaseUrl = pgContainer.getConnectionUri();
    const redisHost = redisContainer.getHost();
    const redisPort = redisContainer.getPort().toString();

    // 2. Push Prisma schema to the new ephemeral DB
    await execAsync(`npx prisma db push --url="${databaseUrl}"`);

    // 3. Build NestJS App with overridden config
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true, // Don't use .env
          load: [
            () => ({
              DATABASE_URL: databaseUrl,
              REDIS_HOST: redisHost,
              REDIS_PORT: redisPort,
            }),
          ],
        }),
        DatabaseModule,
        RedisModule,
        FlashSaleModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    redisClient = app.get(REDIS_CLIENT);
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await pgContainer.stop();
    await redisContainer.stop();
  });

  beforeEach(async () => {
    // Clean up DB and Redis before each test
    await prisma.purchase.deleteMany();
    await prisma.flashSale.deleteMany();

    // Flush all Redis keys related to flash sales
    const keys = await redisClient.keys('flash_sale:*');
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  });

  async function createTestSale(overrides: Record<string, unknown> = {}) {
    const now = new Date();
    return prisma.flashSale.create({
      data: {
        productName: 'Test Product',
        totalStock: 10,
        remainingStock: 10,
        startTime: new Date(now.getTime() - 60_000),
        endTime: new Date(now.getTime() + 60_000),
        ...overrides,
      },
    });
  }

  describe('GET /api/v1/flash-sales/current', () => {
    it('should return 404 when no sale exists', async () => {
      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body.status).toBe('error');
      expect(res.body.error.code).toBe('SALE_NOT_FOUND');
    });

    it('should return the current active sale', async () => {
      await createTestSale();

      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current')
        .expect(HttpStatus.OK);

      expect(res.body.data.productName).toBe('Test Product');
      expect(res.body.data.status).toBe('active');
      expect(res.body.data.totalStock).toBe(10);
      expect(res.body.data.remainingStock).toBe(10);
    });

    it('should return upcoming status for future sale', async () => {
      const future = new Date(Date.now() + 60_000);
      await createTestSale({
        startTime: future,
        endTime: new Date(future.getTime() + 60_000),
      });

      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current')
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe('upcoming');
    });

    it('should return ended status for past sale', async () => {
      const past = new Date(Date.now() - 120_000);
      await createTestSale({
        startTime: past,
        endTime: new Date(past.getTime() + 60_000),
      });

      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current')
        .expect(HttpStatus.OK);

      expect(res.body.data.status).toBe('ended');
    });
  });

  describe('POST /api/v1/flash-sales/current/purchase', () => {
    it('should successfully purchase when sale is active', async () => {
      await createTestSale();

      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'e2e-user@test.com' })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.status).toBe('confirmed');
      expect(res.body.data.userId).toBe('e2e-user@test.com');
      expect(res.body.data.purchaseId).toBeDefined();
    });

    it('should reject duplicate purchase from same user', async () => {
      await createTestSale();

      // First purchase
      await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'dup-user@test.com' })
        .expect(HttpStatus.CREATED);

      // Second attempt
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'dup-user@test.com' })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.error.code).toBe('ALREADY_PURCHASED');
    });

    it('should reject purchase when sale is not active', async () => {
      const future = new Date(Date.now() + 60_000);
      await createTestSale({
        startTime: future,
        endTime: new Date(future.getTime() + 60_000),
      });

      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'not-active-user@test.com' })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.error.code).toBe('SALE_NOT_ACTIVE');
    });

    it('should reject purchase when sold out', async () => {
      await createTestSale({ remainingStock: 1 });

      // First user buys last item
      await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'user1-sold-out@test.com' })
        .expect(HttpStatus.CREATED);

      // Second user should be rejected
      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'user2-sold-out@test.com' })
        .expect(HttpStatus.CONFLICT);

      expect(res.body.error.code).toBe('SOLD_OUT');
    });

    it('should reject invalid userId', async () => {
      await createTestSale();

      const res = await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: '' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should decrement stock after purchase', async () => {
      await createTestSale({ remainingStock: 5 });

      await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'buyer-stock@test.com' })
        .expect(HttpStatus.CREATED);

      // Verify stock decreased in DB
      const sale = await prisma.flashSale.findFirst();
      expect(sale!.remainingStock).toBe(4);
    });
  });

  describe('GET /api/v1/flash-sales/current/purchase', () => {
    it('should return purchased: true when user has purchased', async () => {
      await createTestSale();

      await request(app.getHttpServer() as App)
        .post('/api/v1/flash-sales/current/purchase')
        .send({ userId: 'checker@test.com' })
        .expect(HttpStatus.CREATED);

      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current/purchase?userId=checker@test.com')
        .expect(HttpStatus.OK);

      expect(res.body.data.purchased).toBe(true);
      expect(res.body.data.purchaseId).toBeDefined();
    });

    it('should return purchased: false when user has not purchased', async () => {
      await createTestSale();

      const res = await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current/purchase?userId=nobody@test.com')
        .expect(HttpStatus.OK);

      expect(res.body.data.purchased).toBe(false);
    });

    it('should reject invalid userId', async () => {
      await createTestSale();

      await request(app.getHttpServer() as App)
        .get('/api/v1/flash-sales/current/purchase?userId=')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
