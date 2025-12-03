import { useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";
import { useCashTxRepo } from "./useCashTransactionsRepository";

/**
 * Hook tính số dư quỹ tiền mặt và ngân hàng
 * Được dùng chung cho Dashboard và CashBook để đảm bảo số liệu nhất quán
 */
export const useCashBalance = () => {
  const { paymentSources, currentBranchId } = useAppContext();
  const { data: cashTransactions = [] } = useCashTxRepo();

  // Helper to check if transaction is income type
  const isIncomeType = (type: string | undefined) =>
    type === "income" || type === "deposit";

  // Lấy số dư ban đầu từ paymentSources (đã lưu trong DB)
  const savedInitialCash =
    paymentSources.find((ps) => ps.id === "cash")?.balance[currentBranchId] ||
    0;
  const savedInitialBank =
    paymentSources.find((ps) => ps.id === "bank")?.balance[currentBranchId] ||
    0;

  // Tính số dư quỹ
  const { cashBalance, bankBalance, cashDelta, bankDelta } = useMemo(() => {
    const branchTransactions = cashTransactions.filter(
      (tx) => tx.branchId === currentBranchId
    );

    // Tính biến động tiền mặt từ transactions
    const cashDelta = branchTransactions
      .filter((tx) => tx.paymentSourceId === "cash")
      .reduce((sum, tx) => {
        if (isIncomeType(tx.type)) {
          return sum + Math.abs(tx.amount);
        } else {
          return sum - Math.abs(tx.amount);
        }
      }, 0);

    // Tính biến động ngân hàng từ transactions
    const bankDelta = branchTransactions
      .filter((tx) => tx.paymentSourceId === "bank")
      .reduce((sum, tx) => {
        if (isIncomeType(tx.type)) {
          return sum + Math.abs(tx.amount);
        } else {
          return sum - Math.abs(tx.amount);
        }
      }, 0);

    // Số dư = Số dư ban đầu + Biến động
    return {
      cashBalance: savedInitialCash + cashDelta,
      bankBalance: savedInitialBank + bankDelta,
      cashDelta,
      bankDelta,
    };
  }, [cashTransactions, currentBranchId, savedInitialCash, savedInitialBank]);

  return {
    cashBalance,
    bankBalance,
    totalBalance: cashBalance + bankBalance,
    savedInitialCash,
    savedInitialBank,
    cashDelta,
    bankDelta,
  };
};
