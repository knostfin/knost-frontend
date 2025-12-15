import React, { useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LogoMark from './LogoMark';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const initials = user
    ? `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <header
      className="w-full bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-teal-500/5 relative z-[1000]"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between py-3 sm:py-4 px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="group flex items-center space-x-2 sm:space-x-3 relative">
          <span
            className="absolute -inset-3 rounded-full bg-teal-500/20 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden="true"
          />
          <LogoMark size={40} className="shrink-0 sm:w-[52px]" />
          <div className="flex flex-col leading-tight">
            <span className="text-white text-lg sm:text-xl font-semibold tracking-wide group-hover:text-white/90 transition-colors">
              Knost
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60 group-hover:text-teal-400 transition-colors hidden sm:block">
              Know Your Cost
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center space-x-3 sm:space-x-6 relative">
          {user ? (
            <>
              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpen(!open)}
                  aria-haspopup="true"
                  aria-expanded={open}
                  className="flex items-center space-x-1 sm:space-x-2 bg-white/10 hover:bg-white/15 border border-white/10 px-2 sm:px-4 py-2 rounded-full text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {initials}
                  </div>
                  <span className="hidden md:block capitalize text-sm font-medium">{user.firstname}</span>
                  <span className="text-xs">▼</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {location.pathname !== '/' &&
                location.pathname !== '/signup' &&
                location.pathname !== '/login' && (
                  <>
                    <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="text-sm px-4 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-teal-500 to-green-500 hover:scale-105 transition-transform"
                    >
                      Sign up
                    </Link>
                  </>
                )}
            </>
          )}
        </nav>
      </div>

      {/* Dropdown Portal with overlay to handle outside clicks */}
      {open && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-16 right-6 w-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-teal-500/10 z-[99999]">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Account Details
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              Logout
            </button>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}

// No props expected for Navbar
 
