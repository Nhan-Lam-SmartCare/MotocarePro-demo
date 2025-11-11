import React from "react";
// (Optional jest-dom matchers removed to simplify environment)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SalesManager from "../../src/components/sales/SalesManager";

// Capture last query params passed to useSalesPagedRepo
let lastParams: any = null;

vi.mock("../../src/utils/toast", () => ({
  showToast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../src/contexts/AppContext", () => ({
  useAppContext: () => ({
    customers: [],
    upsertCustomer: vi.fn(),
    cartItems: [],
    setCartItems: vi.fn(),
    clearCart: vi.fn(),
    deleteSale: vi.fn(),
    currentBranchId: "CN1",
    finalizeSale: vi.fn(),
    setCashTransactions: vi.fn(),
    setPaymentSources: vi.fn(),
  }),
}));

vi.mock("../../src/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user", email: "test@example.com" },
    session: null,
    isAuthenticated: true,
  }),
}));

vi.mock("../../src/hooks/usePartsRepository", () => ({
  usePartsRepo: () => ({ data: [], isLoading: false, error: null }),
  useUpdatePartRepo: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("../../src/hooks/useInventoryTransactionsRepository", () => ({
  useCreateInventoryTxRepo: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("../../src/hooks/useCashTransactionsRepository", () => ({
  useCreateCashTxRepo: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("../../src/hooks/usePaymentSourcesRepository", () => ({
  useUpdatePaymentSourceBalanceRepo: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock("../../src/hooks/useSalesRepository", async () => {
  return {
    useSalesRepo: () => ({ data: [], isLoading: false, error: null }),
    useCreateSaleAtomicRepo: () => ({ mutateAsync: vi.fn() }),
    useSalesPagedRepo: (params: any) => {
      lastParams = params;
      const page = params?.page ?? 1;
      const totalPages = 3;
      return {
        data: {
          data: [],
          meta: {
            mode: params?.mode || "offset",
            page,
            pageSize: params?.pageSize || 20,
            total: 100,
            totalPages,
            hasMore: page < totalPages,
          },
        },
        isLoading: false,
        error: null,
      } as any;
    },
  };
});

beforeEach(() => {
  lastParams = null;
});

describe("Sales history modal pagination (offset)", () => {
  it("opens modal and shows initial page indicator", async () => {
    render(<SalesManager />);
    const user = userEvent.setup();

    // open modal
    const historyButtons = screen.getAllByRole("button", {
      name: /lịch sử bán hàng/i,
    });
    await user.click(historyButtons[0]);

    // page indicator should show Trang 1 / 3 from mocked hook meta
    await screen.findByRole("heading", { name: /lịch sử hóa đơn/i });
    expect(screen.getByText(/Trang\s+1\s*\/\s*3/i)).not.toBeNull();
  });
});

describe("Sales history date presets", () => {
  it("applies 'Hôm nay' preset and updates query dates", async () => {
    render(<SalesManager />);
    const user = userEvent.setup();

    // open modal
    const historyButtons = screen.getAllByRole("button", {
      name: /lịch sử bán hàng/i,
    });
    await user.click(historyButtons[0]);

    // click preset 'Hôm nay'
    await screen.findByRole("heading", { name: /lịch sử hóa đơn/i });
    await user.click(screen.getByRole("button", { name: /Hôm nay/i }));

    // The effect should have triggered onDateRangeChange; hook receives new params with from/to
    // Note: fromDate and toDate are ISO strings
    expect(lastParams).toBeTruthy();
    expect(typeof lastParams.fromDate === "string").toBe(true);
    expect(typeof lastParams.toDate === "string").toBe(true);

    // Sanity: fromDate <= toDate
    const from = new Date(lastParams.fromDate).getTime();
    const to = new Date(lastParams.toDate).getTime();
    expect(from).toBeLessThanOrEqual(to);
  });
});
