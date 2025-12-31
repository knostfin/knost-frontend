/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { registerUser, loginUser } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import LegalModal from '../components/LegalModal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import { formatPhoneFromParts } from '../utils/validation';
import { getCountryOptions, searchCountries } from '../utils/countryData';

const CountrySelect = ({ value, onChange }) => {
  const countryOptions = useMemo(() => getCountryOptions(), []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const current = useMemo(() => countryOptions.find((c) => c.code === value), [value, countryOptions]);
  const filteredOptions = useMemo(() => {
    return search ? searchCountries(search, countryOptions) : countryOptions;
  }, [search, countryOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Update highlight index when filtered options change
  useEffect(() => {
    if (open) {
      setHighlightIndex(filteredOptions.findIndex((opt) => opt.code === value));
    }
  }, [open, filteredOptions, value]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (open && highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('button');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, open]);

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
          onChange(filteredOptions[highlightIndex].code);
          setOpen(false);
          setSearch('');
          buttonRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSearch('');
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setOpen(false);
        setSearch('');
        break;
      default:
        // Let the search input handle text input
        break;
    }
  };

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    // Reset highlight when searching
    setHighlightIndex(newSearch ? 0 : -1);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-3 pr-8 rounded-lg bg-white/10 border border-white/15 text-white text-left focus:outline-none focus:border-teal-500/60 hover:bg-white/15 transition-all duration-200 text-sm"
      >
        {current?.label || 'Select country'}
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-hidden rounded-lg bg-slate-900/95 border border-white/20 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search input */}
          <div className="sticky top-0 z-10 bg-slate-900/95 p-2 border-b border-white/10 backdrop-blur-md">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-teal-500/60"
            />
          </div>

          {/* Options list */}
          <div ref={listRef} className="overflow-y-auto max-h-60 recent-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onChange(option.code);
                    setOpen(false);
                    setSearch('');
                    buttonRef.current?.focus();
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors duration-100 ${
                    idx === highlightIndex
                      ? 'bg-teal-500/30 text-teal-100'
                      : 'text-gray-300 hover:bg-white/10'
                  } ${option.code === value ? 'bg-teal-500/20 border-l-2 border-teal-500' : 'border-l-2 border-transparent'}`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.countryCode && (
                    <span className="text-xs text-gray-500 ml-2">
                      {option.countryCode}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-gray-500 text-sm">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Signup() {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    password: '',
  });

  const [countryCode, setCountryCode] = useState('+1');

  const [touched, setTouched] = useState({});
  const [agree, setAgree] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [legalModal, setLegalModal] = useState({ isOpen: false, type: null });
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Validation rules
  const validateField = (name, value) => {
    switch (name) {
      case 'firstname':
        return value.trim().length < 3 ? 'First name must be at least 3 characters' : '';

      case 'lastname':
        return value.trim().length < 3 ? 'Last name must be at least 3 characters' : '';

      case 'email': {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email' : '';
      }

      case 'phone': {
        const phoneRegex = /^[0-9]{10}$/;
        return !phoneRegex.test(value) ? 'Phone must be 10 digits' : '';
      }

      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
        if (!/[0-9]/.test(value)) return 'Must contain a number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Must contain a special character';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 15);
      setForm({ ...form, [name]: digits });
      return;
    }

    setForm({ ...form, [name]: value });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
  };

  const getFieldError = (name) => {
    return touched[name] ? validateField(name, form[name]) : '';
  };

  const isFieldValid = (name) => {
    return !validateField(name, form[name]);
  };

  const passwordChecks = {
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };

  const isFormValid = () => {
    return (
      form.firstname &&
      form.lastname &&
      form.email &&
      form.phone &&
      form.password &&
      isFieldValid('firstname') &&
      isFieldValid('lastname') &&
      isFieldValid('email') &&
      isFieldValid('phone') &&
      isFieldValid('password') &&
      agree
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerErr('');
    setSuccessMsg('');

    setTouched({
      firstname: true,
      lastname: true,
      email: true,
      phone: true,
      password: true,
    });

    if (!isFormValid()) {
      setServerErr('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      // Format phone into combined format: +{countrycode}{10digits}
      const combinedPhone = formatPhoneFromParts(countryCode, form.phone);
      
      if (!combinedPhone) {
        setServerErr('Invalid phone format. Please check country code and phone number.');
        setLoading(false);
        return;
      }

      const res = await registerUser({ 
        firstname: form.firstname,
        lastname: form.lastname,
        email: form.email,
        phone: combinedPhone,  // Send combined format
        password: form.password,
      });

      // If API returned tokens/user, auto-login then navigate to dashboard
      const data = res?.data || {};
      const token = data.accessToken || data.token || data.access_token;
      const refresh = data.refreshToken || data.refresh || data.refresh_token;
      const userObj = data.user || data.userInfo || null;

      if (token) {
        login(token, refresh, userObj);
        navigate('/dashboard', { replace: true });
        return;
      }

      // If register didn't return tokens, attempt to login with provided credentials
      try {
        const loginRes = await loginUser({ email: form.email, password: form.password });
        const ldata = loginRes?.data || {};
        const ltoken = ldata.accessToken || ldata.token || ldata.access_token;
        const lrefresh = ldata.refreshToken || ldata.refresh || ldata.refresh_token;
        const luser = ldata.user || ldata.userInfo || null;

        if (ltoken) {
          login(ltoken, lrefresh, luser);
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (le) {
        // If auto-login fails, fall through to redirect to login
        console.warn('Auto-login after register failed:', le);
      }

      // Fallback: show success message and send user to login
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e) {
      setServerErr(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-10 pt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-800/85" aria-hidden="true" />
      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-teal-500/25 via-cyan-500/20 to-emerald-500/25" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white/6 border border-white/12 shadow-2xl backdrop-blur-2xl px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Create{' '}
            <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent">
              Knost
            </span>{' '}
            Account
          </h1>
          <p className="text-sm text-gray-400">Join thousands managing their expenses smartly</p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="px-4 py-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm flex items-start gap-2 mb-4">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              name="firstname"
              label="First name"
              placeholder="First name"
              value={form.firstname}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('firstname')}
              required
              autoComplete="given-name"
            />
            <Input
              name="lastname"
              label="Last name"
              placeholder="Last name"
              value={form.lastname}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('lastname')}
              required
              autoComplete="family-name"
            />
          </div>

          <Input
            name="email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('email')}
            required
            autoComplete="email"
          />

          <div className="grid grid-cols-[130px_1fr] gap-3">
            <div>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-200">
                  Country
                </span>
                <CountrySelect value={countryCode} onChange={setCountryCode} />
              </label>
            </div>
            <Input
              name="phone"
              type="tel"
              label="Mobile number"
              placeholder="Mobile number"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={getFieldError('phone')}
              required
              autoComplete="tel"
            />
          </div>

          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={getFieldError('password')}
            required
            autoComplete="new-password"
            trailingIcon={(
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="h-6 w-6 text-slate-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223a10.477 10.477 0 00-.858 1.323A10.451 10.451 0 002 12c1.5 2.905 4.64 5 8 5 1.478 0 2.872-.356 4.1-.987m3.02-2.641c.474-.51.888-1.07 1.24-1.672A10.451 10.451 0 0022 12c-1.5-2.905-4.64-5-8-5-1.224 0-2.39.218-3.465.616" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            )}
          />

          <div className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <p className="font-semibold text-gray-300 mb-1">Password requirements:</p>
            <ul className="space-y-1 text-gray-400">
              <li
                className={`${
                  passwordChecks.length ? 'text-teal-400' : 'text-gray-400'
                } transition-colors`}
              >
                ✓ At least 8 characters
              </li>
              <li
                className={`${
                  passwordChecks.uppercase ? 'text-teal-400' : 'text-gray-400'
                } transition-colors`}
              >
                ✓ One uppercase letter (A-Z)
              </li>
              <li
                className={`${
                  passwordChecks.number ? 'text-teal-400' : 'text-gray-400'
                } transition-colors`}
              >
                ✓ One number (0-9)
              </li>
              <li
                className={`${
                  passwordChecks.special ? 'text-teal-400' : 'text-gray-400'
                } transition-colors`}
              >
                ✓ One special character (!@#$%^&* etc.)
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Checkbox
              id="terms"
              checked={agree}
              onChange={() => setAgree(!agree)}
              label="I accept the Terms and Privacy Policy"
              description="You must accept to create your account."
            />
            <div className="text-sm text-teal-300 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'terms' })}
                className="underline hover:text-teal-200"
              >
                View Terms
              </button>
              <button
                type="button"
                onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })}
                className="underline hover:text-teal-200"
              >
                View Privacy Policy
              </button>
            </div>
          </div>

          {serverErr && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
              <span>{serverErr}</span>
            </div>
          )}

          <Button type="submit" disabled={!isFormValid() || loading} loading={loading} fullWidth className="mt-4">
            {loading ? 'Creating Account...' : 'Start Tracking Expenses'}
          </Button>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
              Sign In
            </Link>
          </p>
        </form>
      </div>

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ isOpen: false, type: null })}
        type={legalModal.type}
      />
    </div>
  );
}
