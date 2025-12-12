import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LogoMark from './LogoMark';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const initials = user
    ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <header
      className="
        w-full
        border-b border-white/5
        bg-[#050608]/95
        backdrop-blur-md
      "
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-6">
        {/* Brand */}
        <Link to="/" className="group flex items-center space-x-3 relative">
          <span
            className="absolute -inset-3 rounded-full bg-[var(--primary)]/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <LogoMark size={52} className="shrink-0" />
          <div className="flex flex-col leading-tight">
            <span className="text-white text-xl font-semibold tracking-wide group-hover:text-white/90">
              Knost
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-white/50 group-hover:text-white/70">
              Know Your Cost
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center space-x-6 relative">
          {user ? (
            <>
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-haspopup="true"
                  aria-expanded={open}
                  className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                  <span className="hidden sm:block capitalize">{user.firstname}</span>
                  <span>▼</span>
                </button>

                {open && (
                  <div className="absolute right-0 mt-2 w-40 bg-[#111] border border-white/10 rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/account"
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    >
                      Account Details
                    </Link>

                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {location.pathname !== '/' &&
                location.pathname !== '/signup' &&
                location.pathname !== '/login' && (
                  <>
                    <Link to="/login" className="text-sm font-semibold text-white">
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="text-sm px-3 py-1 rounded-full font-semibold text-white bg-[var(--primary)]"
                    >
                      Sign up
                    </Link>
                  </>
                )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// No props expected for Navbar
