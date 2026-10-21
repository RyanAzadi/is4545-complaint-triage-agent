import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Shared Gemini client setup
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// Fallback clinical triage rules if Gemini API is unavailable or missing key
function heuristicTriage(complaintText: string, metadata?: { source?: string; department?: string; date?: string; patientId?: string }) {
  const lower = complaintText.toLowerCase();

  // Primary and secondary categories
  let primaryCategory = 'Other';
  const secondaryCategories: string[] = [];

  const catChecks: [string, RegExp][] = [
    ['Patient Safety', /(patient safety|near miss|fall|wrong patient|harm|injury|overdose|seizure|bleeding|hematoma|code blue|aspirat)/i],
    ['Clinical Care', /(medication|dosage|wrong dose|diagnosis|physician|doctor|nurse|treatment|surgery|complication|chest pain|infection|sepsis|prescription|iv pump|vital|lab error)/i],
    ['Privacy or Security', /(hipaa|privacy|breach|records|confidential|disclosed|unauthorized|another patient|portal leak|phi)/i],
    ['Accessibility Risk', /(wheelchair|ramp|blind|deaf|interpreter|asl|handicap|ada|hearing impaired|language access)/i],
    ['Billing', /(bill|invoice|insurance|overcharge|copay|deductible|collections|financial|cost|out-of-network|surprise bill)/i],
    ['Technology / Patient Portal', /(portal|mychart|app|login|password|system down|website|server error|ehr|epic|cerner|telehealth link)/i],
    ['Staff Conduct', /(rude|yelled|dismissive|attitude|disrespect|insult|unprofessional|nurse refused|ignored me|berated)/i],
    ['Wait Time', /(hours waiting|wait time|delay|triage wait|forgotten in room|left waiting|delayed care|waiting room)/i],
    ['Scheduling', /(appointment|rescheduled|canceled|scheduling|no availability|calendar|double booked|booking)/i],
    ['Communication', /(miscommunication|nobody told me|informed consent|unclear instructions|no callback|discharge notes)/i],
  ];

  const matchedCats: string[] = [];
  for (const [cat, regex] of catChecks) {
    if (regex.test(lower)) {
      matchedCats.push(cat);
    }
  }

  if (matchedCats.length > 0) {
    primaryCategory = matchedCats[0];
    secondaryCategories.push(...matchedCats.slice(1));
  } else {
    primaryCategory = 'Communication';
  }

  // Severity Level: 1-Low, 2-Moderate, 3-High, 4-Critical
  let severityLevel: 'LEVEL 1 – Low' | 'LEVEL 2 – Moderate' | 'LEVEL 3 – High' | 'LEVEL 4 – Critical' = 'LEVEL 1 – Low';
  let severityReasoning = '';

  const isCritical = /(immediate patient safety|cardiac arrest|chest pain.*(hours|delayed)|fatal|hematoma.*rapid|bleeding uncontrollably|sepsis|wrong surgery|10x.*dose|tenfold dose|lethal|anaphylaxis|throat swelling|epinephrine|wrong antibiotic|insulin.*(wrong|overdose)|abuse|assault|suicid|legal action|retaining lawyer|subpoena|civil rights|discrimination allegation)/i.test(lower);
  const isHigh = /(wrong dose|potential harm|medication error|allergic|allergy band|uncontrolled pain|infection|deaf.*interpreter.*denied|asl denied|ada violation|missed diagnosis|escalated grievance|compromised airway|fall with|fracture|insulin)/i.test(lower);
  const isModerate = /(repeated|multiple times|called 4 times|three weeks|no response|significant frustration|breakdown in care|billing dispute|excessive wait|unprofessional conduct)/i.test(lower);

  if (isCritical) {
    severityLevel = 'LEVEL 4 – Critical';
    severityReasoning = 'Presents immediate patient safety risk, severe clinical instability, acute medication overdose/harm, active regulatory exposure, or serious discrimination allegation requiring emergency executive escalation.';
  } else if (isHigh) {
    severityLevel = 'LEVEL 3 – High';
    severityReasoning = 'Involves potential patient harm, medication error, significant accessibility barrier under federal regulations, or unresolved escalated grievance requiring expedited physician/nursing leadership intervention.';
  } else if (isModerate) {
    severityLevel = 'LEVEL 2 – Moderate';
    severityReasoning = 'Reflects repeated operational service failures, sustained patient frustration, or significant communication breakdown across multiple touchpoints.';
  } else {
    severityLevel = 'LEVEL 1 – Low';
    severityReasoning = 'Routine dissatisfaction, general suggestion, or minor administrative inconvenience without acute clinical risk or patient harm.';
  }

  // Risks
  const riskDetection: { riskType: string; flagged: boolean; reason: string }[] = [
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
      flagged: /(review|google|yelp|media|news|press|facebook|twitter|tiktok|warn everyone|report to the board)/i.test(lower) || severityLevel === 'LEVEL 4 – Critical',
      reason: /(review|google|yelp|media|news|press|facebook|twitter|tiktok|warn everyone|report to the board)/i.test(lower) || severityLevel === 'LEVEL 4 – Critical'
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

  // Routing recommendation
  let primaryRoute = 'Patient Experience Team';
  let secondaryRoute = '';
  if (primaryCategory === 'Patient Safety' || severityLevel === 'LEVEL 4 – Critical') {
    primaryRoute = 'Risk Management';
    secondaryRoute = 'Executive Review';
  } else if (primaryCategory === 'Clinical Care') {
    primaryRoute = lower.includes('nurse') ? 'Nursing Leadership' : 'Physician Leadership';
    secondaryRoute = 'Quality Improvement Team';
  } else if (primaryCategory === 'Privacy or Security') {
    primaryRoute = 'Compliance Office';
    secondaryRoute = 'Information Technology';
  } else if (primaryCategory === 'Accessibility Risk' || lower.includes('interpreter') || lower.includes('wheelchair')) {
    primaryRoute = 'Accessibility Coordinator';
    secondaryRoute = 'Patient Experience Team';
  } else if (primaryCategory === 'Billing') {
    primaryRoute = 'Revenue Cycle / Billing';
    secondaryRoute = 'Patient Experience Team';
  } else if (primaryCategory === 'Technology / Patient Portal') {
    primaryRoute = 'Information Technology';
    secondaryRoute = 'Patient Experience Team';
  } else if (primaryCategory === 'Staff Conduct') {
    primaryRoute = lower.includes('doctor') ? 'Physician Leadership' : 'Nursing Leadership';
    secondaryRoute = 'Patient Experience Team';
  }

  // Response urgency and SLA
  let responseSLA = '5-7 Business Days (Standard)';
  let urgencyWindowHours = 120;
  if (severityLevel === 'LEVEL 4 – Critical') {
    responseSLA = 'Immediate (< 2 Hours)';
    urgencyWindowHours = 2;
  } else if (severityLevel === 'LEVEL 3 – High') {
    responseSLA = 'Urgent (< 24 Hours)';
    urgencyWindowHours = 24;
  } else if (severityLevel === 'LEVEL 2 – Moderate') {
    responseSLA = 'Priority (< 48 Hours)';
    urgencyWindowHours = 48;
  }

  const humanInterventionRequired = severityLevel !== 'LEVEL 1 – Low' || riskDetection.some(r => r.flagged);
  const humanInterventionRationale = humanInterventionRequired
    ? `Required due to ${severityLevel} classification with active ${riskDetection.filter(r => r.flagged).map(r => r.riskType).join(', ')}. Clinical/operational review is legally and procedurally necessary.`
    : 'Optional automated acknowledgment acceptable; routine dissatisfaction without adverse clinical risk.';

  // Structured summary
  const words = complaintText.trim().split(/\s+/);
  const briefSummary = words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');

  return {
    whatHappened: {
      summary: briefSummary,
      incidentChronology: [
        `Incident captured from ${metadata?.source || 'Patient Grievance Portal'}.`,
        `Patient reported acute dissatisfaction involving ${primaryCategory.toLowerCase()} within ${metadata?.department || 'Clinical Service Unit'}.`,
        `Direct impact: ${severityReasoning}`,
      ],
      emotionalTone: severityLevel === 'LEVEL 4 – Critical' ? 'Severely Distressed / Urgent' : severityLevel === 'LEVEL 3 – High' ? 'Frustrated & Alarmed' : 'Dissatisfied',
      partiesIdentified: [metadata?.department || 'Clinical Care Team', 'Patient & Family Support'],
    },
    step1Category: {
      primaryCategory,
      secondaryCategories: secondaryCategories.length > 0 ? secondaryCategories : ['Communication'],
      classificationRationale: `The dominant issue centers on ${primaryCategory.toLowerCase()}, with intersecting impacts across ${secondaryCategories.join(', ') || 'general experience'}.`,
    },
    step2Severity: {
      level: severityLevel,
      reasoning: severityReasoning,
      clinicalImpact: severityLevel === 'LEVEL 4 – Critical' ? 'Severe / Acute Harm Threat' : severityLevel === 'LEVEL 3 – High' ? 'Moderate / Potential Harm' : 'Negligible Clinical Harm',
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
        `Immediate hold or verification on relevant clinical chart/billing invoice.`,
        `Direct escalation notice dispatched to ${primaryRoute}.`,
        `Initiate formal grievance log pursuant to 42 CFR § 482.13 Patient Rights.`,
      ],
      suggestedAcknowledgmentDraft: `Dear Patient, thank you for contacting our leadership team. We have received your feedback regarding your experience with ${metadata?.department || 'our care center'}. A designated patient care coordinator has been assigned to investigate your concerns with our clinical leadership, and we will follow up with you directly within ${responseSLA}.`,
      investigationChecklist: [
        'Review electronic health record audit log and clinician progress notes.',
        'Interview involved bedside nurse, attending physician, or unit supervisor.',
        'Review pharmacy dispensing logs or billing ledger line items if applicable.',
        'Document clinical root cause and corrective action plan.',
      ],
    },
    triageTimestamp: new Date().toISOString(),
  };
}

// POST /api/triage endpoint
app.post('/api/triage', async (req, res) => {
  try {
    const { complaintText, metadata } = req.body;
    if (!complaintText || typeof complaintText !== 'string' || !complaintText.trim()) {
      return res.status(400).json({ error: 'Complaint text is required.' });
    }

    // If Gemini client is available, execute structured analysis
    if (ai && process.env.GEMINI_API_KEY) {
      try {
        const systemInstruction = `You are a Healthcare Complaint Triage Assistant.
Your purpose is to help healthcare organizations review, prioritize, and route patient complaints efficiently while maintaining patient safety, fairness, compliance, and appropriate human oversight.
Your role is NOT to resolve complaints. Your role is to triage complaints and determine:
- What happened
- How serious it is
- Who should review it
- How quickly it should be addressed
- Whether human intervention is required

Adhere strictly to the required steps:
STEP 1: Complaint Category
Classify into ONE primary category from: Communication, Scheduling, Wait Time, Technology / Patient Portal, Billing, Clinical Care, Patient Safety, Privacy or Security, Staff Conduct, Other.
List secondary categories if present.

STEP 2: Severity Assessment
Assign exactly one of:
- LEVEL 1 – Low (Minor inconvenience, Routine dissatisfaction, General suggestion)
- LEVEL 2 – Moderate (Repeated service failures, Significant frustration, Communication breakdown)
- LEVEL 3 – High (Potential patient harm, Medication-related concern, Serious accessibility issue, Escalated complaint)
- LEVEL 4 – Critical (Immediate patient safety risk, Potential legal exposure, Serious privacy violation, Discrimination allegation)
Provide rigorous healthcare operational/clinical reasoning.

STEP 3: Response Urgency & SLA
Provide SLA timeframe (e.g., 'Immediate (< 2 Hours)', 'Urgent (< 24 Hours)', 'Priority (< 48 Hours)', '5-7 Business Days (Standard)') and hours window.

STEP 4: Human Intervention Required
Determine if human intervention is required (true/false) and provide rationale.

STEP 5: Risk Detection
Examine and report on ALL 8 risks:
1. Patient Safety Risk
2. Clinical Risk
3. Compliance Risk
4. Privacy Risk
5. Accessibility Risk
6. Equity Risk
7. Reputational Risk
8. Operational Risk
For each risk: indicate flagged (boolean) and provide a concise, factual clinical explanation for why it was flagged or not.

STEP 6: Escalation Recommendation
ROUTE TO one primary and optional secondary from:
Patient Experience Team, Nursing Leadership, Physician Leadership, Quality Improvement Team, Compliance Office, Information Technology, Revenue Cycle / Billing, Accessibility Coordinator, Risk Management, Executive Review.
Provide immediate containment steps, a professional empathetic acknowledgment draft for the patient, and an internal root-cause investigation checklist.`;

        const prompt = `Patient Complaint Narrative:
"""
${complaintText}
"""
Metadata:
Source: ${metadata?.source || 'Portal'}
Department/Unit: ${metadata?.department || 'Unspecified'}
Incident Date: ${metadata?.date || 'Recent'}
Patient ID / Reference: ${metadata?.patientId || 'De-identified'}

Analyze and return the complete triage results in strict JSON conforming to this schema.`;

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                whatHappened: {
                  type: Type.OBJECT,
                  properties: {
                    summary: { type: Type.STRING },
                    incidentChronology: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    emotionalTone: { type: Type.STRING },
                    partiesIdentified: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['summary', 'incidentChronology', 'emotionalTone'],
                },
                step1Category: {
                  type: Type.OBJECT,
                  properties: {
                    primaryCategory: {
                      type: Type.STRING,
                      description: 'Must be one of: Communication, Scheduling, Wait Time, Technology / Patient Portal, Billing, Clinical Care, Patient Safety, Privacy or Security, Staff Conduct, Other',
                    },
                    secondaryCategories: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    classificationRationale: { type: Type.STRING },
                  },
                  required: ['primaryCategory', 'secondaryCategories', 'classificationRationale'],
                },
                step2Severity: {
                  type: Type.OBJECT,
                  properties: {
                    level: {
                      type: Type.STRING,
                      description: 'Must be exactly: LEVEL 1 – Low, LEVEL 2 – Moderate, LEVEL 3 – High, or LEVEL 4 – Critical',
                    },
                    reasoning: { type: Type.STRING },
                    clinicalImpact: { type: Type.STRING },
                  },
                  required: ['level', 'reasoning', 'clinicalImpact'],
                },
                step3Urgency: {
                  type: Type.OBJECT,
                  properties: {
                    responseSLA: { type: Type.STRING },
                    urgencyWindowHours: { type: Type.INTEGER },
                    deadlineText: { type: Type.STRING },
                  },
                  required: ['responseSLA', 'urgencyWindowHours', 'deadlineText'],
                },
                step4HumanIntervention: {
                  type: Type.OBJECT,
                  properties: {
                    required: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING },
                    suggestedReviewerRole: { type: Type.STRING },
                  },
                  required: ['required', 'rationale'],
                },
                step5RiskDetection: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      riskType: { type: Type.STRING },
                      flagged: { type: Type.BOOLEAN },
                      reason: { type: Type.STRING },
                    },
                    required: ['riskType', 'flagged', 'reason'],
                  },
                },
                step6Escalation: {
                  type: Type.OBJECT,
                  properties: {
                    primaryRoute: {
                      type: Type.STRING,
                      description: 'One of: Patient Experience Team, Nursing Leadership, Physician Leadership, Quality Improvement Team, Compliance Office, Information Technology, Revenue Cycle / Billing, Accessibility Coordinator, Risk Management, Executive Review',
                    },
                    secondaryRoute: { type: Type.STRING },
                    containmentSteps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    suggestedAcknowledgmentDraft: { type: Type.STRING },
                    investigationChecklist: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['primaryRoute', 'containmentSteps', 'suggestedAcknowledgmentDraft', 'investigationChecklist'],
                },
              },
              required: [
                'whatHappened',
                'step1Category',
                'step2Severity',
                'step3Urgency',
                'step4HumanIntervention',
                'step5RiskDetection',
                'step6Escalation',
              ],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI response timed out')), 4000)
        );

        const response = await Promise.race([geminiPromise, timeoutPromise]);

        const rawText = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawText);
        parsed.triageTimestamp = new Date().toISOString();
        parsed.engine = 'Gemini 3.8 Flash';
        return res.json(parsed);
      } catch (geminiError: any) {
        console.error('Gemini triage execution error detail:', geminiError?.message || geminiError);
        const fallback = heuristicTriage(complaintText, metadata);
        (fallback as any).engine = 'Clinical Rule Engine (Fallback)';
        return res.json(fallback);
      }
    }

    // Default to robust clinical heuristic
    const triageResult = heuristicTriage(complaintText, metadata);
    (triageResult as any).engine = 'Clinical Rule Engine';
    return res.json(triageResult);
  } catch (error) {
    console.error('Triage endpoint error:', error);
    res.status(500).json({ error: 'Failed to process triage.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && ai),
    timestamp: new Date().toISOString(),
  });
});

// Vite or Static file serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Healthcare Complaint Triage Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
