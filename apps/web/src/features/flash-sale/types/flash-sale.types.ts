export type SaleStatus = 'upcoming' | 'active' | 'ended';

export interface FlashSaleData {
    id: string;
    productName: string;
    totalStock: number;
    remainingStock: number;
    startTime: string;
    endTime: string;
    status: SaleStatus;
}

export interface PurchaseResult {
    purchaseId: string;
    userId: string;
    productName: string;
    status: 'confirmed';
    purchasedAt: string;
}

export interface UserPurchaseCheck {
    purchased: boolean;
    purchaseId?: string;
    purchasedAt?: string;
}

export interface ApiResponse<T> {
    data: T;
}

export interface ApiError {
    status: 'error';
    code: number;
    error: {
        code: string;
        message: string;
        correlationId: string;
    };
}
