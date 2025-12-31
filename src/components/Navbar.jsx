import React, { useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LogoMark from './LogoMark';
import { ChevronDown, User, LogOut, Settings } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [storedUser, setStoredUser] = useState(null);
  const dropdownRef = useRef(null);

  // Sync storedUser from localStorage on mount
  useEffect(() => {
    try {
      const u = localStorage.getItem('user');
      if (u) setStoredUser(JSON.parse(u));
    } catch (e) {
      console.error('Failed to parse stored user:', e);
    }
  }, []);

  // When context user updates, update storedUser
  useEffect(() => {
    if (user) {
      setStoredUser(user);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Use whichever is available: real user from context or fallback from localStorage
  const displayUser = user || storedUser;
  const initials = displayUser
    ? `${displayUser.firstname?.[0] || ''}${displayUser.lastname?.[0] || ''}`.toUpperCase()
    : '';

  const isActive = (path) => location.pathname === path;

  return (
    <header
      className="sticky top-4 mx-auto w-[calc(100%-2rem)] max-w-7xl h-16 rounded-[20px] border border-white/5 shadow-2xl shadow-black/20 z-[1000] transition-all duration-500"
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="h-full flex items-center justify-between px-6">
        {/* Brand */}
        <Link to={displayUser ? '/dashboard' : '/'} className="group flex items-center space-x-3 relative">
          <LogoMark className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">Knost</span>
        </Link>

        {/* Center Nav */}
        {displayUser && (
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`px-4 py-2 rounded-xl text-base font-medium transition-all duration-300 ${
                isActive('/dashboard')
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/analytics"
              className={`px-4 py-2 rounded-xl text-base font-medium transition-all duration-300 ${
                isActive('/analytics')
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Analytics
            </Link>
          </nav>
        )}

        {/* User Profile */}
        {displayUser ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl border border-white/5 hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 group"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/20">
                  {initials || <User className="w-5 h-5" />}
                </div>
                <div className="absolute inset-0 rounded-full ring-2 ring-emerald-400/30 animate-pulse"></div>
              </div>
              
              {/* User Info */}
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-semibold text-white">
                  {displayUser.firstname} {displayUser.lastname}
                </span>
              </div>
              
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && createPortal(
              <div className="fixed inset-0 z-[999]" onClick={() => setOpen(false)}>
                <div 
                  className="absolute top-20 right-8 w-64 rounded-2xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden"
                  style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-white/5">
                    <p className="text-sm font-semibold text-white">{displayUser.firstname} {displayUser.lastname}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{displayUser.email}</p>
                  </div>
                  
                  <div className="p-2">
                    <Link
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                      <Settings className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                      <span>Account Settings</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-200 group"
                    >
                      <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {location.pathname !== '/' &&
              location.pathname !== '/signup' &&
              location.pathname !== '/login' && (
                <>
                  <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="text-sm px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:scale-105 transition-transform"
                  >
                    Sign up
                  </Link>
                </>
              )}
          </div>
        )}
      </div>
    </header>
  );
}

// No props expected for Navbar
 
