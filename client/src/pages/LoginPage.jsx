import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { AuthBrandHeader } from '../components/auth/AuthBrandHeader';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);

        if (!user.isOnboarded) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F17] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Official Brand Header */}
        <AuthBrandHeader />

        {/* Login Card */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-[#E5E7EB] dark:border-[#253044] p-7 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-[#F8FAFC]">Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Enter your credentials to access your growth workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-700 dark:text-[#F87171] text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2A7A3B]/20 focus:border-[#2A7A3B] focus:bg-white dark:focus:bg-[#111827] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2A7A3B]/20 focus:border-[#2A7A3B] focus:bg-white dark:focus:bg-[#111827] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] active:bg-[#1A5030] text-white font-semibold text-sm transition-all shadow-sm shadow-[#2A7A3B]/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#263247] text-center">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#2A7A3B] hover:text-[#22653A]">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Product Ownership */}
        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400 dark:text-[#64748B]">
            A product by TamZode Technology
          </p>
        </div>
      </div>
    </div>
  );
};
