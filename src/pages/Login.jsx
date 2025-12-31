import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { loginUser, requestOtp, verifyOtp, requestPasswordReset } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import LogoMark from '../components/LogoMark';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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
  
  const current = useMemo(() => countryOptions.find((c) => c.code === value), [value, countryOptions]);
  const filteredOptions = useMemo(() => {
    return search ? searchCountries(search, countryOptions) : countryOptions;
  }, [search, countryOptions]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlightIndex(filteredOptions.findIndex((opt) => opt.code === value));
    }
  }, [open, filteredOptions, value]);

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
        break;
    }
  };

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
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

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tab, setTab] = useState('email'); // email | mobile
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Forgot Password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{6,15}$/;
    return phoneRegex.test(phone);
  };

  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 15);
    setPhone(digits);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setServerErr('');
    setSuccessMsg('');

    if (!email || !password) {
      setServerErr('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setServerErr('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      const { token, refreshToken, user } = res.data;
      login(token, refreshToken, user);
      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setServerErr(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileLogin = async (e) => {
    e.preventDefault();
    setServerErr('');
    setSuccessMsg('');

    if (!phone || !otp) {
      setServerErr('Please fill in all fields');
      return;
    }

    if (!validatePhone(phone)) {
      setServerErr('Please enter a valid phone number');
      return;
    }

    if (otp.length !== 6) {
      setServerErr('OTP must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      // Format phone into combined format: +{countrycode}{10digits}
      const combinedPhone = formatPhoneFromParts(countryCode, phone);
      
      if (!combinedPhone) {
        setServerErr('Invalid phone format. Please check country code and phone number.');
        setLoading(false);
        return;
      }

      // Backend expects combined phone format
      const res = await verifyOtp(combinedPhone, otp);
      const { token, refreshToken, user } = res.data;
      login(token, refreshToken, user);
      setSuccessMsg('Login successful! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (e) {
      setServerErr(e.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(forgotEmail)) {
      setServerErr('Please enter a valid email address');
      return;
    }
    
    setForgotLoading(true);
    setServerErr('');
    
    try {
      await requestPasswordReset(forgotEmail);
      setForgotSuccess(true);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (error) {
      setServerErr(error.response?.data?.error || 'Failed to send reset email');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    setServerErr('');
    setSuccessMsg('');

    if (!phone) {
      setServerErr('Please enter phone number');
      return;
    }

    if (!validatePhone(phone)) {
      setServerErr('Please enter a valid phone number');
      return;
    }

    setOtpLoading(true);
    try {
      // Format phone into combined format: +{countrycode}{10digits}
      const combinedPhone = formatPhoneFromParts(countryCode, phone);
      
      if (!combinedPhone) {
        setServerErr('Invalid phone format. Please check country code and phone number.');
        setOtpLoading(false);
        return;
      }

      // Backend expects combined phone format
      const res = await requestOtp(combinedPhone);
      setOtpSent(true);
      setSuccessMsg(res.data.message || 'OTP sent successfully');
      
      // Show OTP in dev mode (if backend sends it)
      if (res.data.otp) {
        setSuccessMsg(`OTP sent: ${res.data.otp} (Dev mode)`);
      }
    } catch (e) {
      setServerErr(e.response?.data?.error || 'Failed to send OTP. Make sure this number is registered.');
    } finally {
      setOtpLoading(false);
    }
  };

  const isEmailValid = email && validateEmail(email) && password.length > 0;
  const isPhoneValid = phone && validatePhone(phone) && otp.length === 6;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 pb-10 pt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-800/85" aria-hidden="true" />
      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-teal-500/25 via-cyan-500/20 to-emerald-500/25" aria-hidden="true" />

      {/* Glassmorphism container */}
      <div
        className="
        relative z-10
        w-full max-w-xl
        rounded-3xl
        bg-white/6 border border-white/12 shadow-2xl backdrop-blur-2xl
        px-8 py-10
      "
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <LogoMark size={56} />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            Welcome{' '}
            <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent">
              Back
            </span>
          </h1>
          <p className="text-sm text-gray-400">Manage your expenses smarter</p>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => {
              setTab('email');
              setServerErr('');
            }}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm
              transition-all duration-300
              ${
                tab === 'email'
                  ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15'
              }
            `}
          >
            EMAIL/PASSWORD
          </button>
          <button
            onClick={() => {
              setTab('mobile');
              setServerErr('');
              setSuccessMsg('');
              setOtpSent(false);
              setOtp('');
            }}
            className={`
              flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm
              transition-all duration-300
              ${
                tab === 'mobile'
                  ? 'bg-gradient-to-r from-teal-500 to-green-500 text-white shadow-lg'
                  : 'bg-white/10 border border-white/20 text-gray-300 hover:bg-white/15'
              }
            `}
          >
            MOBILE/OTP
          </button>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="px-4 py-3 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm mb-4">
            {successMsg}
          </div>
        )}

        {/* Server error */}
        {serverErr && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{serverErr}</span>
          </div>
        )}

        {/* EMAIL/PASSWORD TAB */}
        {tab === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <Input
              name="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={email && !validateEmail(email) ? 'Please enter a valid email' : ''}
              autoComplete="email"
              required
            />

            <Input
              name="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true);
                  setForgotEmail(email);
                  setServerErr('');
                  setSuccessMsg('');
                }}
                className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" disabled={!isEmailValid || loading} loading={loading} fullWidth>
              {loading ? 'Logging In...' : 'Login'}
            </Button>
          </form>
        ) : (
          /* MOBILE/OTP TAB */
          <form onSubmit={handleMobileLogin} className="space-y-5">
            <div className="flex gap-3">
              <div className="w-[130px]">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-200">
                    Country
                  </span>
                  <CountrySelect value={countryCode} onChange={setCountryCode} />
                </label>
              </div>
              <div className="flex-1">
                <Input
                  name="phone"
                  type="tel"
                  label="Mobile number"
                  placeholder="Enter phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  error={phone && !validatePhone(phone) ? 'Digits only (6-15)' : ''}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <Button
                type="button"
                onClick={handleRequestOtp}
                disabled={!validatePhone(phone) || otpLoading || otpSent}
                loading={otpLoading}
                variant="secondary"
                className="whitespace-nowrap h-[46px]"
              >
                {otpSent ? 'OTP sent' : 'Get OTP'}
              </Button>
              <div className="flex-1">
                <Input
                  name="otp"
                  type="text"
                  label="One-time passcode"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  error={otp && otp.length !== 6 ? 'Enter the 6-digit code' : ''}
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={!isPhoneValid || loading} loading={loading} fullWidth className="mt-2">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </Button>
          </form>
        )}

        {/* Footer link */}
        <p className="text-center text-sm text-gray-400 mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-teal-400 hover:text-teal-300 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl bg-white/10 border border-white/20 shadow-2xl backdrop-blur-xl p-8">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotSuccess(false);
                setServerErr('');
                setSuccessMsg('');
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
              <p className="text-sm text-gray-400">
                {forgotSuccess 
                  ? 'Check your email for reset instructions'
                  : 'Enter your email and we\'ll send you a reset link'}
              </p>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/50 flex gap-2 items-start text-green-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {serverErr && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 flex gap-2 items-start text-red-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{serverErr}</span>
              </div>
            )}

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  type="email"
                  name="forgot-email"
                  label="Email address"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  error={forgotEmail && !validateEmail(forgotEmail) ? 'Please enter a valid email' : ''}
                  autoComplete="email"
                  required
                />

                <Button
                  type="submit"
                  disabled={!validateEmail(forgotEmail) || forgotLoading}
                  loading={forgotLoading}
                  fullWidth
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <Button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotSuccess(false);
                  setServerErr('');
                  setSuccessMsg('');
                }}
                fullWidth
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
