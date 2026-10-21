import React from 'react';
import { ComplaintRecord } from '../types/triage';
import { Printer, ArrowLeft, ShieldAlert } from 'lucide-react';

interface PrintDossierProps {
  complaint: ComplaintRecord;
  onClose: () => void;
}

export const PrintDossier: React.FC<PrintDossierProps> = ({ complaint, onClose }) => {
  const res = complaint.triageResult;
  if (!res) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 overflow-y-auto flex justify-center p-4 sm:p-8">
      <div className="bg-white max-w-4xl w-full p-8 rounded-lg shadow-2xl relative space-y-6 text-slate-900 print:p-0 print:shadow-none print:m-0 print:border-none">
        {/* Navigation & Print buttons (hidden in print) */}
        <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Clinical Dossier</span>
          </button>
        </div>

        {/* Hospital Official Dossier Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                Clinical Grievance & Triage Dossier
              </h1>
              <p className="text-xs text-slate-600">
                Hospital Quality & Clinical Risk Management Division · CMS 42 CFR § 482.13 Compliance
              </p>
            </div>
            <div className="text-right font-mono text-xs text-slate-600">
              <div>Record ID: <strong className="text-slate-900">{complaint.id}</strong></div>
              <div>Date Generated: {new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Case Metadata Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Patient / Complainant</span>
            <span className="font-bold text-slate-900">{complaint.patientName || 'Anonymous / Confidential'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">MRN</span>
            <span className="font-mono text-slate-900">{complaint.patientMRN || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Clinical Service Unit</span>
            <span className="font-bold text-slate-900">{complaint.department}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Intake Source</span>
            <span className="font-bold text-slate-900">{complaint.source}</span>
          </div>
        </div>

        {/* Core Classification Callouts */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 border border-slate-300 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Step 1: Category</span>
            <span className="text-sm font-bold text-slate-900">{res.step1Category.primaryCategory}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Secondary: {res.step1Category.secondaryCategories?.join(', ') || 'None'}
            </span>
          </div>

          <div className="p-3 border border-slate-300 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Step 2: Severity Assessment</span>
            <span className="text-sm font-bold text-slate-900">{res.step2Severity.level}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{res.step2Severity.clinicalImpact}</span>
          </div>

          <div className="p-3 border border-slate-300 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Step 6: Routing & SLA</span>
            <span className="text-sm font-bold text-slate-900">{res.step6Escalation.primaryRoute}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">SLA: {res.step3Urgency.responseSLA}</span>
          </div>
        </div>

        {/* What Happened Narrative */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Clinical Summary & Event Chronology
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
            {res.whatHappened.summary}
          </p>
          <div className="space-y-1 pt-1">
            {res.whatHappened.incidentChronology.map((c, i) => (
              <div key={i} className="text-xs text-slate-700 flex gap-2">
                <span className="font-mono text-slate-500 font-semibold">{i + 1}.</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 8-Risk Vector Findings */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Step 5 · Regulatory Risk Assessment Matrix
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {res.step5RiskDetection.map((risk) => (
              <div key={risk.riskType} className={`p-2 rounded border ${risk.flagged ? 'border-rose-400 bg-rose-50/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between font-semibold mb-1">
                  <span>{risk.riskType}</span>
                  <span className={`text-[10px] font-bold ${risk.flagged ? 'text-rose-700' : 'text-slate-400'}`}>
                    {risk.flagged ? 'FLAGGED' : 'CLEAR'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{risk.reason}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step 6 Escalation & Action Directives */}
        <div className="space-y-2 border-t border-slate-200 pt-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Containment & Departmental Directive
          </h2>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
            {res.step6Escalation.containmentSteps.map((st, i) => (
              <li key={i}>{st}</li>
            ))}
          </ul>
        </div>

        {/* Sign-off Block */}
        <div className="border-t-2 border-slate-300 pt-6 mt-8 grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div>
            <div className="border-b border-slate-400 pb-1 font-mono">
              {res.humanReview?.reviewedBy || 'Pending Triage Officer Sign-off'}
            </div>
            <span className="text-[10px] text-slate-500 uppercase mt-1 block">
              Clinical Triage Reviewer Signature
            </span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 font-mono">
              {res.humanReview ? new Date(res.humanReview.reviewedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </div>
            <span className="text-[10px] text-slate-500 uppercase mt-1 block">
              Date & Verification Timestamp
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
