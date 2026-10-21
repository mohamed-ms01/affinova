import React, { useState } from 'react';
import { X, Link as LinkIcon, ShieldCheck, Sparkles, ShoppingBag, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CreateLinkModal({ isOpen, onClose, onLinkCreated }) {
  const { token } = useAuth();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [fraudFilter, setFraudFilter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Real-time detection of Amazon / Flipkart
  const isAmazon = destinationUrl.toLowerCase().includes('amazon.') || destinationUrl.toLowerCase().includes('amzn.');
  const isFlipkart = destinationUrl.toLowerCase().includes('flipkart.');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!destinationUrl) {
      setError('Please provide a valid destination URL.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title || undefined,
          destination_url: destinationUrl,
          custom_slug: customSlug || undefined,
          bot_filtering: fraudFilter
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to generate affiliate link.');
      }

      onLinkCreated(data);
      onClose();
      setDestinationUrl('');
      setTitle('');
      setCustomSlug('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl glass-panel bg-[#141b24] border-white/10 text-white dark:bg-[#141b24] dark:border-white/10 dark:text-white light:bg-white light:border-slate-200 light:text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading">Deploy Smart Affiliate Link</h2>
              <p className="text-xs text-slate-400">Amazon & Flipkart product parser with auto-tagging</p>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Product / Destination URL *
              </label>
              {isAmazon && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  <ShoppingCart className="w-3 h-3" /> Amazon Associate Tag Auto-Injected
                </span>
              )}
              {isFlipkart && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/30">
                  <ShoppingBag className="w-3 h-3" /> Flipkart Affiliate ID Auto-Injected
                </span>
              )}
            </div>

            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="url"
                required
                placeholder="https://www.amazon.in/dp/B08N5WRWNW or https://www.flipkart.com/..."
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-all
                  bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6] focus:ring-1 focus:ring-[#2ee6a6]
                "
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Amazon.in, Flipkart.com, or any store URL. Product name, image & price are automatically extracted.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Product Title / Campaign Memo (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave empty to auto-extract from Amazon / Flipkart"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none transition-all
                bg-[#0e131a] border-white/10 text-white focus:border-[#2ee6a6]
              "
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Custom Slug (Optional)
            </label>
            <div className="flex items-center rounded-xl border border-white/10 overflow-hidden bg-[#0e131a]">
              <span className="px-3 text-xs font-mono text-slate-400 select-none">affinova.link/r/</span>
              <input
                type="text"
                placeholder={isAmazon ? "amz-deal" : isFlipkart ? "fk-deal" : "deal-2026"}
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                className="w-full py-2.5 pr-4 bg-transparent text-sm font-mono outline-none text-[#2ee6a6]"
              />
            </div>
          </div>

          {/* Bot filter toggle */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.08] cursor-pointer bg-white/[0.02]">
            <input
              type="checkbox"
              checked={fraudFilter}
              onChange={(e) => setFraudFilter(e.target.checked)}
              className="w-4 h-4 rounded text-[#2ee6a6] focus:ring-0"
            />
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#2ee6a6]" />
              <span>Enable AI Bot & Proxy Click Scrubbing</span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono tracking-wide uppercase bg-gradient-to-r from-[#2ee6a6] to-[#00f2fe] text-[#07090e] shadow-glow-teal hover:brightness-110 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Scraping & Routing...' : 'Generate Affiliate Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
