import React, { useState } from 'react';
import { X, Phone, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { contactService } from '../../services/contactService';

export default function PhoneVerificationModal({ isOpen, onClose, onSuccess, currentMaskedPhone }) {
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState(currentMaskedPhone || '');
  const [devCode, setDevCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleStartVerification = async (e) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +91 98765 43210)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await contactService.startVerification(phone.trim());
      setMaskedPhone(res.maskedValue);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to start phone verification');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length < 4) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await contactService.confirmVerification(code.trim());
      if (onSuccess) {
        onSuccess(res.phoneContact || res.contact);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setPhone('');
    setCode('');
    setDevCode(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Phone Number Verification</h3>
              <p className="text-xs text-muted-foreground">Required for voice reminder delivery</p>
            </div>
          </div>
          <button
            onClick={resetModal}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStartVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Include your country code (+91 for India, +1 for US, etc.). We will never send spam.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Your number is strictly used for authorized voice reminders and never shared or exposed publicly.
                </span>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetModal}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConfirmVerification} className="space-y-4">
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">Verification code sent to</p>
                <p className="text-sm font-semibold text-foreground font-mono mt-0.5">{maskedPhone}</p>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  Change Number
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5 text-center">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full max-w-[200px] mx-auto block px-3 py-2.5 bg-background border border-border rounded-xl text-center text-xl tracking-[0.3em] font-mono text-foreground placeholder:tracking-normal placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              {devCode && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center">
                  Test Environment Code: <span className="font-mono font-bold">{devCode}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || code.length < 4}
                  className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify & Enable</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
