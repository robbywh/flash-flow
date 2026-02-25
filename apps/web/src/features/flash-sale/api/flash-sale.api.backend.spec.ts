import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FlashSaleApiBackend } from "./flash-sale.api.backend";
import type {
  FlashSaleData,
  PurchaseResult,
  UserPurchaseCheck,
} from "../types/flash-sale.types";

/**
 * Integration tests for FlashSaleApiBackend.
 *
 * These tests verify the HTTP adapter correctly:
 * - Constructs request URLs and bodies
 * - Parses successful API responses
 * - Extracts error messages from failed responses
 *
 * We mock `global.fetch` to avoid real network calls.
 */

function mockFetchSuccess<T>(data: T): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data }),
    } as Response),
  );
}

function mockFetchError(statusCode: number, errorMessage: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: statusCode,
      json: () =>
        Promise.resolve({
          status: "error",
          code: statusCode,
          error: {
            code: "SOME_ERROR",
            message: errorMessage,
            correlationId: "test-corr-id",
          },
        }),
    } as unknown as Response),
  );
}

describe("FlashSaleApiBackend", () => {
  let api: FlashSaleApiBackend;

  beforeEach(() => {
    api = new FlashSaleApiBackend();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getCurrentSale", () => {
    it("fetches current sale and returns parsed data", async () => {
      const mockSale: FlashSaleData = {
        id: "sale-1",
        productName: "Flash Widget",
        totalStock: 100,
        remainingStock: 75,
        startTime: "2026-01-01T00:00:00Z",
        endTime: "2026-01-01T01:00:00Z",
        status: "active",
      };
      mockFetchSuccess(mockSale);

      const result = await api.getCurrentSale();

      expect(result).toEqual(mockSale);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/flash-sales/current"),
      );
    });

    it("throws with error message on server error", async () => {
      mockFetchError(500, "Internal Server Error");

      await expect(api.getCurrentSale()).rejects.toThrow(
        "Internal Server Error",
      );
    });
  });

  describe("attemptPurchase", () => {
    it("sends POST with userId and returns purchase result", async () => {
      const mockResult: PurchaseResult = {
        purchaseId: "purch-1",
        userId: "user@example.com",
        productName: "Flash Widget",
        status: "confirmed",
        purchasedAt: "2026-01-01T00:05:00Z",
      };
      mockFetchSuccess(mockResult);

      const result = await api.attemptPurchase("user@example.com");

      expect(result).toEqual(mockResult);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/flash-sales/current/purchase"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: "user@example.com" }),
        }),
      );
    });

    it("throws with error message when already purchased", async () => {
      mockFetchError(409, "You have already purchased this item");

      await expect(api.attemptPurchase("user@example.com")).rejects.toThrow(
        "You have already purchased this item",
      );
    });
  });

  describe("checkUserPurchase", () => {
    it("fetches purchase status with userId query param", async () => {
      const mockCheck: UserPurchaseCheck = {
        purchased: true,
        purchaseId: "purch-1",
        purchasedAt: "2026-01-01T00:05:00Z",
      };
      mockFetchSuccess(mockCheck);

      const result = await api.checkUserPurchase("user@example.com");

      expect(result).toEqual(mockCheck);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/v1/flash-sales/current/purchase?userId=user%40example.com",
        ),
      );
    });
  });
});
