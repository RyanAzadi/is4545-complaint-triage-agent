import React, { useState } from 'react';
import { ComplaintRecord, SeverityLevel, RouteTarget, ComplaintCategory } from '../types/triage';
import { X, UserCheck, ShieldAlert, Check } from 'lucide-react';

interface HumanOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintRecord;
  onSaveOverride: (overrideData: {
    reviewedBy: string;
    overrideSeverity?: SeverityLevel;
    overrideRoute?: RouteTarget;
    overrideCategory?: ComplaintCategory;
    notes: string;
  }) => void;
}

const SEVERITIES: SeverityLevel[] = [
  'LEVEL 1 – Low',
  'LEVEL 2 – Moderate',
  'LEVEL 3 – High',
  'LEVEL 4 – Critical',
];

const ROUTE_TARGETS: RouteTarget[] = [
  'Patient Experience Team',
  'Nursing Leadership',
  'Physician Leadership',
  'Quality Improvement Team',
  'Compliance Office',
  'Information Technology',
  'Revenue Cycle / Billing',
  'Accessibility Coordinator',
  'Risk Management',
  'Executive Review',
];

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

export const HumanOverrideModal: React.FC<HumanOverrideModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onSaveOverride,
}) => {
  const currentRes = complaint.triageResult;
  const currentSev = currentRes?.step2Severity.level || 'LEVEL 1 – Low';
  const currentRoute = currentRes?.step6Escalation.primaryRoute || 'Patient Experience Team';
  const currentCat = currentRes?.step1Category.primaryCategory || 'Communication';

  const [reviewerName, setReviewerName] = useState('Dr. Sarah Lin, MD (Chief Medical Quality Officer)');
  const [severity, setSeverity] = useState<SeverityLevel>(currentSev);
  const [route, setRoute] = useState<RouteTarget>(currentRoute);
  const [category, setCategory] = useState<ComplaintCategory>(currentCat);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setError('Please provide reviewer name and clinical title.');
      return;
    }
    if (!notes.trim()) {
      setError('Please provide clinical triage notes justifying this determination.');
      return;
    }

    onSaveOverride({
      reviewedBy: reviewerName,
      overrideSeverity: severity !== currentSev ? severity : undefined,
      overrideRoute: route !== currentRoute ? route : undefined,
      overrideCategory: category !== currentCat ? category : undefined,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-teal-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Human Clinical Oversight & Override Protocol
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {complaint.id} · {complaint.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {error}
            </div>
          )}

          {/* Reviewer Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reviewer Name & Clinical/Administrative Role
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
              required
            />
          </div>

          {/* Severity & Route Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Designated Route Department
              </label>
              <select
                value={route}
                onChange={(e) => setRoute(e.target.value as RouteTarget)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
              >
                {ROUTE_TARGETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Clinical Justification Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Justification & Oversight Directives
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document reason for override or specific investigation instructions for the receiving department..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
              required
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sign-off & Route Complaint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
