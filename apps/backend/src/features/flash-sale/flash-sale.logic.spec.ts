import { describe, it, expect } from 'vitest';
import {
  computeSaleStatus,
  canAttemptPurchase,
  validateUserId,
} from './flash-sale.logic';

describe('computeSaleStatus', () => {
  const start = new Date('2026-03-01T10:00:00Z');
  const end = new Date('2026-03-01T10:30:00Z');

  it('should return upcoming when now is before start', () => {
    const now = new Date('2026-03-01T09:59:59Z');
    expect(computeSaleStatus(start, end, now)).toBe('upcoming');
  });

  it('should return active when now is between start and end', () => {
    const now = new Date('2026-03-01T10:15:00Z');
    expect(computeSaleStatus(start, end, now)).toBe('active');
  });

  it('should return active when now equals start', () => {
    expect(computeSaleStatus(start, end, start)).toBe('active');
  });

  it('should return active when now equals end', () => {
    expect(computeSaleStatus(start, end, end)).toBe('active');
  });

  it('should return ended when now is after end', () => {
    const now = new Date('2026-03-01T10:30:01Z');
    expect(computeSaleStatus(start, end, now)).toBe('ended');
  });
});

describe('canAttemptPurchase', () => {
  it('should allow purchase when sale is active, stock available, no existing purchase', () => {
    const result = canAttemptPurchase('active', 10, false);
    expect(result).toEqual({ allowed: true });
  });

  it('should deny when sale is upcoming', () => {
    const result = canAttemptPurchase('upcoming', 10, false);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('SALE_NOT_ACTIVE');
  });

  it('should deny when sale has ended', () => {
    const result = canAttemptPurchase('ended', 10, false);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('SALE_NOT_ACTIVE');
  });

  it('should deny when stock is zero', () => {
    const result = canAttemptPurchase('active', 0, false);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('SOLD_OUT');
  });

  it('should deny when user already purchased', () => {
    const result = canAttemptPurchase('active', 10, true);
    expect(result.allowed).toBe(false);
    expect(result.errorCode).toBe('ALREADY_PURCHASED');
  });

  it('should prioritize sale status over stock check', () => {
    const result = canAttemptPurchase('ended', 0, true);
    expect(result.errorCode).toBe('SALE_NOT_ACTIVE');
  });
});

describe('validateUserId', () => {
  it('should accept valid userId', () => {
    expect(validateUserId('user@example.com')).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('should accept alphanumeric username', () => {
    expect(validateUserId('john123')).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('should reject empty string', () => {
    const result = validateUserId('');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('should reject non-string input', () => {
    const result = validateUserId(123);
    expect(result.valid).toBe(false);
  });

  it('should reject too short userId', () => {
    const result = validateUserId('ab');
    expect(result.valid).toBe(false);
  });

  it('should reject too long userId', () => {
    const result = validateUserId('a'.repeat(256));
    expect(result.valid).toBe(false);
  });

  it('should reject whitespace-only userId', () => {
    const result = validateUserId('   ');
    expect(result.valid).toBe(false);
  });
});
