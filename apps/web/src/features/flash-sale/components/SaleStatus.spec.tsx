import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SaleStatus } from './SaleStatus';
import type { FlashSaleData } from '../types/flash-sale.types';

function makeSale(overrides: Partial<FlashSaleData> = {}): FlashSaleData {
    return {
        id: 'sale-1',
        productName: 'Limited Widget',
        totalStock: 100,
        remainingStock: 80,
        startTime: '2026-01-01T00:00:00Z',
        endTime: '2026-01-01T01:00:00Z',
        status: 'active',
        ...overrides,
    };
}

describe('SaleStatus', () => {
    it('shows loading spinner when loading', () => {
        const { container } = render(
            <SaleStatus sale={null} loading={true} error={null} />,
        );
        // The spinner is a div with animate-spin class
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('shows error message', () => {
        render(
            <SaleStatus sale={null} loading={false} error="Network error" />,
        );
        expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('renders nothing when sale is null and not loading', () => {
        const { container } = render(
            <SaleStatus sale={null} loading={false} error={null} />,
        );
        expect(container.innerHTML).toBe('');
    });

    it('shows "LIVE NOW" badge for active sale', () => {
        render(
            <SaleStatus sale={makeSale({ status: 'active' })} loading={false} error={null} />,
        );
        expect(screen.getByText('LIVE NOW')).toBeInTheDocument();
        expect(screen.getByText('Limited Widget')).toBeInTheDocument();
        // Use getAllByText as the number might appear in multiple places (text + percentage)
        expect(screen.getAllByText(/80/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/\/ 100/)[0]).toBeInTheDocument();
    });

    it('shows "Coming Soon" badge for upcoming sale', () => {
        render(
            <SaleStatus
                sale={makeSale({ status: 'upcoming' })}
                loading={false}
                error={null}
            />,
        );
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('shows "Sale Ended" badge for ended sale', () => {
        render(
            <SaleStatus
                sale={makeSale({ status: 'ended' })}
                loading={false}
                error={null}
            />,
        );
        expect(screen.getByText('Sale Ended')).toBeInTheDocument();
    });

    it('stock bar is green when >50%', () => {
        const { container } = render(
            <SaleStatus
                sale={makeSale({ remainingStock: 60, totalStock: 100 })}
                loading={false}
                error={null}
            />,
        );
        const bar = container.querySelector('[style*="width: 60%"]');
        expect(bar).toBeInTheDocument();
        expect(bar).toHaveClass('from-cyan-500');
        expect(bar).toHaveClass('to-blue-500');
    });

    it('stock bar is amber when 20-50%', () => {
        const { container } = render(
            <SaleStatus
                sale={makeSale({ remainingStock: 30, totalStock: 100 })}
                loading={false}
                error={null}
            />,
        );
        const bar = container.querySelector('[style*="width: 30%"]');
        expect(bar).toBeInTheDocument();
        expect(bar).toHaveClass('from-amber-500');
        expect(bar).toHaveClass('to-orange-500');
    });

    it('stock bar is red when <20%', () => {
        const { container } = render(
            <SaleStatus
                sale={makeSale({ remainingStock: 10, totalStock: 100 })}
                loading={false}
                error={null}
            />,
        );
        const bar = container.querySelector('[style*="width: 10%"]');
        expect(bar).toBeInTheDocument();
        expect(bar).toHaveClass('from-rose-500');
        expect(bar).toHaveClass('to-red-600');
    });
});
