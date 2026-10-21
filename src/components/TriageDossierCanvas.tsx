import React, { useState } from 'react';
import { ComplaintRecord, SeverityLevel, RouteTarget, RiskType } from '../types/triage';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Building2,
  FileText,
  Copy,
  Check,
  Printer,
  Edit3,
  Send,
  User,
  HeartPulse,
  Scale,
  Lock,
  Accessibility,
  Users,
  Megaphone,
  Cog,
  FileCheck2,
  Stethoscope,
  ChevronRight,
  Info
} from 'lucide-react';

interface TriageDossierCanvasProps {
  complaint: ComplaintRecord;
  onOpenOverride: () => void;
  onPrintDossier: () => void;
  onStatusChange: (status: ComplaintRecord['status']) => void;
}

export const TriageDossierCanvas: React.FC<TriageDossierCanvasProps> = ({
  complaint,
  onOpenOverride,
  onPrintDossier,
  onStatusChange,
}) => {
  const [copiedAck, setCopiedAck] = useState(false);
  const [selectedRiskTab, setSelectedRiskTab] = useState<RiskType | null>(null);

  const res = complaint.triageResult;
  if (!res) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
        <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3 animate-spin" />
        <h3 className="text-base font-semibold text-slate-800">Triage in Progress</h3>
        <p className="text-xs text-slate-500 mt-1">Analyzing narrative against clinical safety rules...</p>
      </div>
    );
  }

  const severity = res.step2Severity.level;

  const getSeverityBadge = (lvl: SeverityLevel) => {
    switch (lvl) {
      case 'LEVEL 4 – Critical':
        return {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-300',
          icon: AlertOctagon,
          accent: 'bg-rose-600',
          barWidth: 'w-full',
          barColor: 'bg-rose-600',
        };
      case 'LEVEL 3 – High':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: AlertTriangle,
          accent: 'bg-amber-600',
          barWidth: 'w-3/4',
          barColor: 'bg-amber-500',
        };
      case 'LEVEL 2 – Moderate':
        return {
          bg: 'bg-indigo-50',
          text: 'text-indigo-800',
          border: 'border-indigo-300',
          icon: AlertCircle,
          accent: 'bg-indigo-600',
          barWidth: 'w-2/4',
          barColor: 'bg-indigo-500',
        };
      case 'LEVEL 1 – Low':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-300',
          icon: CheckCircle,
          accent: 'bg-emerald-600',
          barWidth: 'w-1/4',
          barColor: 'bg-emerald-500',
        };
    }
  };

  const sevMeta = getSeverityBadge(severity);
  const SevIcon = sevMeta.icon;

  const handleCopyAck = () => {
    navigator.clipboard.writeText(res.step6Escalation.suggestedAcknowledgmentDraft);
    setCopiedAck(true);
    setTimeout(() => setCopiedAck(false), 2500);
  };

  const getRiskIcon = (risk: RiskType) => {
    switch (risk) {
      case 'Patient Safety Risk':
        return ShieldAlert;
      case 'Clinical Risk':
        return HeartPulse;
      case 'Compliance Risk':
        return Scale;
      case 'Privacy Risk':
        return Lock;
      case 'Accessibility Risk':
        return Accessibility;
      case 'Equity Risk':
        return Users;
      case 'Reputational Risk':
        return Megaphone;
      case 'Operational Risk':
        return Cog;
    }
  };

  const flaggedRisks = res.step5RiskDetection.filter((r) => r.flagged);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
      {/* Top Dossier Command Bar */}
      <div className="p-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
              {complaint.id}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Source: <strong className="text-slate-700">{complaint.source}</strong>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">
              Department: <strong className="text-slate-700">{complaint.department}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Patient: {complaint.patientName || 'Anonymous / Confidential'}</span>
            {complaint.patientMRN && (
              <>
                <span className="text-slate-300">·</span>
                <span className="font-mono text-[11px] text-slate-500">MRN: {complaint.patientMRN}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>Received: {new Date(complaint.receivedDate).toLocaleString()}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {complaint.status !== 'Human Validated & Routed' ? (
            <button
              onClick={() => onStatusChange('Human Validated & Routed')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors shadow-2xs"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Validate & Route</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 rounded-md">
              <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
              Validated & Routed
            </span>
          )}

          <button
            onClick={onOpenOverride}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
            title="Override Severity, Routing or Add Clinical Notes"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Human Review</span>
          </button>

          <button
            onClick={onPrintDossier}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
            title="Print or Export Formal Hospital Triage Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Human Review Banner if active */}
      {res.humanReview && (
        <div className="px-4 py-2 bg-teal-50/80 border-b border-teal-200/80 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>Human Sign-off by {res.humanReview.reviewedBy}</strong> ({new Date(res.humanReview.reviewedAt).toLocaleString()})
              {res.humanReview.overrideSeverity && (
                <span className="ml-1 text-teal-800">
                  · Override Severity: <strong>{res.humanReview.overrideSeverity}</strong>
                </span>
              )}
            </span>
          </div>
          {res.humanReview.notes && (
            <span className="text-[11px] italic text-teal-800 truncate max-w-md">
              "{res.humanReview.notes}"
            </span>
          )}
        </div>
      )}

      {/* Main Canvas Body */}
      <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-17rem)]">
        {/* Core Triage Summary Card: Severity, Urgency SLA, Human Mandate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
          {/* Severity Column */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Step 2 · Severity Assessment
            </span>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${sevMeta.bg} ${sevMeta.text} ${sevMeta.border} border`}>
                <SevIcon className="w-4 h-4" />
                {severity}
              </span>
            </div>
            {/* Visual Severity Scale Indicator */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-2">
              <div className={`h-full ${sevMeta.barColor} ${sevMeta.barWidth} transition-all duration-500`} />
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Clinical Impact: <strong className="text-slate-700">{res.step2Severity.clinicalImpact}</strong>
            </p>
          </div>

          {/* Urgency SLA Column */}
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Response Urgency & SLA
            </span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-bold font-mono text-slate-900">
                {res.step3Urgency.responseSLA}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-snug">
              {res.step3Urgency.deadlineText}
            </p>
          </div>

          {/* Human Intervention Column */}
          <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Human Intervention Required
            </span>
            <div className="flex items-center gap-2">
              {res.step4HumanIntervention.required ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-rose-800 bg-rose-100/80 border border-rose-300">
                  <UserCheck className="w-3.5 h-3.5 text-rose-700" />
                  MANDATORY HUMAN OVERSIGHT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  AUTOMATED TIER PERMITTED
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              {res.step4HumanIntervention.rationale}
            </p>
          </div>
        </div>

        {/* What Happened: Chronological Narrative & Facts */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              What Happened · Clinical Summary & Timeline
            </h2>
            <span className="text-xs text-slate-500">
              Sentiment: <strong className="text-slate-800">{res.whatHappened.emotionalTone}</strong>
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
            <p className="text-xs text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3 rounded border border-slate-200/60">
              {res.whatHappened.summary}
            </p>

            {/* Event Chronology */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Identified Sequence of Events
              </span>
              <ul className="space-y-1.5">
                {res.whatHappened.incidentChronology.map((event, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="font-mono text-[11px] font-bold text-teal-700 shrink-0 w-4">
                      {idx + 1}.
                    </span>
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Involved Parties */}
            {res.whatHappened.partiesIdentified?.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Identified Parties/Staff:</span>
                {res.whatHappened.partiesIdentified.map((party, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                    {party}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* STEP 1: Complaint Category Diagnosis */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            STEP 1 · Complaint Category Classification
          </h2>

          <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-medium">Primary Category:</span>
                <span className="text-xs font-bold text-slate-900 bg-teal-50 border border-teal-200 text-teal-900 px-2.5 py-1 rounded-md">
                  {res.step1Category.primaryCategory}
                </span>
              </div>

              {res.step1Category.secondaryCategories?.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Secondary:</span>
                  <div className="flex flex-wrap gap-1">
                    {res.step1Category.secondaryCategories.map((sec, idx) => (
                      <span key={idx} className="text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              {res.step1Category.classificationRationale}
            </p>
          </div>
        </section>

        {/* STEP 2: Severity Reasoning Detail */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-teal-700" />
            STEP 2 · Severity Assessment Rationale
          </h2>

          <div className={`p-4 rounded-lg border ${sevMeta.bg} ${sevMeta.border} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${sevMeta.text}`}>
                {severity} Clinical & Legal Rationale
              </span>
              <span className="text-[11px] text-slate-500">
                Evaluation standard: CMS Conditions of Participation & Joint Commission
              </span>
            </div>
            <p className="text-xs text-slate-800 leading-relaxed font-normal">
              {res.step2Severity.reasoning}
            </p>
          </div>
        </section>

        {/* STEP 5: Risk Detection Matrix (8 Risk Dimensions) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-teal-700" />
              STEP 5 · Risk Detection Matrix ({flaggedRisks.length} Flagged Risks)
            </h2>
            <span className="text-xs text-slate-500">8 Regulatory & Operational Vectors Evaluated</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {res.step5RiskDetection.map((risk) => {
              const Icon = getRiskIcon(risk.riskType);
              const isFlagged = risk.flagged;
              const isSelected = selectedRiskTab === risk.riskType;

              return (
                <button
                  key={risk.riskType}
                  onClick={() => setSelectedRiskTab(isSelected ? null : risk.riskType)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isFlagged
                      ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  } ${isSelected ? 'ring-2 ring-teal-600' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${isFlagged ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold text-slate-900 leading-tight">
                        {risk.riskType.replace(' Risk', '')}
                      </span>
                    </div>
                    {isFlagged ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        FLAGGED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Clear
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed">
                    {risk.reason}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Expanded Selected Risk View */}
          {selectedRiskTab && (
            <div className="p-3.5 bg-slate-900 text-white rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-teal-300">{selectedRiskTab} Deep-Dive</span>
                <button
                  onClick={() => setSelectedRiskTab(null)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  Close
                </button>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {res.step5RiskDetection.find((r) => r.riskType === selectedRiskTab)?.reason}
              </p>
            </div>
          )}
        </section>

        {/* STEP 6: Escalation Recommendation & Action Plan */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-teal-700" />
              STEP 6 · Escalation Recommendation & Action Protocol
            </h2>
            <span className="text-xs text-slate-500">Routing & Containment Directive</span>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-4">
            {/* Primary & Secondary Route Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-teal-50/60 border border-teal-200/80 rounded-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-teal-700 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-teal-800 uppercase tracking-wider block">
                    Designated Receiving Department
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    ROUTE TO: {res.step6Escalation.primaryRoute}
                  </span>
                </div>
              </div>

              {res.step6Escalation.secondaryRoute && (
                <div className="text-xs text-slate-600">
                  Secondary Review: <strong className="text-slate-900">{res.step6Escalation.secondaryRoute}</strong>
                </div>
              )}
            </div>

            {/* Immediate Containment Steps */}
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Immediate Containment Protocol
              </span>
              <div className="space-y-1.5">
                {res.step6Escalation.containmentSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-700">
                    <span className="font-mono text-[11px] text-teal-700 font-bold shrink-0">
                      [{idx + 1}]
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Patient Acknowledgment Draft */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  Suggested Empathetic Patient Acknowledgment Draft
                </span>
                <button
                  onClick={handleCopyAck}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded transition-colors"
                >
                  {copiedAck ? (
                    <>
                      <Check className="w-3 h-3 text-teal-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Letter Draft</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 leading-relaxed italic font-serif">
                "{res.step6Escalation.suggestedAcknowledgmentDraft}"
              </div>
            </div>

            {/* Internal Investigation Checklist */}
            <div>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-700" />
                Department Investigation Checklist for {res.step6Escalation.primaryRoute}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {res.step6Escalation.investigationChecklist.map((check, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded border border-slate-200 text-xs text-slate-600">
                    <input type="checkbox" className="mt-0.5 rounded text-teal-600 focus:ring-teal-500" readOnly />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Original Raw Grievance Narrative (Expandable) */}
        <section className="space-y-2 pt-2 border-t border-slate-200">
          <details className="group">
            <summary className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center justify-between py-1">
              <span>View Full Unedited Patient Narrative & Intake Text</span>
              <span className="text-teal-700 text-[11px] group-open:hidden">Expand</span>
              <span className="text-teal-700 text-[11px] hidden group-open:inline">Collapse</span>
            </summary>
            <div className="mt-2 p-3 bg-slate-100/70 rounded-md border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
              {complaint.rawText}
            </div>
          </details>
        </section>
      </div>
    </div>
  );
};
