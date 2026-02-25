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
        expect(screen.getByText('Order Secured!')).toBeInTheDocument();
        expect(screen.getByText('Item secured!')).toBeInTheDocument();
        expect(screen.getByText('order-123')).toBeInTheDocument();
    });

    it('shows success banner without purchase ID', () => {
        render(<PurchaseResult success={true} message="Item secured!" />);
        expect(screen.getByText('Order Secured!')).toBeInTheDocument();
        expect(screen.queryByText(/Confirmation Pointer/)).not.toBeInTheDocument();
    });

    it('shows failure banner with error message', () => {
        render(<PurchaseResult success={false} message="Already purchased" />);
        expect(screen.getByText('Action Failed')).toBeInTheDocument();
        expect(screen.getByText('Already purchased')).toBeInTheDocument();
    });
});
