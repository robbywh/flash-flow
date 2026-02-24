export class FlashSaleError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode: number = 409,
  ) {
    super(message);
    this.name = 'FlashSaleError';
  }
}

export class SoldOutError extends FlashSaleError {
  constructor() {
    super('SOLD_OUT', 'All items have been sold.', 409);
  }
}

export class AlreadyPurchasedError extends FlashSaleError {
  constructor() {
    super('ALREADY_PURCHASED', 'You have already purchased this item.', 409);
  }
}

export class SaleNotActiveError extends FlashSaleError {
  constructor(status: 'upcoming' | 'ended') {
    const message =
      status === 'upcoming'
        ? 'The sale has not started yet.'
        : 'The sale has ended.';
    super('SALE_NOT_ACTIVE', message, 409);
  }
}

export class SaleNotFoundError extends FlashSaleError {
  constructor() {
    super('SALE_NOT_FOUND', 'No flash sale found.', 404);
  }
}
