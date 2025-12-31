import { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { validatePassword } from '../utils/validation';
import LogoMark from '../components/LogoMark';
import Toast from '../components/Toast';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
            <Input
              id="newPassword"
              name="newPassword"
              type={showPassword.new ? 'text' : 'password'}
              label="New Password"
              placeholder="Enter new password (min 8 characters)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setValidationErrors((v) => ({ ...v, new: '' }));
              }}
              error={validationErrors.new}
              autoComplete="new-password"
              required
              min={6}
              trailingIcon={(
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="h-6 w-6 text-slate-400 hover:text-white"
                  aria-label={showPassword.new ? 'Hide new password' : 'Show new password'}
                >
                  {showPassword.new ? (
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

            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword.confirm ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setValidationErrors((v) => ({ ...v, confirm: '' }));
              }}
              error={validationErrors.confirm}
              autoComplete="new-password"
              required
              min={6}
              trailingIcon={(
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="h-6 w-6 text-slate-400 hover:text-white"
                  aria-label={showPassword.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                >
                  {showPassword.confirm ? (
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

            {/* Password Requirements */}
            <div className="text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
              <p className="font-semibold text-gray-300 mb-1">Password requirements:</p>
              <ul className="space-y-1 text-gray-400">
                <li className={`${passwordChecks.length ? 'text-teal-400' : 'text-gray-400'} transition-colors`}>
                  ✓ At least 8 characters
                </li>
                <li className={`${passwordChecks.uppercase ? 'text-teal-400' : 'text-gray-400'} transition-colors`}>
                  ✓ One uppercase letter (A-Z)
                </li>
                <li className={`${passwordChecks.number ? 'text-teal-400' : 'text-gray-400'} transition-colors`}>
                  ✓ One number (0-9)
                </li>
                <li className={`${passwordChecks.special ? 'text-teal-400' : 'text-gray-400'} transition-colors`}>
                  ✓ One special character (!@#$%^&* etc.)
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={loading || !isNewPasswordValid || !isConfirmPasswordValid}
              loading={loading}
              fullWidth
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
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
