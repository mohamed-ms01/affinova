import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  QrCode,
  Building2,
  Smartphone,
  ArrowRight,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Clock,
  ExternalLink,
  CreditCard,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ChangePlanModal({ isOpen, onClose }) {
  const { user, token, updateUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'pro');
  const [paymentStep, setPaymentStep] = useState('select'); // 'select' | 'pay' | 'success'
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'upi' | 'netbanking'
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [supportedBanks, setSupportedBanks] = useState([]);
  const [orderData, setOrderData] = useState(null);
  const [utrRef, setUtrRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const plans = [
    { id: 'starter', name: 'Starter', price: '₹19/mo', amount: 19, clicks: '50k Clicks', domains: 'None' },
    { id: 'pro', name: 'Pro Growth', price: '₹249/mo', amount: 249, clicks: '500k Clicks', domains: '3 Domains', popular: true },
    { id: 'elite', name: 'Enterprise Elite', price: '₹499/mo', amount: 499, clicks: 'Unlimited', domains: 'Unlimited' },
  ];

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select');
      setError('');
      setOrderData(null);
      setUtrRef('');
      // Fetch supported banks
      fetch('/api/payments/banks')
        .then(res => res.json())
        .then(data => {
          if (data.banks) setSupportedBanks(data.banks);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPlanObj = plans.find(p => p.id === selectedPlan) || plans[1];

  // Initiate Razorpay Checkout Popup
  const launchRazorpayCheckout = (orderInfo) => {
    if (!window.Razorpay) {
      // Fallback if Razorpay script not loaded
      handleVerifyPayment(orderInfo, 'rzp_sim_' + Date.now());
      return;
    }

    const options = {
      key: orderInfo.razorpay_key_id || 'rzp_test_placeholder',
      amount: orderInfo.amount * 100,
      currency: 'INR',
      name: 'Affinova Marketing Tech',
      description: `Subscription Upgrade to ${selectedPlan.toUpperCase()} Plan`,
      order_id: orderInfo.razorpay_order_id && !orderInfo.razorpay_order_id.startsWith('order_sim_') 
        ? orderInfo.razorpay_order_id 
        : undefined,
      prefill: {
        name: user?.full_name || 'Publisher',
        email: user?.email || '',
        contact: user?.phone_number || ''
      },
      theme: {
        color: '#2ee6a6'
      },
      handler: function (response) {
        handleVerifyPayment(
          orderInfo, 
          response.razorpay_payment_id, 
          response.razorpay_order_id, 
          response.razorpay_signature
        );
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error?.description || 'Razorpay payment was declined.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.warn('Razorpay popup fallback:', err);
      // Seamless simulation if keys are in test mode
      handleVerifyPayment(orderInfo, 'rzp_pay_' + Date.now());
    }
  };

  // Initiate Payment Order (Razorpay, UPI QR or Net Banking)
  const handleProceedToPayment = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          method: paymentMethod,
          bank_name: paymentMethod === 'netbanking' ? selectedBank : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to initiate payment.');
      }

      setOrderData(data);

      if (paymentMethod === 'razorpay') {
        launchRazorpayCheckout(data);
      } else {
        setPaymentStep('pay');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (paymentMethod !== 'razorpay') {
        setLoading(false);
      }
    }
  };

  // Verify Payment
  const handleVerifyPayment = async (customOrderData, customPaymentId, rzpOrderId, rzpSig) => {
    const activeOrder = customOrderData || orderData;
    if (!activeOrder) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: activeOrder.order_id,
          utr_ref: customPaymentId || utrRef || 'UPI-' + Math.floor(100000000000 + Math.random() * 900000000000),
          bank_name: paymentMethod === 'netbanking' ? selectedBank : undefined,
          razorpay_payment_id: customPaymentId,
          razorpay_order_id: rzpOrderId,
          razorpay_signature: rzpSig
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Payment verification failed.');
      }

      updateUser({ plan: selectedPlan });
      setPaymentStep('success');
      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyVpa = (vpa) => {
    navigator.clipboard.writeText(vpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border p-6 shadow-2xl glass-panel bg-[#141b24] border-white/10 text-white dark:bg-[#141b24] dark:border-white/10 dark:text-white light:bg-white light:border-slate-200 light:text-slate-900 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#2ee6a6]/15 text-[#2ee6a6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">
                {paymentStep === 'select' ? 'Select Subscription Tier' : paymentStep === 'pay' ? 'Secure Payment Gateway' : 'Subscription Active!'}
              </h2>
              <p className="text-xs text-slate-400">
                {paymentStep === 'select' ? 'Checkout seamlessly via Razorpay, UPI QR, or Net Banking' : 'Fast, zero-fee payment settlement via NPCI / Net Banking'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {error}
          </div>
        )}

        {/* STEP 1: SELECT PLAN & METHOD */}
        {paymentStep === 'select' && (
          <div className="mt-4 space-y-5">
            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {plans.map((p) => {
                const isSelected = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#2ee6a6] bg-[#2ee6a6]/10 shadow-glow-teal ring-1 ring-[#2ee6a6]'
                        : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                    }`}
                  >
                    <div>
                      {p.popular && (
                        <span className="inline-block text-[9px] font-bold text-[#2ee6a6] uppercase tracking-wider mb-1">
                          Recommended
                        </span>
                      )}
                      <h3 className="font-bold text-sm">{p.name}</h3>
                      <div className="text-lg font-extrabold font-heading text-white mt-1">{p.price}</div>
                      <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
                        <div>• {p.clicks}</div>
                        <div>• {p.domains}</div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-xs font-semibold">{isSelected ? 'Selected' : 'Choose'}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#2ee6a6]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Select Payment Rail
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Razorpay Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#00BAF2] bg-[#00BAF2]/10 text-white shadow-[0_0_15px_rgba(0,186,242,0.25)]'
                      : 'border-white/10 hover:border-white/20 text-slate-400 bg-white/[0.02]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#00BAF2]/20 text-[#00BAF2]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">Razorpay Secure</div>
                    <div className="text-[10px] text-slate-400">Cards, UPI, Netbanking</div>
                  </div>
                </button>

                {/* Direct UPI QR Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-[#2ee6a6] bg-[#2ee6a6]/10 text-white shadow-glow-teal'
                      : 'border-white/10 hover:border-white/20 text-slate-400 bg-white/[0.02]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#2ee6a6]/20 text-[#2ee6a6]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">Direct UPI QR</div>
                    <div className="text-[10px] text-slate-400">GPay, PhonePe, Paytm</div>
                  </div>
                </button>

                {/* Netbanking Option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    paymentMethod === 'netbanking'
                      ? 'border-[#7c8cff] bg-[#7c8cff]/10 text-white'
                      : 'border-white/10 hover:border-white/20 text-slate-400 bg-white/[0.02]'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-[#7c8cff]/20 text-[#7c8cff]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-xs text-white">Bank Transfer</div>
                    <div className="text-[10px] text-slate-400">SBI, HDFC, ICICI, Axis</div>
                  </div>
                </button>
              </div>
            </div>

            {/* If Net Banking selected, show bank options */}
            {paymentMethod === 'netbanking' && (
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="text-xs font-semibold text-slate-300">Select Your Bank:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {supportedBanks.map((b) => (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => setSelectedBank(b.code)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        selectedBank === b.code
                          ? 'border-[#7c8cff] bg-[#7c8cff]/20 text-white ring-1 ring-[#7c8cff]'
                          : 'border-white/10 hover:border-white/20 text-slate-400'
                      }`}
                    >
                      <span>{b.logo}</span>
                      <span>{b.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Summary & Proceed Button */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Payable Amount:</span>
                <div className="text-xl font-mono font-extrabold text-[#2ee6a6]">
                  ₹{currentPlanObj.amount}.00
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 flex items-center gap-2"
                >
                  {loading ? 'Processing...' : paymentMethod === 'razorpay' ? 'Pay via Razorpay' : 'Proceed to Checkout'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT EXECUTION (UPI QR / NET BANKING) */}
        {paymentStep === 'pay' && orderData && (
          <div className="mt-4 space-y-4">
            {paymentMethod === 'upi' && orderData.upi_details ? (
              <div className="flex flex-col items-center p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2ee6a6] mb-1">
                  Scan Dynamic QR Code to Pay
                </div>
                <div className="text-2xl font-mono font-extrabold text-white mb-3">
                  ₹{orderData.amount}.00
                </div>

                {/* Render Dynamic QR Code */}
                <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-[#2ee6a6]/30 mb-3">
                  <img
                    src={orderData.upi_details.qr_code_base64}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.05] text-xs font-mono text-slate-300 mb-3">
                  <span>UPI ID: <strong>{orderData.upi_details.payee_vpa}</strong></span>
                  <button
                    onClick={() => copyVpa(orderData.upi_details.payee_vpa)}
                    className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                    title="Copy UPI ID"
                  >
                    {copiedVpa ? <Check className="w-3.5 h-3.5 text-[#2ee6a6]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 text-center max-w-sm mb-4">
                  Open any UPI app (GPay, PhonePe, Paytm, BHIM, Cred) and scan the QR code above.
                </div>

                {/* UTR Input */}
                <div className="w-full space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    UPI 12-Digit UTR / Transaction Ref No. (Optional for Demo)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 428901849102"
                    value={utrRef}
                    onChange={(e) => setUtrRef(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-mono border outline-none bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]"
                  />
                </div>
              </div>
            ) : (
              /* Net Banking Flow */
              <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-[#7c8cff]/10 border border-[#7c8cff]/30 inline-block mx-auto">
                  <Building2 className="w-10 h-10 text-[#7c8cff]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Net Banking Gateway Simulation</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Connecting to <strong>{selectedBank} Net Banking</strong> portal for order #{orderData.order_id}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] text-xs font-mono text-left space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Ref:</span>
                    <span className="text-white">{orderData.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Institution:</span>
                    <span className="text-[#7c8cff] font-bold">{selectedBank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Debit:</span>
                    <span className="text-[#2ee6a6] font-bold">₹{orderData.amount}.00</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPaymentStep('select')}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                ← Back
              </button>

              <button
                onClick={() => handleVerifyPayment()}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 flex items-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify & Upgrade Now'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {paymentStep === 'success' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-[#2ee6a6]/20 border border-[#2ee6a6]/40 text-[#2ee6a6] flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-heading text-white">Subscription Activated!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your account has been upgraded to the <strong className="text-[#2ee6a6]">{selectedPlan.toUpperCase()}</strong> tier. Your dashboard permissions are now live!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
