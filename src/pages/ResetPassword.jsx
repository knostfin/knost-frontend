import { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { validatePassword } from '../utils/validation';
import LogoMark from '../components/LogoMark';
import Toast from '../components/Toast';

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [serverErr, setServerErr] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isNewPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.special;
  const isConfirmPasswordValid = confirmPassword && confirmPassword === newPassword;

  const togglePasswordVisibility = (field) => {
    setShowPassword((s) => ({ ...s, [field]: !s[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr('');
    setSuccessMsg('');
    setValidationErrors({});

    // Validate passwords
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setValidationErrors({ new: passwordError });
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationErrors({ confirm: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({ token, email, newPassword, confirmPassword });
      setSuccessMsg(response.data.message || 'Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reset password. Please try again.';
      setServerErr(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-800/85" aria-hidden="true" />
      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-teal-500/25 via-cyan-500/20 to-emerald-500/25" aria-hidden="true" />

      {/* Toast Messages */}
      <Toast
        message={successMsg}
        type="success"
        onClose={() => setSuccessMsg('')}
      />
      <Toast
        message={serverErr}
        type="error"
        onClose={() => setServerErr('')}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <LogoMark className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your new password</p>
        </div>

        {/* Reset Password Form */}
        <div className="rounded-3xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPassword.new ? 'text' : 'password'}
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setValidationErrors((v) => ({ ...v, new: '' }));
                  }}
                  className={`w-full px-4 pr-12 py-3 rounded-lg text-white placeholder-gray-500 transition focus:outline-none ${
                    validationErrors.new
                      ? 'bg-red-500/10 border-2 border-red-500/50 focus:ring-2 focus:ring-red-500/50'
                      : isNewPasswordValid
                      ? 'bg-teal-500/10 border-2 border-teal-500/50 focus:ring-2 focus:ring-teal-500/50'
                      : 'bg-white/5 border border-white/10 focus:ring-2 focus:ring-teal-500'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-3 flex items-center justify-center h-6 w-6 my-auto text-white/70 hover:text-white transition-transform active:scale-95"
                  aria-label={showPassword.new ? 'Hide new password' : 'Show new password'}
                >
                  {showPassword.new ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223a10.477 10.477 0 00-.858 1.323A10.451 10.451 0 002 12c1.5 2.905 4.64 5 8 5 1.478 0 2.872-.356 4.1-.987m3.02-2.641c.474-.51.888-1.07 1.24-1.672A10.451 10.451 0 0022 12c-1.5-2.905-4.64-5-8-5-1.224 0-2.39.218-3.465.616"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.new && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.new}</p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setValidationErrors((v) => ({ ...v, confirm: '' }));
                  }}
                  className={`w-full px-4 pr-12 py-3 rounded-lg text-white placeholder-gray-500 transition focus:outline-none ${
                    validationErrors.confirm
                      ? 'bg-red-500/10 border-2 border-red-500/50 focus:ring-2 focus:ring-red-500/50'
                      : isConfirmPasswordValid
                      ? 'bg-teal-500/10 border-2 border-teal-500/50 focus:ring-2 focus:ring-teal-500/50'
                      : 'bg-white/5 border border-white/10 focus:ring-2 focus:ring-teal-500'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-3 flex items-center justify-center h-6 w-6 my-auto text-white/70 hover:text-white transition-transform active:scale-95"
                  aria-label={showPassword.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showPassword.confirm ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223a10.477 10.477 0 00-.858 1.323A10.451 10.451 0 002 12c1.5 2.905 4.64 5 8 5 1.478 0 2.872-.356 4.1-.987m3.02-2.641c.474-.51.888-1.07 1.24-1.672A10.451 10.451 0 0022 12c-1.5-2.905-4.64-5-8-5-1.224 0-2.39.218-3.465.616"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l16 16" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.confirm && (
                <p className="text-red-400 text-xs mt-1">{validationErrors.confirm}</p>
              )}
            </div>

            {/* Password Requirements */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isNewPasswordValid || !isConfirmPasswordValid}
              className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all duration-300"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          {/* Back to Login */}
          <p className="text-center text-sm text-gray-400 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-semibold">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
