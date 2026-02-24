import type { FlashSaleApi } from './flash-sale.api';
import type {
    FlashSaleData,
    PurchaseResult,
    UserPurchaseCheck,
    ApiResponse,
    ApiError,
} from '../types/flash-sale.types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorBody = (await response.json()) as ApiError;
        throw new Error(errorBody.error?.message ?? 'An unexpected error occurred');
    }
    const body = (await response.json()) as ApiResponse<T>;
    return body.data;
}

export class FlashSaleApiBackend implements FlashSaleApi {
    async getCurrentSale(): Promise<FlashSaleData> {
        const response = await fetch(`${API_BASE}/api/v1/flash-sales/current`);
        return handleResponse<FlashSaleData>(response);
    }

    async attemptPurchase(userId: string): Promise<PurchaseResult> {
        const response = await fetch(
            `${API_BASE}/api/v1/flash-sales/current/purchase`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            },
        );
        return handleResponse<PurchaseResult>(response);
    }

    async checkUserPurchase(userId: string): Promise<UserPurchaseCheck> {
        const response = await fetch(
            `${API_BASE}/api/v1/flash-sales/current/purchase?userId=${encodeURIComponent(userId)}`,
        );
        return handleResponse<UserPurchaseCheck>(response);
    }
}

export const flashSaleApi = new FlashSaleApiBackend();
