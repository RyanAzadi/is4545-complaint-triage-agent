export type ComplaintCategory =
  | 'Communication'
  | 'Scheduling'
  | 'Wait Time'
  | 'Technology / Patient Portal'
  | 'Billing'
  | 'Clinical Care'
  | 'Patient Safety'
  | 'Privacy or Security'
  | 'Staff Conduct'
  | 'Other';

export type SeverityLevel =
  | 'LEVEL 1 – Low'
  | 'LEVEL 2 – Moderate'
  | 'LEVEL 3 – High'
  | 'LEVEL 4 – Critical';

export type RiskType =
  | 'Patient Safety Risk'
  | 'Clinical Risk'
  | 'Compliance Risk'
  | 'Privacy Risk'
  | 'Accessibility Risk'
  | 'Equity Risk'
  | 'Reputational Risk'
  | 'Operational Risk';

export type RouteTarget =
  | 'Patient Experience Team'
  | 'Nursing Leadership'
  | 'Physician Leadership'
  | 'Quality Improvement Team'
  | 'Compliance Office'
  | 'Information Technology'
  | 'Revenue Cycle / Billing'
  | 'Accessibility Coordinator'
  | 'Risk Management'
  | 'Executive Review';

export type ComplaintSource =
  | 'Patient Portal'
  | 'Post-discharge Survey'
  | 'Formal Grievance'
  | 'Online Review'
  | 'Phone Intake'
  | 'Bedside Feedback'
  | 'Letter to CEO';

export type ComplaintStatus =
  | 'Pending Triage'
  | 'Triaged / Pending Review'
  | 'Human Validated & Routed'
  | 'Under Investigation'
  | 'Closed';

export interface RiskFinding {
  riskType: RiskType;
  flagged: boolean;
  reason: string;
}

export interface TriageResult {
  whatHappened: {
    summary: string;
    incidentChronology: string[];
    emotionalTone: string;
    partiesIdentified: string[];
  };
  step1Category: {
    primaryCategory: ComplaintCategory;
    secondaryCategories: ComplaintCategory[];
    classificationRationale: string;
  };
  step2Severity: {
    level: SeverityLevel;
    reasoning: string;
    clinicalImpact: string;
  };
  step3Urgency: {
    responseSLA: string;
    urgencyWindowHours: number;
    deadlineText: string;
  };
  step4HumanIntervention: {
    required: boolean;
    rationale: string;
    suggestedReviewerRole?: string;
  };
  step5RiskDetection: RiskFinding[];
  step6Escalation: {
    primaryRoute: RouteTarget;
    secondaryRoute?: string;
    containmentSteps: string[];
    suggestedAcknowledgmentDraft: string;
    investigationChecklist: string[];
  };
  engine?: string;
  triageTimestamp: string;
  humanReview?: {
    reviewedBy: string;
    reviewedAt: string;
    overrideSeverity?: SeverityLevel;
    overrideRoute?: RouteTarget;
    overrideCategory?: ComplaintCategory;
    notes: string;
  };
}

export interface ComplaintRecord {
  id: string;
  receivedDate: string;
  source: ComplaintSource;
  department: string;
  facilityLocation: string;
  patientName?: string;
  patientMRN?: string;
  isAnonymous?: boolean;
  rawText: string;
  status: ComplaintStatus;
  triageResult?: TriageResult;
}
