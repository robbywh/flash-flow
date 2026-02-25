import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlashSaleService } from './flash-sale.service';
import {
  MockFlashSaleStorage,
  MockFlashSaleRedisStorage,
} from './flash-sale.storage.mock';
import type { FlashSaleRecord } from './flash-sale.storage';
import {
  SaleNotFoundError,
  SaleNotActiveError,
  SoldOutError,
  AlreadyPurchasedError,
  FlashSaleError,
} from './flash-sale.errors';

function createActiveSale(
  overrides: Partial<FlashSaleRecord> = {},
): FlashSaleRecord {
  const now = new Date();
  return {
    id: 'sale-1',
    productName: 'Test Widget',
    totalStock: 10,
    remainingStock: 10,
    startTime: new Date(now.getTime() - 60_000),
    endTime: new Date(now.getTime() + 60_000),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('FlashSaleService', () => {
  let service: FlashSaleService;
  let storage: MockFlashSaleStorage;
  let redisStorage: MockFlashSaleRedisStorage;

  beforeEach(() => {
    storage = new MockFlashSaleStorage();
    redisStorage = new MockFlashSaleRedisStorage();
    service = new FlashSaleService(storage, redisStorage);
  });

  describe('getCurrentSale', () => {
    it('should return the current sale with computed status', async () => {
      storage.sales.push(createActiveSale());
      const result = await service.getCurrentSale();
      expect(result.id).toBe('sale-1');
      expect(result.status).toBe('active');
      expect(result.remainingStock).toBe(10);
    });

    it('should throw SaleNotFoundError when no sale exists', async () => {
      await expect(service.getCurrentSale()).rejects.toThrow(SaleNotFoundError);
    });

    it('should use Redis stock when available', async () => {
      storage.sales.push(createActiveSale());
      await redisStorage.initializeStock('sale-1', 5);
      const result = await service.getCurrentSale();
      expect(result.remainingStock).toBe(5);
    });

    it('should initialize Redis stock from DB when Redis is empty', async () => {
      storage.sales.push(createActiveSale({ remainingStock: 7 }));
      await service.getCurrentSale();
      const redisStock = await redisStorage.getStock('sale-1');
      expect(redisStock).toBe(7);
    });
  });

  describe('attemptPurchase', () => {
    it('should successfully purchase when sale is active and stock available', async () => {
      storage.sales.push(createActiveSale());
      const result = await service.attemptPurchase('user@example.com');
      expect(result.status).toBe('confirmed');
      expect(result.userId).toBe('user@example.com');
      expect(result.productName).toBe('Test Widget');
    });

    it('should throw SaleNotFoundError when no sale', async () => {
      await expect(service.attemptPurchase('user@example.com')).rejects.toThrow(
        SaleNotFoundError,
      );
    });

    it('should throw SaleNotActiveError when sale is upcoming', async () => {
      storage.sales.push(
        createActiveSale({
          startTime: new Date(Date.now() + 60_000),
          endTime: new Date(Date.now() + 120_000),
        }),
      );
      await expect(service.attemptPurchase('user@example.com')).rejects.toThrow(
        SaleNotActiveError,
      );
    });

    it('should throw AlreadyPurchasedError on duplicate purchase', async () => {
      storage.sales.push(createActiveSale());
      await service.attemptPurchase('user@example.com');
      await expect(service.attemptPurchase('user@example.com')).rejects.toThrow(
        AlreadyPurchasedError,
      );
    });

    it('should throw SoldOutError when stock is exhausted', async () => {
      storage.sales.push(createActiveSale({ remainingStock: 1 }));
      await service.attemptPurchase('user1@example.com');
      await expect(
        service.attemptPurchase('user2@example.com'),
      ).rejects.toThrow(SoldOutError);
    });

    it('should throw validation error for empty userId', async () => {
      storage.sales.push(createActiveSale());
      await expect(service.attemptPurchase('')).rejects.toThrow(FlashSaleError);
    });

    it('should throw validation error for short userId', async () => {
      storage.sales.push(createActiveSale());
      await expect(service.attemptPurchase('ab')).rejects.toThrow(
        FlashSaleError,
      );
    });

    it('should decrement stock for each purchase', async () => {
      storage.sales.push(createActiveSale({ remainingStock: 3 }));
      await service.attemptPurchase('user1@test.com');
      await service.attemptPurchase('user2@test.com');
      await service.attemptPurchase('user3@test.com');
      const sale = await service.getCurrentSale();
      expect(sale.remainingStock).toBe(0);
    });
  });

  describe('checkUserPurchase', () => {
    it('should return purchased: true when user has purchased', async () => {
      storage.sales.push(createActiveSale());
      await service.attemptPurchase('user@example.com');
      const result = await service.checkUserPurchase('user@example.com');
      expect(result.purchased).toBe(true);
      expect(result.purchaseId).toBeDefined();
    });

    it('should return purchased: false when user has not purchased', async () => {
      storage.sales.push(createActiveSale());
      const result = await service.checkUserPurchase('user@example.com');
      expect(result.purchased).toBe(false);
    });

    it('should throw SaleNotFoundError when no sale', async () => {
      await expect(
        service.checkUserPurchase('user@example.com'),
      ).rejects.toThrow(SaleNotFoundError);
    });

    it('should throw validation error for invalid userId', async () => {
      storage.sales.push(createActiveSale());
      await expect(service.checkUserPurchase('')).rejects.toThrow(
        FlashSaleError,
      );
    });
  });

  describe('attemptPurchase error handling', () => {
    it('should increment stock back in Redis if storage.createPurchase fails', async () => {
      storage.sales.push(createActiveSale());
      // Mock createPurchase to fail
      vi.spyOn(storage, 'createPurchase').mockRejectedValue(new Error('DB_FAIL'));
      const redisSpy = vi.spyOn(redisStorage, 'incrementStock');

      await expect(
        service.attemptPurchase('user@example.com'),
      ).rejects.toThrow('DB_FAIL');
      expect(redisSpy).toHaveBeenCalledWith('sale-1');
    });

    it('should map unknown string errors to generic Error', async () => {
      storage.sales.push(createActiveSale());
      vi.spyOn(storage, 'createPurchase').mockRejectedValue('STRING_ERROR');

      await expect(
        service.attemptPurchase('user@example.com'),
      ).rejects.toBe('STRING_ERROR');
    });

    it('should properly log and re-throw unhandled errors', async () => {
      storage.sales.push(createActiveSale());
      const genericError = new Error('UNHANDLED');
      vi.spyOn(storage, 'createPurchase').mockRejectedValue(genericError);

      await expect(
        service.attemptPurchase('user@example.com'),
      ).rejects.toThrow(genericError);
    });

    it('should throw AlreadyPurchasedError if storage returns ALREADY_PURCHASED string', async () => {
      storage.sales.push(createActiveSale());
      vi.spyOn(storage, 'createPurchase').mockRejectedValue(new Error('ALREADY_PURCHASED'));

      await expect(
        service.attemptPurchase('user@example.com'),
      ).rejects.toThrow(AlreadyPurchasedError);
    });

    it('should throw SoldOutError if storage returns SOLD_OUT string', async () => {
      storage.sales.push(createActiveSale());
      vi.spyOn(storage, 'createPurchase').mockRejectedValue(new Error('SOLD_OUT'));

      await expect(
        service.attemptPurchase('user@example.com'),
      ).rejects.toThrow(SoldOutError);
    });
  });
});
