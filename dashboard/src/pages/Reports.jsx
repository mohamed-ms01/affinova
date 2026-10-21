import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function Reports() {
  const [platformFilter, setPlatformFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('current-month');
  const [downloading, setDownloading] = useState(null);

  const reports = [
    {
      id: 'weekly-perf',
      title: 'Weekly Performance Digest',
      desc: 'Raw click attributions, device user-agents, bot mitigations, and velocity stats.',
      format: 'CSV / Excel'
    },
    {
      id: 'monthly-settle',
      title: 'Monthly Settlement Statement',
      desc: 'Itemized merchant conversions, commission rates, gross deductions, and net settled funds.',
      format: 'PDF / CSV'
    },
    {
      id: 'payout-statement',
      title: 'Annual Payout Tax Summary',
      desc: 'Official financial audit record of all multi-rail withdrawals dispatched to date.',
      format: 'CSV / JSON'
    }
  ];

  const handleDownload = (report) => {
    setDownloading(report.id);
    setTimeout(() => {
      // Generate actual downloadable CSV data
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Report_Name,Generated_Date,Status\n"
        + `${report.title},${new Date().toISOString()},Generated_Verified\n`;

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${report.id}-report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(null);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Control */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel">
        <div>
          <h2 className="text-xl font-bold font-heading">Reports & Financial Auditing</h2>
          <p className="text-xs text-slate-400">Export verified telemetry records, conversion logs, and tax statements</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white dark:bg-[#0e131a] dark:border-white/10 dark:text-white light:bg-slate-50 light:border-slate-200 light:text-slate-900"
          >
            <option value="current-week">Current Week</option>
            <option value="current-month">Current Month</option>
            <option value="last-quarter">Last Quarter</option>
            <option value="year-to-date">Year to Date (2026)</option>
          </select>

          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs border outline-none bg-[#0e131a] border-white/10 text-white dark:bg-[#0e131a] dark:border-white/10 dark:text-white light:bg-slate-50 light:border-slate-200 light:text-slate-900"
          >
            <option value="all">All Traffic Vectors</option>
            <option value="direct">Direct Bio Links</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
          </select>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((r) => (
          <div key={r.id} className="p-6 rounded-2xl glass-panel flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#2ee6a6]/10 text-[#2ee6a6] flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base font-heading mb-1.5">{r.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">{r.desc}</p>
            </div>

            <div className="pt-4 border-t border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">{r.format}</span>
              <button
                onClick={() => handleDownload(r)}
                disabled={downloading === r.id}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 hover:border-[#2ee6a6]/40 hover:text-[#2ee6a6] transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading === r.id ? 'Exporting...' : 'Download'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
