import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { getTransactions } from '../api/finance';

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
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, debt: 0, balance: 0 });
  const [toast, setToast] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('month');

  // Mock data for sparklines and trends (in real app, calculate from backend data)
  const [trends, setTrends] = useState({
    balance: [1.2, 1.3, 1.25, 1.4, 1.44],
    income: [0.5, 0.6, 0.55, 0.7, 0.69],
    expense: [0.2, 0.22, 0.25, 0.23, 0.245],
  });

  // We intentionally exclude `user` from the dependency array below to avoid
  // an effect loop: `verify()` updates the context `user`, which would
  // retrigger this effect. `verify` is stable via `useCallback` and will
  // change when `accessToken` changes.
   
  useEffect(() => {
    async function load() {
      try {
        // verify() now returns the user object on success
        const verifiedUser = await verify();
        if (!verifiedUser) {
          await logout();
          navigate('/login');
        } else {
          setInfo(verifiedUser);
          // TODO: Fetch transactions and summary from backend
          await fetchFinancialData();
        }
      } catch {
        await logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    }

    load();
    // We intentionally exclude `user` from deps to avoid loop: verify() sets user,
    // which would retrigger this effect. `verify` is stable via useCallback
    // and will change when `accessToken` changes.
  }, [logout, navigate, verify]);

  const fetchFinancialData = async () => {
    try {
      const response = await getTransactions({ period: filterPeriod });
      setTransactions(response.data.transactions);
      setSummary(response.data.summary);
      
      // Generate sparkline data from transactions (simplified)
      if (response.data.transactions.length > 0) {
        // This is mock - in production calculate actual historical data
        const balanceData = Array.from({length: 5}, (_, i) => 
          response.data.summary.balance * (0.85 + Math.random() * 0.15)
        );
        setTrends(prev => ({ ...prev, balance: balanceData }));
      }
    } catch (err) {
      console.error('Failed to fetch financial data:', err);
      setToast({
        message: 'Failed to load financial data',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    if (info) {
      fetchFinancialData();
    }
  }, [filterPeriod]);

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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const netFlow = summary.income - summary.expense;

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
        {/* Header with improved spacing */}
        <div className="dashboard-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 leading-tight">
              Welcome back, {info?.firstname || 'User'}!
            </h1>
            <p className="text-gray-400 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg font-medium">Your Intelligent financial overview</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/finances')}
              className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300 whitespace-nowrap"
            >
              Manage Finances
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
          {/* Total Balance - Net Worth Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-2xl sm:rounded-3xl overflow-hidden p-4 sm:p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-3 sm:space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Total Net Worth</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-1 truncate">{formatCurrency(summary.balance)}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-2">
                    <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${calculateChange(summary.balance, 'balance') >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                      {calculateChange(summary.balance, 'balance') >= 0 ? '↗' : '↘'} {Math.abs(calculateChange(summary.balance, 'balance'))}% vs last month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  📈
                </div>
              </div>
              <div className="pt-2 overflow-x-auto">
                <Sparkline data={trends.balance} color="#14b8a6" />
              </div>
            </div>
          </div>

          {/* Monthly Net Flow Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Monthly Net Flow</p>
                  <p className={`text-3xl lg:text-4xl font-black mb-1 ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(Math.abs(netFlow))}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-blue-400">
                      Income: {formatCurrency(summary.income)}
                    </span>
                  </div>
                </div>
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-3xl lg:text-4xl group-hover:scale-110 transition-transform duration-300">
                  {netFlow >= 0 ? '💰' : '⚠️'}
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((summary.income / (summary.income + summary.expense)) * 100, 100)}%` }}
                  ></div>
                </div>
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
                <Sparkline data={[0.18, 0.22, 0.19, 0.25, 0.245]} color="#fb7185" />
              </div>
            </div>
          </div>

          {/* Holiday Fund Goal Card */}
          <div className="summary-card glass-card glass-card-hover group relative rounded-3xl overflow-hidden p-6 lg:p-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-400 mb-1 tracking-wide uppercase">Total Savings</p>
                  <p className="text-3xl lg:text-4xl font-black text-purple-400 mb-1">{formatCurrency(24000)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-purple-400">
                      Holiday Fund
                    </span>
                  </div>
                </div>
                <div className="relative w-14 h-14 lg:w-16 lg:h-16">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="6" fill="none" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      stroke="url(#gradient)" 
                      strokeWidth="6" 
                      fill="none"
                      strokeDasharray="175.93"
                      strokeDashoffset={175.93 * (1 - 0.75)}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-white">
                    75%
                  </div>
                </div>
              </div>
              <div className="pt-2 text-xs text-purple-400 font-semibold">
                ₹6,000 more to reach goal
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions with improved design */}
        <div className="transactions-container glass-card rounded-3xl overflow-hidden p-6 md:p-8 lg:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white">Recent Transactions</h2>
              <p className="text-gray-400 mt-1 text-sm">Track your latest financial activities</p>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>📊</div>
              <p className="text-gray-400 mb-8 text-lg font-medium">No transactions yet</p>
              <button
                onClick={() => navigate('/finances')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold hover:shadow-2xl hover:shadow-teal-500/40 hover:scale-105 transition-all duration-300"
              >
                Add Your First Transaction
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-500/30 scrollbar-track-transparent recent-scrollbar">
              {transactions.slice(0, 10).map((transaction, idx) => (
                  <div
                    key={transaction.id}
                    className="transaction-item relative flex items-center justify-between p-5 lg:p-6 rounded-2xl glass-card glass-card-hover group"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 lg:gap-5 flex-1 min-w-0">
                      <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl lg:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-base lg:text-lg truncate">{transaction.category}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1.5">
                          <span>{formatDate(transaction.transaction_date)}</span>
                          <span>•</span>
                          <span className="capitalize">{transaction.payment_method?.replace('_', ' ')}</span>
                        </div>
                        {transaction.description && (
                          <p className="text-xs text-gray-600 mt-2 truncate">{transaction.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p
                        className={`text-xl lg:text-2xl font-black transition-all duration-300 ${
                          transaction.type === 'income'
                            ? 'text-emerald-400 group-hover:text-emerald-300'
                            : transaction.type === 'expense'
                            ? 'text-rose-400 group-hover:text-rose-300'
                            : 'text-orange-400 group-hover:text-orange-300'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Mobile action button - Hidden on larger screens */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 flex justify-center px-4 z-40">
        <button
          onClick={() => navigate('/finances')}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-2xl shadow-teal-500/40 hover:scale-105 transition-all duration-300"
        >
          Add Transaction
        </button>
      </div>
    </div>
  );
}
