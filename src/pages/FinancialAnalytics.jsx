import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, PiggyBank, BarChart3, Shield, Scale } from 'lucide-react';
import Toast from '../components/Toast';
import { useFinance } from '../context/FinanceContext';
import { getMonthlyOverview, getCategoryBreakdown, getTrends } from '../api/dashboard';

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

// Transform backend trends response to chart-friendly format
// Backend format: { trends: [{ month_year, income, expenses, emis, balance, savings_rate }] }
const normalizeTrend = (payload) => {
	const data = payload?.data || payload || {};
	
	// Handle actual backend format: { trends: [...] }
	if (Array.isArray(data.trends)) {
		const trends = data.trends;
		return {
			months: trends.map(t => t.month_year),
			income: trends.map(t => Number(t.income) || 0),
			expenses: trends.map(t => Number(t.expenses) || 0),
			emis: trends.map(t => Number(t.emis) || 0),
			balance: trends.map(t => Number(t.balance) || 0),
			savingsRate: trends.map(t => parseFloat(t.savings_rate) || 0),
		};
	}
	
	// Fallback for old format compatibility
	const trend = data.trend || data || {};
	const months = trend.months || trend.labels || [];
	const income = trend.income || trend.incomes || [];
	const expenses = trend.expenses || trend.expense || [];
	const emis = trend.emis || trend.loans || trend.emi || [];
	return { months, income, expenses, emis, balance: [], savingsRate: [] };
};

// Transform backend category breakdown response
// Backend format: { month_year, total_amount, breakdown: [{ category, amount, percentage, transaction_count, paid_count, pending_count }] }
const normalizeCategories = (payload) => {
	const data = payload?.data || payload || {};
	const raw = data.breakdown || data.categories || data;
	if (!Array.isArray(raw)) return [];
	return raw
		.map((item, idx) => ({
			label: item.category || item.name || `Category ${idx + 1}`,
			value: Number(item.amount || item.total || item.value || 0) || 0,
			percentage: parseFloat(item.percentage) || 0,
			transactionCount: item.transaction_count || 0,
			paidCount: item.paid_count || 0,
			pendingCount: item.pending_count || 0,
		}))
		.filter((c) => c.value > 0);
};

// Smooth Area Chart Component
function AreaChart({ data, series, height = 200, showLegend = true, activeKeys = [] }) {
	const maxValue = useMemo(() => {
		const activeSeries = activeKeys.length > 0 ? series.filter(s => activeKeys.includes(s.key)) : series;
		const values = data.flatMap((row) => activeSeries.map((s) => Number(row[s.key]) || 0));
		return Math.max(...values, 1);
	}, [data, series, activeKeys]);

	const points = useMemo(() => {
		const activeSeries = activeKeys.length > 0 ? series.filter(s => activeKeys.includes(s.key)) : series;
		return activeSeries.map(s => {
			const pts = data.map((row, idx) => {
				const value = Number(row[s.key]) || 0;
				const x = data.length > 1 ? (idx / (data.length - 1)) * 100 : 50;
				const y = 100 - (value / maxValue) * 85;
				return { x, y, value, label: row.label };
			});
			return { ...s, points: pts };
		});
	}, [data, series, maxValue, activeKeys]);

	const createPath = (pts) => {
		if (pts.length < 2) return '';
		let d = `M ${pts[0].x} ${pts[0].y}`;
		for (let i = 1; i < pts.length; i++) {
			const prev = pts[i - 1];
			const curr = pts[i];
			const cpx1 = prev.x + (curr.x - prev.x) / 3;
			const cpx2 = prev.x + (2 * (curr.x - prev.x)) / 3;
			d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
		}
		return d;
	};

	const createAreaPath = (pts) => {
		if (pts.length < 2) return '';
		let d = createPath(pts);
		d += ` L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`;
		return d;
	};

	return (
		<div className="w-full">
			<div className="relative" style={{ height: `${height}px` }}>
				<svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
					<defs>
						{points.map((s) => (
							<linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={s.color} stopOpacity="0.3" />
								<stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
							</linearGradient>
						))}
					</defs>
					{/* Grid lines */}
					{[0, 25, 50, 75, 100].map(y => (
						<line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgb(51 65 85 / 0.3)" strokeWidth="0.2" />
					))}
					{/* Area fills */}
					{points.map((s) => (
						<path key={`area-${s.key}`} d={createAreaPath(s.points)} fill={`url(#gradient-${s.key})`} />
					))}
					{/* Lines */}
					{points.map((s) => (
						<path key={`line-${s.key}`} d={createPath(s.points)} fill="none" stroke={s.color} strokeWidth="0.5" strokeLinecap="round" />
					))}
					{/* Points */}
					{points.map((s) =>
						s.points.map((pt, idx) => (
							<circle key={`point-${s.key}-${idx}`} cx={pt.x} cy={pt.y} r="1" fill={s.color} className="opacity-80" />
						))
					)}
				</svg>
				{/* X-axis labels */}
				<div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 transform translate-y-6">
					{data.map((row, idx) => (
						<span key={idx} className="text-[10px] text-slate-500 font-medium">{row.label}</span>
					))}
				</div>
			</div>
			{showLegend && (
				<div className="flex flex-wrap gap-4 mt-8 text-xs text-slate-300">
					{(activeKeys.length > 0 ? series.filter(s => activeKeys.includes(s.key)) : series).map((s) => (
						<span key={s.key} className="flex items-center gap-2">
							<span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
							{s.label}
						</span>
					))}
				</div>
			)}
		</div>
	);
}

// Horizontal Bar Chart for Categories
function HorizontalBarChart({ categories, previousCategories = [] }) {
	const maxValue = Math.max(...categories.map(c => c.value), 1);
	const total = categories.reduce((sum, c) => sum + c.value, 0);

	const getChange = (category) => {
		const prev = previousCategories.find(p => p.label === category.label);
		if (!prev || prev.value === 0) return null;
		return ((category.value - prev.value) / prev.value * 100).toFixed(0);
	};

	return (
		<div className="space-y-4">
			{categories.slice(0, 5).map((c, idx) => {
				const pct = total ? (c.value / total * 100).toFixed(1) : 0;
				const change = getChange(c);
				return (
					<div key={c.label} className="group">
						<div className="flex items-center justify-between mb-1.5">
							<div className="flex items-center gap-3">
								<span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: palette[idx % palette.length] + '40' }}>
									{idx + 1}
								</span>
								<span className="text-white font-medium text-sm">{c.label}</span>
							</div>
							<div className="flex items-center gap-3">
								<span className="text-slate-400 text-xs">{pct}%</span>
								{change !== null && (
									<span className={`text-xs font-medium ${Number(change) > 0 ? 'text-rose-400' : Number(change) < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
										{Number(change) > 0 ? '↑' : Number(change) < 0 ? '↓' : '→'} {Math.abs(Number(change))}%
									</span>
								)}
								<span className="text-white font-semibold text-sm min-w-[80px] text-right">{toCurrency(c.value)}</span>
							</div>
						</div>
						<div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${(c.value / maxValue) * 100}%` }}
								transition={{ duration: 0.8, delay: idx * 0.1 }}
								className="h-full rounded-full"
								style={{ backgroundColor: palette[idx % palette.length] }}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}

// Insight Card Component
function InsightCard({ title, value, trend, interpretation, icon: Icon, color, delay = 0 }) {
	const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
	const TrendIcon = trendIcon;
	const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay }}
			className="group relative rounded-2xl border border-white/5 overflow-hidden transition-all duration-500 hover:border-opacity-20"
			style={{
				background: `linear-gradient(135deg, ${color}08 0%, rgba(15, 23, 42, 0.8) 100%)`,
				backdropFilter: 'blur(12px)',
				WebkitBackdropFilter: 'blur(12px)',
				borderColor: color + '20',
			}}
		>
			<div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: `linear-gradient(to bottom, ${color}08, transparent)` }} />
			<div className="relative p-5">
				<div className="flex items-start justify-between mb-3">
					<div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
						<Icon className="w-5 h-5" style={{ color }} />
					</div>
					<div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendColor}`} style={{ backgroundColor: color + '10' }}>
						<TrendIcon className="w-3 h-3" />
					</div>
				</div>
				<p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-1" style={{ color: color + 'aa' }}>{title}</p>
				<p className="text-2xl font-black text-white mb-2">{value}</p>
				<p className="text-xs text-slate-400 leading-relaxed">{interpretation}</p>
			</div>
		</motion.div>
	);
}

// Auto-generated Insights Panel
function InsightPanel({ insights }) {
	if (!insights || insights.length === 0) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.6 }}
			className="rounded-2xl border border-amber-500/20 overflow-hidden"
			style={{
				background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)',
				backdropFilter: 'blur(12px)',
			}}
		>
			<div className="p-5">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
						<svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h3 className="text-white font-semibold text-sm">Smart Insights</h3>
						<p className="text-slate-400 text-xs">Auto-generated observations from your data</p>
					</div>
				</div>
				<div className="space-y-3">
					{insights.map((insight, idx) => (
						<div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
							<div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${insight.type === 'warning' ? 'bg-amber-400' : insight.type === 'positive' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
							<p className="text-slate-300 text-sm leading-relaxed">{insight.message}</p>
						</div>
					))}
				</div>
			</div>
		</motion.div>
	);
}

export default function FinancialAnalytics() {
	const { currentMonth, refreshTrigger } = useFinance();
	// Updated state to match actual backend format (emis instead of loans, no debts in trends)
	const [trendData, setTrendData] = useState({ months: [], income: [], expenses: [], emis: [], balance: [], savingsRate: [] });
	const [categories, setCategories] = useState([]);
	const [overviewHistory, setOverviewHistory] = useState([]);
	const [toast, setToast] = useState(null);
	const [loading, setLoading] = useState(true);
	const [range, setRange] = useState(1);
	const [activeChartKeys, setActiveChartKeys] = useState(['income', 'expenses', 'savings']);

	const rangeOptions = [
		{ value: 1, label: '1 Month' },
		{ value: 3, label: '3 Months' },
		{ value: 6, label: '6 Months' },
		{ value: 12, label: '12 Months' },
	];

	useEffect(() => {
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentMonth, refreshTrigger, range]);

	const loadData = async () => {
		try {
			setLoading(true);

			// Fetch trend data and category breakdown
			const [trendRes, categoriesRes] = await Promise.all([
				getTrends({ months: range }).catch((err) => {
					console.error('Trends API error:', err.response?.data?.error || err.message);
					return null;
				}),
				getCategoryBreakdown(currentMonth).catch((err) => {
					console.error('Category breakdown API error:', err.response?.data?.error || err.message);
					return null;
				}),
			]);

			// Normalize and set trend data
			// Backend returns: { trends: [...], period_months, start_month, end_month }
			const normalizedTrend = normalizeTrend(trendRes || {});
			setTrendData(normalizedTrend);
			
			// Backend returns: { month_year, total_amount, breakdown: [...] }
			setCategories(normalizeCategories(categoriesRes || {}));

			// Fetch monthly overviews for historical comparison
			// Backend returns: { overview: { income, expenses, emis, debts, summary } }
			const overviews = [];
			for (let i = 0; i < Math.min(range, 3); i++) {
				const date = new Date(currentMonth + '-01');
				date.setMonth(date.getMonth() - i);
				const monthStr = date.toISOString().slice(0, 7);
				try {
					const res = await getMonthlyOverview(monthStr);
					// Extract overview directly - backend returns { overview: {...} }
					const overview = res?.data?.overview || res?.overview || res?.data || {};
					// Transform to consistent format with calculated counts
					overviews.push({
						month: monthStr,
						data: {
							income: {
								total: overview.income?.total || 0,
								count: overview.income?.count || 0,
							},
							expenses: {
								total: overview.expenses?.total || 0,
								count: (overview.expenses?.paid_count || 0) + (overview.expenses?.pending_count || 0),
								paid: overview.expenses?.paid || 0,
								pending: overview.expenses?.pending || 0,
							},
							emis: {
								total: overview.emis?.total || 0,
								count: (overview.emis?.paid_count || 0) + (overview.emis?.pending_count || 0),
								paid: overview.emis?.paid || 0,
								pending: overview.emis?.pending || 0,
							},
							debts: {
								total: overview.debts?.total || 0,
								count: overview.debts?.count || 0,
							},
							summary: overview.summary || {},
						},
					});
				} catch (err) {
					console.error(`Monthly overview API error for ${monthStr}:`, err.response?.data?.error || err.message);
					overviews.push({ month: monthStr, data: {} });
				}
			}
			setOverviewHistory(overviews);

		} catch (err) {
			console.error('Failed to load analytics', err);
			setToast({ message: 'Could not load analytics. Please retry.', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	// Transform trend data for charts
	// Uses backend-provided balance and savings_rate when available
	const chartData = useMemo(() => {
		const months = trendData.months || [];
		return months.map((m, idx) => {
			const income = Number(trendData.income?.[idx]) || 0;
			const expenses = Number(trendData.expenses?.[idx]) || 0;
			const emis = Number(trendData.emis?.[idx]) || 0;
			// Use backend-provided balance if available, otherwise calculate
			const balance = Number(trendData.balance?.[idx]) || (income - expenses - emis);
			const savingsRate = Number(trendData.savingsRate?.[idx]) || (income > 0 ? ((income - expenses) / income * 100) : 0);
			
			return {
				label: monthLabel(m),
				income,
				expenses,
				emis, // Backend uses 'emis' not 'loans'
				balance,
				savingsRate,
				// For compatibility with existing savings chart key
				savings: Math.max(0, income - expenses),
			};
		});
	}, [trendData]);

	// Calculate insights metrics
	const insights = useMemo(() => {
		const current = overviewHistory[0]?.data || {};
		const previous = overviewHistory[1]?.data || {};

		// Average Monthly Savings
		const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
		const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0);
		const avgSavings = chartData.length > 0 ? (totalIncome - totalExpenses) / chartData.length : 0;
		const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

		// Expense Growth Rate
		const currentExpense = Number(current?.expenses?.total) || 0;
		const prevExpense = Number(previous?.expenses?.total) || 0;
		const expenseGrowth = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense * 100) : 0;

		// Income Stability
		const incomeValues = chartData.map(d => d.income).filter(v => v > 0);
		const avgIncome = incomeValues.length > 0 ? incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length : 0;
		const incomeVariance = incomeValues.length > 1
			? Math.sqrt(incomeValues.reduce((sum, v) => sum + Math.pow(v - avgIncome, 2), 0) / incomeValues.length)
			: 0;
		const incomeStability = avgIncome > 0 ? Math.max(0, 100 - (incomeVariance / avgIncome * 100)) : 0;

		// Debt vs EMI Load
		const currentDebts = Number(current?.debts?.total) || 0;
		const currentEmi = Number(current?.emis?.total) || 0;
		const currentIncome = Number(current?.income?.total) || 0;
		const debtEmiLoad = currentIncome > 0 ? ((currentDebts + currentEmi) / currentIncome * 100) : 0;

		return {
			avgSavings: { value: avgSavings, rate: savingsRate },
			expenseGrowth: { value: expenseGrowth },
			incomeStability: { value: incomeStability },
			debtEmiLoad: { value: debtEmiLoad, emi: currentEmi, debt: currentDebts },
		};
	}, [chartData, overviewHistory]);

	// Auto-generated insights
	const smartInsights = useMemo(() => {
		const list = [];
		const current = overviewHistory[0]?.data || {};
		const currentIncome = Number(current?.income?.total) || 0;
		const currentExpense = Number(current?.expenses?.total) || 0;

		// Expense vs Income
		if (currentExpense > currentIncome && currentIncome > 0) {
			list.push({
				type: 'warning',
				message: `Your expenses (${toCurrency(currentExpense)}) exceeded income (${toCurrency(currentIncome)}) this month. Consider reviewing non-essential spending.`
			});
		}

		// Expense growth warning
		if (insights.expenseGrowth.value > 20) {
			list.push({
				type: 'warning',
				message: `Expenses grew by ${insights.expenseGrowth.value.toFixed(0)}% compared to last month. This is higher than typical growth patterns.`
			});
		}

		// Savings positive
		if (insights.avgSavings.rate > 20) {
			list.push({
				type: 'positive',
				message: `Great job! You're saving ${insights.avgSavings.rate.toFixed(0)}% of your income on average. This is above the recommended 20% threshold.`
			});
		}

		// Debt load warning
		if (insights.debtEmiLoad.value > 40) {
			list.push({
				type: 'warning',
				message: `Your debt and EMI payments account for ${insights.debtEmiLoad.value.toFixed(0)}% of income. Financial advisors recommend keeping this below 40%.`
			});
		}

		// Income stability
		if (insights.incomeStability.value > 80) {
			list.push({
				type: 'positive',
				message: `Your income shows ${insights.incomeStability.value.toFixed(0)}% stability. Consistent income helps with better financial planning.`
			});
		}

		// Top expense category
		if (categories.length > 0) {
			const topCategory = categories[0];
			const total = categories.reduce((sum, c) => sum + c.value, 0);
			const pct = total > 0 ? (topCategory.value / total * 100).toFixed(0) : 0;
			list.push({
				type: 'info',
				message: `"${topCategory.label}" is your highest expense category at ${pct}% of total spending (${toCurrency(topCategory.value)}).`
			});
		}

		return list.slice(0, 4);
	}, [overviewHistory, insights, categories]);

	const incomeExpenseSeries = [
		{ key: 'income', label: 'Income', color: '#10b981' },
		{ key: 'expenses', label: 'Expenses', color: '#f43f5e' },
		{ key: 'savings', label: 'Net Savings', color: '#22d3ee' },
	];

	// Note: Backend trends endpoint only provides 'emis', not 'debts'
	// Debts are available from monthly overview but not in trends array
	const emiSeries = [
		{ key: 'emis', label: 'EMI Payments', color: '#3b82f6' },
		{ key: 'balance', label: 'Monthly Balance', color: '#10b981' },
	];

	const toggleChartKey = (key) => {
		setActiveChartKeys(prev =>
			prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
		);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 md:p-8">
			<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

			<div className="max-w-7xl mx-auto space-y-8">
				{/* Header */}
				<motion.header
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="flex flex-col md:flex-row md:items-center justify-between gap-6"
				>
					<div>
						<p className="text-[10px] uppercase tracking-[0.25em] font-bold text-cyan-400/80 mb-3 flex items-center gap-2">
							<span className="w-6 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent"></span>
							INSIGHTS
						</p>
						<h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white via-slate-50 to-slate-400 bg-clip-text text-transparent mb-2">
							Financial Analytics
						</h1>
						<p className="text-slate-400 text-sm font-medium">Trends and insights based on your activity</p>
					</div>

					{/* Time Range Selector */}
					<div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-800/50 border border-slate-700/50">
						{rangeOptions.map((opt) => (
							<button
								key={opt.value}
								onClick={() => setRange(opt.value)}
								className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${range === opt.value
									? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
									: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
									}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				</motion.header>

				{/* Insight Summary Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<InsightCard
						title="Avg Monthly Savings"
						value={toCurrency(insights.avgSavings.value)}
						trend={insights.avgSavings.rate > 15 ? 'up' : insights.avgSavings.rate < 5 ? 'down' : 'neutral'}
						interpretation={`${insights.avgSavings.rate.toFixed(0)}% of income saved on average`}
						icon={PiggyBank}
						color="#10b981"
						delay={0}
					/>
					<InsightCard
						title="Expense Growth"
						value={`${insights.expenseGrowth.value >= 0 ? '+' : ''}${insights.expenseGrowth.value.toFixed(1)}%`}
						trend={insights.expenseGrowth.value > 10 ? 'up' : insights.expenseGrowth.value < -5 ? 'down' : 'neutral'}
						interpretation={insights.expenseGrowth.value > 0 ? 'Spending increased vs last month' : 'Spending decreased vs last month'}
						icon={BarChart3}
						color="#f43f5e"
						delay={0.1}
					/>
					<InsightCard
						title="Income Stability"
						value={`${insights.incomeStability.value.toFixed(0)}%`}
						trend={insights.incomeStability.value > 70 ? 'up' : insights.incomeStability.value < 50 ? 'down' : 'neutral'}
						interpretation={insights.incomeStability.value > 70 ? 'Consistent income pattern' : 'Variable income detected'}
						icon={Shield}
						color="#3b82f6"
						delay={0.2}
					/>
					<InsightCard
						title="Debt & EMI Load"
						value={`${insights.debtEmiLoad.value.toFixed(0)}%`}
						trend={insights.debtEmiLoad.value > 40 ? 'down' : insights.debtEmiLoad.value < 20 ? 'up' : 'neutral'}
						interpretation={`${toCurrency(insights.debtEmiLoad.emi + insights.debtEmiLoad.debt)} of income committed`}
						icon={Scale}
						color="#f97316"
						delay={0.3}
					/>
				</div>

				{/* Core Trends Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Income vs Expenses Trend */}
					<motion.section
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="rounded-2xl border border-slate-700/50 overflow-hidden"
						style={{
							background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
						}}
					>
						<div className="p-6">
							<div className="flex items-start justify-between mb-6">
								<div>
									<h2 className="text-lg font-bold text-white mb-1">Income vs Expenses</h2>
									<p className="text-xs text-slate-400">Track your cash flow patterns over time</p>
								</div>
								{loading && (
									<span className="px-2 py-1 rounded-lg bg-slate-800/60 text-xs text-slate-400">Loading...</span>
								)}
							</div>
							{/* Toggle Buttons */}
							<div className="flex flex-wrap gap-2 mb-6">
								{incomeExpenseSeries.map((s) => (
									<button
										key={s.key}
										onClick={() => toggleChartKey(s.key)}
										className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeChartKeys.includes(s.key)
											? 'text-white border'
											: 'text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/50'
											}`}
										style={activeChartKeys.includes(s.key) ? {
											backgroundColor: s.color + '20',
											borderColor: s.color + '50',
											color: s.color
										} : {}}
									>
										{s.label}
									</button>
								))}
							</div>
							{chartData.length > 0 ? (
								<AreaChart data={chartData} series={incomeExpenseSeries} height={180} showLegend={false} activeKeys={activeChartKeys} />
							) : (
								<div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
									No trend data available
								</div>
							)}
						</div>
					</motion.section>

					{/* EMI & Balance Trend */}
					<motion.section
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.5 }}
						className="rounded-2xl border border-slate-700/50 overflow-hidden"
						style={{
							background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
						}}
					>
						<div className="p-6">
							<div className="flex items-start justify-between mb-6">
								<div>
									<h2 className="text-lg font-bold text-white mb-1">EMI & Monthly Balance</h2>
									<p className="text-xs text-slate-400">EMI payments and remaining balance over time</p>
								</div>
								{loading && (
									<span className="px-2 py-1 rounded-lg bg-slate-800/60 text-xs text-slate-400">Loading...</span>
								)}
							</div>
							{chartData.length > 0 ? (
								<AreaChart data={chartData} series={emiSeries} height={220} />
							) : (
								<div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
									No trend data available
								</div>
							)}
						</div>
					</motion.section>
				</div>

				{/* Bottom Section: Expense Intelligence + Insights */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Expense Intelligence */}
					<motion.section
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="lg:col-span-2 rounded-2xl border border-slate-700/50 overflow-hidden"
						style={{
							background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.02) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
						}}
					>
						<div className="p-6">
							<div className="flex items-start justify-between mb-6">
								<div>
									<h2 className="text-lg font-bold text-white mb-1">Expense Intelligence</h2>
									<p className="text-xs text-slate-400">Top spending categories for {monthLabel(currentMonth)}</p>
								</div>
								{categories.length > 0 && (
									<div className="text-right">
										<p className="text-xs text-slate-400">Total</p>
										<p className="text-lg font-bold text-white">{toCurrency(categories.reduce((sum, c) => sum + c.value, 0))}</p>
									</div>
								)}
							</div>
							{categories.length > 0 ? (
								<HorizontalBarChart categories={categories} />
							) : (
								<div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
									No category data for this month
								</div>
							)}
						</div>
					</motion.section>

					{/* Smart Insights Panel */}
					<InsightPanel insights={smartInsights} />
				</div>

				{/* Backend Data Requirements Notice */}
				{(chartData.length === 0 || categories.length === 0) && !loading && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="rounded-2xl border border-slate-700/50 p-6 text-center"
						style={{ background: 'rgba(15, 23, 42, 0.6)' }}
					>
						<p className="text-slate-400 text-sm mb-2">Some analytics data is unavailable.</p>
						<p className="text-slate-500 text-xs">
							Required backend endpoints: /api/dashboard/trends, /api/dashboard/category-breakdown/{'{month}'},
							/api/dashboard/monthly/{'{month}'} with historical comparison support.
						</p>
					</motion.div>
				)}
			</div>
		</div>
	);
}
