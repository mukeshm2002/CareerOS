import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { ArrowRight, Lock, Mail, User, AlertCircle } from 'lucide-react';
import { ValariLogo } from '../components/common/ValariLogo';

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register({ fullName, email, password });
      if (response.success) {
        const { user, tokens } = response.data;
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        // New users go to onboarding first
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#090D16] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Official Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <ValariLogo variant="lockup" size="md" />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
            Plan your growth. Execute your day. Track your progress.
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-[#E5E7EB] dark:border-[#263247] shadow-card p-7 md:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-[#F8FAFC]">Build your VALARI</h2>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
              Start structuring your goals, priorities, and daily execution system.
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
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 focus:border-[#FF7A00] focus:bg-white dark:focus:bg-[#111827] transition-all"
                />
              </div>
            </div>

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
                  placeholder="alex@domain.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 focus:border-[#FF7A00] focus:bg-white dark:focus:bg-[#111827] transition-all"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#FF7A00]/25 focus:border-[#FF7A00] focus:bg-white dark:focus:bg-[#111827] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] active:bg-[#D95F00] text-white font-semibold text-sm transition-all shadow-sm shadow-[#FF7A00]/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#263247] text-center">
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#FF7A00] hover:text-[#EA6700]">
                Sign In
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
