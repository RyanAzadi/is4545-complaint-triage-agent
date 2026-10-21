import { TriageResult, ComplaintCategory, SeverityLevel, RiskFinding, RouteTarget } from '../types/triage';

export async function triageComplaint(
  complaintText: string,
  metadata?: { source?: string; department?: string; date?: string; patientId?: string }
): Promise<TriageResult> {
  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ complaintText, metadata }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data: TriageResult = await res.json();
    return data;
  } catch (err) {
    console.warn('Network or server error during AI triage, falling back to client-side clinical heuristic:', err);
    return fallbackClientTriage(complaintText, metadata);
  }
}

// Client-side clinical rule engine fallback for resilient offline operation
export function fallbackClientTriage(
  complaintText: string,
  metadata?: { source?: string; department?: string; date?: string; patientId?: string }
): TriageResult {
  const lower = complaintText.toLowerCase();

  // Category determination
  const catChecks: [ComplaintCategory, RegExp][] = [
    ['Patient Safety', /(patient safety|near miss|fall|wrong patient|harm|injury|overdose|seizure|bleeding|hematoma|code blue|aspirat)/i],
    ['Clinical Care', /(medication|dosage|wrong dose|diagnosis|physician|doctor|nurse|treatment|surgery|complication|chest pain|infection|sepsis|prescription|vital)/i],
    ['Privacy or Security', /(hipaa|privacy|breach|records|confidential|disclosed|unauthorized|another patient|portal leak|phi)/i],
    ['Staff Conduct', /(rude|yelled|dismissive|attitude|disrespect|insult|unprofessional|nurse refused|ignored me|berated)/i],
    ['Billing', /(bill|invoice|insurance|overcharge|copay|deductible|collections|financial|cost|out-of-network|surprise bill)/i],
    ['Technology / Patient Portal', /(portal|mychart|app|login|password|system down|website|server error|ehr|epic|cerner|telehealth link)/i],
    ['Wait Time', /(hours waiting|wait time|delay|triage wait|forgotten in room|left waiting|delayed care|waiting room)/i],
    ['Scheduling', /(appointment|rescheduled|canceled|scheduling|no availability|calendar|double booked|booking)/i],
    ['Communication', /(miscommunication|nobody told me|informed consent|unclear instructions|no callback|discharge notes)/i],
  ];

  let primaryCategory: ComplaintCategory = 'Communication';
  const secondaryCategories: ComplaintCategory[] = [];

  for (const [cat, regex] of catChecks) {
    if (regex.test(lower)) {
      if (primaryCategory === 'Communication') {
        primaryCategory = cat;
      } else if (!secondaryCategories.includes(cat)) {
        secondaryCategories.push(cat);
      }
    }
  }

  // Severity Level
  let level: SeverityLevel = 'LEVEL 1 – Low';
  let reasoning = '';
  const isCritical = /(immediate patient safety|cardiac arrest|chest pain.*(hours|delayed)|fatal|hematoma.*rapid|bleeding uncontrollably|sepsis|wrong surgery|10x.*dose|tenfold dose|lethal|anaphylaxis|throat swelling|epinephrine|wrong antibiotic|insulin.*(wrong|overdose)|abuse|assault|suicid|legal action|retaining lawyer|subpoena|civil rights|discrimination allegation)/i.test(lower);
  const isHigh = /(wrong dose|potential harm|medication error|allergic|allergy band|uncontrolled pain|infection|deaf.*interpreter.*denied|asl denied|ada violation|missed diagnosis|escalated grievance|compromised airway|fall with|fracture|insulin)/i.test(lower);
  const isModerate = /(repeated|multiple times|called 4 times|three weeks|no response|significant frustration|breakdown in care|billing dispute|excessive wait|unprofessional conduct)/i.test(lower);

  if (isCritical) {
    level = 'LEVEL 4 – Critical';
    reasoning = 'Presents immediate patient safety risk, severe clinical instability, acute medication overdose/harm, active regulatory exposure, or serious discrimination allegation requiring emergency executive escalation.';
  } else if (isHigh) {
    level = 'LEVEL 3 – High';
    reasoning = 'Involves potential patient harm, medication error, significant accessibility barrier under federal regulations, or unresolved escalated grievance requiring expedited physician/nursing leadership intervention.';
  } else if (isModerate) {
    level = 'LEVEL 2 – Moderate';
    reasoning = 'Reflects repeated operational service failures, sustained patient frustration, or significant communication breakdown across multiple touchpoints.';
  } else {
    level = 'LEVEL 1 – Low';
    reasoning = 'Routine dissatisfaction, general suggestion, or minor administrative inconvenience without acute clinical risk or patient harm.';
  }

  // Risks
  const riskDetection: RiskFinding[] = [
    {
      riskType: 'Patient Safety Risk',
      flagged: /(safety|fall|injury|harm|hematoma|wrong patient|bleeding|trauma|complication|allergic|allergy|anaphylaxis|swelling|epinephrine|hives|overdose)/i.test(lower),
      reason: /(safety|fall|injury|harm|hematoma|wrong patient|bleeding|trauma|complication|allergic|allergy|anaphylaxis|swelling|epinephrine|hives|overdose)/i.test(lower)
        ? 'Active or threatened physical injury, severe allergic reaction, patient misidentification, or acute safety compromise identified in narrative.'
        : 'No acute physical compromise or adverse event documented.',
    },
    {
      riskType: 'Clinical Risk',
      flagged: /(medication|dose|drug|antibiotic|penicillin|insulin|chest pain|cardiac|infection|septic|vital|diagnosis|treatment|physician|surgery|symptoms|allergic|anaphylaxis)/i.test(lower),
      reason: /(medication|dose|drug|antibiotic|penicillin|insulin|chest pain|cardiac|infection|septic|vital|diagnosis|treatment|physician|surgery|symptoms|allergic|anaphylaxis)/i.test(lower)
        ? 'Directly involves clinical care delivery, medication accuracy, delayed acute diagnosis, or therapeutic outcomes.'
        : 'Complaint centers on administrative or logistical workflows rather than clinical diagnosis or therapeutics.',
    },
    {
      riskType: 'Compliance Risk',
      flagged: /(hipaa|lawyer|sue|legal|attorney|billing fraud|cms|joint commission|oig|regulat|ada violation|civil rights)/i.test(lower),
      reason: /(hipaa|lawyer|sue|legal|attorney|billing fraud|cms|joint commission|oig|regulat|ada violation|civil rights)/i.test(lower)
        ? 'Potential non-compliance with CMS Conditions of Participation, Section 1557, HIPAA Privacy Rule, or threatened litigation.'
        : 'Standard service level dispute without imminent statutory or regulatory breach triggers.',
    },
    {
      riskType: 'Privacy Risk',
      flagged: /(privacy|hipaa|breach|another patient|records|confidential|portal leak|phi|disclosure)/i.test(lower),
      reason: /(privacy|hipaa|breach|another patient|records|confidential|portal leak|phi|disclosure)/i.test(lower)
        ? 'Allegation of unauthorized PHI disclosure, electronic health record crossover, or privacy safeguard failure.'
        : 'No protected health information (PHI) disclosure or privacy boundary breach noted.',
    },
    {
      riskType: 'Accessibility Risk',
      flagged: /(wheelchair|ramp|blind|deaf|interpreter|asl|ada|handicap|braille|hearing|mobility)/i.test(lower),
      reason: /(wheelchair|ramp|blind|deaf|interpreter|asl|ada|handicap|braille|hearing|mobility)/i.test(lower)
        ? 'Potential violation of Title III ADA, Section 504 Rehabilitation Act, or refusal of auxiliary sensory aids.'
        : 'Physical or auxiliary communication accessibility was not cited as a barrier.',
    },
    {
      riskType: 'Equity Risk',
      flagged: /(discrimination|racism|racial|bias|lgbtq|treated differently|accent|spanish|immigrant|language|prejudice|stereotyp)/i.test(lower),
      reason: /(discrimination|racism|racial|bias|lgbtq|treated differently|accent|spanish|immigrant|language|prejudice|stereotyp)/i.test(lower)
        ? 'Presents allegations of differential treatment, linguistic exclusion, or demographic bias requiring impartial equity review.'
        : 'No demographic or protected class discrimination allegations surfaced in complaint.',
    },
    {
      riskType: 'Reputational Risk',
      flagged: /(review|google|yelp|media|news|press|facebook|twitter|tiktok|warn everyone|report to the board)/i.test(lower) || level === 'LEVEL 4 – Critical',
      reason: /(review|google|yelp|media|news|press|facebook|twitter|tiktok|warn everyone|report to the board)/i.test(lower) || level === 'LEVEL 4 – Critical'
        ? 'High probability of public dissemination, negative online reviews, press coverage, or community trust damage.'
        : 'Contained private feedback with low external viral or community visibility.',
    },
    {
      riskType: 'Operational Risk',
      flagged: /(staffing|understaffed|wait|system down|process|lost paperwork|delayed|scheduling|protocol failure)/i.test(lower),
      reason: /(staffing|understaffed|wait|system down|process|lost paperwork|delayed|scheduling|protocol failure)/i.test(lower)
        ? 'Reflects departmental bottlenecks, EHR downtime, nurse-to-patient staffing strain, or broken handoff protocols.'
        : 'Isolated individual occurrence rather than systemic operational defect.',
    },
  ];

  // Routing
  let primaryRoute: RouteTarget = 'Patient Experience Team';
  let secondaryRoute = '';
  if (primaryCategory === 'Patient Safety' || level === 'LEVEL 4 – Critical') {
    primaryRoute = 'Risk Management';
    secondaryRoute = 'Executive Review';
  } else if (primaryCategory === 'Clinical Care') {
    primaryRoute = lower.includes('nurse') ? 'Nursing Leadership' : 'Physician Leadership';
    secondaryRoute = 'Quality Improvement Team';
  } else if (primaryCategory === 'Privacy or Security') {
    primaryRoute = 'Compliance Office';
    secondaryRoute = 'Information Technology';
  } else if (primaryCategory === 'Billing') {
    primaryRoute = 'Revenue Cycle / Billing';
    secondaryRoute = 'Patient Experience Team';
  } else if (primaryCategory === 'Technology / Patient Portal') {
    primaryRoute = 'Information Technology';
    secondaryRoute = 'Patient Experience Team';
  } else if (lower.includes('interpreter') || lower.includes('wheelchair') || lower.includes('asl')) {
    primaryRoute = 'Accessibility Coordinator';
    secondaryRoute = 'Compliance Office';
  } else if (primaryCategory === 'Staff Conduct') {
    primaryRoute = lower.includes('doctor') ? 'Physician Leadership' : 'Nursing Leadership';
    secondaryRoute = 'Patient Experience Team';
  }

  // Response urgency and SLA
  let responseSLA = '5-7 Business Days (Standard)';
  let urgencyWindowHours = 120;
  if (level === 'LEVEL 4 – Critical') {
    responseSLA = 'Immediate (< 2 Hours)';
    urgencyWindowHours = 2;
  } else if (level === 'LEVEL 3 – High') {
    responseSLA = 'Urgent (< 24 Hours)';
    urgencyWindowHours = 24;
  } else if (level === 'LEVEL 2 – Moderate') {
    responseSLA = 'Priority (< 48 Hours)';
    urgencyWindowHours = 48;
  }

  const humanInterventionRequired = level !== 'LEVEL 1 – Low' || riskDetection.some(r => r.flagged);
  const humanInterventionRationale = humanInterventionRequired
    ? `Human review required due to ${level} rating with active ${riskDetection.filter(r => r.flagged).map(r => r.riskType).join(', ')}. Clinical oversight mandatory.`
    : 'Automated acknowledgment permitted; standard customer service tier.';

  return {
    whatHappened: {
      summary: complaintText.slice(0, 200) + '...',
      incidentChronology: [
        `Grievance logged via ${metadata?.source || 'Portal'}.`,
        `Patient described concerns regarding ${primaryCategory.toLowerCase()} in ${metadata?.department || 'Care Unit'}.`,
        `Core impact: ${reasoning}`,
      ],
      emotionalTone: level === 'LEVEL 4 – Critical' ? 'Severely Alarmed' : 'Frustrated / Dissatisfied',
      partiesIdentified: [metadata?.department || 'Clinical Care Unit', 'Care Team'],
    },
    step1Category: {
      primaryCategory,
      secondaryCategories,
      classificationRationale: `Classified primarily as ${primaryCategory} based on core complaint triggers and clinical impact.`,
    },
    step2Severity: {
      level,
      reasoning,
      clinicalImpact: level === 'LEVEL 4 – Critical' ? 'Severe / Acute Harm Threat' : level === 'LEVEL 3 – High' ? 'Moderate / Potential Harm' : 'Negligible Clinical Harm',
    },
    step3Urgency: {
      responseSLA,
      urgencyWindowHours,
      deadlineText: `Requires designated liaison outreach within ${responseSLA}.`,
    },
    step4HumanIntervention: {
      required: humanInterventionRequired,
      rationale: humanInterventionRationale,
      suggestedReviewerRole: primaryRoute === 'Risk Management' ? 'Clinical Risk Manager & Charge Physician' : 'Patient Relations Advocate',
    },
    step5RiskDetection: riskDetection,
    step6Escalation: {
      primaryRoute,
      secondaryRoute,
      containmentSteps: [
        'Secure patient record and confirm immediate safety/containment.',
        `Route urgent incident brief to ${primaryRoute}.`,
        'Log formal grievance tracking timestamp pursuant to CMS guidelines.',
      ],
      suggestedAcknowledgmentDraft: `Dear Patient: Thank you for contacting our leadership team. We have received your feedback regarding your experience with ${metadata?.department || 'our care center'}. A designated patient care coordinator has been assigned to investigate your concerns, and we will follow up with you within ${responseSLA}.`,
      investigationChecklist: [
        'Review electronic health record audit log and clinician progress notes.',
        'Interview involved care team members.',
        'Document clinical root cause and corrective action plan.',
      ],
    },
    engine: 'Clinical Rule Engine (Client Safe)',
    triageTimestamp: new Date().toISOString(),
  };
}
