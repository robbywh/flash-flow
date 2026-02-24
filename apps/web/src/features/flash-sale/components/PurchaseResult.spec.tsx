import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PurchaseResult } from './PurchaseResult';

describe('PurchaseResult', () => {
    it('renders nothing when success is null', () => {
        const { container } = render(
            <PurchaseResult success={null} message={null} />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('renders nothing when message is null', () => {
        const { container } = render(
            <PurchaseResult success={true} message={null} />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('shows success banner with purchase ID', () => {
        render(
            <PurchaseResult
                success={true}
                message="Item secured!"
                purchaseId="order-123"
            />,
        );
        expect(screen.getByText('Purchase Confirmed!')).toBeInTheDocument();
        expect(screen.getByText('Item secured!')).toBeInTheDocument();
        expect(screen.getByText('Order ID: order-123')).toBeInTheDocument();
    });

    it('shows success banner without purchase ID', () => {
        render(<PurchaseResult success={true} message="Item secured!" />);
        expect(screen.getByText('Purchase Confirmed!')).toBeInTheDocument();
        expect(screen.queryByText(/Order ID/)).not.toBeInTheDocument();
    });

    it('shows failure banner with error message', () => {
        render(<PurchaseResult success={false} message="Already purchased" />);
        expect(screen.getByText('Purchase Failed')).toBeInTheDocument();
        expect(screen.getByText('Already purchased')).toBeInTheDocument();
    });
});
