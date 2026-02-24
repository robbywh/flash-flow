import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/database/prisma.service';
import type { FlashSaleStorage } from './flash-sale.storage';

@Injectable()
export class FlashSaleStoragePg implements FlashSaleStorage {
  private readonly logger = new Logger(FlashSaleStoragePg.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSale() {
    return this.prisma.flashSale.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPurchase(flashSaleId: string, userId: string) {
    return this.prisma.purchase.findFirst({
      where: { flashSaleId, userId, status: 'confirmed' },
    });
  }

  async createPurchase(flashSaleId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      // Acquire advisory lock to serialize purchases for this sale
      const lockKey = this.hashStringToInt(flashSaleId);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey}::bigint)`;

      // Check for existing purchase within the lock
      const existing = await tx.purchase.findFirst({
        where: { flashSaleId, userId, status: 'confirmed' },
      });
      if (existing) {
        throw new Error('ALREADY_PURCHASED');
      }

      // Decrement stock using Prisma's typed update instead of raw SQL
      // This avoids parameterization issues with the PrismaPg adapter
      try {
        await tx.flashSale.update({
          where: { id: flashSaleId },
          data: { remainingStock: { decrement: 1 } },
        });
      } catch (error: unknown) {
        // CHECK constraint violation or no rows updated
        this.logger.warn({
          operation: 'createPurchase',
          step: 'decrement_stock',
          error: error instanceof Error ? error.message : 'Unknown',
          flashSaleId,
        });
        throw new Error('SOLD_OUT');
      }

      // Insert purchase record
      return tx.purchase.create({
        data: {
          flashSaleId,
          userId,
          status: 'confirmed',
        },
      });
    });
  }

  private hashStringToInt(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
