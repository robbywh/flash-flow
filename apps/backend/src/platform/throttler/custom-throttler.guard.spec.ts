import { describe, it, expect, vi } from 'vitest';
import { CustomThrottlerGuard } from './throttler.guard';
import { FlashSaleError } from '../../features/flash-sale/flash-sale.errors';

describe('CustomThrottlerGuard', () => {
    it('should throw FlashSaleError with RATE_LIMIT_EXCEEDED', async () => {
        // We only need to test the protected method throwThrottledException
        // Use any cast to avoid providing all constructor dependencies for this pure unit test
        const guard = new (CustomThrottlerGuard as any)();

        expect(() => guard.throwThrottledException()).toThrow(FlashSaleError);

        try {
            guard.throwThrottledException();
            expect.fail('Should have thrown');
        } catch (error: any) {
            expect(error).toBeInstanceOf(FlashSaleError);
            expect(error.code || error.errorCode).toBe('RATE_LIMIT_EXCEEDED');
            expect(error.status || error.statusCode).toBe(429);
        }
    });
});
