import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Coins,
  Globe2,
  Layers,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Analytics() {
  const { token } = useAuth();
  const [range, setRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAnalytics() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/analytics/detailed?range=${range}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        } else {
          setError('Failed to load analytics data.');
        }
      } catch (err) {
        setError('Network error loading analytics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [token, range]);

  const hasData = analyticsData?.has_data === true;

  // Build chart data from API or show empty state
  const chartDays = hasData ? (analyticsData?.chart_days || []) : [];
  const chartClicks = hasData ? (analyticsData?.chart_clicks || []) : [];
  const maxClicks = chartClicks.length > 0 ? Math.max(...chartClicks, 1) : 1;

  const trafficChannels = hasData ? (analyticsData?.traffic_channels || []) : [];
  const totalChannelClicks = trafficChannels.reduce((sum, ch) => sum + ch.clicks, 0) || 1;

  const conversionRate = hasData ? analyticsData?.conversion_rate : null;
  const avgOrderValue = hasData ? analyticsData?.avg_order_value : null;
  const topSource = hasData && trafficChannels.length > 0 ? trafficChannels[0].name : null;

  const channelColors = ['#2ee6a6', '#7c8cff', '#ffb020', '#00f2fe', '#ff4d6d'];

  return (
    <div className="space-y-6">
      {/* Analytics Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel">
        <div>
          <h2 className="text-xl font-bold font-heading">Performance Telemetry</h2>
          <p className="text-xs text-slate-400">First-party edge analytics, device footprints, and conversion velocity</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-white/10 bg-[#0e131a] dark:bg-[#0e131a] light:bg-slate-100">
          {['7d', '30d', '90d'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                range === r ? 'bg-[#2ee6a6] text-[#07090e]' : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="p-12 rounded-2xl glass-panel flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-[#2ee6a6] animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading analytics data...</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conversion Rate */}
            <div className="p-5 rounded-2xl glass-panel">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
                <Percent className="w-4 h-4 text-[#2ee6a6]" />
              </div>
              {conversionRate !== null ? (
                <>
                  <div className="text-2xl font-bold font-mono text-white">{conversionRate.toFixed(2)}%</div>
                  <div className="text-xs text-[#2ee6a6] mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Based on real click &amp; order data
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold font-mono text-slate-500">—</div>
                  <div className="text-xs text-slate-500 mt-2">No conversion data yet</div>
                </>
              )}
            </div>

            {/* Avg Order Value */}
            <div className="p-5 rounded-2xl glass-panel">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Avg Order Value (AOV)</span>
                <Coins className="w-4 h-4 text-[#7c8cff]" />
              </div>
              {avgOrderValue !== null ? (
                <>
                  <div className="text-2xl font-bold font-mono text-white">
                    ₹{avgOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">Aggregated merchant basket checkout size</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold font-mono text-slate-500">—</div>
                  <div className="text-xs text-slate-500 mt-2">No order data available yet</div>
                </>
              )}
            </div>

            {/* Top Source */}
            <div className="p-5 rounded-2xl glass-panel">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Top Source</span>
                <Globe2 className="w-4 h-4 text-[#ffb020]" />
              </div>
              {topSource ? (
                <>
                  <div className="text-2xl font-bold font-heading text-white">{topSource}</div>
                  <div className="text-xs text-slate-400 mt-2">
                    {Math.round((trafficChannels[0]?.clicks / totalChannelClicks) * 100)}% of total verified traffic
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold font-heading text-slate-500">No data yet</div>
                  <div className="text-xs text-slate-500 mt-2">Traffic sources will appear here</div>
                </>
              )}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Click Velocity Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl glass-panel">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-sm font-heading">Click Influx Velocity</h3>
                  <p className="text-xs text-slate-400">Daily breakdown of incoming smart link engagements</p>
                </div>
                {hasData && (
                  <span className="text-xs font-mono text-[#2ee6a6] bg-[#2ee6a6]/10 px-2.5 py-1 rounded-full border border-[#2ee6a6]/30">
                    {chartClicks.reduce((a, b) => a + b, 0).toLocaleString('en-IN')} Total
                  </span>
                )}
              </div>

              {hasData && chartDays.length > 0 ? (
                <div className="h-60 flex items-end justify-between gap-2 pt-4 px-2 border-b border-white/[0.08]">
                  {chartDays.map((day, idx) => {
                    const heightPct = maxClicks > 0 ? Math.max((chartClicks[idx] / maxClicks) * 100, 4) : 4;
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end" title={`${day}: ${chartClicks[idx]} clicks`}>
                        <div className="w-full max-w-[42px] bg-white/[0.04] rounded-t-xl overflow-hidden relative group-hover:bg-[#2ee6a6]/20 transition-all flex items-end" style={{ height: '100%' }}>
                          <div
                            style={{ height: `${heightPct}%` }}
                            className="w-full bg-gradient-to-t from-[#2ee6a6] to-[#7c8cff] rounded-t-xl transition-all duration-500 group-hover:brightness-125"
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{day}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-center border border-white/[0.04] rounded-xl bg-white/[0.01]">
                  <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No click data available yet</p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">
                    Create affiliate links and share them to start tracking click velocity here.
                  </p>
                </div>
              )}
            </div>

            {/* Right Col: Traffic Channels */}
            <div className="p-6 rounded-2xl glass-panel">
              <h3 className="font-bold text-sm font-heading mb-1">Traffic Channels</h3>
              <p className="text-xs text-slate-400 mb-6">Attributed conversion share by referral vector</p>

              {trafficChannels.length > 0 ? (
                <div className="space-y-4">
                  {trafficChannels.map((ch, idx) => {
                    const sharePct = Math.round((ch.clicks / totalChannelClicks) * 100);
                    return (
                      <div key={ch.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-200 truncate max-w-[140px]">{ch.name}</span>
                          <span className="font-mono font-semibold ml-2" style={{ color: channelColors[idx % channelColors.length] }}>
                            {sharePct}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${sharePct}%`, backgroundColor: channelColors[idx % channelColors.length] }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 text-right font-mono">
                          {ch.clicks.toLocaleString('en-IN')} clicks recorded
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <Layers className="w-8 h-8 text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-400">No traffic sources yet</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Traffic channel breakdown will appear when links receive clicks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
