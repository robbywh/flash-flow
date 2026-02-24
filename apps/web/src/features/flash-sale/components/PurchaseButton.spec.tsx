import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PurchaseButton } from './PurchaseButton';

describe('PurchaseButton', () => {
    const defaultProps = {
        userId: 'user@example.com',
        disabled: false,
        loading: false,
        saleStatus: 'active' as const,
        onPurchase: vi.fn(),
    };

    it('shows "Buy Now" when sale is active and userId is valid', () => {
        render(<PurchaseButton {...defaultProps} />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Buy Now');
        expect(button).toBeEnabled();
    });

    it('shows "Enter your User ID" when userId is empty', () => {
        render(<PurchaseButton {...defaultProps} userId="" />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Enter your User ID');
        expect(button).toBeDisabled();
    });

    it('shows "User ID too short" when userId is less than 3 chars', () => {
        render(<PurchaseButton {...defaultProps} userId="ab" />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('User ID too short');
        expect(button).toBeDisabled();
    });

    it('shows "Sale Not Started" when saleStatus is upcoming', () => {
        render(<PurchaseButton {...defaultProps} saleStatus="upcoming" />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Sale Not Started');
        expect(button).toBeDisabled();
    });

    it('shows "Sale Ended" when saleStatus is ended', () => {
        render(<PurchaseButton {...defaultProps} saleStatus="ended" />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Sale Ended');
        expect(button).toBeDisabled();
    });

    it('shows "Processing..." when loading is true', () => {
        render(<PurchaseButton {...defaultProps} loading={true} />);
        const button = screen.getByRole('button');
        expect(button).toHaveTextContent('Processing...');
        expect(button).toBeDisabled();
    });

    it('calls onPurchase when clicked with valid state', () => {
        const onPurchase = vi.fn();
        render(<PurchaseButton {...defaultProps} onPurchase={onPurchase} />);
        fireEvent.click(screen.getByRole('button'));
        expect(onPurchase).toHaveBeenCalledOnce();
    });

    it('does NOT call onPurchase when button is disabled', () => {
        const onPurchase = vi.fn();
        render(
            <PurchaseButton {...defaultProps} onPurchase={onPurchase} disabled={true} />,
        );
        fireEvent.click(screen.getByRole('button'));
        expect(onPurchase).not.toHaveBeenCalled();
    });
});
