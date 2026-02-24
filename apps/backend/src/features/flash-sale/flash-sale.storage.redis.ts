import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../platform/redis/redis.module';
import type { FlashSaleRedisStorage } from './flash-sale.storage';

const STOCK_KEY_PREFIX = 'flash_sale:stock:';

@Injectable()
export class FlashSaleStorageRedis implements FlashSaleRedisStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getStock(flashSaleId: string): Promise<number | null> {
    const value = await this.redis.get(`${STOCK_KEY_PREFIX}${flashSaleId}`);
    return value !== null ? parseInt(value, 10) : null;
  }

  async initializeStock(flashSaleId: string, stock: number): Promise<void> {
    await this.redis.set(`${STOCK_KEY_PREFIX}${flashSaleId}`, stock);
  }

  async decrementStock(flashSaleId: string): Promise<number> {
    return this.redis.decr(`${STOCK_KEY_PREFIX}${flashSaleId}`);
  }

  async incrementStock(flashSaleId: string): Promise<void> {
    await this.redis.incr(`${STOCK_KEY_PREFIX}${flashSaleId}`);
  }
}
