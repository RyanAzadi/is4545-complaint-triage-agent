import React from 'react';
import { ShieldAlert, PlusCircle, BarChart3, RotateCcw, Stethoscope, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onNewComplaint: () => void;
  showAnalytics: boolean;
  onToggleAnalytics: () => void;
  onResetData: () => void;
  totalComplaints: number;
  criticalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewComplaint,
  showAnalytics,
  onToggleAnalytics,
  onResetData,
  criticalCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Purpose */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Healthcare Complaint Triage Assistant
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Clinical & Safety Review
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Patient safety, risk classification & escalation routing with human oversight
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            {criticalCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-md text-xs font-medium text-rose-800 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>{criticalCount} Critical (L4) Pending Immediate Action</span>
              </div>
            )}

            <button
              onClick={onToggleAnalytics}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                showAnalytics
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Toggle Clinical Analytics"
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showAnalytics ? 'Queue Canvas' : 'Analytics & Trends'}</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
              title="Reset Sample Healthcare Complaints"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Cases</span>
            </button>

            <button
              onClick={onNewComplaint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-md shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Intake & Triage</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
