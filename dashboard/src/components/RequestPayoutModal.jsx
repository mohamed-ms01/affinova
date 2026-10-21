import React, { useState } from 'react';
import { X, Wallet, Building2, Smartphone, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RequestPayoutModal({ isOpen, onClose, availableBalance, onPayoutRequested }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi'); // upi | bank | paypal
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid payout amount.');
      return;
    }

    if (parsedAmount > availableBalance) {
      setError(`Requested amount exceeds your available balance (₹${availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).`);
      return;
    }

    if (!accountDetails.trim()) {
      setError('Please provide destination payout coordinates.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parsedAmount,
          method: method,
          details: accountDetails
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Payout submission failed.');
      }

      onPayoutRequested(data);
      onClose();
      setAmount('');
      setAccountDetails('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl glass-panel bg-[#141b24] border-white/10 text-white dark:bg-[#141b24] dark:border-white/10 dark:text-white light:bg-white light:border-slate-200 light:text-slate-900">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">Request Payout</h2>
              <p className="text-xs text-slate-400">Available: ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
              Withdrawal Amount (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="1000"
                max={availableBalance}
                required
                placeholder="1000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm border outline-none font-mono
                  bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]
                  dark:bg-[#0e131a] dark:border-white/10 dark:text-white
                  light:bg-slate-50 light:border-slate-200 light:text-slate-900
                "
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
              Disbursement Method *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  method === 'upi'
                    ? 'border-[#2ee6a6] bg-[#2ee6a6]/10 text-[#2ee6a6]'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>UPI Fast</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('bank')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  method === 'bank'
                    ? 'border-[#2ee6a6] bg-[#2ee6a6]/10 text-[#2ee6a6]'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Bank Wire</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('paypal')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 transition-all ${
                  method === 'paypal'
                    ? 'border-[#2ee6a6] bg-[#2ee6a6]/10 text-[#2ee6a6]'
                    : 'border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>PayPal</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-700 mb-1.5">
              {method === 'upi' ? 'UPI Virtual ID' : method === 'bank' ? 'Account Number & IFSC / Routing' : 'PayPal Email'} *
            </label>
            <input
              type="text"
              required
              placeholder={method === 'upi' ? 'username@okhdfcbank' : method === 'bank' ? 'AC: 9876543210 / IFSC: HDFC0001234' : 'user@paypal.me'}
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none
                bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]
                dark:bg-[#0e131a] dark:border-white/10 dark:text-white
                light:bg-slate-50 light:border-slate-200 light:text-slate-900
              "
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || availableBalance <= 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Request Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
