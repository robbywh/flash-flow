/**
 * Pure business logic for flash sale operations.
 * No I/O dependencies — all functions are deterministic and side-effect free.
 */

export type SaleStatus = 'upcoming' | 'active' | 'ended';

export interface CanAttemptPurchaseResult {
  allowed: boolean;
  reason?: string;
  errorCode?: string;
}

/**
 * Derives the current sale status based on time window.
 */
export function computeSaleStatus(
  startTime: Date,
  endTime: Date,
  now: Date,
): SaleStatus {
  if (now < startTime) return 'upcoming';
  if (now > endTime) return 'ended';
  return 'active';
}

/**
 * Pre-validates whether a purchase attempt can proceed.
 * This is a pure guard — actual stock decrement and DB writes happen in the service.
 */
export function canAttemptPurchase(
  saleStatus: SaleStatus,
  remainingStock: number,
  hasExistingPurchase: boolean,
): CanAttemptPurchaseResult {
  if (saleStatus !== 'active') {
    return {
      allowed: false,
      reason:
        saleStatus === 'upcoming'
          ? 'The sale has not started yet.'
          : 'The sale has ended.',
      errorCode: 'SALE_NOT_ACTIVE',
    };
  }

  if (remainingStock <= 0) {
    return {
      allowed: false,
      reason: 'All items have been sold.',
      errorCode: 'SOLD_OUT',
    };
  }

  if (hasExistingPurchase) {
    return {
      allowed: false,
      reason: 'You have already purchased this item.',
      errorCode: 'ALREADY_PURCHASED',
    };
  }

  return { allowed: true };
}

/**
 * Validates userId format.
 * Accepts email-like identifiers or alphanumeric usernames (3-255 chars).
 */
export function validateUserId(userId: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof userId !== 'string') {
    errors.push('userId must be a string.');
    return { valid: false, errors };
  }

  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    errors.push('userId must not be empty.');
  } else if (trimmed.length < 3) {
    errors.push('userId must be at least 3 characters.');
  } else if (trimmed.length > 255) {
    errors.push('userId must not exceed 255 characters.');
  }

  return { valid: errors.length === 0, errors };
}
