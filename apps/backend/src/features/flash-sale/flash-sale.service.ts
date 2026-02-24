import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  FLASH_SALE_STORAGE,
  FLASH_SALE_REDIS_STORAGE,
  type FlashSaleStorage,
  type FlashSaleRedisStorage,
  type FlashSaleRecord,
} from './flash-sale.storage';
import { computeSaleStatus, validateUserId } from './flash-sale.logic';
import type {
  FlashSaleDto,
  PurchaseResultDto,
  UserPurchaseCheckDto,
} from './flash-sale.dto';
import {
  SaleNotFoundError,
  SaleNotActiveError,
  SoldOutError,
  AlreadyPurchasedError,
  FlashSaleError,
} from './flash-sale.errors';

@Injectable()
export class FlashSaleService {
  private readonly logger = new Logger(FlashSaleService.name);

  constructor(
    @Inject(FLASH_SALE_STORAGE)
    private readonly storage: FlashSaleStorage,
    @Inject(FLASH_SALE_REDIS_STORAGE)
    private readonly redisStorage: FlashSaleRedisStorage,
  ) {}

  async getCurrentSale(): Promise<FlashSaleDto> {
    const correlationId = uuidv4();
    this.logger.log({ correlationId, operation: 'getCurrentSale' });

    const sale = await this.storage.getCurrentSale();
    if (!sale) {
      throw new SaleNotFoundError();
    }

    const now = new Date();
    const status = computeSaleStatus(sale.startTime, sale.endTime, now);

    // Try Redis for fast stock read, fallback to DB
    let remainingStock = await this.redisStorage.getStock(sale.id);
    if (remainingStock === null) {
      remainingStock = sale.remainingStock;
      await this.redisStorage.initializeStock(sale.id, remainingStock);
    }

    this.logger.log({
      correlationId,
      operation: 'getCurrentSale',
      status: 'success',
      saleId: sale.id,
    });

    return this.toSaleDto(sale, status, remainingStock);
  }

  async attemptPurchase(userId: string): Promise<PurchaseResultDto> {
    const correlationId = uuidv4();
    this.logger.log({
      correlationId,
      operation: 'attemptPurchase',
      userId,
    });

    // 1. Validate input
    const validation = validateUserId(userId);
    if (!validation.valid) {
      throw new FlashSaleError(
        'VALIDATION_ERROR',
        validation.errors.join(' '),
        400,
      );
    }

    // 2. Get sale and check status
    const sale = await this.storage.getCurrentSale();
    if (!sale) throw new SaleNotFoundError();

    const now = new Date();
    const status = computeSaleStatus(sale.startTime, sale.endTime, now);

    if (status !== 'active') {
      throw new SaleNotActiveError(status);
    }

    // 3. Check existing purchase
    const existingPurchase = await this.storage.findPurchase(sale.id, userId);
    if (existingPurchase) {
      throw new AlreadyPurchasedError();
    }

    // 4. Redis atomic decrement (fast gate)
    const redisStock = await this.redisStorage.getStock(sale.id);
    if (redisStock === null) {
      await this.redisStorage.initializeStock(sale.id, sale.remainingStock);
    }

    const newStock = await this.redisStorage.decrementStock(sale.id);
    if (newStock < 0) {
      await this.redisStorage.incrementStock(sale.id);
      throw new SoldOutError();
    }

    // 5. DB transaction (source of truth)
    try {
      const purchase = await this.storage.createPurchase(sale.id, userId);

      this.logger.log({
        correlationId,
        operation: 'attemptPurchase',
        status: 'success',
        purchaseId: purchase.id,
        userId,
      });

      return {
        purchaseId: purchase.id,
        userId,
        productName: sale.productName,
        status: 'confirmed',
        purchasedAt: purchase.createdAt.toISOString(),
      };
    } catch (error: unknown) {
      await this.redisStorage.incrementStock(sale.id);

      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message === 'ALREADY_PURCHASED') {
        throw new AlreadyPurchasedError();
      }
      if (message === 'SOLD_OUT') {
        throw new SoldOutError();
      }

      this.logger.error({
        correlationId,
        operation: 'attemptPurchase',
        status: 'error',
        error: message,
        userId,
      });
      throw error;
    }
  }

  async checkUserPurchase(userId: string): Promise<UserPurchaseCheckDto> {
    const correlationId = uuidv4();
    this.logger.log({
      correlationId,
      operation: 'checkUserPurchase',
      userId,
    });

    const validation = validateUserId(userId);
    if (!validation.valid) {
      throw new FlashSaleError(
        'VALIDATION_ERROR',
        validation.errors.join(' '),
        400,
      );
    }

    const sale = await this.storage.getCurrentSale();
    if (!sale) throw new SaleNotFoundError();

    const purchase = await this.storage.findPurchase(sale.id, userId);

    this.logger.log({
      correlationId,
      operation: 'checkUserPurchase',
      status: 'success',
      purchased: !!purchase,
    });

    if (purchase) {
      return {
        purchased: true,
        purchaseId: purchase.id,
        purchasedAt: purchase.createdAt.toISOString(),
      };
    }

    return { purchased: false };
  }

  private toSaleDto(
    sale: FlashSaleRecord,
    status: string,
    remainingStock: number,
  ): FlashSaleDto {
    return {
      id: sale.id,
      productName: sale.productName,
      totalStock: sale.totalStock,
      remainingStock: Math.max(0, remainingStock),
      startTime: sale.startTime.toISOString(),
      endTime: sale.endTime.toISOString(),
      status: status as 'upcoming' | 'active' | 'ended',
    };
  }
}
