import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FlashSaleError } from '../../features/flash-sale/flash-sale.errors';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected throwThrottledException(): Promise<void> {
    throw new FlashSaleError(
      'RATE_LIMIT_EXCEEDED',
      'Slow down! You are making too many requests. Please wait a moment.',
      429,
    );
  }
}
