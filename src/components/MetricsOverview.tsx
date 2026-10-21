import React from 'react';
import { ComplaintRecord, SeverityLevel } from '../types/triage';
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle, UserCheck, Inbox } from 'lucide-react';

interface MetricsOverviewProps {
  complaints: ComplaintRecord[];
  activeSeverityFilter: string | null;
  onSelectSeverityFilter: (severity: string | null) => void;
  humanOnlyFilter: boolean;
  onToggleHumanFilter: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  complaints,
  activeSeverityFilter,
  onSelectSeverityFilter,
  humanOnlyFilter,
  onToggleHumanFilter,
}) => {
  const l4Critical = complaints.filter(
    (c) => c.triageResult?.step2Severity?.level === 'LEVEL 4 – Critical'
  ).length;
  const l3High = complaints.filter(
    (c) => c.triageResult?.step2Severity?.level === 'LEVEL 3 – High'
  ).length;
  const l2Moderate = complaints.filter(
    (c) => c.triageResult?.step2Severity?.level === 'LEVEL 2 – Moderate'
  ).length;
  const l1Low = complaints.filter(
    (c) => c.triageResult?.step2Severity?.level === 'LEVEL 1 – Low'
  ).length;
  const humanRequired = complaints.filter(
    (c) => c.triageResult?.step4HumanIntervention?.required
  ).length;
  const total = complaints.length;

  const cardStyle = (isActive: boolean, borderColor: string, activeBg: string) => `
    p-3.5 rounded-lg border text-left transition-all cursor-pointer relative
    ${isActive ? `${borderColor} ${activeBg} shadow-xs` : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60'}
  `;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      {/* Total Complaints */}
      <button
        onClick={() => onSelectSeverityFilter(null)}
        className={cardStyle(activeSeverityFilter === null && !humanOnlyFilter, 'border-slate-900', 'bg-slate-50')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Queue</span>
          <Inbox className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900">{total}</span>
          <span className="text-xs text-slate-500">cases</span>
        </div>
        <div className="text-[11px] text-slate-400 mt-1">All incoming reports</div>
      </button>

      {/* Level 4 Critical */}
      <button
        onClick={() => onSelectSeverityFilter(activeSeverityFilter === 'LEVEL 4 – Critical' ? null : 'LEVEL 4 – Critical')}
        className={cardStyle(activeSeverityFilter === 'LEVEL 4 – Critical', 'border-rose-600 ring-1 ring-rose-600', 'bg-rose-50/50')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Level 4 · Critical</span>
          <AlertOctagon className="w-4 h-4 text-rose-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-rose-700">{l4Critical}</span>
          <span className="text-xs text-rose-600 font-medium">&lt; 2h SLA</span>
        </div>
        <div className="text-[11px] text-rose-600/80 mt-1">Immediate patient safety</div>
      </button>

      {/* Level 3 High */}
      <button
        onClick={() => onSelectSeverityFilter(activeSeverityFilter === 'LEVEL 3 – High' ? null : 'LEVEL 3 – High')}
        className={cardStyle(activeSeverityFilter === 'LEVEL 3 – High', 'border-amber-600 ring-1 ring-amber-600', 'bg-amber-50/50')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Level 3 · High</span>
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-amber-800">{l3High}</span>
          <span className="text-xs text-amber-700 font-medium">&lt; 24h SLA</span>
        </div>
        <div className="text-[11px] text-amber-700/80 mt-1">Potential harm / meds</div>
      </button>

      {/* Level 2 Moderate */}
      <button
        onClick={() => onSelectSeverityFilter(activeSeverityFilter === 'LEVEL 2 – Moderate' ? null : 'LEVEL 2 – Moderate')}
        className={cardStyle(activeSeverityFilter === 'LEVEL 2 – Moderate', 'border-indigo-600 ring-1 ring-indigo-600', 'bg-indigo-50/50')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Level 2 · Moderate</span>
          <AlertCircle className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-indigo-800">{l2Moderate}</span>
          <span className="text-xs text-indigo-600 font-medium">&lt; 48h SLA</span>
        </div>
        <div className="text-[11px] text-indigo-600/80 mt-1">Repeated breakdowns</div>
      </button>

      {/* Level 1 Low */}
      <button
        onClick={() => onSelectSeverityFilter(activeSeverityFilter === 'LEVEL 1 – Low' ? null : 'LEVEL 1 – Low')}
        className={cardStyle(activeSeverityFilter === 'LEVEL 1 – Low', 'border-emerald-600 ring-1 ring-emerald-600', 'bg-emerald-50/50')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Level 1 · Low</span>
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-emerald-800">{l1Low}</span>
          <span className="text-xs text-emerald-600 font-medium">Standard</span>
        </div>
        <div className="text-[11px] text-emerald-600/80 mt-1">Routine dissatisfaction</div>
      </button>

      {/* Human Review Needed */}
      <button
        onClick={onToggleHumanFilter}
        className={cardStyle(humanOnlyFilter, 'border-teal-600 ring-1 ring-teal-600', 'bg-teal-50/60')}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider">Human Oversight</span>
          <UserCheck className="w-4 h-4 text-teal-600" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-teal-900">{humanRequired}</span>
          <span className="text-xs text-teal-700 font-medium">Mandatory</span>
        </div>
        <div className="text-[11px] text-teal-700/80 mt-1">Clinical / Risk Review</div>
      </button>
    </div>
  );
};
