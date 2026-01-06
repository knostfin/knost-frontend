import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, CreditCard, Wallet } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';
import Calendar from '../components/Calendar';
import CategorySelect from '../components/CategorySelect';
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
	markExpenseAsPaid,
} from '../api/expenses';
import {
	getLoans,
	addLoan,
	updateLoan,
	deleteLoan,
	closeLoan,
	getMonthlyEMIDue,
	markEMIPaid,
} from '../api/loans';
import {
	addDebt,
	deleteDebt,
	getDebts,
	updateDebt,
	payDebt,
	getMonthlyDebtsDue,
} from '../api/debts';
import {
	getMonthlyOverview,
	getAllTransactions,
	getLoanSummary,
	downloadMonthlyReport,
} from '../api/dashboard';

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
	received_on: '',
};

const blankExpense = {
	id: null,
	description: '',
	amount: '',
	category: '',
	due_date: '',
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
	start_date: '',
	notes: '',
};

const blankDebt = {
	id: null,
	debt_name: '',
	total_amount: '',
	creditor: '',
	due_date: '',
	notes: '',
};

export default function Dashboard() {
	const { currentMonth, triggerRefresh, refreshTrigger } = useFinance();
	const location = useLocation();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savingAction, setSavingAction] = useState(null); // 'add' | 'addAndClose' | null
	const [toast, setToast] = useState(null);
	const [modal, setModal] = useState({ type: null, mode: null, payload: null });
	const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });
	const [reportDownloading, setReportDownloading] = useState(false);
	const [hasModalChanges, setHasModalChanges] = useState(false);

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
			await generateMonthlyExpenses(currentMonth).catch(() => { });

			// Load critical data first - only wait for these to show dashboard
			const [incomeRes, expenseRes, loansRes, emisRes, debtsRes, monthlyDebtsRes] = await Promise.all([
				getIncome({ month_year: currentMonth }),
				getMonthlyExpenses({ month_year: currentMonth }),
				getLoans(),
				getMonthlyEMIDue({ month_year: currentMonth }),
				getDebts(),
				getMonthlyDebtsDue({ month_year: currentMonth }),
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

			// Stop loading - show dashboard now
			setLoading(false);

			// Load non-critical data in background (overview & transactions)
			Promise.all([
				getMonthlyOverview(currentMonth),
				getAllTransactions(currentMonth),
			]).then(([overviewRes, txRes]) => {
				setOverview(overviewRes.data?.overview || overviewRes.data || null);
				setTransactions(txRes.data?.transactions || []);
			}).catch(err => console.warn('Non-critical data failed:', err));

			// Fetch loan summaries in background
			fetchLoanSummaries(Array.isArray(loanData) ? loanData : []);
		} catch (err) {
			console.error('Failed to load dashboard', err);
			setToast({ message: 'Failed to load data. Please retry.', type: 'error' });
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
			? monthlyDebts.reduce((sum, d) => sum + Number(d.total_amount || d.amount_paid || 0), 0)
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
		const shouldRefresh = hasModalChanges;
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
		setHasModalChanges(false);
		// Refresh dashboard data only when modal closes and changes were made
		if (shouldRefresh) {
			triggerRefresh();
		}
	};

	// Reset form for adding another entry (keeps modal open)
	const resetFormForNewEntry = (type) => {
		if (type === 'income') {
			setIncomeForm(blankIncome);
			setIncomeErrors({});
			setIncomeWarnings({});
			setModal(prev => ({ ...prev, mode: 'add', payload: null }));
		} else if (type === 'expense') {
			setExpenseForm(blankExpense);
			setExpenseErrors({});
			setModal(prev => ({ ...prev, mode: 'add', payload: null }));
		} else if (type === 'loan') {
			setLoanForm(blankLoan);
			setLoanErrors({});
			setLoanWarnings({});
			setModal(prev => ({ ...prev, mode: 'add', payload: null }));
		} else if (type === 'debt') {
			setDebtForm(blankDebt);
			setDebtErrors({});
			setModal(prev => ({ ...prev, mode: 'add', payload: null }));
		}
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
		if (debtForm.notes && debtForm.notes.length > 300) errors.notes = 'Notes must be 300 characters or fewer';
		setDebtErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleSaveIncome = async (e, andClose = false) => {
		e?.preventDefault();
		if (!validateIncome()) return;

		try {
			setSaving(true);
			setSavingAction(andClose ? 'addAndClose' : 'add');
			const payload = { ...incomeForm, month_year: toMonth(incomeForm.received_on, currentMonth) };

			if (incomeForm.id) {
				const updated = await updateIncome(incomeForm.id, payload);
				const updatedItem = updated.data?.income || updated.data || payload;
				setIncomeList(list => list.map(i => (i.id === incomeForm.id ? { ...i, ...updatedItem } : i)));
				setToast({ message: 'Income updated', type: 'success' });
				setHasModalChanges(true);
				closeModalAndReset();
			} else {
				const created = await addIncome(payload);
				const newItem = created.data?.income || created.data || payload;
				setIncomeList(list => [...list, newItem]);
				setToast({ message: 'Income added', type: 'success' });
				setHasModalChanges(true);
				if (andClose) {
					closeModalAndReset();
				} else {
					resetFormForNewEntry('income');
				}
			}
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save income', type: 'error' });
		} finally {
			setSaving(false);
			setSavingAction(null);
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
					setHasModalChanges(true);
				} catch {
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

	const handleSaveExpense = async (e, andClose = false) => {
		e?.preventDefault();
		if (!validateExpense()) return;

		try {
			setSaving(true);
			setSavingAction(andClose ? 'addAndClose' : 'add');
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
				setHasModalChanges(true);
				closeModalAndReset();
			} else {
				// Add new expense
				if (expenseForm.is_recurring) {
					// For recurring expenses, create template and let generateMonthlyExpenses handle instances
					await saveRecurringTemplate(payload);
					const generated = await generateMonthlyExpenses(month_year);
					// Try to get the newly generated expense from response
					const newExpenses = generated.data?.expenses || [];
					if (newExpenses.length > 0) {
						setExpenses(list => [...list, ...newExpenses.filter(ne => !list.some(e => e.id === ne.id))]);
					}
					setToast({ message: 'Recurring expense added', type: 'success' });
					setHasModalChanges(true);
					if (andClose) {
						closeModalAndReset();
					} else {
						resetFormForNewEntry('expense');
					}
				} else {
					// For one-time expenses, add directly
					const created = await addMonthlyExpense(payload);
					const newItem = created.data?.expense || created.data || payload;
					setExpenses(list => [...list, newItem]);
					setToast({ message: 'Expense added', type: 'success' });
					setHasModalChanges(true);
					if (andClose) {
						closeModalAndReset();
					} else {
						resetFormForNewEntry('expense');
					}
				}
			}
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save expense', type: 'error' });
		} finally {
			setSaving(false);
			setSavingAction(null);
		}
	};

	const handleDeleteExpense = (item) => {
		const isRecurring = !!item.recurring_expense_id;
		
		setConfirm({
			open: true,
			title: isRecurring ? 'Delete recurring expense' : 'Delete expense',
			message: isRecurring 
				? `"${item.description}" is a recurring expense. Delete just this month's entry or stop the entire recurring series?`
				: `Delete "${item.description}"?`,
			confirmText: isRecurring ? 'This Month Only' : 'Delete',
			secondaryText: isRecurring ? 'Delete Recurring' : undefined,
			onConfirm: async () => {
				// Delete only this month's expense (keep recurring template)
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteMonthlyExpense(item.id);
					setExpenses(list => list.filter(exp => exp.id !== item.id));
					setToast({ message: 'Expense deleted', type: 'success' });
					setHasModalChanges(true);
				} catch {
					setToast({ message: 'Failed to delete expense', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
			onSecondary: isRecurring ? async () => {
				// Delete the recurring template (detaches paid, removes pending)
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await deleteRecurringExpense(item.recurring_expense_id, { month_year: currentMonth });
					// Remove expenses with this recurring_expense_id from local state
					setExpenses(list => list.filter(exp => 
						exp.recurring_expense_id !== item.recurring_expense_id || exp.status === 'paid'
					));
					setToast({ message: 'Recurring expense deleted', type: 'success' });
					setHasModalChanges(true);
				} catch {
					setToast({ message: 'Failed to delete recurring expense', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			} : undefined,
		});
	};

	const handleSaveLoan = async (e, andClose = false) => {
		e?.preventDefault();
		if (!validateLoan()) return;

		try {
			setSaving(true);
			setSavingAction(andClose ? 'addAndClose' : 'add');
			if (loanForm.id) {
				const updated = await updateLoan(loanForm.id, loanForm);
				const updatedItem = updated.data?.loan || updated.data || loanForm;
				setLoans(list => list.map(loan => (loan.id === loanForm.id ? { ...loan, ...updatedItem } : loan)));
				setToast({ message: 'Loan updated', type: 'success' });
				setHasModalChanges(true);
				closeModalAndReset();
			} else {
				const created = await addLoan(loanForm);
				const newItem = created.data?.loan || created.data || loanForm;
				setLoans(list => [...list, newItem]);
				setToast({ message: 'Loan added', type: 'success' });
				setHasModalChanges(true);
				if (andClose) {
					closeModalAndReset();
				} else {
					resetFormForNewEntry('loan');
				}
			}
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save loan', type: 'error' });
		} finally {
			setSaving(false);
			setSavingAction(null);
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
					// Also remove EMIs for this loan from local state
					setMonthlyEmis(list => list.filter(emi => emi.loan_id !== item.id));
					setToast({ message: 'Loan deleted', type: 'success' });
					setHasModalChanges(true);
				} catch {
					setToast({ message: 'Failed to delete loan', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleCloseLoan = (loan) => {
		setConfirm({
			open: true,
			title: 'Close loan',
			message: `Mark "${loan.loan_name}" as fully paid and close it? This action cannot be undone.`,
			confirmText: 'Close Loan',
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await closeLoan(loan.id);
					setLoans(list => list.map(l => l.id === loan.id ? { ...l, status: 'closed' } : l));
					// Remove EMIs for this loan since it's closed
					setMonthlyEmis(list => list.filter(emi => emi.loan_id !== loan.id));
					setToast({ message: 'Loan closed successfully', type: 'success' });
					setHasModalChanges(true);
				} catch (err) {
					setToast({ message: err.response?.data?.message || 'Failed to close loan', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleMarkEMIPaid = (emi) => {
		setConfirm({
			open: true,
			title: 'Mark EMI as paid',
			message: `Mark EMI of ${currency(emi.amount || emi.emi_amount)} for "${emi.loan_name}" as paid?`,
			confirmText: 'Mark Paid',
			onConfirm: async () => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					await markEMIPaid(emi.loan_id, emi.payment_id || emi.id);
					// Update EMI status to paid (don't remove, so it shows as paid in the list)
					setMonthlyEmis(list => list.map(e => 
						(e.payment_id || e.id) === (emi.payment_id || emi.id) 
							? { ...e, status: 'paid' } 
							: e
					));
					// Update loan summaries to reflect new paid count
					setLoanSummaries(prev => {
						const loanId = emi.loan_id;
						const currentSummary = prev[loanId] || {};
						return {
							...prev,
							[loanId]: {
								...currentSummary,
								paid_payments: (Number(currentSummary.paid_payments) || 0) + 1
							}
						};
					});
					setToast({ message: 'EMI marked as paid', type: 'success' });
					setHasModalChanges(true);
				} catch (err) {
					setToast({ message: err.response?.data?.message || 'Failed to mark EMI as paid', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleSaveDebt = async (e, andClose = false) => {
		e?.preventDefault();
		if (!validateDebt()) return;

		try {
			setSaving(true);
			setSavingAction(andClose ? 'addAndClose' : 'add');
			const payload = { ...debtForm, month_year: currentMonth };
			if (debtForm.id) {
				const updated = await updateDebt(debtForm.id, payload);
				const updatedItem = updated.data?.debt || updated.data || payload;
				setDebts(list => list.map(debt => (debt.id === debtForm.id ? { ...debt, ...updatedItem } : debt)));
				setToast({ message: 'Debt updated', type: 'success' });
				setHasModalChanges(true);
				closeModalAndReset();
			} else {
				const created = await addDebt(payload);
				const newItem = created.data?.debt || created.data || payload;
				setDebts(list => [...list, newItem]);
				setToast({ message: 'Debt added', type: 'success' });
				setHasModalChanges(true);
				if (andClose) {
					closeModalAndReset();
				} else {
					resetFormForNewEntry('debt');
				}
			}
		} catch (err) {
			setToast({ message: err.response?.data?.message || 'Unable to save debt', type: 'error' });
		} finally {
			setSaving(false);
			setSavingAction(null);
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
					// Also remove from monthly debts
					setMonthlyDebts(list => list.filter(debt => debt.id !== item.id));
					setToast({ message: 'Debt deleted', type: 'success' });
					setHasModalChanges(true);
				} catch {
					setToast({ message: 'Failed to delete debt', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handlePayDebt = (item, payFull = false) => {
		const paid = Number(item.amount_paid || 0);
		const total = Number(item.total_amount || 0);
		const remaining = Math.max(0, total - paid);
		
		if (remaining <= 0) {
			setToast({ message: 'This debt is already fully paid', type: 'info' });
			return;
		}

		setConfirm({
			open: true,
			title: payFull ? 'Mark as Fully Paid' : 'Record Payment',
			message: payFull 
				? `Mark "${item.debt_name}" as fully paid? This will record ${currency(remaining)} as paid.`
				: `Record payment for "${item.debt_name}"? Outstanding: ${currency(remaining)}`,
			variant: 'primary',
			confirmText: payFull ? 'Mark Paid' : 'Record',
			showInput: !payFull,
			inputLabel: 'Payment Amount',
			inputType: 'number',
			inputPlaceholder: `Max: ${remaining}`,
			onConfirm: async (inputValue) => {
				try {
					setConfirm((c) => ({ ...c, loading: true }));
					const paymentAmount = payFull ? undefined : Number(inputValue);
					
					if (!payFull && (!paymentAmount || paymentAmount <= 0)) {
						setToast({ message: 'Please enter a valid payment amount', type: 'error' });
						setConfirm({ open: false, loading: false });
						return;
					}
					
					const payload = payFull ? {} : { amount_paid: paymentAmount };
					const response = await payDebt(item.id, payload);
					const updatedDebt = response.data?.debt || response.data;
					
				setDebts(list => list.map(debt => 
						debt.id === item.id ? { ...debt, ...updatedDebt } : debt
					));
					// Also update monthly debts if present
					setMonthlyDebts(list => list.map(debt => 
						debt.id === item.id ? { ...debt, ...updatedDebt } : debt
					).filter(d => d.status !== 'paid'));
					
					const message = updatedDebt.status === 'paid' 
						? 'Debt marked as fully paid' 
						: 'Payment recorded successfully';
					setToast({ message, type: 'success' });
					setHasModalChanges(true);
				} catch (err) {
					// Security: Generic error message
					setToast({ message: 'Failed to record payment. Please try again.', type: 'error' });
				} finally {
					setConfirm({ open: false, loading: false });
				}
			},
		});
	};

	const handleDownloadReport = async () => {
		try {
			setReportDownloading(true);
			const response = await downloadMonthlyReport(currentMonth);
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

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
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
				confirmText={confirm.confirmText}
				secondaryText={confirm.secondaryText}
				loading={confirm.loading}
				onConfirm={confirm.onConfirm}
				onSecondary={confirm.onSecondary}
				onCancel={() => setConfirm({ open: false, loading: false })}
				showInput={confirm.showInput}
				inputLabel={confirm.inputLabel}
				inputType={confirm.inputType}
				inputPlaceholder={confirm.inputPlaceholder}
				variant={confirm.variant}
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
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-opacity duration-300"
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
											<span className="text-emerald-400">✓ {expenses.filter(e => e.status === 'paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-rose-400">✗ {expenses.filter(e => e.status === 'pending').length} pending</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-500/30 transition-opacity duration-300"
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
											<span className="text-emerald-400">✓ {monthlyEmis.filter(emi => (emi.status || '').toLowerCase() === 'paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-rose-400">✗ {monthlyEmis.filter(emi => (emi.status || '').toLowerCase() !== 'paid').length} due</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-opacity duration-300"
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
											<span className="text-emerald-400">✓ {debts.filter(d => (d.status || '').toLowerCase() === 'paid').length} paid</span>
											<span className="text-slate-500">•</span>
											<span className="text-rose-400">✗ {debts.filter(d => (d.status || '').toLowerCase() !== 'paid').length} outstanding</span>
										</div>
									</div>
								</div>
								<motion.div
									whileHover={{ scale: 1.1, rotate: 90 }}
									whileTap={{ scale: 0.95 }}
									className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 transition-opacity duration-300"
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
				size="large"
				initialFocusRef={incomeSourceRef}
			>
				{/* Fixed Header */}
				<div className="flex-shrink-0 flex items-start justify-between p-6 pb-4 border-b border-white/5">
					<div>
						<h2 id="income-modal-title" className="text-2xl font-bold text-white mb-1">Manage Income Entries</h2>
						<p className="text-slate-400 text-sm">For {currentMonth}</p>
					</div>
					<button
						type="button"
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
				<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					{/* Left Column - Form (fixed, no scroll) */}
					<div className="flex flex-col justify-start">
						<form onSubmit={handleSaveIncome} className="grid grid-cols-2 gap-3" noValidate>
							<Input
								label="Source"
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
								label="Amount"
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
							<div className="col-span-2">
								<label className="text-sm font-medium text-slate-200 block mb-2">Received On</label>
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
								className="col-span-2"
								label="Description"
								id="income-desc"
								name="description"
								value={incomeForm.description}
								onChange={handleIncomeChange}
								maxLength={140}
								placeholder="Add notes..."
							/>
							<div className="col-span-2 flex gap-3 justify-end pt-3">
								<Button
									type="button"
									variant="secondary"
									onClick={closeModalAndReset}
									className="opacity-70 hover:opacity-100"
								>
									{incomeForm.id ? 'Cancel' : 'Close'}
								</Button>
								{!incomeForm.id && (
									<Button
										type="button"
										variant="secondary"
										loading={savingAction === 'addAndClose'}
										onClick={(e) => handleSaveIncome(e, true)}
										disabled={saving || !incomeForm.source.trim() || !incomeForm.amount || Number(incomeForm.amount) <= 0}
									>
										Add & Close
									</Button>
								)}
								<Button
									type="submit"
									loading={savingAction === 'add'}
									disabled={saving || !incomeForm.source.trim() || !incomeForm.amount || Number(incomeForm.amount) <= 0}
								>
									{incomeForm.id ? 'Update Income' : 'Add Income'}
								</Button>
							</div>
						</form>
					</div>

					{/* Right Column - Entries List (scrollable) */}
					<div className="border-l border-white/5 pl-6 flex flex-col min-h-0">
						<div className="mb-4 flex-shrink-0">
							<h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Income Entries</h3>
							<p className="text-slate-500 text-xs mt-1">{incomeList.length} entr{incomeList.length === 1 ? 'y' : 'ies'} this month</p>
						</div>
						<div className="flex-1 overflow-y-auto pr-2 modal-scrollbar space-y-3">
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
										<div className="flex-1 min-w-0">
											<p className="text-white font-semibold mb-1 truncate">{inc.source}</p>
											<p className="text-emerald-400 font-bold text-sm">{currency(inc.amount)}</p>
											<p className="text-slate-500 text-xs mt-1">on {inc.received_on}</p>
										</div>
										<div className="flex gap-2 flex-shrink-0">
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
												className="text-xs px-3"
											>
												Delete
											</Button>
										</div>
									</div>
									{inc.description && <p className="text-slate-500 text-xs mt-2 line-clamp-2">{inc.description}</p>}
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
				initialFocusRef={expenseDescriptionRef}
				size="large"
				ariaLabelledBy="expense-modal-title"
			>
				{/* Fixed Header */}
				<div className="flex-shrink-0 flex items-start justify-between p-6 pb-4 border-b border-white/5">
					<div>
						<h2 id="expense-modal-title" className="text-2xl font-bold text-white">Expenses</h2>
						<p className="text-slate-400 text-sm mt-1">Manage expenses for {currentMonth}</p>
					</div>
					<button
						type="button"
						onClick={closeModalAndReset}
						className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
						aria-label="Close modal"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					{/* Left Column - Form (fixed, no scroll) */}
					<div className="flex flex-col justify-start">
						<form onSubmit={handleSaveExpense} className="grid grid-cols-2 gap-3" noValidate>
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
							<CategorySelect
								label="Category"
								id="expense-category"
								name="category"
								value={expenseForm.category}
								onChange={handleExpenseChange}
								type="expense"
								placeholder="Select or add category"
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
								<label className="text-sm font-medium text-slate-200 block mb-2">Due Date</label>
								<Calendar type="date" value={expenseForm.due_date} onChange={(date) => handleExpenseChange('due_date', date)} />
								{expenseErrors.due_date && <p className="text-xs text-red-400 mt-1">{expenseErrors.due_date}</p>}
							</div>

							<div>
								<label className="text-sm font-medium text-slate-200 block mb-2">&nbsp;</label>
								<label className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all duration-200">
									<input
										id="recurring"
										type="checkbox"
										checked={expenseForm.is_recurring}
										onChange={(e) => handleExpenseChange('is_recurring', e.target.checked)}
										className="w-4 h-4 accent-teal-500"
									/>
									<span className="text-sm text-white">Recurring</span>
								</label>
							</div>

							{expenseForm.is_recurring && (
								<>
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
									<div>
										<label className="text-sm font-medium text-slate-200 block mb-2">End Date (Optional)</label>
										<Calendar type="date" value={expenseForm.recurring_end_date} onChange={(date) => handleExpenseChange('recurring_end_date', date)} />
										{expenseErrors.recurring_end_date && <p className="text-xs text-red-400 mt-1">{expenseErrors.recurring_end_date}</p>}
									</div>
								</>
							)}

							<div className="col-span-2 flex gap-3 justify-end pt-3">
								<Button
									type="button"
									variant="secondary"
									onClick={closeModalAndReset}
									className="opacity-70 hover:opacity-100"
								>
									{expenseForm.id ? 'Cancel' : 'Close'}
								</Button>
								{!expenseForm.id && (
									<Button
										type="button"
										variant="secondary"
										loading={savingAction === 'addAndClose'}
										onClick={(e) => handleSaveExpense(e, true)}
										disabled={saving || !expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0}
									>
										Add & Close
									</Button>
								)}
								<Button 
									type="submit" 
									loading={savingAction === 'add'} 
									disabled={saving || !expenseForm.description.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0}
								>
									{expenseForm.id ? 'Update Expense' : 'Add Expense'}
								</Button>
							</div>
						</form>
					</div>

					{/* Right Column - Expense Entries (scrollable list) */}
					<div className="border-l border-white/5 pl-6 flex flex-col min-h-0">
						<div className="mb-4 flex-shrink-0">
							<h3 className="text-lg font-semibold text-white">Expense Entries</h3>
							<p className="text-sm text-slate-400 mt-1">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} this month</p>
						</div>
						<div className="flex-1 overflow-y-auto pr-2 modal-scrollbar space-y-3">
							{expenses.length === 0 && (
								<div className="text-center py-8">
									<p className="text-slate-400 text-sm">No expenses for this month.</p>
								</div>
							)}
							{expenses.map((exp) => (
								<div key={exp.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/70 hover:shadow-md transition-all duration-200">
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 flex-wrap">
											<p className="text-white font-semibold truncate">{exp.description}</p>
											{exp.status === 'paid' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-500/20 flex-shrink-0">Paid</span>}
											{exp.status === 'pending' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20 flex-shrink-0">Pending</span>}
										</div>
										<p className="text-slate-400 text-xs mt-1">{currency(exp.amount)} on {exp.due_date}</p>
										{exp.recurring_expense_id && <p className="text-teal-400 text-xs font-medium mt-1">✓ Recurring</p>}
									</div>
									<div className="flex gap-2 flex-shrink-0 ml-2">
										{exp.status === 'pending' && (
											<Button size="sm" variant="primary" className="transition-opacity active:opacity-50" onClick={() => {
												markExpenseAsPaid(exp.id).then((res) => {
													const paidExp = res.data?.expense || { ...exp, status: 'paid', paid_on: new Date().toISOString() };
													setExpenses(list => list.map(e => e.id === exp.id ? paidExp : e));
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
					</div>
				</div>
			</Modal>

			{/* Loans Modal */}
			<Modal
				open={modal.type === 'loan'}
				onClose={closeModalAndReset}
				size="large"
				ariaLabelledBy="loan-modal-title"
				initialFocusRef={loanNameRef}
			>
				{/* Fixed Header */}
				<div className="flex-shrink-0 flex items-start justify-between p-6 pb-4 border-b border-white/5">
					<div>
						<h2 id="loan-modal-title" className="text-2xl font-bold text-white">Loans & EMI</h2>
						<p className="text-slate-400 text-sm mt-1">Manage loans and track EMI payments</p>
					</div>
					<button
						type="button"
						onClick={closeModalAndReset}
						className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
						aria-label="Close modal"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					{/* Left Column - Form (fixed, no scroll) */}
					<div className="flex flex-col justify-start">
						<form onSubmit={handleSaveLoan} className="grid grid-cols-2 gap-3" noValidate>
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
							<div className="col-span-2">
								<label className="text-sm font-medium text-slate-200 block mb-2">Start Date</label>
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
								className="col-span-2"
								label="Notes"
								id="loan-notes"
								name="notes"
								value={loanForm.notes}
								onChange={handleLoanChange}
								maxLength={300}
								placeholder="Additional details..."
							/>
							<div className="col-span-2 flex gap-3 justify-end pt-3">
								<Button
									type="button"
									variant="secondary"
									onClick={closeModalAndReset}
									className="opacity-70 hover:opacity-100"
								>
									{loanForm.id ? 'Cancel' : 'Close'}
								</Button>
								{!loanForm.id && (
									<Button
										type="button"
										variant="secondary"
										loading={savingAction === 'addAndClose'}
										onClick={(e) => handleSaveLoan(e, true)}
										disabled={saving || !loanForm.loan_name.trim() || !loanForm.principal_amount || Number(loanForm.principal_amount) <= 0 || !loanForm.tenure_months || Number(loanForm.tenure_months) <= 0}
									>
										Add & Close
									</Button>
								)}
								<Button 
									type="submit" 
									loading={savingAction === 'add'} 
									disabled={saving || !loanForm.loan_name.trim() || !loanForm.principal_amount || Number(loanForm.principal_amount) <= 0 || !loanForm.tenure_months || Number(loanForm.tenure_months) <= 0}
								>
									{loanForm.id ? 'Update Loan' : 'Add Loan'}
								</Button>
							</div>
						</form>
					</div>

					{/* Right Column - Loan Entries & EMI Dues (scrollable) */}
					<div className="border-l border-white/5 pl-6 flex flex-col min-h-0">
						<div className="mb-4 flex-shrink-0">
							<h3 className="text-lg font-semibold text-white">Loan Entries</h3>
							<p className="text-sm text-slate-400 mt-1">{loans.length} loan{loans.length !== 1 ? 's' : ''} tracked</p>
						</div>
						<div className="flex-1 overflow-y-auto pr-2 modal-scrollbar space-y-3">
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
								const isClosed = loan.status === 'closed';
								return (
									<div key={loan.id} className={`p-4 rounded-lg border transition ${isClosed ? 'bg-slate-800/20 border-slate-700/30' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-700'}`}>
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												<div>
													<div className="flex items-center gap-2">
														<p className={`font-semibold ${isClosed ? 'text-slate-400' : 'text-white'}`}>{loan.loan_name}</p>
														{isClosed ? (
															<span className="px-2 py-0.5 text-xs font-medium bg-slate-500/20 text-slate-400 rounded-full">Closed</span>
														) : (
															<span className="px-2 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full">Active</span>
														)}
													</div>
													<p className="text-slate-400 text-xs mt-1">Principal {currency(loan.principal_amount)} • EMI: {currency(loan.emi_amount)}</p>
												</div>
											</div>
											<div className="flex gap-2">
												{!isClosed && (
													<>
														<Button size="sm" variant="ghost" onClick={() => openLoanModal(loan)}>
															Edit
														</Button>
														<Button size="sm" variant="secondary" onClick={() => handleCloseLoan(loan)}>
															Close
														</Button>
													</>
												)}
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
												<div className={`h-full ${isClosed ? 'bg-slate-500' : 'bg-teal-500'}`} style={{ width: `${progress}%` }} />
											</div>
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 pt-6 border-t border-slate-700/60 flex-shrink-0">
							<h3 className="text-white font-semibold mb-4">This Month's EMI Dues</h3>
							<div className="space-y-2">
								{monthlyEmis.length === 0 && (
									<div className="text-center py-4">
										<p className="text-slate-400 text-sm">No EMIs due this month.</p>
									</div>
								)}
								{monthlyEmis.map((emi) => {
									const isPaid = (emi.status || '').toLowerCase() === 'paid';
									return (
										<div key={emi.id || emi.payment_id} className={`flex items-center justify-between p-3 rounded-lg ${isPaid ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-teal-500/5 border border-teal-500/20'}`}>
											<div className="flex items-center gap-2">
												<div>
													<div className="flex items-center gap-2">
														<p className={`font-semibold text-sm ${isPaid ? 'text-slate-300' : 'text-white'}`}>{emi.loan_name || 'Loan EMI'}</p>
														{isPaid && <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">Paid</span>}
													</div>
													<p className="text-slate-400 text-xs">{isPaid ? 'Paid' : 'Due'} {(emi.payment_date || emi.due_date) ? new Date(emi.payment_date || emi.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : currentMonth}</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<p className={`font-semibold ${isPaid ? 'text-emerald-300' : 'text-teal-300'}`}>{currency(emi.amount || emi.emi_amount)}</p>
												{!isPaid && (
													<Button size="sm" variant="secondary" onClick={() => handleMarkEMIPaid(emi)}>
														Pay
													</Button>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>
			</Modal>

			{/* Debts Modal */}
			<Modal
				open={modal.type === 'debt'}
				onClose={closeModalAndReset}
				size="large"
				ariaLabelledBy="debt-modal-title"
				initialFocusRef={debtNameRef}
			>
				{/* Fixed Header */}
				<div className="flex-shrink-0 flex items-start justify-between p-6 pb-4 border-b border-white/5">
					<div>
						<h2 id="debt-modal-title" className="text-2xl font-bold text-white">Debts</h2>
						<p className="text-slate-400 text-sm mt-1">Track outstanding debts and obligations</p>
					</div>
					<button
						type="button"
						onClick={closeModalAndReset}
						className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition"
						aria-label="Close modal"
					>
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Body */}
				<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					{/* Left Column - Form (fixed, no scroll) */}
					<div className="flex flex-col justify-start">
						<form onSubmit={handleSaveDebt} className="grid grid-cols-2 gap-3" noValidate>
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
							<div className="col-span-2">
								<label className="text-sm font-medium text-slate-200 block mb-2">Due Date</label>
								<Calendar type="date" value={debtForm.due_date} onChange={(date) => handleDebtChange('due_date', date)} />
							</div>
							<Input
								className="col-span-2"
								label="Creditor/Lender"
								id="debt-creditor"
								name="creditor"
								value={debtForm.creditor}
								onChange={handleDebtChange}
								maxLength={80}
								placeholder="Bank, Person, etc."
							/>
							<Input
								className="col-span-2"
								label="Notes"
								id="debt-notes"
								name="notes"
								value={debtForm.notes}
								onChange={handleDebtChange}
								maxLength={300}
								placeholder="Add any additional details..."
							/>
							<div className="col-span-2 flex gap-3 justify-end pt-3">
								<Button
									type="button"
									variant="secondary"
									onClick={closeModalAndReset}
									className="opacity-70 hover:opacity-100"
								>
									{debtForm.id ? 'Cancel' : 'Close'}
								</Button>
								{!debtForm.id && (
									<Button
										type="button"
										variant="secondary"
										loading={savingAction === 'addAndClose'}
										onClick={(e) => handleSaveDebt(e, true)}
										disabled={saving || !debtForm.debt_name.trim() || !debtForm.total_amount || Number(debtForm.total_amount) <= 0}
									>
										Add & Close
									</Button>
								)}
								<Button 
									type="submit" 
									loading={savingAction === 'add'} 
									disabled={saving || !debtForm.debt_name.trim() || !debtForm.total_amount || Number(debtForm.total_amount) <= 0}
								>
									{debtForm.id ? 'Update Debt' : 'Add Debt'}
								</Button>
							</div>
						</form>
					</div>

					{/* Right Column - Debt Entries & Monthly Debts (scrollable) */}
					<div className="border-l border-white/5 pl-6 flex flex-col min-h-0">
						<div className="mb-4 flex-shrink-0">
							<h3 className="text-lg font-semibold text-white">Debt Entries</h3>
							<p className="text-sm text-slate-400 mt-1">{debts.length} debt{debts.length !== 1 ? 's' : ''} tracked</p>
						</div>
						<div className="flex-1 overflow-y-auto pr-2 modal-scrollbar space-y-3">
							{debts.length === 0 && (
								<div className="text-center py-8">
									<p className="text-slate-400 text-sm">No debts tracked yet.</p>
								</div>
							)}
							{debts.map((debt) => {
								const paid = Number(debt.amount_paid || 0);
								const total = Number(debt.total_amount || 0);
								const outstanding = Math.max(0, total - paid);
								const progressPercent = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
								const status = debt.status || (paid >= total ? 'paid' : paid > 0 ? 'partially_paid' : 'pending');
								const isPaid = status === 'paid';
								return (
									<div key={debt.id} className={`p-4 rounded-lg border transition-all duration-200 ${isPaid ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/70 hover:shadow-md'}`}>
										<div className="flex items-start justify-between">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="text-white font-semibold truncate">{debt.debt_name}</p>
													{isPaid ? (
														<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">Paid</span>
													) : status === 'partially_paid' ? (
														<span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">Partial</span>
													) : null}
												</div>
												<p className="text-slate-400 text-xs mt-1">
													{isPaid ? `Total: ${currency(total)}` : `${currency(paid)} / ${currency(total)} paid`}
												</p>
												{!isPaid && progressPercent > 0 && (
													<div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
														<div 
															className="h-full bg-amber-500 rounded-full transition-all duration-300" 
															style={{ width: `${progressPercent}%` }}
														/>
													</div>
												)}
												{!isPaid && outstanding > 0 && (
													<p className="text-orange-400 text-xs mt-1 font-medium">Outstanding: {currency(outstanding)}</p>
												)}
											</div>
											<div className="flex gap-1 ml-2 flex-shrink-0">
												{!isPaid && (
													<>
														<Button size="sm" variant="ghost" onClick={() => handlePayDebt(debt, false)} title="Record partial payment">
															Pay
														</Button>
														<Button size="sm" variant="ghost" onClick={() => handlePayDebt(debt, true)} title="Mark as fully paid">
															✓
														</Button>
													</>
												)}
												<Button size="sm" variant="ghost" onClick={() => openDebtModal(debt)}>
													Edit
												</Button>
												<Button size="sm" variant="danger" onClick={() => handleDeleteDebt(debt)}>
													Delete
												</Button>
											</div>
										</div>
									</div>
								);
							})}
						</div>

						<div className="mt-6 pt-6 border-t border-slate-700/60 flex-shrink-0">
							<h3 className="text-white font-semibold mb-4">Debts Due This Month</h3>
							<div className="space-y-2">
								{monthlyDebts.length === 0 && (
									<div className="text-center py-4">
										<p className="text-slate-400 text-sm">No debts due this month.</p>
									</div>
								)}
								{monthlyDebts.map((d) => (
									<div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
										<div>
											<p className="text-white font-semibold text-sm">{d.debt_name || d.name || 'Debt'}</p>
											<p className="text-slate-400 text-xs">Due {d.due_date ? new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : currentMonth}</p>
										</div>
										<p className="text-orange-300 font-semibold">{currency(d.outstanding_amount || d.amount_due)}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</Modal>

			{/* Monthly Report Modal */}
			<Modal
				open={modal.type === 'report'}
				onClose={closeModalAndReset}
				size="large"
				ariaLabelledBy="report-modal-title"
			>
				{/* Fixed Header */}
				<div className="flex-shrink-0 p-6 pb-4 border-b border-slate-700/60">
					<div className="flex items-center justify-between">
						<div>
							<h2 id="report-modal-title" className="text-2xl font-bold text-white">Monthly Details • {currentMonth}</h2>
							<p className="text-slate-400 text-sm mt-1">Read-only snapshot — all sections visible</p>
						</div>
						<div className="flex items-center gap-3">
							<Button onClick={handleDownloadReport} loading={reportDownloading} disabled={reportDownloading} className="flex items-center gap-2 whitespace-nowrap">
								<span className="leading-none">Download</span>
							</Button>
							<button
								type="button"
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
				</div>

				{/* Body */}
				<div className="flex-1 overflow-y-auto p-6 modal-scrollbar">
					{/* Two Column Layout for Income & Expenses */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* Incomes Section */}
						<div>
							<h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Incomes ({incomeList.length})
							</h3>
							<div className="rounded-xl border border-slate-700 overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-slate-800/60">
										<tr>
											<th className="text-left px-4 py-3 text-slate-300 font-medium">Source</th>
											<th className="text-center px-4 py-3 text-slate-300 font-medium">Date</th>
											<th className="text-right px-4 py-3 text-slate-300 font-medium">Amount</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-700/50">
										{incomeList.length === 0 ? (
											<tr>
												<td colSpan={3} className="px-4 py-4 text-center text-slate-400">No income recorded</td>
											</tr>
										) : (
											incomeList.map((income) => (
												<tr key={income.id} className="hover:bg-slate-800/30">
													<td className="px-4 py-3 text-white">{income.source}</td>
													<td className="px-4 py-3 text-center text-slate-300">
														{income.received_on ? new Date(income.received_on).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '-'}
													</td>
													<td className="px-4 py-3 text-right text-white">{currency(income.amount)}</td>
												</tr>
											))
										)}
										<tr className="bg-slate-800/40 font-semibold">
											<td className="px-4 py-3 text-white">Total</td>
											<td></td>
											<td className="px-4 py-3 text-right text-emerald-400">{currency(totals.incomeAmount)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* Expenses Section */}
						<div>
							<h3 className="text-rose-400 font-semibold mb-3 flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
								Expenses ({expenses.length})
							</h3>
							<div className="rounded-xl border border-slate-700 overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-slate-800/60">
										<tr>
											<th className="text-left px-4 py-3 text-slate-300 font-medium">Category</th>
											<th className="text-center px-4 py-3 text-slate-300 font-medium">Date</th>
											<th className="text-center px-4 py-3 text-slate-300 font-medium">Status</th>
											<th className="text-right px-4 py-3 text-slate-300 font-medium">Amount</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-700/50">
										{expenses.length === 0 ? (
											<tr>
												<td colSpan={4} className="px-4 py-4 text-center text-slate-400">No expenses recorded</td>
											</tr>
										) : (
											expenses.map((expense) => (
												<tr key={expense.id} className="hover:bg-slate-800/30">
													<td className="px-4 py-3 text-white">{expense.description || expense.category}</td>
													<td className="px-4 py-3 text-center text-slate-300">
														{expense.due_date ? new Date(expense.due_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : '-'}
													</td>
													<td className="px-4 py-3 text-center">
														<span className={`px-2 py-0.5 text-xs font-medium rounded-full ${expense.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
															{expense.status || 'pending'}
														</span>
													</td>
													<td className="px-4 py-3 text-right text-white">{currency(expense.amount)}</td>
												</tr>
											))
										)}
										<tr className="bg-slate-800/40 font-semibold">
											<td className="px-4 py-3 text-white">Total</td>
											<td></td>
											<td></td>
											<td className="px-4 py-3 text-right text-rose-400">{currency(totals.expenseAmount)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					{/* Loans & Debts Section */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{/* Loans/EMI Section */}
						<div>
							<h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
								Loans & EMI ({loans.length} loans)
							</h3>
							<div className="rounded-xl border border-slate-700 overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-slate-800/60">
										<tr>
											<th className="text-left px-4 py-3 text-slate-300 font-medium">Loan</th>
											<th className="text-center px-4 py-3 text-slate-300 font-medium">Status</th>
											<th className="text-right px-4 py-3 text-slate-300 font-medium">EMI</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-700/50">
										{monthlyEmis.length === 0 ? (
											<tr>
												<td colSpan={3} className="px-4 py-4 text-center text-slate-400">No EMIs due this month</td>
											</tr>
										) : (
											monthlyEmis.map((emi) => (
												<tr key={emi.id || emi.payment_id} className="hover:bg-slate-800/30">
													<td className="px-4 py-3 text-white">{emi.loan_name || 'Loan EMI'}</td>
													<td className="px-4 py-3 text-center">
														<span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(emi.status || '').toLowerCase() === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
															{(emi.status || '').toLowerCase() === 'paid' ? 'paid' : 'pending'}
														</span>
													</td>
													<td className="px-4 py-3 text-right text-white">{currency(emi.amount || emi.emi_amount)}</td>
												</tr>
											))
										)}
										<tr className="bg-slate-800/40 font-semibold">
											<td className="px-4 py-3 text-white">Total EMI Due</td>
											<td></td>
											<td className="px-4 py-3 text-right text-blue-400">{currency(totals.loanEmiAmount)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						{/* Debts Section */}
						<div>
							<h3 className="text-orange-400 font-semibold mb-3 flex items-center gap-2">
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								Debts ({debts.length})
							</h3>
							<div className="rounded-xl border border-slate-700 overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-slate-800/60">
										<tr>
											<th className="text-left px-4 py-3 text-slate-300 font-medium">Debt</th>
											<th className="text-center px-4 py-3 text-slate-300 font-medium">Status</th>
											<th className="text-right px-4 py-3 text-slate-300 font-medium">Outstanding</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-700/50">
										{debts.length === 0 ? (
											<tr>
												<td colSpan={3} className="px-4 py-4 text-center text-slate-400">No debts recorded</td>
											</tr>
										) : (
											debts.map((debt) => {
												const outstanding = Math.max(0, Number(debt.total_amount || 0) - Number(debt.amount_paid || 0));
												const isPaid = outstanding === 0 || debt.status === 'paid';
												return (
													<tr key={debt.id} className="hover:bg-slate-800/30">
														<td className="px-4 py-3 text-white">{debt.debt_name}</td>
														<td className="px-4 py-3 text-center">
															<span className={`px-2 py-0.5 text-xs font-medium rounded-full ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
																{isPaid ? 'paid' : 'pending'}
															</span>
														</td>
														<td className="px-4 py-3 text-right text-white">{currency(outstanding)}</td>
													</tr>
												);
											})
										)}
										<tr className="bg-slate-800/40 font-semibold">
											<td className="px-4 py-3 text-white">Total Outstanding</td>
											<td></td>
											<td className="px-4 py-3 text-right text-orange-400">{currency(totals.debtOutstanding)}</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</div>

					{/* Summary Cards */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
						<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
							<p className="text-slate-400 text-xs">Total Income</p>
							<p className="text-emerald-400 text-lg font-semibold">{currency(totals.incomeAmount)}</p>
						</div>
						<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
							<p className="text-slate-400 text-xs">Total Expenses</p>
							<p className="text-rose-400 text-lg font-semibold">{currency(totals.expenseAmount)}</p>
						</div>
						<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
							<p className="text-slate-400 text-xs">Loans EMI</p>
							<p className="text-blue-400 text-lg font-semibold">{currency(totals.loanEmiAmount)}</p>
						</div>
						<div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
							<p className="text-slate-400 text-xs">Net Balance</p>
							<p className={`text-lg font-semibold ${totals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{currency(totals.balance)}</p>
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
}

