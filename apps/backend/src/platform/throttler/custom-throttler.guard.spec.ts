import { describe, it, expect } from 'vitest';
import { CustomThrottlerGuard } from './throttler.guard';
import { FlashSaleError } from '../../features/flash-sale/flash-sale.errors';

describe('CustomThrottlerGuard', () => {
  it('should throw FlashSaleError with RATE_LIMIT_EXCEEDED', () => {
    // We only need to test the protected method throwThrottledException
    // Use unknown cast followed by specific type to avoid 'any'
    const guard = new (CustomThrottlerGuard as unknown as new () => {
      throwThrottledException: () => void;
    })();

    expect(() => guard.throwThrottledException()).toThrow(FlashSaleError);

    try {
      guard.throwThrottledException();
      expect.fail('Should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(FlashSaleError);
      const fsError = error as FlashSaleError;
      expect(fsError.errorCode).toBe('RATE_LIMIT_EXCEEDED');
      expect(fsError.statusCode).toBe(429);
    }
  });
});
