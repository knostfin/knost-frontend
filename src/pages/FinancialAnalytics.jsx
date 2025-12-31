import React, { useEffect, useMemo, useState } from 'react';
import MonthSelector from '../components/MonthSelector';
import Select from '../components/ui/Select';
import SummaryCard from '../components/SummaryCard';
import Toast from '../components/Toast';
import { useFinance } from '../context/FinanceContext';
import { getMonthlyOverview, getCategoryBreakdown, getTrends } from '../api/dashboard';
import { getMonthlyTrend } from '../api/finance';

const palette = ['#22d3ee', '#f472b6', '#a78bfa', '#38bdf8', '#f97316', '#34d399', '#eab308', '#f43f5e'];

const toCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
};

const monthLabel = (monthYear) => {
  if (!monthYear || !monthYear.includes('-')) return monthYear || '';
  const [year, month] = monthYear.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

const normalizeTrend = (payload) => {
  const data = payload?.data || payload || {};
  const trend = data.trend || data || {};
  const months = trend.months || trend.labels || [];
  const income = trend.income || trend.incomes || [];
  const expenses = trend.expenses || trend.expense || [];
  const loans = trend.loans || trend.emis || trend.emi || [];
  const debts = trend.debts || [];
  return { months, income, expenses, loans, debts };
};

const normalizeCategories = (payload) => {
  const data = payload?.data || payload || {};
  const raw = data.breakdown || data.categories || data;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx) => ({
      label: item.category || item.name || `Category ${idx + 1}`,
      value: Number(item.total || item.amount || item.value || 0) || 0,
    }))
    .filter((c) => c.value > 0);
};

function BarChart({ data, series, height = 140 }) {
  const maxValue = useMemo(() => {
    const values = data.flatMap((row) => series.map((s) => Number(row[s.key]) || 0));
    return Math.max(...values, 1);
  }, [data, series]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[640px] space-y-3">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-4">
          {data.map((row) => (
            <div key={row.label} className="flex flex-col items-center gap-2">
              <div className="flex items-end gap-1 w-full h-[180px] px-1 bg-slate-900/60 rounded-lg border border-slate-800">
                {series.map((s, idx) => {
                  const value = Number(row[s.key]) || 0;
                  const ratio = Math.max(0, Math.min(1, value / maxValue));
                  return (
                    <div key={s.key} className="flex-1 flex items-end">
                      <div
                        className="w-full rounded-md transition-all"
                        style={{ height: `${ratio * height}px`, backgroundColor: s.color || palette[idx % palette.length], opacity: 0.9 }}
                        title={`${s.label}: ${toCurrency(value)}`}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 font-medium">{row.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          {series.map((s, idx) => (
            <span key={s.key} className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-800/60 border border-slate-800">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color || palette[idx % palette.length] }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Donut({ categories }) {
  const total = categories.reduce((sum, c) => sum + c.value, 0);
  const slices = [];
  let acc = 0;
  categories.forEach((c, idx) => {
    const pct = total ? (c.value / total) * 100 : 0;
    const start = acc;
    const end = acc + pct;
    slices.push(`${palette[idx % palette.length]} ${start}% ${end}%`);
    acc = end;
  });
  const gradient = slices.length ? `conic-gradient(${slices.join(',')})` : 'conic-gradient(#334155 0% 100%)';
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-48 h-48">
        <div className="w-full h-full rounded-full" style={{ backgroundImage: gradient }} />
        <div className="absolute inset-8 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
          <div className="text-center">
            <p className="text-slate-400 text-xs">Total</p>
            <p className="text-white font-semibold">{toCurrency(total)}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-[240px] space-y-2">
        {categories.length === 0 ? (
          <p className="text-slate-400 text-sm">No category data for this month.</p>
        ) : (
          categories.map((c, idx) => (
            <div key={c.label} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: palette[idx % palette.length] }} />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{c.label}</p>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${total ? (c.value / total) * 100 : 0}%`, backgroundColor: palette[idx % palette.length] }}
                  />
                </div>
              </div>
              <p className="text-slate-300 text-sm font-medium">{toCurrency(c.value)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function FinancialAnalytics() {
  const { currentMonth, refreshTrigger } = useFinance();
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState({ months: [], income: [], expenses: [], loans: [], debts: [] });
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(6);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, refreshTrigger, range]);

  const loadData = async () => {
    try {
      setLoading(true);
      const trendParams = { month_year: currentMonth, months: range };
      const [overviewRes, trendRes, categoriesRes, fallbackTrendRes] = await Promise.all([
        getMonthlyOverview(currentMonth),
        getMonthlyTrend(trendParams).catch(() => null),
        getCategoryBreakdown(currentMonth).catch(() => null),
        getTrends({ month_year: currentMonth, months: range }).catch(() => null),
      ]);

      setOverview(overviewRes?.data?.overview || overviewRes?.data || null);
      const normalizedTrend = normalizeTrend(trendRes || fallbackTrendRes || {});
      setTrend(normalizedTrend);
      setCategories(normalizeCategories(categoriesRes || {}));
    } catch (err) {
      console.error('Failed to load analytics', err);
      setToast({ message: 'Could not load analytics. Please retry.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const trendRows = useMemo(() => {
    const months = trend.months && trend.months.length ? trend.months : [];
    return months.map((m, idx) => ({
      label: monthLabel(m),
      income: Number(trend.income?.[idx]) || 0,
      expenses: Number(trend.expenses?.[idx]) || 0,
      loans: Number(trend.loans?.[idx]) || 0,
      debts: Number(trend.debts?.[idx]) || 0,
    }));
  }, [trend]);

  const incomeVsExpenseSeries = [
    { key: 'income', label: 'Income', color: '#22d3ee' },
    { key: 'expenses', label: 'Expenses', color: '#f472b6' },
  ];
  const loanDebtSeries = [
    { key: 'loans', label: 'Loans / EMI', color: '#38bdf8' },
    { key: 'debts', label: 'Debts', color: '#f97316' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-5 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">Insights</p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Financial Analytics</h1>
            <p className="text-slate-400 text-sm">Read-only visuals for {monthLabel(currentMonth)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <MonthSelector />
            <Select
              id="analytics-range"
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              options={[
                { value: 3, label: 'Last 3 months' },
                { value: 6, label: 'Last 6 months' },
                { value: 12, label: 'Last 12 months' },
              ]}
              placeholder="Select range"
            />
          </div>
        </header>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Income" amount={overview?.income?.total || 0} type="income" />
          <SummaryCard title="Total Expenses" amount={overview?.expenses?.total || 0} type="expense" />
          <SummaryCard title="Total Loans (EMI)" amount={overview?.emis?.total || 0} type="loan" />
          <SummaryCard title="Total Debts" amount={overview?.debts?.total || 0} type="debt" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Income vs Expenses</h2>
                <p className="text-xs text-slate-400">Monthly comparison for the selected range</p>
              </div>
              {loading && <span className="text-xs text-slate-400">Loading...</span>}
            </div>
            <BarChart data={trendRows} series={incomeVsExpenseSeries} />
          </section>

          <section className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Loans vs Debts</h2>
                <p className="text-xs text-slate-400">EMI and debt movement over time</p>
              </div>
              {loading && <span className="text-xs text-slate-400">Loading...</span>}
            </div>
            <BarChart data={trendRows} series={loanDebtSeries} />
          </section>
        </div>

        <section className="p-5 rounded-xl border border-slate-800 bg-slate-900/70 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Category-wise Expenses</h2>
              <p className="text-xs text-slate-400">Breakdown for {monthLabel(currentMonth)}</p>
            </div>
            {loading && <span className="text-xs text-slate-400">Loading...</span>}
          </div>
          <Donut categories={categories} />
        </section>
      </div>
    </div>
  );
}
