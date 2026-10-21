import React from 'react';
import { ComplaintRecord, ComplaintCategory, RiskType } from '../types/triage';
import { Search, Filter, ShieldAlert, Clock, ChevronRight, UserCheck } from 'lucide-react';

interface ComplaintQueueProps {
  complaints: ComplaintRecord[];
  selectedId: string | null;
  onSelectComplaint: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  riskFilter: string;
  onRiskFilterChange: (risk: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Communication',
  'Scheduling',
  'Wait Time',
  'Technology / Patient Portal',
  'Billing',
  'Clinical Care',
  'Patient Safety',
  'Privacy or Security',
  'Staff Conduct',
  'Other',
];

const RISKS: RiskType[] = [
  'Patient Safety Risk',
  'Clinical Risk',
  'Compliance Risk',
  'Privacy Risk',
  'Accessibility Risk',
  'Equity Risk',
  'Reputational Risk',
  'Operational Risk',
];

export const ComplaintQueue: React.FC<ComplaintQueueProps> = ({
  complaints,
  selectedId,
  onSelectComplaint,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  riskFilter,
  onRiskFilterChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  const getSeverityBadgeClass = (level?: string) => {
    switch (level) {
      case 'LEVEL 4 – Critical':
        return 'text-rose-700 bg-rose-50 border border-rose-200';
      case 'LEVEL 3 – High':
        return 'text-amber-800 bg-amber-50 border border-amber-200';
      case 'LEVEL 2 – Moderate':
        return 'text-indigo-700 bg-indigo-50 border border-indigo-200';
      case 'LEVEL 1 – Low':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      default:
        return 'text-slate-700 bg-slate-100 border border-slate-200';
    }
  };

  const getSeverityLabel = (level?: string) => {
    switch (level) {
      case 'LEVEL 4 – Critical':
        return 'L4 · Critical';
      case 'LEVEL 3 – High':
        return 'L3 · High';
      case 'LEVEL 2 – Moderate':
        return 'L2 · Moderate';
      case 'LEVEL 1 – Low':
        return 'L1 · Low';
      default:
        return 'Untriaged';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 flex flex-col h-[calc(100vh-14rem)] min-h-[580px] shadow-2xs">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-200/80 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, MRN, ID, keyword..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-colors"
          />
        </div>

        {/* Quick Filter Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={riskFilter}
              onChange={(e) => onRiskFilterChange(e.target.value)}
              className="w-full text-xs py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-teal-600"
            >
              <option value="">All Risk Types</option>
              {RISKS.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>{complaints.length} complaints matching filters</span>
          {statusFilter && (
            <button
              onClick={() => onStatusFilterChange('')}
              className="text-teal-700 hover:underline text-[11px]"
            >
              Clear status
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Queue List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
        {complaints.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Filter className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-600">No complaints found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try clearing or adjusting filters</p>
          </div>
        ) : (
          complaints.map((item) => {
            const isSelected = item.id === selectedId;
            const res = item.triageResult;
            const flaggedRisksCount = res?.step5RiskDetection?.filter((r) => r.flagged).length || 0;
            const severity = res?.step2Severity?.level;

            return (
              <button
                key={item.id}
                onClick={() => onSelectComplaint(item.id)}
                className={`w-full text-left p-3 rounded-md transition-all relative ${
                  isSelected
                    ? 'bg-teal-50/70 border border-teal-600/40 shadow-xs'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {/* Top Line: ID & Severity & SLA */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {item.id}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${getSeverityBadgeClass(severity)}`}>
                      {getSeverityLabel(severity)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.receivedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Primary Category & Department */}
                <div className="text-xs text-slate-700 font-medium truncate mb-1">
                  {res?.step1Category?.primaryCategory || 'Under Review'}
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-500 font-normal">{item.department}</span>
                </div>

                {/* Patient Summary Preview */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                  {res?.whatHappened?.summary || item.rawText}
                </p>

                {/* Footer Badges & Metadata */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {res?.step3Urgency?.responseSLA || 'Standard'}
                    </span>
                    {flaggedRisksCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-rose-700 font-medium text-[10px]">
                        <ShieldAlert className="w-3 h-3" />
                        {flaggedRisksCount} risks
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {res?.step4HumanIntervention?.required && (
                      <span className="text-[10px] font-medium text-teal-800 bg-teal-50 px-1 py-0.5 rounded flex items-center gap-0.5">
                        <UserCheck className="w-2.5 h-2.5" />
                        Review
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-700' : 'text-slate-300'}`} />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
