import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';
import Calendar from '../components/Calendar';
import SummaryCard from '../components/SummaryCard';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Sparkline from '../components/Sparkline';
import { useFinance } from '../context/FinanceContext';
import { addIncome, deleteIncome, getIncome, updateIncome } from '../api/income';
import {
	addMonthlyExpense,
	updateMonthlyExpense,
	deleteMonthlyExpense,
	getMonthlyExpenses,
	generateMonthlyExpenses,
	addRecurringExpense,
	updateRecurringExpense,
	deleteRecurringExpense,
} from '../api/expenses';
import {
	getLoans,
	addLoan,
	updateLoan,
	deleteLoan,
	getMonthlyEMIDue,
} from '../api/loans';
import {
	addDebt,
	deleteDebt,
	getDebts,
	updateDebt,
	getMonthlyDebtsDue,
} from '../api/debts';
import {
	getMonthlyOverview,
	getAllTransactions,
	getLoanSummary,
} from '../api/dashboard';
import { createApiClient } from '../api/apiClient';

const today = new Date().toISOString().split('T')[0];

const currency = (value) => {
	const num = Number(value || 0);
	if (Number.isNaN(num)) return '₹0';
	return new Intl.NumberFormat('en-IN', {
		style: 'currency',
		currency: 'INR',
		minimumFractionDigits: 0,
	}).format(num);
};

const toMonth = (dateString, fallbackMonth) => {
	if (!dateString) return fallbackMonth;
	return dateString.slice(0, 7);
};

const blankIncome = {
	id: null,
	source: '',
	amount: '',
	description: '',
	received_on: today,
};

const blankExpense = {
	id: null,
	description: '',
	amount: '',
	category: '',
	due_date: today,
	status: 'pending',
	payment_method: 'cash',
	is_recurring: false,
	recurring_due_day: '1',
	recurring_end_date: '',
	recurring_expense_id: null,
};

const blankLoan = {
	id: null,
	loan_name: '',
	principal_amount: '',
	interest_rate: '',
	tenure_months: '',
	start_date: today,
	notes: '',
};

const blankDebt = {
	id: null,
	debt_name: '',
	total_amount: '',
	creditor: '',
	due_date: today,
	notes: '',
};

const inputClass = (hasError) =>
	`w-full mt-1 px-3 py-2 rounded-lg bg-slate-800 border ${
		hasError ? 'border-red-500/60 focus:border-red-500' : 'border-emerald-500/20 focus:border-emerald-500/40'
	} text-white transition-all duration-200 placeholder:text-slate-500 focus:outline-none`;

export default function Dashboard() {
	const { currentMonth, triggerRefresh, refreshTrigger } = useFinance();
	const location = useLocation();
	const dashboardApi = useMemo(() => createApiClient('/api/dashboard'), []);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [toast, setToast] = useState(null);
	const [modal, setModal] = useState({ type: null, mode: null, payload: null });
	const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });
	const [reportDownloading, setReportDownloading] = useState(false);

	const [incomeForm, setIncomeForm] = useState(blankIncome);
	const [expenseForm, setExpenseForm] = useState(blankExpense);
	const [loanForm, setLoanForm] = useState(blankLoan);
	const [debtForm, setDebtForm] = useState(blankDebt);
	const [incomeErrors, setIncomeErrors] = useState({});
	const [expenseErrors, setExpenseErrors] = useState({});
	const [loanErrors, setLoanErrors] = useState({});
	const [debtErrors, setDebtErrors] = useState({});
	const [incomeWarnings, setIncomeWarnings] = useState({});
	const [loanWarnings, setLoanWarnings] = useState({});

	const [incomeList, setIncomeList] = useState([]);
	const [expenses, setExpenses] = useState([]);
	const [loans, setLoans] = useState([]);
	const [loanSummaries, setLoanSummaries] = useState({});
	const [monthlyEmis, setMonthlyEmis] = useState([]);
	const [debts, setDebts] = useState([]);
	const [monthlyDebts, setMonthlyDebts] = useState([]);
	const [overview, setOverview] = useState(null);
	const [transactions, setTransactions] = useState([]);

	 // Refs for initial focus in modals
	 const incomeSourceRef = useRef(null);
	 const expenseDescriptionRef = useRef(null);
	 const loanNameRef = useRef(null);
	 const debtNameRef = useRef(null);

	useEffect(() => {
		loadDashboard();
	}, [currentMonth, refreshTrigger]);

	// Close any open modal/confirm on route change to avoid stale overlays
	useEffect(() => {
		if (modal.type) setModal({ type: null, mode: null, payload: null });
		if (confirm.open) setConfirm((c) => ({ ...c, open: false }));
	}, [location.pathname]);

	// Focus first input when modal opens
	useEffect(() => {
		if (modal.type === 'income' && incomeSourceRef.current) {
			incomeSourceRef.current.focus();
		} else if (modal.type === 'expense' && expenseDescriptionRef.current) {
			expenseDescriptionRef.current.focus();
		} else if (modal.type === 'loan' && loanNameRef.current) {
			loanNameRef.current.focus();
		} else if (modal.type === 'debt' && debtNameRef.current) {
			debtNameRef.current.focus();
		}
	}, [modal.type]);

	const loadDashboard = async () => {
		setLoading(true);
		try {
			await generateMonthlyExpenses(currentMonth).catch(() => {});

			const [incomeRes, expenseRes, loansRes, emisRes, debtsRes, monthlyDebtsRes, overviewRes, txRes] = await Promise.all([
				getIncome({ month_year: currentMonth }),
				getMonthlyExpenses({ month_year: currentMonth }),
				getLoans(),
				getMonthlyEMIDue({ month_year: currentMonth }),
				getDebts(),
				getMonthlyDebtsDue({ month_year: currentMonth }),
				getMonthlyOverview(currentMonth),
				getAllTransactions(currentMonth),
			]);

			const incomeData = incomeRes.data?.income || incomeRes.data || [];
			const expenseData = expenseRes.data?.expenses || expenseRes.data || [];
			const loanData = loansRes.data?.loans || loansRes.data || [];
			const emiData = emisRes.data?.payments || emisRes.data?.emis || emisRes.data || [];
			const debtData = debtsRes.data?.debts || debtsRes.data || [];
			const monthDebtData = monthlyDebtsRes.data?.debts || monthlyDebtsRes.data || [];

			setIncomeList(Array.isArray(incomeData) ? incomeData : []);
			setExpenses(Array.isArray(expenseData) ? expenseData : []);
			setLoans(Array.isArray(loanData) ? loanData : []);
			setMonthlyEmis(Array.isArray(emiData) ? emiData : []);
			setDebts(Array.isArray(debtData) ? debtData : []);
			setMonthlyDebts(Array.isArray(monthDebtData) ? monthDebtData : []);
			setOverview(overviewRes.data?.overview || overviewRes.data || null);
			setTransactions(txRes.data?.transactions || []);

			fetchLoanSummaries(Array.isArray(loanData) ? loanData : []);
		} catch (err) {
			console.error('Failed to load dashboard', err);
			setToast({ message: 'Failed to load data. Please retry.', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const fetchLoanSummaries = async (list) => {
		if (!list.length) {
			setLoanSummaries({});
			return;
		}

		const summaries = await Promise.all(
			list.map(async (loan) => {
				try {
					const res = await getLoanSummary(loan.id);
					return [loan.id, res.data?.summary || {}];
				} catch (err) {
					console.warn('Loan summary failed', err);
					return [loan.id, {}];
				}
			})
		);

		setLoanSummaries(Object.fromEntries(summaries));
	};

	const totals = useMemo(() => {
		const incomeAmount = incomeList.reduce((sum, i) => sum + Number(i.amount || 0), 0);
		const expenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
		const loanEmiAmount = monthlyEmis.reduce((sum, emi) => sum + Number(emi.amount || emi.emi_amount || 0), 0);
		const debtOutstanding = monthlyDebts.length
			? monthlyDebts.reduce((sum, d) => sum + Number(d.outstanding_amount || d.amount_due || 0), 0)
			: debts.reduce((sum, d) => sum + Math.max(0, Number(d.total_amount || 0) - Number(d.amount_paid || 0)), 0);

		return {
			incomeAmount,
			expenseAmount,
			loanEmiAmount,
			debtOutstanding,
			incomeCount: incomeList.length,
			expenseCount: expenses.length,
			loanCount: loans.filter((l) => (l.status || '').toLowerCase() !== 'closed').length,
			debtCount: debts.length,
			balance: incomeAmount - expenseAmount - debtOutstanding,
		};
	}, [incomeList, expenses, loans, monthlyEmis, debts, monthlyDebts, overview]);

	const openIncomeModal = (item = null) => {
		setIncomeErrors({});
		setIncomeWarnings({});
		setIncomeForm(item ? { ...blankIncome, ...item, id: item.id } : blankIncome);
		setModal({ type: 'income', mode: item ? 'edit' : 'add', payload: item });
	};

	const openExpenseModal = (item = null) => {
		setExpenseErrors({});
		setExpenseForm(
			item
				? {
						...blankExpense,
						...item,
						id: item.id,
						is_recurring: !!item.recurring_expense_id,
						recurring_expense_id: item.recurring_expense_id || null,
						recurring_due_day: item.due_date ? new Date(item.due_date).getDate().toString() : '1',
					}
				: blankExpense
		);
		setModal({ type: 'expense', mode: item ? 'edit' : 'add', payload: item });
	};

	const openLoanModal = (item = null) => {
		setLoanErrors({});
		setLoanWarnings({});
		setLoanForm(item ? { ...blankLoan, ...item, id: item.id } : blankLoan);
		setModal({ type: 'loan', mode: item ? 'edit' : 'add', payload: item });
	};

	const openDebtModal = (item = null) => {
		setDebtErrors({});
		setDebtForm(item ? { ...blankDebt, ...item, id: item.id } : blankDebt);
		setModal({ type: 'debt', mode: item ? 'edit' : 'add', payload: item });
	};

	const closeModalAndReset = () => {
		setModal({ type: null, mode: null, payload: null });
		setIncomeForm(blankIncome);
		setExpenseForm(blankExpense);
		setLoanForm(blankLoan);
		setDebtForm(blankDebt);
		setIncomeErrors({});
		setExpenseErrors({});
		setLoanErrors({});
		setDebtErrors({});
		setIncomeWarnings({});
		setLoanWarnings({});
	};

	// Field-level change handlers with error clearing
	const handleIncomeChange = (eOrField, maybeValue) => {

		if (typeof eOrField === 'string') {
			const field = eOrField;
			const value = maybeValue;
			setIncomeForm(prev => ({ ...prev, [field]: value }));
			setIncomeErrors(prev => ({ ...prev, [field]: undefined }));
			setIncomeWarnings(prev => ({ ...prev, [field]: undefined }));
			return;
		}

		const { name, value } = eOrField.target;
		
		setIncomeForm(prev => ({ ...prev, [name]: value }));
		setIncomeErrors(prev => ({ ...prev, [name]: undefined }));
		setIncomeWarnings(prev => ({ ...prev, [name]: undefined }));
	};

	const handleExpenseChange = (eOrField, maybeValue) => {
		const name = typeof eOrField === 'string' ? eOrField : eOrField.target.name;
		const value = typeof eOrField === 'string' ? maybeValue : eOrField.target.value;
		setExpenseForm(prev => ({ ...prev, [name]: value }));
		setExpenseErrors(prev => ({ ...prev, [name]: undefined }));
	};

	const handleLoanChange = (eOrField, maybeValue) => {
		const name = typeof eOrField === 'string' ? eOrField : eOrField.target.name;
		const value = typeof eOrField === 'string' ? maybeValue : eOrField.target.value;
		setLoanForm(prev => ({ ...prev, [name]: value }));
		setLoanErrors(prev => ({ ...prev, [name]: undefined }));
		setLoanWarnings(prev => ({ ...prev, [name]: undefined }));
	};

	const handleDebtChange = (eOrField, maybeValue) => {
		const name = typeof eOrField === 'string' ? eOrField : eOrField.target.name;
		const value = typeof eOrField === 'string' ? maybeValue : eOrField.target.value;
		setDebtForm(prev => ({ ...prev, [name]: value }));
		setDebtErrors(prev => ({ ...prev, [name]: undefined }));
	};

	const validateIncome = () => {
		const errors = {};
		const warnings = {};
		if (!incomeForm.source.trim()) errors.source = 'Source is required';
		if (incomeForm.source && incomeForm.source.trim().length < 3) errors.source = 'Source must be at least 3 characters';
		if (incomeForm.source && incomeForm.source.length > 80) errors.source = 'Source must be 80 characters or fewer';
		if (!incomeForm.amount || Number(incomeForm.amount) <= 0) errors.amount = 'Amount must be greater than 0';
		if (!incomeForm.received_on) errors.received_on = 'Received date is required';
		// Warn about future income (but allow it)
		if (incomeForm.received_on && incomeForm.received_on > today) {
			warnings.received_on = 'Note: This is a future date';
		}
		if (incomeForm.description && incomeForm.description.length > 140) errors.description = 'Description must be 140 characters or fewer';
		setIncomeErrors(errors);
		setIncomeWarnings(warnings);
		return Object.keys(errors).length === 0;
	};

	const validateExpense = () => {
		const errors = {};
		if (!expenseForm.description.trim()) errors.description = 'Description is required';
		if (expenseForm.description && expenseForm.description.length > 140) errors.description = 'Description must be 140 characters or fewer';
		if (!expenseForm.amount || Number(expenseForm.amount) <= 0) errors.amount = 'Amount must be greater than 0';
		if (!expenseForm.due_date) errors.due_date = 'Due date is required';
		if (expenseForm.is_recurring && expenseForm.recurring_due_day && (Number(expenseForm.recurring_due_day) < 1 || Number(expenseForm.recurring_due_day) > 31)) {
			errors.recurring_due_day = 'Due day must be between 1 and 31';
		}
		// Validate recurring end date is not before start month
		if (expenseForm.is_recurring && expenseForm.recurring_end_date) {
			const dueYearMonth = toMonth(expenseForm.due_date, currentMonth);
			if (expenseForm.recurring_end_date < dueYearMonth) {
				errors.recurring_end_date = 'End month cannot be before start month';
			}
		}
		setExpenseErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const validateLoan = () => {
		const errors = {};
		const warnings = {};
		if (!loanForm.loan_name.trim()) errors.loan_name = 'Loan name is required';
		if (loanForm.loan_name && loanForm.loan_name.length > 80) errors.loan_name = 'Loan name must be 80 characters or fewer';
		if (!loanForm.principal_amount || Number(loanForm.principal_amount) <= 0) errors.principal_amount = 'Principal must be greater than 0';
		if (!loanForm.interest_rate || Number(loanForm.interest_rate) < 0) errors.interest_rate = 'Rate must be 0 or greater';
		if (!loanForm.tenure_months || Number(loanForm.tenure_months) <= 0) errors.tenure_months = 'Tenure must be greater than 0';
		// Ensure tenure is integer
		if (loanForm.tenure_months && !Number.isInteger(Number(loanForm.tenure_months))) errors.tenure_months = 'Tenure must be a whole number of months';
		if (!loanForm.start_date) errors.start_date = 'Start date is required';
		// Warn if start date is in future (but allow it)
		if (loanForm.start_date && loanForm.start_date > today) {
			warnings.start_date = 'Note: This is a future start date';
		}
		if (loanForm.notes && loanForm.notes.length > 300) errors.notes = 'Notes must be 300 characters or fewer';
		setLoanErrors(errors);
		setLoanWarnings(warnings);
		return Object.keys(errors).length === 0;
	};

	const validateDebt = () => {
		const errors = {};
		if (!debtForm.debt_name.trim()) errors.debt_name = 'Debt name is required';
		if (debtForm.debt_name && debtForm.debt_name.length > 80) errors.debt_name = 'Debt name must be 80 characters or fewer';
		if (!debtForm.total_amount || Number(debtForm.total_amount) <= 0) errors.total_amount = 'Amount must be greater than 0';
		if (!debtForm.due_date) errors.due_date = 'Due date is required';
		if (debtForm.notes && debtForm.notes.length > 300) errors.notes = 'Notes must be 300 characters or fewer';
		setDebtErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSaveIncome = async (e) => {
		e?.preventDefault();
		if (!validateIncome()) return;

		try {
			setSaving(true);
			const payload = { ...incomeForm, month_year: toMonth(incomeForm.received_on, currentMonth) };

			if (incomeForm.id) {
				const updated = await updateIncome(incomeForm.id, payload);
				const updatedItem = updated.data?.income || updated.data || payload;
				setIncomeList(list => list.map(i => (i.id === incomeForm.id ? { ...i, ...updatedItem } : i)));
				setToast({ message: 'Income updated', type: 'success' });
			} else {
				const created = await addIncome(payload);
				const newItem = created.data?.income || created.data || payload;
				setIncomeList(list => [...list, newItem]);
				setToast({ message: 'Income added', type: 'success' });
			}

			closeModalAndReset();
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save income', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteIncome = (item) => {
		setConfirm({
			open: true,
			title: 'Delete income',
			message: `Delete income from ${item.source}?`,
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteIncome(item.id);
					setIncomeList(list => list.filter(i => i.id !== item.id));
					setToast({ message: 'Income deleted', type: 'success' });
				} catch (err) {
					setToast({ message: 'Failed to delete income', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const saveRecurringTemplate = async (expensePayload) => {
		const [year, month] = (expensePayload.due_date || `${currentMonth}-01`).split('-');
		const startMonth = `${year}-${month}-01`;
		const recurringPayload = {
			category: expensePayload.category || 'Recurring',
			amount: Number(expensePayload.amount),
			description: expensePayload.description || null,
			payment_method: expensePayload.payment_method,
			due_day: Number(expenseForm.recurring_due_day || '1'),
			start_month: startMonth,
		};
		if (expenseForm.recurring_end_date) {
			const [ey, em] = expenseForm.recurring_end_date.split('-');
			recurringPayload.end_month = `${ey}-${em}-01`;
		}

		if (expenseForm.recurring_expense_id) {
			await updateRecurringExpense(expenseForm.recurring_expense_id, recurringPayload);
		} else {
			const created = await addRecurringExpense(recurringPayload);
			expensePayload.recurring_expense_id = created.data?.id || created.data?.recurring_expense?.id || null;
		}
	};

	const handleSaveExpense = async (e) => {
		e?.preventDefault();
		if (!validateExpense()) return;

		try {
			setSaving(true);
			const month_year = toMonth(expenseForm.due_date, currentMonth);
			const payload = {
				description: expenseForm.description,
				amount: expenseForm.amount,
				due_date: expenseForm.due_date,
				category: expenseForm.category,
				status: expenseForm.status,
				payment_method: expenseForm.payment_method,
				month_year,
				recurring_expense_id: expenseForm.recurring_expense_id,
			};

			if (expenseForm.id) {
				// Update existing expense
				if (expenseForm.is_recurring) {
					await saveRecurringTemplate(payload);
					await generateMonthlyExpenses(month_year);
				} else if (expenseForm.recurring_expense_id) {
					// Removing recurring flag from existing recurring expense
					await deleteRecurringExpense(expenseForm.recurring_expense_id, { month_year });
					payload.recurring_expense_id = null;
				}
				const updated = await updateMonthlyExpense(expenseForm.id, payload);
				const updatedItem = updated.data?.expense || updated.data || payload;
				setExpenses(list => list.map(exp => (exp.id === expenseForm.id ? { ...exp, ...updatedItem } : exp)));
				setToast({ message: 'Expense updated', type: 'success' });
			} else {
				// Add new expense
				if (expenseForm.is_recurring) {
					// For recurring expenses, create template and let generateMonthlyExpenses handle instances
					await saveRecurringTemplate(payload);
					await generateMonthlyExpenses(month_year);
					setToast({ message: 'Recurring expense added', type: 'success' });
					// Reload to get generated expense
					triggerRefresh();
				} else {
					// For one-time expenses, add directly
					const created = await addMonthlyExpense(payload);
					const newItem = created.data?.expense || created.data || payload;
					setExpenses(list => [...list, newItem]);
					setToast({ message: 'Expense added', type: 'success' });
				}
			}
			closeModalAndReset();
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save expense', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteExpense = (item) => {
		setConfirm({
			open: true,
			title: 'Delete expense',
			message: `Delete ${item.description}?`,
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteMonthlyExpense(item.id);
					if (item.recurring_expense_id) {
						await deleteRecurringExpense(item.recurring_expense_id, { month_year: currentMonth });
					}
					setExpenses(list => list.filter(exp => exp.id !== item.id));
					setToast({ message: 'Expense deleted', type: 'success' });
					// Trigger refresh if recurring to update derived data
					if (item.recurring_expense_id) {
						triggerRefresh();
					}
				} catch (err) {
					setToast({ message: 'Failed to delete expense', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleSaveLoan = async (e) => {
		e?.preventDefault();
		if (!validateLoan()) return;

		try {
			setSaving(true);
			if (loanForm.id) {
				const updated = await updateLoan(loanForm.id, loanForm);
				const updatedItem = updated.data?.loan || updated.data || loanForm;
				setLoans(list => list.map(loan => (loan.id === loanForm.id ? { ...loan, ...updatedItem } : loan)));
				setToast({ message: 'Loan updated', type: 'success' });
			} else {
				const created = await addLoan(loanForm);
				const newItem = created.data?.loan || created.data || loanForm;
				setLoans(list => [...list, newItem]);
				setToast({ message: 'Loan added', type: 'success' });
			}
			closeModalAndReset();
			// Reload dashboard to get updated EMIs and summaries
			await loadDashboard();
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save loan', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteLoan = (item) => {
		setConfirm({
			open: true,
			title: 'Delete loan',
			message: `Delete ${item.loan_name}?`,
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteLoan(item.id);
					setLoans(list => list.filter(loan => loan.id !== item.id));
					setToast({ message: 'Loan deleted', type: 'success' });
					// Reload dashboard to update EMIs
					await loadDashboard();
				} catch (err) {
					setToast({ message: 'Failed to delete loan', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleSaveDebt = async (e) => {
		e?.preventDefault();
		if (!validateDebt()) return;

		try {
			setSaving(true);
			const payload = { ...debtForm, month_year: currentMonth };
			if (debtForm.id) {
				const updated = await updateDebt(debtForm.id, payload);
				const updatedItem = updated.data?.debt || updated.data || payload;
				setDebts(list => list.map(debt => (debt.id === debtForm.id ? { ...debt, ...updatedItem } : debt)));
				setToast({ message: 'Debt updated', type: 'success' });
			} else {
				const created = await addDebt(payload);
				const newItem = created.data?.debt || created.data || payload;
				setDebts(list => [...list, newItem]);
				setToast({ message: 'Debt added', type: 'success' });
			}
			closeModalAndReset();
			// Trigger refresh to update monthly debts
			triggerRefresh();
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save debt', type: 'error' });
		} finally {
			setSaving(false);
		}
	};

	const handleDeleteDebt = (item) => {
		setConfirm({
			open: true,
			title: 'Delete debt',
			message: `Delete ${item.debt_name}?`,
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteDebt(item.id);
					setDebts(list => list.filter(debt => debt.id !== item.id));
					setToast({ message: 'Debt deleted', type: 'success' });
					// Trigger refresh to update monthly debts
					triggerRefresh();
				} catch (err) {
					setToast({ message: 'Failed to delete debt', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleDownloadReport = async () => {
		try {
			setReportDownloading(true);
			const response = await dashboardApi.get(`/report/download/${currentMonth}`, { responseType: 'blob' });
			const blob = response?.data;
			if (!blob || blob.size === 0) {
				throw new Error('Empty report');
			}
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `Monthly_Report_${currentMonth}.xlsx`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
			setToast({ message: 'Report downloaded', type: 'success' });
		} catch (err) {
			console.error('Report download failed', err);
			setToast({ message: 'Failed to download report', type: 'error' });
		} finally {
			setReportDownloading(false);
		}
	};

	// Premium fintech card styling with glassmorphism and interactive states
	const getCardClass = (cardType) => {
		const baseClass = 'group relative overflow-hidden rounded-2xl border backdrop-blur-xl cursor-pointer transition-all duration-300 ease-out';
		const hoverEffects = 'hover:scale-[1.015] active:scale-[0.99]';
		const shadows = 'shadow-md hover:shadow-xl';
		
		switch (cardType) {
			case 'income':
				return `${baseClass} ${hoverEffects} ${shadows} bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/30 border-emerald-500/15 hover:border-emerald-400/40 hover:shadow-emerald-500/10`;
			case 'expense':
				return `${baseClass} ${hoverEffects} ${shadows} bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/30 border-red-500/15 hover:border-red-400/40 hover:shadow-red-500/10`;
			case 'loan':
				return `${baseClass} ${hoverEffects} ${shadows} bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/30 border-blue-500/15 hover:border-blue-400/40 hover:shadow-blue-500/10`;
			case 'debt':
				return `${baseClass} ${hoverEffects} ${shadows} bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-slate-900/30 border-amber-500/15 hover:border-amber-400/40 hover:shadow-amber-500/10`;
			default:
				return `${baseClass} ${hoverEffects} ${shadows} bg-slate-900/60 border-slate-700/30 hover:border-slate-600/50`;
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
				<div className="flex flex-col items-center gap-4">
					<div className="relative">
						{/* Outer rotating ring */}
						<div className="w-16 h-16 rounded-full border-4 border-slate-700/30 border-t-transparent animate-spin"></div>
						{/* Inner pulsing ring */}
						<div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '0.8s' }}></div>
						{/* Glow effect */}
						<div className="absolute inset-0 w-16 h-16 rounded-full bg-teal-400/10 blur-xl animate-pulse"></div>
					</div>
					<div className="text-center space-y-1">
						<p className="text-slate-200 font-semibold text-lg">Loading Dashboard</p>
						<p className="text-slate-400 text-sm">Fetching your financial data...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen p-4 sm:p-6 md:p-8 relative">
			<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
			<ConfirmDialog
				open={confirm.open}
				title={confirm.title}
				message={confirm.message}
				loading={confirm.loading}
				onConfirm={confirm.onConfirm}
				onCancel={() => setConfirm({ open: false, loading: false })}
			/>

			<div className="max-w-7xl mx-auto space-y-8 relative z-10">
				<div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-8">
					<div>
						<p className="text-[10px] uppercase tracking-[0.25em] font-bold text-emerald-400/80 mb-3 flex items-center gap-2">
							<span className="w-6 h-[1px] bg-gradient-to-r from-emerald-400/50 to-transparent"></span>
							OVERVIEW
						</p>
						<h1 className="text-4xl md:text-5xl font-black bg-gradient-to-br from-white via-slate-50 to-slate-400 bg-clip-text text-transparent mb-2">Dashboard</h1>
						<p className="text-slate-400 text-sm font-medium">Manage your finances with precision</p>
					</div>
					<div className="flex flex-wrap gap-3 items-center">
						<MonthSelector />
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setModal({ type: 'report', mode: 'view', payload: null })}
							className="group relative px-5 py-2.5 rounded-2xl font-semibold text-sm bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-white border border-emerald-500/20 hover:border-emerald-400/40 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-500 shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 overflow-hidden"
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							Monthly Report
							<div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
						</motion.button>
					</div>
				</div>

				{/* Dashboard Cards - 2 Column Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{/* Income Card */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0 }}
						whileHover={{ y: -4 }}
						className="group relative rounded-[28px] border border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-emerald-400/20 hover:shadow-2xl hover:shadow-emerald-500/10"
						style={{
							background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
							WebkitBackdropFilter: 'blur(12px)',
						}}
						onClick={() => openIncomeModal()}
					>
						{/* Inner glow border */}
						<div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none"></div>
						
						<div className="relative p-6">
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-400/60 mb-2">TOTAL INCOME</p>
									<h3 className="text-3xl font-black text-white mb-3">{currency(totals.incomeAmount)}</h3>
									<div className="flex items-center gap-2">
										<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
											<TrendingUp className="w-3 h-3 text-emerald-400" />
											<span className="text-emerald-400 text-xs font-semibold">{totals.incomeCount} entries</span>
										</div>
									</div>
								</div>
								{/* Floating Add Button */}
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								>
									<Plus className="w-5 h-5 text-white" />
								</motion.div>
							</div>
							<Sparkline data={[30, 40, 35, 50, 49, 60, 70, 91, 100]} color="#10b981" width={120} height={40} />
						</div>
					</motion.div>

					{/* Expense Card */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						whileHover={{ y: -4 }}
						className="group relative rounded-[28px] border border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-rose-400/20 hover:shadow-2xl hover:shadow-rose-500/10"
						style={{
							background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
							WebkitBackdropFilter: 'blur(12px)',
						}}
						onClick={() => openExpenseModal()}
					>
						<div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none"></div>
						<div className="relative p-6">
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className="text-[10px] uppercase tracking-[0.2em] font-bold text-rose-400/60 mb-2">EXPENSES</p>
									<h3 className="text-3xl font-black text-white mb-3">{currency(totals.expenseAmount)}</h3>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 w-fit">
												<TrendingDown className="w-3 h-3 text-rose-400" />
												<span className="text-rose-400 text-xs font-semibold">{totals.expenseCount}</span>
											</div>
										</div>
										<div className="flex items-center gap-2 text-xs">
											<span className="text-emerald-400">✓ {expenses.filter(e => e.payment_status === 'Paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-amber-400">⏱ {expenses.filter(e => e.payment_status === 'Pending').length} pending</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								>
									<Plus className="w-5 h-5 text-white" />
								</motion.div>
							</div>
							<Sparkline data={[100, 80, 85, 70, 75, 60, 65, 50, 45]} color="#f43f5e" width={120} height={40} />
						</div>
					</motion.div>

					{/* Loan Card */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						whileHover={{ y: -4 }}
						className="group relative rounded-[28px] border border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-blue-400/20 hover:shadow-2xl hover:shadow-blue-500/10"
						style={{
							background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
							WebkitBackdropFilter: 'blur(12px)',
						}}
						onClick={() => openLoanModal()}
					>
						<div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
						<div className="relative p-6">
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-400/60 mb-2">LOANS</p>
									<h3 className="text-3xl font-black text-white mb-3">{currency(totals.loanEmiAmount)}</h3>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 w-fit">
												<CreditCard className="w-3 h-3 text-blue-400" />
												<span className="text-blue-400 text-xs font-semibold">{totals.loanCount}</span>
											</div>
										</div>
										<div className="flex items-center gap-2 text-xs">
											<span className="text-emerald-400">✓ {loans.filter(l => l.payment_status === 'Paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-amber-400">⏱ {loans.filter(l => l.payment_status === 'Due').length} due</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								>
									<Plus className="w-5 h-5 text-white" />
								</motion.div>
							</div>
							<Sparkline data={[40, 45, 50, 48, 52, 55, 60, 58, 62]} color="#3b82f6" width={120} height={40} />
						</div>
					</motion.div>

					{/* Debt Card */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.3 }}
						whileHover={{ y: -4 }}
						className="group relative rounded-[28px] border border-white/5 overflow-hidden cursor-pointer transition-all duration-500 hover:border-amber-400/20 hover:shadow-2xl hover:shadow-amber-500/10"
						style={{
							background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(15, 23, 42, 0.8) 100%)',
							backdropFilter: 'blur(12px)',
							WebkitBackdropFilter: 'blur(12px)',
						}}
						onClick={() => openDebtModal()}
					>
						<div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none"></div>
						<div className="relative p-6">
							<div className="flex items-start justify-between mb-4">
								<div>
									<p className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-400/60 mb-2">DEBTS</p>
									<h3 className="text-3xl font-black text-white mb-3">{currency(totals.debtOutstanding)}</h3>
									<div className="space-y-2">
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 w-fit">
												<Wallet className="w-3 h-3 text-amber-400" />
												<span className="text-amber-400 text-xs font-semibold">{totals.debtCount}</span>
											</div>
										</div>
										<div className="flex items-center gap-2 text-xs">
											<span className="text-emerald-400">✓ {debts.filter(d => d.status === 'Paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-amber-400">⏱ {debts.filter(d => d.status === 'Outstanding').length} outstanding</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								>
									<Plus className="w-5 h-5 text-white" />
								</motion.div>
							</div>
							<Sparkline data={[70, 65, 68, 60, 58, 55, 50, 48, 45]} color="#f59e0b" width={120} height={40} />
						</div>
					</motion.div>
				</div>
			</div>

			{/* Income Modal */}
			<Modal
				open={modal.type === 'income'}
				onClose={closeModalAndReset}
			ariaLabelledBy="income-modal-title"
		>
			{/* Header */}
			<div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
				<div>
					<h2 id="income-modal-title" className="text-2xl font-bold text-white mb-1">Manage Income Entries</h2>
					<p className="text-slate-400 text-sm">For {currentMonth}</p>
				</div>
				<button 
					onClick={closeModalAndReset} 
					className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
					aria-label="Close modal"
				>
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
				{/* Left Column - Form */}
				<div>
					<form onSubmit={handleSaveIncome} className="space-y-4">
						<Input
							label="Source *"
							id="income-source"
							name="source"
							value={incomeForm.source}
							onChange={handleIncomeChange}
							error={incomeErrors.source}
							maxLength={80}
							placeholder="Salary, Freelance, etc."
							required
							ref={incomeSourceRef}
						/>
						<Input
							label="Amount *"
							id="income-amount"
							name="amount"
							type="number"
							min="0"
							step="1"
							inputMode="numeric"
							integerOnly
							value={incomeForm.amount}
							onChange={handleIncomeChange}
							error={incomeErrors.amount}
							placeholder="0"
							required
						/>
						<div>
							<label className="text-sm font-medium text-slate-200 block mb-2">Received On *</label>
							<Calendar type="date" value={incomeForm.received_on} onChange={(date) => handleIncomeChange('received_on', date)} />
							{incomeErrors.received_on && <p id="income-received-on-error" className="text-xs text-red-400 mt-1">{incomeErrors.received_on}</p>}
							{!incomeErrors.received_on && incomeWarnings.received_on && <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
								<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
								{incomeWarnings.received_on}
							</p>}
						</div>
						<Input
							label="Description"
							id="income-desc"
							name="description"
							value={incomeForm.description}
							onChange={handleIncomeChange}
							maxLength={140}
							placeholder="Add notes..."
						/>
						<div className="flex gap-3 pt-2">
							<Button
								type="button"
								variant="secondary"
								onClick={closeModalAndReset}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button 
								type="submit" 
								loading={saving} 
								disabled={saving}
								className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
							>
								{incomeForm.id ? 'Update Income' : 'Add Income'}
							</Button>
						</div>
					</form>
				</div>

				{/* Right Column - Entries List */}
				<div className="border-l border-white/5 pl-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Income Entries</h3>
						<button 
							onClick={() => openIncomeModal()}
							className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all duration-200"
							aria-label="Add new income"
						>
							<Plus className="w-4 h-4" />
						</button>
					</div>
					<div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 modal-scrollbar">
						{incomeList.length === 0 && (
							<div className="text-center py-12">
								<div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
									<TrendingUp className="w-6 h-6 text-emerald-400" />
								</div>
								<p className="text-slate-400 text-sm">No income entries</p>
							</div>
						)}
						{incomeList.map((inc) => (
							<div key={inc.id} className="group p-4 rounded-xl bg-slate-900/40 border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all duration-200">
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<p className="text-white font-semibold mb-1">{inc.source}</p>
										<p className="text-emerald-400 font-bold text-sm">{currency(inc.amount)}</p>
										<p className="text-slate-500 text-xs mt-1">on {inc.received_on}</p>
									</div>
									<div className="flex gap-2">
										<Button 
											size="sm" 
											variant="ghost" 
											onClick={() => openIncomeModal(inc)}
											className="text-slate-400 hover:text-white text-xs px-3"
										>
											Edit
										</Button>
										<Button 
											size="sm" 
											variant="danger" 
											onClick={() => handleDeleteIncome(inc)}
											className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-3"
										>
											Delete
										</Button>
									</div>
								</div>
								{inc.description && <p className="text-slate-500 text-xs mt-2">{inc.description}</p>}
							</div>
						))}
					</div>
				</div>
			</div>
		</Modal>

		{/* Expense Modal */}
		<Modal
			open={modal.type === 'expense'}
			onClose={closeModalAndReset}
			contentClassName="p-6 w-full max-w-4xl"
			ariaLabelledBy="expense-modal-title"
		>
				<div className="mb-6 pb-6 border-b border-slate-700/60">
					<div className="flex items-center justify-between">
						<div>
							<h2 id="expense-modal-title" className="text-2xl font-bold text-white">Expenses</h2>
							<p className="text-slate-400 text-sm mt-1">Manage expenses for {currentMonth}</p>
						</div>
						<button 
							onClick={closeModalAndReset} 
							className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
							aria-label="Close modal"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<form onSubmit={handleSaveExpense} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-700/60">
					<Input
						label="Description"
						id="expense-desc"
						name="description"
						value={expenseForm.description}
						onChange={handleExpenseChange}
						error={expenseErrors.description}
						maxLength={140}
						placeholder="What did you spend on?"
												ref={expenseDescriptionRef}
						required
					/>
					<Input
						label="Amount"
						id="expense-amount"
						name="amount"
						type="number"
						min="0"
						step="1"
						inputMode="numeric"
						integerOnly
						value={expenseForm.amount}
						onChange={handleExpenseChange}
						error={expenseErrors.amount}
						placeholder="0"
						required
					/>
					<Input
						label="Category"
						id="expense-category"
						name="category"
						value={expenseForm.category}
						onChange={handleExpenseChange}
						maxLength={50}
						placeholder="Food, Transport, etc."
					/>
					<Select
						label="Payment Status"
						id="expense-status"
						name="status"
						value={expenseForm.status}
						onChange={handleExpenseChange}
						options={[
							{ value: 'pending', label: 'Pending' },
							{ value: 'paid', label: 'Paid' },
						]}
						required
					/>
					<div>
						<label className="text-sm font-medium text-slate-200 block mb-2">Due Date *</label>
						<Calendar type="date" value={expenseForm.due_date} onChange={(date) => handleExpenseChange('due_date', date)} />
						{expenseErrors.due_date && <p className="text-xs text-red-400 mt-1">{expenseErrors.due_date}</p>}
					</div>
					
					<div className="flex items-center gap-3 p-4 rounded-lg bg-slate-800/40 border border-slate-700/50">
						<input 
							id="recurring" 
							type="checkbox" 
							checked={expenseForm.is_recurring} 
							onChange={(e) => handleExpenseChange('is_recurring', e.target.checked)}
							className="w-4 h-4"
						/>
						<label htmlFor="recurring" className="text-sm text-slate-300 cursor-pointer">Mark as recurring expense</label>
					</div>

					{expenseForm.is_recurring && (
						<div className="grid grid-cols-2 gap-4 md:col-span-2 p-4 rounded-lg bg-teal-500/8 border border-teal-500/25 shadow-inner">
							<Input
								label="Due Day (1-31)"
								id="recurring-day"
								name="recurring_due_day"
								type="number"
								min="1"
								max="31"
								step="1"
								inputMode="numeric"
								integerOnly
								value={expenseForm.recurring_due_day}
								onChange={handleExpenseChange}
								error={expenseErrors.recurring_due_day}
								required
							/>
							<Input
								label="End Month (Optional)"
								id="recurring-end"
								name="recurring_end_date"
								type="month"
								value={expenseForm.recurring_end_date}
								onChange={handleExpenseChange}
							/>
						</div>
					)}

					<div className="md:col-span-2 flex gap-3 justify-end pt-4">
						<Button
							variant="secondary"
							onClick={closeModalAndReset}
							className="opacity-70 hover:opacity-100"
						>
							Cancel
						</Button>
						<Button type="submit" loading={saving} disabled={saving}>
							{expenseForm.id ? 'Update Expense' : 'Add Expense'}
						</Button>
					</div>
				</form>

				<div className="space-y-2 max-h-[320px] overflow-y-auto">
					{expenses.length === 0 && (
						<div className="text-center py-8">
							<p className="text-slate-400 text-sm">No expenses for this month.</p>
						</div>
					)}
					{expenses.map((exp) => (
						<div key={exp.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/70 hover:shadow-md transition-all duration-200">
							<div className="flex-1">
								<div className="flex items-center gap-2">
									<p className="text-white font-semibold">{exp.description}</p>
									{exp.status === 'paid' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-500/20">Paid</span>}
									{exp.status === 'pending' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20">Pending</span>}
								</div>
								<p className="text-slate-400 text-xs mt-1">{currency(exp.amount)} on {exp.due_date}</p>
								{exp.recurring_expense_id && <p className="text-teal-400 text-xs font-medium mt-1">✓ Recurring</p>}
							</div>
							<div className="flex gap-2">
								{exp.status === 'pending' && (
									<Button size="sm" variant="primary" className="transition-opacity active:opacity-50" onClick={() => {
										const updatedExp = { ...exp, status: 'paid' };
										updateMonthlyExpense(exp.id, updatedExp).then(() => {
											setExpenses(list => list.map(e => e.id === exp.id ? updatedExp : e));
											setToast({ message: 'Marked as paid', type: 'success' });
										}).catch(() => {
											setToast({ message: 'Failed to update status', type: 'error' });
										});
									}}>
										Mark Paid
									</Button>
								)}
								<Button size="sm" variant="ghost" onClick={() => openExpenseModal(exp)}>
									Edit
								</Button>
								<Button size="sm" variant="danger" onClick={() => handleDeleteExpense(exp)}>
									Delete
								</Button>
							</div>
						</div>
					))}
				</div>
			</Modal>

			{/* Loans Modal */}
			<Modal
				open={modal.type === 'loan'}
				onClose={closeModalAndReset}
				contentClassName="p-6 w-full max-w-4xl"
				ariaLabelledBy="loan-modal-title"
			>
				<div className="mb-6 pb-6 border-b border-slate-700/60">
					<div className="flex items-center justify-between">
						<div>
							<h2 id="loan-modal-title" className="text-2xl font-bold text-white">Loans & EMI</h2>
							<p className="text-slate-400 text-sm mt-1">Manage loans and track EMI payments</p>
						</div>
						<button 
							onClick={closeModalAndReset} 
							className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
							aria-label="Close modal"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<form onSubmit={handleSaveLoan} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-700/60">
					<Input
						label="Loan Name"
						id="loan-name"
						name="loan_name"
						value={loanForm.loan_name}
						onChange={handleLoanChange}
						error={loanErrors.loan_name}
						maxLength={80}
						placeholder="Home Loan, Car Loan, etc."
												ref={loanNameRef}
						required
					/>
					<Input
						label="Principal Amount"
						id="loan-principal"
						name="principal_amount"
						type="number"
						min="0"
						step="1"
						inputMode="numeric"
						integerOnly
						value={loanForm.principal_amount}
						onChange={handleLoanChange}
						error={loanErrors.principal_amount}
						placeholder="0"
						required
					/>
					<Input
						label="Interest Rate (% p.a)"
						id="loan-rate"
						name="interest_rate"
						type="number"
						step="0.01"
						min="0"
						inputMode="decimal"
						value={loanForm.interest_rate}
						onChange={handleLoanChange}
						error={loanErrors.interest_rate}
						placeholder="0.00"
						required
					/>
					<Input
						label="Tenure (months)"
						id="loan-tenure"
						name="tenure_months"
						type="number"
						min="1"
						step="1"
						inputMode="numeric"
						integerOnly
						value={loanForm.tenure_months}
						onChange={handleLoanChange}
						error={loanErrors.tenure_months}
						placeholder="60"
						required
					/>
					<div>
						<label className="text-sm font-medium text-slate-200 block mb-2">Start Date *</label>
						<Calendar type="date" value={loanForm.start_date} onChange={(date) => handleLoanChange('start_date', date)} />
						{loanErrors.start_date && <p id="loan-start-date-error" className="text-xs text-red-400 mt-1">{loanErrors.start_date}</p>}
						{!loanErrors.start_date && loanWarnings.start_date && <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
							<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
							</svg>
							{loanWarnings.start_date}
						</p>}
					</div>
					<Input
						label="Notes"
						id="loan-notes"
						name="notes"
						value={loanForm.notes}
						onChange={handleLoanChange}
						maxLength={300}
						placeholder="Additional details..."
					/>
					<div className="md:col-span-2 flex gap-3 justify-end pt-4">
						<Button
							variant="secondary"
							onClick={closeModalAndReset}
							className="opacity-70 hover:opacity-100"
						>
							Cancel
						</Button>
						<Button type="submit" loading={saving} disabled={saving}>
							{loanForm.id ? 'Update Loan' : 'Add Loan'}
						</Button>
					</div>
				</form>

				<div className="space-y-3 max-h-[320px] overflow-y-auto">
					{loans.length === 0 && (
						<div className="text-center py-8">
							<p className="text-slate-400 text-sm">No loans added yet.</p>
						</div>
					)}
					{loans.map((loan) => {
						const summary = loanSummaries[loan.id] || {};
						const paid = Number(summary.paid_payments || 0);
						const total = Number(summary.total_payments || loan.tenure_months || 0) || 1;
						const progress = Math.min(100, Math.round((paid / total) * 100));
						return (
							<div key={loan.id} className="p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-700 transition">
								<div className="flex items-center justify-between mb-3">
									<div>
										<p className="text-white font-semibold">{loan.loan_name}</p>
										<p className="text-slate-400 text-xs mt-1">Principal {currency(loan.principal_amount)} • EMI: {currency(loan.emi_amount)}</p>
									</div>
									<div className="flex gap-2">
										<Button size="sm" variant="ghost" onClick={() => openLoanModal(loan)}>
											Edit
										</Button>
										<Button size="sm" variant="danger" onClick={() => handleDeleteLoan(loan)}>
											Delete
										</Button>
									</div>
								</div>
								<div>
									<div className="flex justify-between text-xs text-slate-400 mb-1">
										<span>Progress</span>
										<span>{paid}/{total} paid</span>
									</div>
									<div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
										<div className="h-full bg-teal-500" style={{ width: `${progress}%` }} />
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-6 pt-6 border-t border-slate-700/60">
					<h3 className="text-white font-semibold mb-4">This Month's EMI Dues</h3>
					<div className="space-y-2 max-h-[240px] overflow-y-auto">
						{monthlyEmis.length === 0 && (
							<div className="text-center py-4">
								<p className="text-slate-400 text-sm">No EMIs due this month.</p>
							</div>
						)}
						{monthlyEmis.map((emi) => (
							<div key={emi.id || emi.payment_id} className="flex items-center justify-between p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
								<div>
									<p className="text-white font-semibold text-sm">{emi.loan_name || 'Loan EMI'}</p>
									<p className="text-slate-400 text-xs">Due {emi.payment_date || emi.due_date || currentMonth}</p>
								</div>
								<p className="text-teal-300 font-semibold">{currency(emi.amount || emi.emi_amount)}</p>
							</div>
						))}
					</div>
				</div>
			</Modal>

			{/* Debts Modal */}
			<Modal
				open={modal.type === 'debt'}
				onClose={closeModalAndReset}
				contentClassName="p-6 w-full max-w-4xl"
				ariaLabelledBy="debt-modal-title"
			>
				<div className="mb-6 pb-6 border-b border-slate-700/60">
					<div className="flex items-center justify-between">
						<div>
							<h2 id="debt-modal-title" className="text-2xl font-bold text-white">Debts</h2>
							<p className="text-slate-400 text-sm mt-1">Track outstanding debts and obligations</p>
						</div>
						<button 
							onClick={closeModalAndReset} 
							className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
							aria-label="Close modal"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<form onSubmit={handleSaveDebt} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-700/60">
					<Input
						label="Debt Name"
						id="debt-name"
						name="debt_name"
						value={debtForm.debt_name}
						onChange={handleDebtChange}
						error={debtErrors.debt_name}
						maxLength={80}
						placeholder="Credit Card, Personal Loan, etc."
												ref={debtNameRef}
						required
					/>
					<Input
						label="Total Amount"
						id="debt-amount"
						name="total_amount"
						type="number"
						min="0"
						step="1"
						inputMode="numeric"
						integerOnly
						value={debtForm.total_amount}
						onChange={handleDebtChange}
						error={debtErrors.total_amount}
						placeholder="0"
						required
					/>
					<div>
						<label className="text-sm font-medium text-slate-200 block mb-2">Due Date *</label>
						<Calendar type="date" value={debtForm.due_date} onChange={(date) => handleDebtChange('due_date', date)} />
						{debtErrors.due_date && <p className="text-xs text-red-400 mt-1">{debtErrors.due_date}</p>}
					</div>
					<Input
						label="Creditor/Lender"
						id="debt-creditor"
						name="creditor"
						value={debtForm.creditor}
						onChange={handleDebtChange}
						maxLength={80}
						placeholder="Bank, Person, etc."
					/>
					<div className="md:col-span-2">
						<Input
							label="Notes"
							id="debt-notes"
							name="notes"
							value={debtForm.notes}
							onChange={handleDebtChange}
							maxLength={300}
							placeholder="Add any additional details..."
						/>
					</div>
					<div className="md:col-span-2 flex gap-3 justify-end pt-4">
						<Button
							variant="secondary"
							onClick={closeModalAndReset}
							className="opacity-70 hover:opacity-100"
						>
							Cancel
						</Button>
						<Button type="submit" loading={saving} disabled={saving}>
							{debtForm.id ? 'Update Debt' : 'Add Debt'}
						</Button>
					</div>
				</form>

				<div className="space-y-2 max-h-[320px] overflow-y-auto">
					{debts.length === 0 && (
						<div className="text-center py-8">
							<p className="text-slate-400 text-sm">No debts tracked yet.</p>
						</div>
					)}
					{debts.map((debt) => {
						const paid = Number(debt.amount_paid || 0);
						const total = Number(debt.total_amount || 0);
						const outstanding = Math.max(0, total - paid);
						return (
							<div key={debt.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/70 hover:shadow-md transition-all duration-200">
								<div>
									<p className="text-white font-semibold">{debt.debt_name}</p>
									<p className="text-slate-400 text-xs mt-1">Outstanding {currency(outstanding)}</p>
								</div>
								<div className="flex gap-2">
									<Button size="sm" variant="ghost" onClick={() => openDebtModal(debt)}>
										Edit
									</Button>
									<Button size="sm" variant="danger" onClick={() => handleDeleteDebt(debt)}>
										Delete
									</Button>
								</div>
							</div>
						);
					})}
				</div>

				<div className="mt-6 pt-6 border-t border-slate-700/60">
					<h3 className="text-white font-semibold mb-4">Debts Due This Month</h3>
					<div className="space-y-2 max-h-[220px] overflow-y-auto">
						{monthlyDebts.length === 0 && (
							<div className="text-center py-4">
								<p className="text-slate-400 text-sm">No debts due this month.</p>
							</div>
						)}
						{monthlyDebts.map((d) => (
							<div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
								<div>
									<p className="text-white font-semibold text-sm">{d.debt_name || d.name || 'Debt'}</p>
									<p className="text-slate-400 text-xs">Due {d.due_date || currentMonth}</p>
								</div>
								<p className="text-orange-300 font-semibold">{currency(d.outstanding_amount || d.amount_due)}</p>
							</div>
						))}
					</div>
				</div>
			</Modal>

			{/* Monthly Report Modal */}
			<Modal
				open={modal.type === 'report'}
				onClose={closeModalAndReset}
				contentClassName="p-6 w-full max-w-3xl"
				ariaLabelledBy="report-modal-title"
			>
				<div className="mb-6 pb-6 border-b border-slate-700/60">
					<div className="flex items-center justify-between">
						<div>
							<h2 id="report-modal-title" className="text-2xl font-bold text-white">Monthly Report</h2>
							<p className="text-slate-400 text-sm mt-1">Summary for {currentMonth}</p>
						</div>
						<button 
							onClick={closeModalAndReset} 
							className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
							aria-label="Close modal"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 mb-6">
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
						<p className="text-slate-400 text-xs">Income</p>
						<p className="text-white text-lg font-semibold">{currency(totals.incomeAmount)}</p>
					</div>
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
						<p className="text-slate-400 text-xs">Expenses</p>
						<p className="text-white text-lg font-semibold">{currency(totals.expenseAmount)}</p>
					</div>
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
						<p className="text-slate-400 text-xs">Loans EMI</p>
						<p className="text-white text-lg font-semibold">{currency(totals.loanEmiAmount)}</p>
					</div>
					<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
						<p className="text-slate-400 text-xs">Debts Outstanding</p>
						<p className="text-white text-lg font-semibold">{currency(totals.debtOutstanding)}</p>
					</div>
				</div>

				<div className="mb-4">
					<h3 className="text-white font-semibold mb-2">Transactions</h3>
					<p className="text-slate-400 text-sm">{transactions.length} transactions recorded this month.</p>
				</div>

				<div className="flex gap-3 justify-end">
					<Button onClick={handleDownloadReport} loading={reportDownloading} disabled={reportDownloading}>
						Download (Excel)
					</Button>
				</div>
			</Modal>
		</div>
	);
}

