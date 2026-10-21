import React, { useState } from 'react';
import { ComplaintSource, ComplaintRecord } from '../types/triage';
import { X, Sparkles, AlertCircle, FileText, Stethoscope, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { triageComplaint } from '../services/triageService';

interface NewComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintCreated: (complaint: ComplaintRecord) => void;
}

const PRESET_TEMPLATES = [
  {
    title: 'Medication Overdose (L4)',
    source: 'Formal Grievance' as ComplaintSource,
    department: 'Med-Surg 4B',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-789214',
    text: `URGENT GRIEVANCE: My 82-year-old mother was admitted following hip surgery. The night float nurse administered 10 times the prescribed dose of Lovenox (300mg instead of 30mg). When she complained of severe flank pain, the nurse dismissed her. By morning shift change, she had an expanding retroperitoneal hematoma, hemoglobin dropped to 6.8 g/dL, and she required emergency ICU transfer and 3 units of blood. The attending doctor refused to meet with us. We have already contacted our medical malpractice attorney.`,
  },
  {
    title: 'ED 4-Hour Chest Pain Delay (L4)',
    source: 'Patient Portal' as ComplaintSource,
    department: 'Emergency Medicine',
    patientName: 'Marcus Sterling',
    mrn: 'MRN-442190',
    text: `I arrived at the ED at 6:30 PM with crushing chest pain radiating to my left arm, cold sweats, and blood pressure 185/105. I waited 4.5 hours in the waiting room with no ECG. When I asked if an ECG was going to be done, the receptionist snapped at me to take my seat. I was so scared I drove to another hospital across town, where they found ST-elevation and rushed me to the cath lab for an emergent LAD stent. Your emergency department almost let me die.`,
  },
  {
    title: 'HIPAA Portal Breach (L4)',
    source: 'Patient Portal' as ComplaintSource,
    department: 'Outpatient Behavioral Health',
    patientName: 'Samantha Green',
    mrn: 'MRN-330198',
    text: `MAJOR PRIVACY BREACH: When I logged into the portal to check my lab results, my account showed psychotherapy notes, suicide risk assessments, and Social Security numbers for 12 other psychiatric patients! I am a clinical social worker and this is a blatant HIPAA Omnibus Rule breach. Fix this immediately or I am filing a complaint with the HHS Office for Civil Rights.`,
  },
  {
    title: 'ASL Interpreter Denied (L3)',
    source: 'Formal Grievance' as ComplaintSource,
    department: 'Interventional Radiology',
    patientName: 'David Chen',
    mrn: 'MRN-551029',
    text: `I am completely Deaf and communicate via ASL. Two weeks before my scheduled core needle thyroid biopsy, I requested an on-site certified ASL interpreter. When I arrived, no interpreter was provided. The nurse handed me a broken VRI iPad that froze constantly. When I wrote that I couldn't understand the risks, the doctor waved his hand dismissively and wrote on a sticky note to just sign the consent form so we don't waste time. I refused and left without my cancer biopsy.`,
  },
  {
    title: 'Surprise Balance Bill (L3)',
    source: 'Online Review' as ComplaintSource,
    department: 'Patient Financial Services',
    patientName: 'Brenda Kowalski',
    mrn: 'MRN-609112',
    text: `I had an emergency appendectomy at your in-network hospital. Two months later, an aggressive collection agency sent me a bill demanding $14,850 for an out-of-network assistant surgeon I never agreed to! When I called your billing office, they said "not our problem." This violates the federal No Surprises Act and is causing me severe panic.`,
  },
  {
    title: 'Chemotherapy Delay (L2)',
    source: 'Post-discharge Survey' as ComplaintSource,
    department: 'Infusion Center',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-881204',
    text: `For the third time in 5 weeks, I arrived at 8 AM for my lung cancer chemo infusion only to wait 3 hours and be told the clinic forgot to submit the prior-authorization renewal to my insurance. My infusion was cancelled and pushed back. My doctor says delays between cycles reduce drug efficacy. When I cried at the front desk, the scheduler shrugged and said insurance is out of their hands.`,
  },
  {
    title: 'PT Wait & Parking (L1)',
    source: 'Post-discharge Survey' as ComplaintSource,
    department: 'Physical Therapy',
    patientName: 'Gary Miller',
    mrn: 'MRN-210984',
    text: `My physical therapist Mark is fantastic. However, check-in was delayed by 25 minutes yesterday because the receptionist was on a personal phone call. The parking validation machine was also broken, resulting in a $15 ticket from the private lot next door. Can the clinic reimburse or validate manually?`,
  },
];

const SOURCES: ComplaintSource[] = [
  'Patient Portal',
  'Post-discharge Survey',
  'Formal Grievance',
  'Online Review',
  'Phone Intake',
  'Bedside Feedback',
  'Letter to CEO',
];

const DEPARTMENTS = [
  'Emergency Medicine',
  'Med-Surg Unit 4B',
  'Cardiology & Cath Lab',
  'Outpatient Behavioral Health',
  'Comprehensive Cancer Center - Infusion',
  'Interventional Radiology',
  'Surgical Services / OR',
  'Patient Financial Services / Billing',
  'Physical Therapy & Rehabilitation',
  'Pediatrics & Neonatal Care',
  'Labor & Delivery',
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  isOpen,
  onClose,
  onComplaintCreated,
}) => {
  const [narrative, setNarrative] = useState('');
  const [source, setSource] = useState<ComplaintSource>('Patient Portal');
  const [department, setDepartment] = useState('Emergency Medicine');
  const [patientName, setPatientName] = useState('');
  const [patientMRN, setPatientMRN] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Triage loading sequence states
  const [isProcessing, setIsProcessing] = useState(false);
  const [triageStep, setTriageStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setNarrative(preset.text);
    setSource(preset.source);
    setDepartment(preset.department);
    setPatientName(preset.patientName);
    setPatientMRN(preset.mrn);
    setIsAnonymous(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim()) {
      setError('Please enter the patient grievance narrative or select a preset scenario.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setTriageStep('Step 1: Classifying primary & secondary complaint categories...');
      await new Promise((r) => setTimeout(r, 450));

      setTriageStep('Step 2: Performing clinical severity assessment (L1 - L4) & harm evaluation...');
      await new Promise((r) => setTimeout(r, 450));

      setTriageStep('Step 5: Scanning 8 regulatory and patient safety risk vectors...');
      await new Promise((r) => setTimeout(r, 450));

      setTriageStep('Step 6: Formulating department routing & immediate containment protocols...');

      // Call Triage Service (server Gemini or fallback)
      const triageResult = await triageComplaint(narrative, {
        source,
        department,
        patientId: patientMRN || patientName || 'Unspecified',
        date: new Date().toISOString(),
      });

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newRecord: ComplaintRecord = {
        id: `CMP-2026-${randomNum}`,
        receivedDate: new Date().toISOString(),
        source,
        department,
        facilityLocation: 'Main Health System Campus',
        patientName: isAnonymous ? 'Anonymous' : patientName || undefined,
        patientMRN: isAnonymous ? undefined : patientMRN || undefined,
        isAnonymous,
        rawText: narrative,
        status: 'Pending Triage',
        triageResult,
      };

      onComplaintCreated(newRecord);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('An error occurred during triage. Please retry.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                New Complaint Intake & Clinical Triage
              </h2>
              <p className="text-xs text-slate-500">
                Submit patient feedback, grievances, or clinical reports for automated risk classification and routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
            Load Pre-Configured Clinical Test Cases
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(tpl)}
                disabled={isProcessing}
                className="text-xs px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded text-slate-700 transition-colors"
              >
                {tpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Intake Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Source & Department row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intake Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as ComplaintSource)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
                disabled={isProcessing}
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Department / Care Area
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600"
                disabled={isProcessing}
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Patient Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Name (Optional)
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Eleanor Vance"
                disabled={isAnonymous || isProcessing}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Record # (MRN)
              </label>
              <input
                type="text"
                value={patientMRN}
                onChange={(e) => setPatientMRN(e.target.value)}
                placeholder="e.g. MRN-789214"
                disabled={isAnonymous || isProcessing}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600 font-mono disabled:opacity-50"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={isProcessing}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Anonymous Submission</span>
              </label>
            </div>
          </div>

          {/* Narrative Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Complaint Narrative / Grievance Text
            </label>
            <textarea
              rows={6}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Paste patient portal message, survey comment, formal grievance, or clinician bedside report..."
              disabled={isProcessing}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:ring-1 focus:ring-teal-600 font-normal leading-relaxed"
            />
          </div>

          {/* Processing State Indicator */}
          {isProcessing && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
                <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
                <span>AI Clinical Triage Engine Executing...</span>
              </div>
              <p className="text-xs text-teal-800 font-medium pl-6">
                {triageStep}
              </p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-md transition-colors shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>Run AI Clinical Triage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
