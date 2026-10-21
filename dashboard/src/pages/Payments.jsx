import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  Smartphone,
  Send,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Download,
  AlertCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Payments({ onOpenPayout, onOpenPlan }) {
  const { token, user } = useAuth();
  const [balance, setBalance] = useState(0.0);
  const [payouts, setPayouts] = useState([]);
  const [inwardPayments, setInwardPayments] = useState([]);
  const [activeLedgerTab, setActiveLedgerTab] = useState('subscriptions'); // 'subscriptions' | 'payouts'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      try {
        // Fetch payouts
        const pRes = await fetch('/api/payouts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          setPayouts(pData.history || []);
          setBalance(pData.available_balance || 0.0);
        }

        // Fetch inward payments
        const payRes = await fetch('/api/payments/history', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (payRes.ok) {
          const payData = await payRes.json();
          setInwardPayments(payData || []);
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#2ee6a6] uppercase tracking-wider mb-2">
              <Wallet className="w-4 h-4" />
              <span>Available Disbursement Pool</span>
            </div>
            <div className="text-4xl font-extrabold font-heading text-white font-mono">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Accumulated affiliate commissions ready for immediate multi-rail disbursement.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenPayout}
              disabled={balance <= 0}
              className="px-6 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 disabled:opacity-40"
            >
              Request Payout
            </button>
            <button
              onClick={onOpenPlan}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase border border-[#2ee6a6]/40 bg-[#2ee6a6]/10 text-[#2ee6a6] hover:bg-[#2ee6a6]/20 flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Pay via UPI / Change Tier</span>
            </button>
            <span className="text-xs text-slate-500">
              * Active Plan: <strong className="text-white capitalize">{user?.plan || 'Starter'}</strong>
            </span>
          </div>
        </div>

        {/* Supported Disbursement & Payment Rails */}
        <div className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-heading mb-1">Payment & Disbursement Rails</h3>
            <p className="text-xs text-slate-400 mb-4">Supported settlement protocols</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03]">
                <Smartphone className="w-4 h-4 text-[#2ee6a6]" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Dynamic UPI QR (Pay & Payout)</div>
                  <div className="text-[10px] text-slate-400">NPCI QR Protocol • Real-time</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03]">
                <Building2 className="w-4 h-4 text-[#7c8cff]" />
                <div className="text-xs">
                  <div className="font-semibold text-white">Direct Net Banking (ACH/NEFT)</div>
                  <div className="text-[10px] text-slate-400">SBI, HDFC, ICICI, Axis • Instant</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03]">
                <Send className="w-4 h-4 text-[#ffb020]" />
                <div className="text-xs">
                  <div className="font-semibold text-white">PayPal International</div>
                  <div className="text-[10px] text-slate-400">Worldwide currency conversion</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Ledger Section */}
      <div className="p-6 rounded-2xl glass-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-white/[0.08] gap-4">
          <div>
            <h3 className="font-bold text-base font-heading">Financial Transactions Ledger</h3>
            <p className="text-xs text-slate-400">Audit trail of inward plan payments and outward payout settlements</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.05] border border-white/10">
            <button
              onClick={() => setActiveLedgerTab('subscriptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeLedgerTab === 'subscriptions'
                  ? 'bg-[#2ee6a6] text-[#07090e] shadow-glow-teal'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Subscription Payments ({inwardPayments.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('payouts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeLedgerTab === 'payouts'
                  ? 'bg-[#2ee6a6] text-[#07090e] shadow-glow-teal'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Withdrawals / Payouts ({payouts.length})
            </button>
          </div>
        </div>

        {/* TAB 1: INWARD SUBSCRIPTION PAYMENTS (UPI QR / NET BANKING) */}
        {activeLedgerTab === 'subscriptions' && (
          <div>
            {inwardPayments.length === 0 ? (
              <div className="py-12 text-center">
                <CreditCard className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-300">No subscription payments yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Upgrade your tier using Dynamic UPI QR Code or Net Banking to activate pro features.
                </p>
                <button
                  onClick={onOpenPlan}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 text-[#2ee6a6]"
                >
                  Make Payment / Upgrade
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="pb-3 pl-2">Order ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Tier Plan</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Reference / UTR</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {inwardPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-slate-300">
                          {pay.order_id}
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono">
                          {new Date(pay.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 font-semibold text-white capitalize">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10">
                            {pay.plan}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-300 font-semibold uppercase">
                          {pay.method === 'upi' ? 'UPI Dynamic QR' : pay.bank_name ? `${pay.bank_name} Net Banking` : 'Net Banking'}
                        </td>
                        <td className="py-3.5 font-mono text-slate-400 text-[11px]">
                          {pay.utr_ref || 'Verified Gateway'}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-[#2ee6a6]">
                          ₹{pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pay.status === 'success'
                              ? 'bg-[#2ee6a6]/10 text-[#2ee6a6] border border-[#2ee6a6]/30'
                              : 'bg-[#ffb020]/10 text-[#ffb020] border border-[#ffb020]/30'
                          }`}>
                            {pay.status === 'success' ? 'Settled / Active' : pay.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAYOUTS (DISBURSEMENTS) */}
        {activeLedgerTab === 'payouts' && (
          <div>
            {payouts.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-300">No payout history recorded yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  When you submit a payout request, each transaction receipt and status tracker will be listed here.
                </p>
                <button
                  onClick={onOpenPayout}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 text-[#2ee6a6]"
                >
                  Request Initial Payout
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                      <th className="pb-3 pl-2">Transaction ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Disbursement Rail</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right pr-2">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 pl-2 font-mono text-slate-300">
                          #{p.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 text-slate-400 font-mono">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 font-semibold text-white capitalize">
                          {p.method}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-white">
                          ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'Paid'
                              ? 'bg-[#2ee6a6]/10 text-[#2ee6a6] border border-[#2ee6a6]/30'
                              : 'bg-[#ffb020]/10 text-[#ffb020] border border-[#ffb020]/30'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10" title="Download Statement">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
