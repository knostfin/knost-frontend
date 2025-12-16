import React, { createContext, useContext, useState, useCallback } from 'react';

export const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  // Current month selector state
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Global finance data cache
  const [loans, setLoans] = useState([]);
  const [debts, setDebts] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [monthlyOverview, setMonthlyOverview] = useState(null);

  // Refresh flags to trigger refetch
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Helper to navigate months
  const navigateMonth = useCallback((direction) => {
    setCurrentMonth((prev) => {
      const [year, month] = prev.split('-').map(Number);
      const date = new Date(year, month - 1);
      
      if (direction === 'next') {
        date.setMonth(date.getMonth() + 1);
      } else if (direction === 'prev') {
        date.setMonth(date.getMonth() - 1);
      }
      
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
  }, []);

  const setMonth = useCallback((monthYear) => {
    setCurrentMonth(monthYear);
  }, []);

  // Format month for display
  const formatMonthDisplay = useCallback((monthYear) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const value = {
    // State
    currentMonth,
    loans,
    debts,
    recurringExpenses,
    monthlyExpenses,
    income,
    investments,
    monthlyOverview,
    refreshTrigger,

    // Setters
    setLoans,
    setDebts,
    setRecurringExpenses,
    setMonthlyExpenses,
    setIncome,
    setInvestments,
    setMonthlyOverview,

    // Actions
    navigateMonth,
    setMonth,
    triggerRefresh,
    formatMonthDisplay,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}
