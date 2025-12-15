import React from 'react';
import { Link } from 'react-router-dom';
import { getCloudinaryUrl, getCloudinarySrcSet } from '../utils/cloudinary';

export default function Welcome() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 pb-10 pt-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/90 to-slate-800/85" aria-hidden="true" />
      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-teal-500/25 via-cyan-500/20 to-emerald-500/25" aria-hidden="true" />
      <div
        className="
          relative z-10
          w-full max-w-6xl mx-auto
          rounded-2xl sm:rounded-3xl
          bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl
          grid grid-cols-1 md:grid-cols-2 items-center gap-4 sm:gap-6 lg:gap-8
          px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10
        "
      >
        {/* LEFT SECTION */}
        <div className="flex flex-col justify-center animate-fadeIn relative">
          {/* Heading with Gradient */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight text-white mb-1">
            Master Your{' '}
            <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent">
              Money
            </span>
            <br />
            Know Your{' '}
            <span className="bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent">
              Cost
            </span>
          </h1>

          {/* Description */}
          <p className="mt-2 text-sm sm:text-base leading-relaxed text-gray-300 max-w-lg">
            Take control of your expenses, budgets, and savings with powerful insights and smart
            financial tools.
          </p>

          {/* CTA Buttons */}
          <div className="mt-5 flex gap-2 sm:gap-4 flex-wrap">
            <Link
              to="/signup"
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Get Started
            </Link>

            <Link
              to="/login"
              className="px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-full bg-gradient-to-r from-slate-700/70 via-slate-600/70 to-slate-500/70 text-white font-semibold text-sm sm:text-base md:text-lg shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 border border-white/10"
            >
              Sign In
            </Link>
          </div>

          {/* Features with Icon Backgrounds */}
          <div className="mt-8 sm:mt-10 grid grid-cols-3 gap-3 sm:gap-5 md:gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full bg-teal-900/30 flex items-center justify-center mb-2 sm:mb-3 group hover:bg-teal-900/50 transition-colors">
                <svg
                  className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-teal-400 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                Expense Tracking
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full bg-green-900/30 flex items-center justify-center mb-2 sm:mb-3 group hover:bg-green-900/50 transition-colors">
                <svg
                  className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-green-400 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                Budget Planning
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-2 sm:mb-3 group hover:bg-blue-900/50 transition-colors">
                <svg
                  className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-blue-400 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-white">
                Smart Analytics
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex justify-center items-center animate-fadeIn">
          <div className="relative w-full max-w-full overflow-hidden">
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900/20 to-green-900/20 rounded-3xl blur-3xl overflow-hidden" />

            <img
              src={getCloudinaryUrl('welcome-illustration.png', { width: 800 })}
              srcSet={getCloudinarySrcSet('welcome-illustration.png', [480, 800, 1200])}
              sizes="(max-width: 640px) 100vw, 50vw"
              alt="Illustration of analytics dashboard, charts and budgeting tools"
              loading="eager"
              decoding="async"
              className="relative w-full rounded-3xl shadow-2xl object-contain hover:shadow-3xl transition-shadow duration-500"
            />
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

// No props expected for Welcome
