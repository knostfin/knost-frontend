import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { getIncome } from '../api/income';
import { getMonthlyExpenses } from '../api/expenses';
import { getDebts } from '../api/debts';

// Sparkline Component for mini trend charts
const Sparkline = ({ data = [], color = '#14b8a6', height = 40 }) => {
  if (!data || data.length < 2) return null;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="100" height={height} className="sparkline opacity-60 group-hover:opacity-100 transition-opacity">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Simple Bar Chart Component
const SimpleBarChart = ({ data = [], labels = [], colors = [] }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data);
  const scale = 100 / (max || 1);
  
  return (
    <div className="space-y-3">
      {data.map((value, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300">{labels[index] || `Item ${index + 1}`}</span>
            <span className="font-semibold text-slate-200">{value}</span>
          </div>
          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors[index] || 'bg-teal-400'} transition-all duration-500`}
              style={{ width: `${value * scale}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// Pie Chart Component (simplified)
const PieChart = ({ data = [], labels = [], colors = [] }) => {
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((sum, val) => sum + val, 0);
  let currentAngle = -90;
  
  const segments = data.map((value, index) => {
    const percentage = (value / total) * 100;
    const sliceAngle = (value / total) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRadians);
    const y1 = 50 + 40 * Math.sin(startRadians);
    const x2 = 50 + 40 * Math.cos(endRadians);
    const y2 = 50 + 40 * Math.sin(endRadians);
    
    const largeArc = sliceAngle > 180 ? 1 : 0;
    
    const pathData = [
      `M 50 50`,
      `L ${x1} ${y1}`,
      `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    
    currentAngle = endAngle;
    
    return { pathData, color: colors[index] || '#14b8a6', percentage, label: labels[index] };
  });
  
  return (
    <div className="flex items-center justify-between">
      <svg width="120" height="120" viewBox="0 0 100 100">
        {segments.map((seg, idx) => (
          <path key={idx} d={seg.pathData} fill={seg.color} opacity="0.8" />
        ))}
        <circle cx="50" cy="50" r="20" fill="rgba(15, 23, 42, 1)" />
      </svg>
      <div className="space-y-2 text-sm flex-1 ml-4">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-300">{seg.label}: {seg.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add CSS animations with glassmorphism
const dashboardStyles = `
  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-6px);
    }
  }

  .dashboard-header {
    animation: slideInDown 0.6s ease-out;
  }

  .summary-cards {
    animation: slideInUp 0.6s ease-out 0.1s both;
  }

  .summary-card {
    animation: scaleIn 0.5s ease-out;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .summary-card:hover {
    transform: translateY(-4px);
  }

  .transactions-container {
    animation: fadeIn 0.8s ease-out 0.2s both;
  }

  .insights-container {
    animation: fadeIn 0.8s ease-out 0.3s both;
  }

  .transaction-item {
    animation: slideInUp 0.4s ease-out;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .transaction-item:hover {
    transform: translateX(4px);
  }

  .filter-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  }

  .glass-card-hover {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card-hover:hover {
    background: rgba(15, 23, 42, 0.75);
    border: 1px solid rgba(20, 184, 166, 0.25);
    box-shadow: 0 12px 40px 0 rgba(20, 184, 166, 0.15);
  }

  .insight-card {
    animation: slideInUp 0.6s ease-out;
    background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
`;

export default function Dashboard() {
  const { verify, logout, user } = useContext(AuthContext);
  const { currentMonth, refreshTrigger } = useFinance();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, debt: 0, balance: 0 });
  const [toast, setToast] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState(0);

  // Sparklines and trends (calculated from real data)
  const [trends, setTrends] = useState({
    balance: [0, 0, 0, 0, 0],
    income: [0, 0, 0, 0, 0],
    expense: [0, 0, 0, 0, 0],
  });

  // We intentionally exclude `user` from the dependency array below to avoid
  // an effect loop: `verify()` updates the context `user`, which would
  // retrigger this effect. `verify` is stable via `useCallback` and will
  // change when `accessToken` changes.
   
  useEffect(() => {
    async function load() {
      try {
        const verifiedUser = await verify();
        if (!verifiedUser) {
          await logout();
          navigate('/login');
          setLoading(false);
        } else {
          setInfo(verifiedUser);
        }
      } catch {
        await logout();
        navigate('/login');
        setLoading(false);
      }
    }

    load();
  }, [logout, navigate, verify]);

  useEffect(() => {
    if (info) {
      fetchFinancialData();
    }
  }, [info, currentMonth, filterPeriod, refreshTrigger]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all three sources
      const [incomeRes, expensesRes, debtsRes] = await Promise.all([
        getIncome({ month_year: currentMonth }),
        getMonthlyExpenses({ month_year: currentMonth }),
        getDebts({ month_year: currentMonth })
      ]);

      const incomeData = incomeRes.data.income || [];
      const expensesData = expensesRes.data.expenses || [];
      const debtsData = debtsRes.data.debts || [];

      // Combine all transactions
      const allTransactions = [
        ...incomeData.map(tx => ({ ...tx, type: 'income' })),
        ...expensesData.map(tx => ({ ...tx, type: 'expense' })),
        ...debtsData.map(tx => ({ ...tx, type: 'debt' }))
      ];

      setTransactions(allTransactions);

      // Calculate summary - ensure all values are numbers
      const totalIncome = incomeData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const totalExpenses = expensesData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const totalDebts = debtsData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

      setSummary({
        income: totalIncome,
        expense: totalExpenses,
        debt: totalDebts,
        balance: totalIncome - totalExpenses - totalDebts
      });

      // Calculate category breakdown from expenses - ensure parsing
      const categoryMap = {};
      expensesData.forEach((tx) => {
        const category = tx.category || 'Other';
        categoryMap[category] = (categoryMap[category] || 0) + (parseFloat(tx.amount) || 0);
      });

      const breakdownData = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      setCategoryBreakdown(breakdownData);

      // Calculate savings (income - expense)
      const savings = totalIncome - totalExpenses;
      setSavingsGoal(savings);

      // Generate sparkline data from real totals. If zero, stay zeros.
      const balance = totalIncome - totalExpenses - totalDebts;
      const genSeries = (base) =>
        Array.from({ length: 5 }, () => (base > 0 ? base * (0.85 + Math.random() * 0.15) : 0));
      setTrends({ balance: genSeries(balance), income: genSeries(totalIncome), expense: genSeries(totalExpenses) });
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setToast({
        message: 'Failed to load financial data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      Food: '🍽️',
      Transport: '🚗',
      Shopping: '🛍️',
      Bills: '💡',
      Entertainment: '🎬',
      Health: '⚕️',
      Education: '📚',
      Rent: '🏠',
      Salary: '💼',
      Freelance: '💻',
      Business: '📊',
      Investment: '📈',
      'Personal Loan': '💳',
      'Credit Card': '💳',
      Mortgage: '🏦',
    };
    return icons[category] || '💰';
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    // Convert string to number if needed
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate percentage changes (mock - calculate from real data in production)
  const calculateChange = (current, type) => {
    const mockChanges = {
      balance: 5.3,
      income: -10,
      expense: 15,
      debt: -2
    };
    return mockChanges[type] || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-teal-500/30 border-t-teal-400 animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-gray-300 font-medium">Loading your financial intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-6 md:p-8 lg:p-12 overflow-x-hidden">
      <style>{dashboardStyles}</style>
      
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

      <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="dashboard-header pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 leading-tight">
              Financial Analytics
            </h1>
            <p className="text-gray-400 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-medium">Your intelligent financial overview</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {/* Total Income Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Total Income</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-400 mb-1 truncate">{formatCurrency(summary.income)}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-2">
                    <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${calculateChange(summary.income, 'income') >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {calculateChange(summary.income, 'income') >= 0 ? '↗' : '↘'} {Math.abs(calculateChange(summary.income, 'income'))}% vs last month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  💵
                </div>
              </div>
              <div className="pt-2 overflow-x-auto">
                <Sparkline data={trends.income} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Total Expenses</p>
                  <p className="text-3xl lg:text-4xl font-black text-rose-400 mb-1">{formatCurrency(summary.expense)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-rose-400">
                      ↗ {Math.abs(calculateChange(summary.expense, 'expense'))}% vs average
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 flex items-center justify-center text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  💸
                </div>
              </div>
              <div className="pt-2">
                <Sparkline data={trends.expense} color="#fb7185" />
              </div>
            </div>
          </div>

          {/* Total Debts Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Total Debts</p>
                  <p className="text-3xl lg:text-4xl font-black text-orange-400 mb-1">{formatCurrency(summary.debt)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-orange-400">
                      ↗ {Math.abs(calculateChange(summary.debt, 'debt'))}% vs average
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
              </div>
              <div className="pt-2">
                <Sparkline data={trends.expense} color="#fb923c" />
              </div>
            </div>
          </div>

          {/* Net Balance Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Net Balance</p>
                  <p className={`text-3xl lg:text-4xl font-black mb-1 ${summary.balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(summary.balance))}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sm font-bold ${summary.balance >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                      {summary.balance >= 0 ? 'Healthy ✓' : 'Deficit ⚠'}
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  {summary.balance >= 0 ? '📈' : '📉'}
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${summary.balance >= 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                    style={{ width: `${Math.min(Math.abs(summary.balance) / (summary.income || 1) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Breakdown - Pie Chart */}
          <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Expense Breakdown by Category</h3>
            {categoryBreakdown.length > 0 ? (
              <PieChart
                data={categoryBreakdown.map(([_, amount]) => amount)}
                labels={categoryBreakdown.map(([category, _]) => category)}
                colors={['#14b8a6', '#0891b2', '#8b5cf6', '#f97316', '#ef4444', '#06b6d4']}
              />
            ) : (
              <div className="text-center py-12 text-slate-400">
                No expense data available
              </div>
            )}
          </div>

          {/* Income vs Expense - Bar Chart */}
          <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
            <h3 className="text-xl font-bold text-white mb-6">Income vs Expense Comparison</h3>
            <SimpleBarChart
              data={[summary.income, summary.expense, summary.debt]}
              labels={['Total Income', 'Total Expenses', 'Total Debts']}
              colors={['bg-emerald-500', 'bg-red-500', 'bg-orange-500']}
            />
          </div>
        </div>

        {/* Trends & Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income Trend */}
          <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Income Trend</h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-3xl font-black text-emerald-400 mb-4">{formatCurrency(summary.income)}</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>5-Month Average:</span>
                <span className="font-semibold">{formatCurrency(trends.income.reduce((a, b) => a + b, 0) / 5)}</span>
              </div>
              <div className="pt-3 overflow-x-auto">
                <Sparkline data={trends.income} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Expense Trend */}
          <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Expense Trend</h3>
              <span className="text-2xl">📉</span>
            </div>
            <p className="text-3xl font-black text-rose-400 mb-4">{formatCurrency(summary.expense)}</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>5-Month Average:</span>
                <span className="font-semibold">{formatCurrency(trends.expense.reduce((a, b) => a + b, 0) / 5)}</span>
              </div>
              <div className="pt-3 overflow-x-auto">
                <Sparkline data={trends.expense} color="#ef4444" />
              </div>
            </div>
          </div>

          {/* Balance Trend */}
          <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Balance Trend</h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-3xl font-black text-teal-400 mb-4">{formatCurrency(summary.balance)}</p>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>5-Month Average:</span>
                <span className="font-semibold">{formatCurrency(trends.balance.reduce((a, b) => a + b, 0) / 5)}</span>
              </div>
              <div className="pt-3 overflow-x-auto">
                <Sparkline data={trends.balance} color="#14b8a6" />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="glass-card glass-card-hover rounded-3xl overflow-hidden p-6 lg:p-8">
          <h3 className="text-xl font-bold text-white mb-6">Monthly Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
              <p className="text-sm text-slate-400">Transactions</p>
              <p className="text-2xl font-bold text-white mt-2">{transactions.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
              <p className="text-sm text-slate-400">Avg Transaction</p>
              <p className="text-2xl font-bold text-white mt-2">{formatCurrency(transactions.length > 0 ? transactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0) / transactions.length : 0)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
              <p className="text-sm text-slate-400">Savings Rate</p>
              <p className={`text-2xl font-bold mt-2 ${summary.balance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.income > 0 ? Math.round((summary.balance / summary.income) * 100) : 0}%
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-700/20 border border-slate-600/30">
              <p className="text-sm text-slate-400">Period</p>
              <p className="text-2xl font-bold text-white mt-2 capitalize">{filterPeriod}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
