import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SaleStatus } from "./SaleStatus";
import type { FlashSaleData } from "../types/flash-sale.types";

function makeSale(overrides: Partial<FlashSaleData> = {}): FlashSaleData {
  return {
    id: "sale-1",
    productName: "Limited Widget",
    totalStock: 100,
    remainingStock: 80,
    startTime: "2026-01-01T00:00:00Z",
    endTime: "2026-01-01T01:00:00Z",
    status: "active",
    ...overrides,
  };
}

describe("SaleStatus", () => {
  it("shows loading spinner when loading", () => {
    const { container } = render(<SaleStatus sale={null} loading={true} />);
    // The spinner is a div with animate-spin class
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders nothing when sale is null and not loading", () => {
    const { container } = render(<SaleStatus sale={null} loading={false} />);
    expect(container.innerHTML).toBe("");
  });

  it('shows "LIVE NOW" badge for active sale', () => {
    render(
      <SaleStatus sale={makeSale({ status: "active" })} loading={false} />,
    );
    expect(screen.getByText("LIVE NOW")).toBeInTheDocument();
    expect(screen.getByText("Limited Widget")).toBeInTheDocument();
    // Use getAllByText as the number might appear in multiple places (text + percentage)
    expect(screen.getAllByText(/80/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/\/ 100/)[0]).toBeInTheDocument();
  });

  it('shows "Coming Soon" badge for upcoming sale', () => {
    render(
      <SaleStatus sale={makeSale({ status: "upcoming" })} loading={false} />,
    );
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it('shows "Sale Ended" badge for ended sale', () => {
    render(<SaleStatus sale={makeSale({ status: "ended" })} loading={false} />);
    expect(screen.getByText("Sale Ended")).toBeInTheDocument();
  });

  it("stock bar is green when >50%", () => {
    const { container } = render(
      <SaleStatus
        sale={makeSale({ remainingStock: 60, totalStock: 100 })}
        loading={false}
      />,
    );
    const bar = container.querySelector('[style*="width: 60%"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass("from-cyan-500");
    expect(bar).toHaveClass("to-blue-500");
  });

  it("stock bar is amber when 20-50%", () => {
    const { container } = render(
      <SaleStatus
        sale={makeSale({ remainingStock: 30, totalStock: 100 })}
        loading={false}
      />,
    );
    const bar = container.querySelector('[style*="width: 30%"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass("from-amber-500");
    expect(bar).toHaveClass("to-orange-500");
  });

  it("red bar when <20%", () => {
    const { container } = render(
      <SaleStatus
        sale={makeSale({ remainingStock: 10, totalStock: 100 })}
        loading={false}
      />,
    );
    const bar = container.querySelector('[style*="width: 10%"]');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveClass("from-rose-500");
    expect(bar).toHaveClass("to-red-600");
  });

  describe("Timer Logic", () => {
    it("updates the timer every second for active sale", () => {
      vi.useFakeTimers();
      const startTime = new Date("2026-01-01T00:00:00Z").toISOString();
      const endTime = new Date("2026-01-01T01:00:00Z").toISOString();
      const sale = makeSale({ startTime, endTime, status: "active" });

      // Mock Date.now to be just before the end
      const now = new Date("2026-01-01T00:59:50Z").getTime();
      vi.setSystemTime(now);

      render(<SaleStatus sale={sale} loading={false} />);

      expect(screen.getByText("00:00:10")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText("00:00:09")).toBeInTheDocument();

      vi.useRealTimers();
    });

    it("displays 00:00:00 when sale ends", () => {
      vi.useFakeTimers();
      const past = new Date(Date.now() - 1000).toISOString();
      const evenFurtherPast = new Date(Date.now() - 2000).toISOString();
      const sale = makeSale({
        startTime: evenFurtherPast,
        endTime: past,
        status: "active",
      });

      render(<SaleStatus sale={sale} loading={false} />);

      expect(screen.getByText("00:00:00")).toBeInTheDocument();
      vi.useRealTimers();
    });

    it("counts down to start time for upcoming sale", () => {
      vi.useFakeTimers();
      const now = new Date("2026-01-01T00:00:00Z").getTime();
      vi.setSystemTime(now);

      const startTime = new Date("2026-01-01T00:00:10Z").toISOString();
      const endTime = new Date("2026-01-01T01:00:00Z").toISOString();
      const sale = makeSale({ startTime, endTime, status: "upcoming" });

      render(<SaleStatus sale={sale} loading={false} />);

      expect(screen.getByText("00:00:10")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText("00:00:09")).toBeInTheDocument();
      vi.useRealTimers();
    });
  });
});
