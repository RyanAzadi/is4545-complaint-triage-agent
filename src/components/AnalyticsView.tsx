import React from 'react';
import { ComplaintRecord, RiskType } from '../types/triage';
import { BarChart3, ShieldAlert, AlertOctagon, Clock, Building2, Stethoscope, ArrowLeft } from 'lucide-react';

interface AnalyticsViewProps {
  complaints: ComplaintRecord[];
  onBackToQueue: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ complaints, onBackToQueue }) => {
  const total = complaints.length;

  // Severity breakdown
  const sevCounts = {
    'LEVEL 4 – Critical': complaints.filter((c) => c.triageResult?.step2Severity?.level === 'LEVEL 4 – Critical').length,
    'LEVEL 3 – High': complaints.filter((c) => c.triageResult?.step2Severity?.level === 'LEVEL 3 – High').length,
    'LEVEL 2 – Moderate': complaints.filter((c) => c.triageResult?.step2Severity?.level === 'LEVEL 2 – Moderate').length,
    'LEVEL 1 – Low': complaints.filter((c) => c.triageResult?.step2Severity?.level === 'LEVEL 1 – Low').length,
  };

  // Risk breakdown
  const riskTypes: RiskType[] = [
    'Patient Safety Risk',
    'Clinical Risk',
    'Compliance Risk',
    'Privacy Risk',
    'Accessibility Risk',
    'Equity Risk',
    'Reputational Risk',
    'Operational Risk',
  ];

  const riskCounts = riskTypes.map((rt) => ({
    type: rt,
    count: complaints.filter((c) => c.triageResult?.step5RiskDetection?.some((r) => r.riskType === rt && r.flagged)).length,
  })).sort((a, b) => b.count - a.count);

  // Department Route breakdown
  const routeCounts: { [key: string]: number } = {};
  complaints.forEach((c) => {
    const route = c.triageResult?.step6Escalation?.primaryRoute || 'Unassigned';
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });

  // Category breakdown
  const catCounts: { [key: string]: number } = {};
  complaints.forEach((c) => {
    const cat = c.triageResult?.step1Category?.primaryCategory || 'Other';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToQueue}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Triage Queue</span>
          </button>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Clinical Grievance & Quality Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Cross-departmental trends, severity distributions, and active regulatory risk vectors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded">
            Total Intake: <strong>{total}</strong> complaints
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Severity Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Severity Level Distribution
            </h3>
            <span className="text-xs text-slate-400 font-mono">CMS Alignment</span>
          </div>

          <div className="space-y-3 pt-1">
            {Object.entries(sevCounts).map(([lvl, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              let barColor = 'bg-slate-400';
              let badgeColor = 'text-slate-700';
              if (lvl.includes('Critical')) {
                barColor = 'bg-rose-600';
                badgeColor = 'text-rose-700 font-bold';
              } else if (lvl.includes('High')) {
                barColor = 'bg-amber-500';
                badgeColor = 'text-amber-800 font-semibold';
              } else if (lvl.includes('Moderate')) {
                barColor = 'bg-indigo-500';
                badgeColor = 'text-indigo-800';
              } else if (lvl.includes('Low')) {
                barColor = 'bg-emerald-500';
                badgeColor = 'text-emerald-800';
              }

              return (
                <div key={lvl} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={badgeColor}>{lvl}</span>
                    <span className="font-mono text-slate-600">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 8 Risk Vectors Prevalence */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              Regulatory Risk Prevalence (Step 5)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Flagged Cases</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {riskCounts.map((rc) => {
              const pct = total > 0 ? Math.round((rc.count / total) * 100) : 0;
              return (
                <div key={rc.type} className="flex items-center justify-between text-xs">
                  <div className="w-40 font-medium text-slate-700 truncate">{rc.type}</div>
                  <div className="flex-1 mx-3 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal-700 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-slate-600 w-12 text-right">
                    {rc.count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Escalation Queues */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-700" />
              Receiving Department Workload (Step 6)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Active Queues</span>
          </div>

          <div className="space-y-2 pt-1">
            {Object.entries(routeCounts).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                <span className="font-medium text-slate-800">{dept}</span>
                <span className="font-mono font-bold text-teal-800 px-2 py-0.5 bg-teal-50 rounded">
                  {count} case{count > 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Complaint Categories */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-slate-700" />
              Primary Complaint Categories (Step 1)
            </h3>
            <span className="text-xs text-slate-400 font-mono">Taxonomy</span>
          </div>

          <div className="space-y-2 pt-1">
            {Object.entries(catCounts).map(([cat, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className="flex items-center justify-between text-xs p-1.5 border-b border-slate-100">
                  <span className="text-slate-700 font-medium">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500">{pct}%</span>
                    <span className="font-mono text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                      {count}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
