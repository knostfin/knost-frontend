import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  getUserProfile,
  updateUser as apiUpdateUser,
  uploadProfilePhoto,
  changePassword as apiChangePassword,
  requestEmailVerification,
  verifyNewEmail,
} from '../api/auth';
import Toast from '../components/Toast';
import { validateEmail, validatePhone, validateName, validatePassword } from '../utils/validation';

const formatJoinedDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatLastActive = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export default function Account() {
  const { user, verify, setUser, accessToken, loading } = useContext(AuthContext);
  const [tab, setTab] = useState('profile'); // profile, password, email
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', phone: '' });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoDataPreview, setPhotoDataPreview] = useState(null);
  const [photoCandidates, setPhotoCandidates] = useState([]);
  const [photoSrcIndex, setPhotoSrcIndex] = useState(0);
  const [photoError, setPhotoError] = useState('');
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [emailForm, setEmailForm] = useState({ newEmail: '', code: '' });
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [formLoading, setFormLoading] = useState(false); // used for password/email flows
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [optimisticUser, setOptimisticUser] = useState(null);
  const fileInputRef = useRef(null);

  const MAX_PHOTO_SIZE_MB = 5;
  const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const getUserPhotoValue = (u) => u?.profilePhoto || u?.photo || u?.photo_filename || u?.photoFilename;
  

  const buildPhotoCandidates = (rawValue, dataPreview) => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    const ensureLeadingSlash = (v) => (v.startsWith('/') ? v : `/${v}`);
    const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));

    // Start with data preview so the user sees what they just picked while network resolves
    const candidates = dataPreview ? [dataPreview] : [];
    if (!rawValue) return uniq(candidates);

    if (rawValue.startsWith('data:') || /^https?:\/\//i.test(rawValue)) {
      candidates.push(rawValue);
      return uniq(candidates);
    }

    const basename = rawValue.includes('/') ? ensureLeadingSlash(rawValue) : ensureLeadingSlash(rawValue);
    const filename = rawValue.includes('/') ? rawValue.split('/').pop() : rawValue;

    const relativeGuesses = [
      basename,
      `/uploads/${filename}`,
      `/api/uploads/${filename}`,
      `/api/auth/uploads/${filename}`,
      `/${filename}`,
    ].map(ensureLeadingSlash);

    relativeGuesses.forEach((g) => {
      candidates.push(`${apiBase}${g}`);
      candidates.push(g); // also try same-origin relative
    });

    return uniq(candidates);
  };

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!loading && accessToken) {
        try {
          const res = await getUserProfile();
          if (res?.data?.user) {
            setUser(res.data.user);
            setOptimisticUser(res.data.user);
          }
        } catch (err) {
          console.error('Failed to load profile:', err);
        }
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, accessToken]);

  useEffect(() => {
    if (user) {
      setForm({
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      const initialValue = getUserPhotoValue(user);
      if (initialValue) {
        const cands = buildPhotoCandidates(initialValue, null);
        setPhotoCandidates(cands);
        setPhotoSrcIndex(0);
        setPhotoPreview(cands[0] || null);
        setPhotoDataPreview(null);
        setPhotoSuccess(false);
        setPhotoError('');
      }
      setOptimisticUser(user);
    }
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((s) => ({ ...s, [field]: !s[field] }));
  };

  // ========== Profile Tab ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setValidationErrors((e) => ({ ...e, [name]: '' }));
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!form.firstname) errors.firstname = 'First name is required';
    else if (validateName(form.firstname)) errors.firstname = validateName(form.firstname);

    if (!form.lastname) errors.lastname = 'Last name is required';
    else if (validateName(form.lastname)) errors.lastname = validateName(form.lastname);

    if (form.phone && validatePhone(form.phone)) errors.phone = validatePhone(form.phone);

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setPhotoSuccess(false);

    const isAllowedType =
      ALLOWED_PHOTO_TYPES.includes(file.type) || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if (!isAllowedType) {
      const message = 'Only JPG, PNG, WEBP, or GIF images are allowed.';
      setPhotoError(message);
      showToast(message, 'error');
      if (e.target.value) e.target.value = '';
      return;
    }

    const maxBytes = MAX_PHOTO_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      const message = `File size must be under ${MAX_PHOTO_SIZE_MB}MB.`;
      setPhotoError(message);
      showToast(message, 'error');
      if (e.target.value) e.target.value = '';
      return;
    }

    setPhotoUploading(true);
    try {
      const dataPreview = await readFileAsDataURL(file);
      setPhotoPreview(dataPreview);
      setPhotoDataPreview(dataPreview);

      const res = await uploadProfilePhoto(file);
      const uploadedValue =
        res?.data?.user?.profilePhoto ||
        res?.data?.user?.photo ||
        res?.data?.user?.photo_filename ||
        res?.data?.photo_filename;

      const refreshed = await verify({ force: true });
      const verifiedValue = getUserPhotoValue(refreshed);

      const nextValue = uploadedValue || verifiedValue || getUserPhotoValue(user);
      const cands = buildPhotoCandidates(nextValue, dataPreview);
      setPhotoCandidates(cands);
      setPhotoSrcIndex(0);
      setPhotoPreview(cands[0] || null);
      setOptimisticUser((prev) => ({ ...prev, profilePhoto: nextValue, photo_filename: nextValue }));
      setUser((prev) => ({ ...(prev || {}), profilePhoto: nextValue, photo_filename: nextValue }));

      setPhotoSuccess(true);
      showToast('Profile photo updated successfully');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to upload photo';
      const cands = buildPhotoCandidates(getUserPhotoValue(user), photoDataPreview);
      setPhotoCandidates(cands);
      setPhotoSrcIndex(0);
      setPhotoPreview(cands[0] || null);
      setPhotoError(message);
      showToast(message, 'error');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUploadButtonClick = () => {
    if (photoUploading) return;
    setPhotoError('');
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setProfileSaving(true);
    try {
      // Optimistic update: merge form into existing user to preserve untouched fields
      const baseUser = optimisticUser || user || {};
      const optimistic = {
        ...baseUser,
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
      };
      setOptimisticUser(optimistic);

      const res = await apiUpdateUser({
        firstname: form.firstname,
        lastname: form.lastname,
        phone: form.phone,
      });
      const serverUser = res?.data?.user;

      // Always merge server response with current user to preserve all fields
      const updatedUser = { ...baseUser, ...(serverUser || {}) };
      if (!serverUser) {
        // If server didn't return user, manually add the updated fields
        updatedUser.firstname = form.firstname;
        updatedUser.lastname = form.lastname;
        updatedUser.phone = form.phone;
      }

      // Persist updated user locally to avoid stale data from partial responses
      setUser(updatedUser);
      setOptimisticUser(updatedUser);

      // Fallback refresh if backend does not return user payload
      if (!res?.data?.user) {
        await verify({ force: true });
      }
      showToast('Account details updated successfully');
    } catch (err) {
      setOptimisticUser(user);
      showToast(err.response?.data?.error || 'Failed to update account', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ========== Password Tab ==========
  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.current) errors.current = 'Current password is required';
    if (!passwordForm.new) errors.new = 'New password is required';
    else if (validatePassword(passwordForm.new)) errors.new = validatePassword(passwordForm.new);
    if (!passwordForm.confirm) errors.confirm = 'Please confirm password';
    else if (passwordForm.new !== passwordForm.confirm) errors.confirm = 'Passwords do not match';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setFormLoading(true);
    try {
      await apiChangePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new,
        confirmPassword: passwordForm.confirm,
      });
      setPasswordForm({ current: '', new: '', confirm: '' });
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ========== Email Verification Tab ==========
  const validateEmailForm = () => {
    const errors = {};
    if (!emailForm.newEmail) errors.newEmail = 'Email is required';
    else if (validateEmail(emailForm.newEmail)) errors.newEmail = validateEmail(emailForm.newEmail);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestEmailVerification = async (e) => {
    e.preventDefault();
    if (!validateEmailForm() || emailCodeSent) return;

    setSendingEmailCode(true);
    try {
      await requestEmailVerification(emailForm.newEmail);
      setEmailCodeSent(true);
      showToast('Verification code sent to your email');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to send verification code', 'error');
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!emailCodeSent) return;
    
    const code = (emailForm.code || '').trim();
    if (!code) {
      setValidationErrors({ code: 'Verification code is required' });
      return;
    }

    setVerifyingEmail(true);
    try {
      await verifyNewEmail(code);
      setEmailForm({ newEmail: '', code: '' });
      setEmailCodeSent(false);
      await verify();
      showToast('Email verified successfully');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to verify email', 'error');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const displayUser = optimisticUser || user;
  const phoneDisplay = displayUser
    ? `${
        displayUser.countryCode || displayUser.country_code
          ? `${displayUser.countryCode || displayUser.country_code} `
          : ''
      }${displayUser.phone || ''}`.trim()
    : '';

  const passwordChecks = {
    length: passwordForm.new.length >= 8,
    uppercase: /[A-Z]/.test(passwordForm.new),
    number: /[0-9]/.test(passwordForm.new),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.new),
  };

  const isNewPasswordValid =
    passwordChecks.length &&
    passwordChecks.uppercase &&
    passwordChecks.number &&
    passwordChecks.special;
  const isPasswordFormValid = Boolean(
    passwordForm.current &&
      passwordForm.new &&
      passwordForm.confirm &&
      isNewPasswordValid &&
      passwordForm.new === passwordForm.confirm
  );

  return (
    <div className="min-h-screen p-6">
      <div className="container-max">
        <div className="k-card p-6">
          <h2 className="text-2xl font-semibold mb-6">Account Settings</h2>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => setTab('profile')}
              className={`pb-2 px-4 font-semibold transition ${
                tab === 'profile' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setTab('password')}
              className={`pb-2 px-4 font-semibold transition ${
                tab === 'password' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setTab('email')}
              className={`pb-2 px-4 font-semibold transition ${
                tab === 'email' ? 'border-b-2 border-teal-500 text-teal-400' : 'text-gray-400'
              }`}
            >
              Email
            </button>
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
              {/* Left: Photo only */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 h-fit">
                <h3 className="text-sm font-semibold text-teal-400 mb-3">Profile Photo</h3>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => {
                          const nextIndex = photoSrcIndex + 1;
                          if (nextIndex < photoCandidates.length) {
                            setPhotoSrcIndex(nextIndex);
                            setPhotoPreview(photoCandidates[nextIndex]);
                          } else {
                            setPhotoPreview(null);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl text-gray-400">
                        {displayUser?.firstname?.[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleUploadButtonClick}
                    disabled={photoUploading}
                    className={`w-full px-4 py-2 rounded border transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      photoSuccess
                        ? 'bg-green-500/15 text-green-200 border-green-500/30'
                        : 'bg-teal-500/20 text-teal-300 border-teal-500/30 hover:bg-teal-500/30'
                    }`}
                  >
                    {photoUploading ? (
                      'Uploading...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {photoSuccess && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.072 7.14a1 1 0 0 1-1.436.006L3.29 9.938A1 1 0 0 1 4.71 8.518l3.219 3.204 6.36-6.422a1 1 0 0 1 1.415-.01Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span>{photoPreview ? 'Change Photo' : 'Upload Photo'}</span>
                      </span>
                    )}
                  </button>
                  {photoError && (
                    <p className="text-red-400 text-xs text-center w-full">{photoError}</p>
                  )}
                </div>
              </div>

              {/* Right: Info + form */}
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-semibold text-teal-400 mb-2">Account Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-400">
                    <div className="flex flex-col gap-1">
                      <p>Joined</p>
                      <p className="text-white font-medium leading-snug">
                        {displayUser?.createdAt || displayUser?.created_at
                          ? formatJoinedDate(displayUser.createdAt || displayUser.created_at)
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Last Active</p>
                      <p className="text-white font-medium leading-snug break-words">
                        {displayUser?.lastLogin || displayUser?.last_login
                          ? formatLastActive(displayUser.lastLogin || displayUser.last_login)
                          : 'Never'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p>Phone (signup)</p>
                      <p className="text-white font-medium leading-snug break-words">
                        {phoneDisplay || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">First name</label>
                    <input
                      name="firstname"
                      value={form.firstname}
                      onChange={handleChange}
                      className={`w-full mt-2 px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition ${
                        validationErrors.firstname
                          ? 'border-red-500'
                          : 'border-white/20 focus:border-teal-500'
                      }`}
                    />
                    {validationErrors.firstname && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.firstname}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Last name</label>
                    <input
                      name="lastname"
                      value={form.lastname}
                      onChange={handleChange}
                      className={`w-full mt-2 px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition ${
                        validationErrors.lastname
                          ? 'border-red-500'
                          : 'border-white/20 focus:border-teal-500'
                      }`}
                    />
                    {validationErrors.lastname && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.lastname}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Email (Read-only)</label>
                  <input
                    name="email"
                    value={form.email}
                    disabled
                    className="w-full mt-2 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Phone</label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="px-3 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm flex items-center justify-between min-w-[110px]">
                      <span className="text-gray-400">Code</span>
                      <span className="font-semibold">
                        {displayUser?.countryCode || displayUser?.country_code || '+'}
                      </span>
                    </div>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone number"
                      className={`w-full md:max-w-xs px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition ${
                        validationErrors.phone
                          ? 'border-red-500'
                          : 'border-white/20 focus:border-teal-500'
                      }`}
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              <div>
                <label className="text-sm text-gray-400">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.current ? 'text' : 'password'}
                    value={passwordForm.current}
                    onChange={(e) => {
                      setPasswordForm((s) => ({ ...s, current: e.target.value }));
                      setValidationErrors((v) => ({ ...v, current: '' }));
                    }}
                    className={`w-full mt-2 px-4 pr-12 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition focus:outline-none ${
                      validationErrors.current
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/20 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-3 flex items-center justify-center h-6 w-6 my-auto text-white/70 hover:text-white"
                    aria-label={
                      showPassword.current ? 'Hide current password' : 'Show current password'
                    }
                  >
                    {showPassword.current ? (
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
                {validationErrors.current && (
                  <p className="text-red-400 text-xs mt-1">{validationErrors.current}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-400">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? 'text' : 'password'}
                    value={passwordForm.new}
                    onChange={(e) => {
                      setPasswordForm((s) => ({ ...s, new: e.target.value }));
                      setValidationErrors((v) => ({ ...v, new: '' }));
                    }}
                    className={`w-full mt-2 px-4 pr-12 py-3 rounded-lg text-white placeholder-gray-500 transition focus:outline-none ${
                      validationErrors.new
                        ? 'bg-red-500/10 border-2 border-red-500/50 focus:border-red-500'
                        : isNewPasswordValid
                        ? 'bg-teal-500/10 border-2 border-teal-500/50 focus:border-teal-500'
                        : 'bg-white/10 border border-white/20 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-3 flex items-center justify-center h-6 w-6 my-auto text-white/70 hover:text-white"
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

              <div>
                <label className="text-sm text-gray-400">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={passwordForm.confirm}
                    onChange={(e) => {
                      setPasswordForm((s) => ({ ...s, confirm: e.target.value }));
                      setValidationErrors((v) => ({ ...v, confirm: '' }));
                    }}
                    className={`w-full mt-2 px-4 pr-12 py-3 rounded-lg text-white placeholder-gray-500 transition focus:outline-none ${
                      validationErrors.confirm
                        ? 'bg-red-500/10 border-2 border-red-500/50 focus:border-red-500'
                        : passwordForm.confirm && passwordForm.confirm === passwordForm.new
                        ? 'bg-teal-500/10 border-2 border-teal-500/50 focus:border-teal-500'
                        : 'bg-white/10 border border-white/20 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-3 flex items-center justify-center h-6 w-6 my-auto text-white/70 hover:text-white"
                    aria-label={
                      showPassword.confirm
                        ? 'Hide confirmation password'
                        : 'Show confirmation password'
                    }
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

              <button
                type="submit"
                disabled={formLoading || !isPasswordFormValid}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* Email Verification Tab */}
          {tab === 'email' && (
            <div className="space-y-4 max-w-md">
              <p className="text-sm text-gray-400">
                Current email:{' '}
                <span className="text-white font-semibold">{displayUser?.email}</span>
              </p>
              <form onSubmit={handleRequestEmailVerification} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">New Email Address</label>
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => {
                      setEmailForm((s) => ({ ...s, newEmail: e.target.value, code: '' }));
                      setValidationErrors((v) => ({ ...v, newEmail: '', code: '' }));
                      setEmailCodeSent(false);
                    }}
                    placeholder="your-new-email@example.com"
                    className={`w-full mt-2 px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition ${
                      validationErrors.newEmail
                        ? 'border-red-500'
                        : 'border-white/20 focus:border-teal-500'
                    }`}
                    disabled={sendingEmailCode || verifyingEmail}
                  />
                  {validationErrors.newEmail && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.newEmail}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sendingEmailCode || verifyingEmail || emailCodeSent}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingEmailCode ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>

              {emailCodeSent && (
                <form
                  onSubmit={handleVerifyEmail}
                  className="space-y-4 border-t border-white/10 pt-4"
                  key="verify-form"
                >
                  <p className="text-xs text-gray-400">
                    We&apos;ve sent a code to {emailForm.newEmail}
                  </p>
                  <div>
                    <label className="text-sm text-gray-400">Verification Code</label>
                    <input
                      type="text"
                      value={emailForm.code}
                      onChange={(e) => {
                        setEmailForm((s) => ({ ...s, code: e.target.value.trim() }));
                        setValidationErrors((v) => ({ ...v, code: '' }));
                      }}
                      placeholder="6-digit code"
                      className={`w-full mt-2 px-4 py-3 rounded-lg bg-white/10 border text-white placeholder-gray-500 transition ${
                        validationErrors.code
                          ? 'border-red-500'
                          : 'border-white/20 focus:border-teal-500'
                      }`}
                      disabled={sendingEmailCode || verifyingEmail}
                    />
                    {validationErrors.code && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.code}</p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={sendingEmailCode || verifyingEmail}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifyingEmail ? 'Verifying...' : 'Verify Email'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setEmailCodeSent(false);
                        setEmailForm(prev => ({ ...prev, code: '' }));
                        setValidationErrors({});
                      }}
                      disabled={sendingEmailCode || verifyingEmail}
                      className="px-6 py-3 rounded-full bg-gray-600 text-white font-semibold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
