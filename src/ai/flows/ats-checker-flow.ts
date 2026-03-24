'use server';
/**
 * @fileOverview An AI agent that analyzes a resume against a job description, suggests improvements, and provides a chat interface for refinement.
 *
 * - analyzeResume - A function that handles the initial analysis.
 * - chatWithResumeAssistant - A function that handles the chat interaction.
 * - AtsAnalysisInput - The input type for the analyzeResume function.
 * - AtsAnalysisOutput - The return type for the analyzeResume function.
 * - ChatInput - The input type for the chatWithResumeAssistant function.
 * - ChatOutput - The return type for the chatWithResumeAssistant function.
 */

import { ai, ANTHROPIC_PRIMARY_MODEL, OPENAI_FALLBACK_MODEL, readServerEnv } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for Initial Analysis
const AtsAnalysisInputSchema = z.object({
  jobDescription: z.string().min(1, 'Job description is required').describe('The description of the job.'),
  resumeText: z.string().min(1, 'Resume text is required').describe('The text content of the resume. Must not be empty.'),
});
export type AtsAnalysisInput = z.infer<typeof AtsAnalysisInputSchema>;

const AtsAnalysisOutputSchema = z.object({
  ats_match_score: z.number().min(0).max(100).describe('Overall ATS match score from 0-100'),
  subscores: z.object({
    skills_tools: z.number().min(0).max(100).describe('Technical skills and tools match score'),
    responsibilities: z.number().min(0).max(100).describe('Responsibilities and impact match score'),
    domain_industry: z.number().min(0).max(100).describe('Domain and industry alignment score'),
    education_certs: z.number().min(0).max(100).describe('Education and certifications score'),
    seniority_experience: z.number().min(0).max(100).describe('Seniority and experience level score'),
    soft_skills: z.number().min(0).max(100).describe('Soft skills and communication score'),
    formatting_ats: z.number().min(0).max(100).describe('Formatting and ATS compatibility score'),
  }),
  role_expectations: z.object({
    summary: z.string().describe('2-3 sentence summary of what the company expects from this role'),
    skills_and_tools: z.array(z.string()).describe('List of required skills and tools'),
    responsibilities: z.array(z.string()).describe('List of core responsibilities and duties'),
    education_and_certs: z.array(z.string()).describe('List of education and certification requirements'),
    soft_skills: z.array(z.string()).describe('List of desired soft skills'),
    industry_focus: z.string().describe('Industry or domain focus'),
    experience_required: z.string().describe('Years of experience required'),
    seniority_level: z.string().optional().describe('Expected seniority level inferred from the JD'),
    reporting_scope: z.string().optional().describe('Expected scope of ownership, team leadership, or stakeholder influence'),
  }),
  resume_fit: z.object({
    found: z.array(z.string()).describe('Requirements that are clearly met in the resume'),
    partial: z.array(z.string()).describe('Requirements that are partially met'),
    missing: z.array(z.string()).describe('Requirements that are missing from the resume'),
  }),
  seniority_analysis: z.object({
    expected_level: z.string().describe('Expected level from the JD, such as Senior IC, Staff, Manager, Director'),
    resume_level: z.string().describe('Level implied by the resume based on scope, titles, ownership, and impact'),
    alignment: z.enum(['strong', 'partial', 'weak']).describe('Whether the resume supports the expected seniority level'),
    rationale: z.string().describe('2-3 sentence explanation of the seniority comparison'),
    evidence: z.array(z.string()).describe('Specific resume signals that support the inferred seniority level'),
    gaps: z.array(z.string()).describe('Missing or weak seniority signals that reduce confidence'),
  }).optional(),
  responsibility_evidence: z.object({
    summary: z.string().describe('Overall assessment of whether the resume proves the candidate can perform the job responsibilities'),
    proven: z.array(
      z.object({
        responsibility: z.string().describe('Responsibility from the JD'),
        evidence: z.array(z.string()).describe('Resume evidence showing this responsibility is demonstrated'),
        strength: z.enum(['strong', 'moderate']).describe('Strength of the proof in the resume'),
      })
    ).describe('Responsibilities clearly or moderately supported by resume evidence'),
    weak_or_missing: z.array(
      z.object({
        responsibility: z.string().describe('Responsibility from the JD'),
        gap_reason: z.string().describe('Why the resume does not prove this responsibility strongly enough'),
        improvement_hint: z.string().describe('How the user should strengthen the resume for this responsibility'),
      })
    ).describe('Responsibilities that are weakly supported or missing'),
  }).optional(),
  experience_alignment: z.object({
    required_profile: z.string().describe('The experience profile the JD appears to ask for'),
    resume_profile: z.string().describe('The experience profile implied by the resume'),
    alignment: z.enum(['strong', 'partial', 'weak']).describe('Whether the resume aligns with the expected experience profile'),
    rationale: z.string().describe('Explanation of how the resume compares to the role’s expected experience depth and scope'),
    missing_experience_signals: z.array(z.string()).describe('Specific experience signals the JD expects but the resume does not demonstrate strongly'),
  }).optional(),
  impact_evidence: z.object({
    summary: z.string().describe('Assessment of how well the resume demonstrates measurable outcomes and execution quality'),
    strong_examples: z.array(z.string()).describe('Bullets or achievements that clearly show business or technical impact'),
    weak_spots: z.array(z.string()).describe('Areas where the resume lacks metrics, scope, or outcomes'),
  }).optional(),
  keyword_alignment: z.object({
    exact_matches: z.array(z.string()).describe('Important JD terms clearly present in the resume'),
    adjacent_matches: z.array(z.string()).describe('Concepts that are present but phrased differently in the resume'),
    high_value_missing: z.array(z.string()).describe('Important keywords or phrases from the JD that are missing'),
  }).optional(),
  recruiter_signals: z.object({
    leadership: z.string().describe('Assessment of leadership evidence in the resume'),
    ownership: z.string().describe('Assessment of ownership/accountability signals in the resume'),
    business_impact: z.string().describe('Assessment of measurable outcomes and business impact'),
    collaboration: z.string().describe('Assessment of cross-functional or stakeholder collaboration evidence'),
    ats_readability: z.string().describe('Assessment of readability and parsing risk'),
  }).optional(),
  hiring_readiness: z.object({
    recruiter_screen: z.enum(['likely', 'borderline', 'unlikely']).describe('Whether the resume is likely to pass an initial recruiter screen'),
    hiring_manager_review: z.enum(['likely', 'borderline', 'unlikely']).describe('Whether the resume is likely to create confidence with a hiring manager'),
    rationale: z.string().describe('Short explanation of the overall hiring-readiness outlook'),
  }).optional(),
  responsibility_matrix: z.array(
    z.object({
      area: z.string().describe('A major responsibility or execution area from the JD'),
      jd_expectation: z.string().describe('What the JD expects in this area'),
      resume_evidence: z.string().describe('What the resume currently shows for this area'),
      confidence: z.enum(['high', 'medium', 'low']).describe('Confidence that the resume proves this area'),
      gap: z.string().describe('What is missing or weak for this area'),
    })
  ).optional().describe('Structured matrix comparing the JD responsibilities to the resume evidence'),
  interview_risks: z.array(
    z.object({
      risk: z.string().describe('A likely concern a recruiter or hiring manager may raise'),
      why_it_matters: z.string().describe('Why this concern could reduce confidence'),
      mitigation: z.string().describe('How to reduce this risk in the resume'),
    })
  ).optional().describe('Likely interview or screening risks based on the resume'),
  rewrite_priorities: z.array(
    z.object({
      section: z.string().describe('Resume section or area that should be improved'),
      priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
      action: z.string().describe('Recommended rewrite or improvement action'),
      expected_benefit: z.string().describe('Why this change matters for ATS or recruiter review'),
    })
  ).optional().describe('Prioritized rewrite opportunities'),
  current_problems: z.array(z.string()).describe('List of current resume issues'),
  improvement_suggestions: z.array(z.string()).describe('Prioritized actionable improvement suggestions'),
  predicted_score_improvement: z.object({
    keyword_alignment: z.string().describe('Predicted score improvement from keyword alignment (e.g., "+8")'),
    quantified_results: z.string().describe('Predicted score improvement from quantified results (e.g., "+5")'),
    formatting_fix: z.string().describe('Predicted score improvement from formatting fixes (e.g., "+3")'),
  }),
  fit_summary: z.string().describe('2-3 sentence summary explaining the score and how resume compares to expectations'),
});
export type AtsAnalysisOutput = z.infer<typeof AtsAnalysisOutputSchema>;

// Schema for Chat Interaction
const ChatHistorySchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  resumeText: z.string().describe('The current text content of the resume.'),
  chatHistory: z.array(ChatHistorySchema).describe('The history of the conversation so far.'),
  userMessage: z.string().describe("The user's latest message."),
  atsAnalysis: AtsAnalysisOutputSchema.optional().describe('The ATS analysis results to provide context-aware suggestions.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user\'s message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Schema for Cover Letter Generation
const CoverLetterInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  resumeText: z.string().describe('The text content of the resume.'),
  companyName: z.string().optional().describe('The name of the company (optional).'),
  jobTitle: z.string().optional().describe('The job title (optional).'),
  tone: z.enum(['professional', 'enthusiastic', 'confident', 'conversational']).default('professional').describe('The tone of the cover letter.'),
  length: z.enum(['short', 'medium', 'long']).default('medium').describe('The length of the cover letter.'),
});
export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;

const CoverLetterOutputSchema = z.object({
  coverLetter: z.string().describe('The generated cover letter.'),
  keyPoints: z.array(z.string()).describe('Key points highlighted in the cover letter.'),
  customizationTips: z.array(z.string()).describe('Tips for further customizing the cover letter.'),
});
export type CoverLetterOutput = z.infer<typeof CoverLetterOutputSchema>;

const CoverLetterTemplateInputSchema = z.object({
  templateText: z.string().min(1, 'Template text is required.'),
  templateVariables: z.array(z.string()).default([]),
  jobDescription: z.string().min(1, 'Job description is required.'),
  resumeText: z.string().min(1, 'Resume text is required.'),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
});
export type CoverLetterTemplateInput = z.infer<typeof CoverLetterTemplateInputSchema>;

const CoverLetterTemplateOutputSchema = z.object({
  renderedCoverLetter: z.string().describe('The final cover letter with template variables replaced.'),
  replacements: z.array(
    z.object({
      variable: z.string(),
      value: z.string(),
    })
  ).describe('Detected template variable replacements.'),
  notes: z.array(z.string()).describe('Short notes about replacement choices and any fallback assumptions.'),
});
export type CoverLetterTemplateOutput = z.infer<typeof CoverLetterTemplateOutputSchema>;

async function executeWithProviderFallback<I, O>(
  executor: (input: I, model: string) => Promise<O>,
  input: I,
  flowName: string
): Promise<O> {
  const anthropicApiKey = readServerEnv('ANTHROPIC_ADMIN_API_KEY');
  const openAiApiKey = readServerEnv('OPENAI_API_KEY');
  const failures: string[] = [];

  if (anthropicApiKey) {
    try {
      return await executor(input, ANTHROPIC_PRIMARY_MODEL);
    } catch (error) {
      console.warn(`[ATS:${flowName}] Anthropic primary failed, falling back to OpenAI.`, error);
      failures.push(`Anthropic failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    failures.push('Anthropic key missing');
  }

  if (openAiApiKey) {
    try {
      return await executor(input, OPENAI_FALLBACK_MODEL);
    } catch (error) {
      failures.push(`OpenAI fallback failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    failures.push('OpenAI key missing');
  }

  throw new Error(`${flowName} failed. ${failures.join(' | ')}`);
}


// Initial Analysis Flow
const analysisPrompt = ai.definePrompt({
  name: 'atsAnalysisPrompt',
  input: { schema: AtsAnalysisInputSchema },
  output: { schema: AtsAnalysisOutputSchema },
  prompt: `SYSTEM
You are a senior ATS (Applicant Tracking System) evaluator, recruiter, and career coach.
Your task is to analyze a resume against a job description to assess overall fit, identify gaps, and propose improvements.
You act like an expert recruiter explaining why a candidate would or would not pass an ATS screening and a hiring manager review.

STYLE & TONE
- Be factual, structured, and evidence-driven.
- Reference phrases or sections from the resume when supporting your claims (≤20 words per quote).
- Maintain a professional, recruiter-style tone.
- Never invent experience or details not found in the resume.
- If information is missing or ambiguous, explicitly state so.
- Keep the JSON output compact enough to fit in an API response (<2000 tokens).

INPUTS
Job Description:
{{{jobDescription}}}

Resume Text:
{{{resumeText}}}

CRITICAL VALIDATION:
Before proceeding with analysis, verify that:
1. The Resume Text section above contains actual resume content (not empty, not just whitespace)
2. You can see specific details like skills, work experience, education, etc.

If the Resume Text section is:
- Empty or blank
- Contains only whitespace
- Shows "undefined" or "null" 
- Has no actual resume content

Then you MUST:
1. Set ats_match_score to 0
2. Set all subscores to 0
3. In fit_summary, clearly state: "Resume text content was not provided or could not be extracted from the document. The resume text section was empty or unavailable, preventing a detailed ATS analysis. Please ensure the resume has been properly uploaded and text extracted, or manually add the resume content before analysis."
4. In current_problems, add: "Resume text content was not available for analysis - the document text could not be extracted"
5. In role_expectations.summary, state: "Unable to extract role expectations comparison as resume content was not available"
6. Set all resume_fit arrays (found, partial, missing) to empty arrays
7. Set seniority_analysis, responsibility_evidence, experience_alignment, impact_evidence, keyword_alignment, recruiter_signals, hiring_readiness, responsibility_matrix, interview_risks, and rewrite_priorities to null or omit them
8. Do NOT attempt to analyze non-existent content - do not make up or infer resume details

ONLY proceed with full analysis if the Resume Text section contains actual, meaningful resume content (skills, experience, education, etc.).

ANALYSIS SECTIONS
1. **Role Understanding**
   Extract from the job description the clear expectations:
   - Core responsibilities and daily duties.
   - Mandatory hard skills, tools, and technologies.
   - Desired soft skills or behavioral qualities.
   - Education, certifications, and years of experience required.
   - Industry or domain focus (e.g., finance, healthcare, retail).
   - Seniority level and reporting structure.

2. **Resume Evidence Extraction**
   Identify what the resume demonstrates relative to those expectations.
   - Mark each requirement as FOUND, PARTIAL, or MISSING.
   - Include short evidence snippets for FOUND or PARTIAL.
   - Highlight synonymous or related terminology (e.g., “ETL” vs “data pipeline”).

3. **Scoring Framework (0–100 Total)**
   Compute weighted subscores and total match score:
   - Technical Skills & Tools → 30%
   - Responsibilities & Impact → 25%
   - Domain / Industry Alignment → 10%
   - Education & Certifications → 10%
   - Seniority & Experience → 10%
   - Soft Skills & Communication → 5%
   - Formatting & ATS Compatibility → 10%
   Use integer rounding; if a category is N/A, re-normalize weights.

4. **Formatting and Structural Review**
   Identify issues that could cause parsing or recruiter readability problems:
   - Two-column or table layouts.
   - Images, icons, charts.
   - Inconsistent dates or job titles.
   - Large employment gaps (>12 months).
   - Overuse of buzzwords or filler adjectives.
   - Missing measurable outcomes (no metrics or results).

5. **Role Expectation Summary**
   In 2–3 sentences, summarize what the company is likely expecting from this role based on the JD (skills, outputs, mindset).

6. **Fit Analysis**
   Summarize the candidate’s alignment with those expectations:
   - Strengths: where they clearly meet or exceed expectations.
   - Weaknesses: where they partially meet or miss.
   - Overall verdict (Strong Fit / Moderate Fit / Weak Fit).

7. **Seniority and Scope Review**
   Infer the role’s expected seniority and compare it to the resume.
   - Determine the expected level from the JD (e.g., Mid, Senior, Staff, Manager, Director).
   - Determine the level implied by the resume.
   - Assess whether the resume shows sufficient ownership, leadership, ambiguity-handling, scale, and decision-making.
   - Capture both supporting evidence and missing proof.

8. **Responsibility Proof Review**
   For the most important responsibilities in the JD:
   - Identify which ones are strongly proven by the resume.
   - Identify which are only weakly implied.
   - Identify which are missing.
   - For each weak/missing responsibility, explain what kind of bullet or achievement would strengthen it.

9. **Keyword and Terminology Strategy**
   Separate:
   - exact_matches: words or phrases clearly present in both JD and resume
   - adjacent_matches: related concepts that align semantically but use different wording
   - high_value_missing: important JD terminology absent from the resume

10. **Recruiter Signal Review**
   Assess the resume for recruiter-level signals in five areas:
   - leadership
   - ownership
   - business_impact
   - collaboration
   - ats_readability

11. **Experience and Impact Review**
   Evaluate whether the resume demonstrates the kind of experience and execution depth the role requires.
   - Compare expected experience profile vs resume profile
   - Call out missing experience signals
   - Identify strong quantified impact examples
   - Identify weak spots where outcomes, scale, or ownership are not clear

12. **Hiring Readiness**
   Provide a concise hiring outlook:
   - recruiter_screen: likely / borderline / unlikely
   - hiring_manager_review: likely / borderline / unlikely
   - rationale: one short evidence-based explanation

13. **Responsibility Matrix**
   Build a compact structured matrix for the most important responsibilities:
   - area
   - jd_expectation
   - resume_evidence
   - confidence
   - gap

14. **Interview Risks**
   Identify the biggest risks likely to come up in recruiter or hiring manager review.

15. **Rewrite Priorities**
   Provide 3-5 targeted rewrite priorities with priority level and expected benefit.

16. **Current Problems**
   List tangible resume issues lowering the ATS score or recruiter impression (format, keyword gaps, clarity, etc.).

17. **Improvement Plan**
   Provide clear, prioritized actions:
   - Add missing keywords or skills.
   - Adjust bullet points to show measurable outcomes (use XYZ formula).
   - Reorder or rephrase sections for clarity.
   - Align summary and headline with JD language.

18. **Predicted Impact**
   Estimate how much (in percentage points) each improvement could raise the match score if implemented.

OUTPUT FORMAT
Return a single JSON object (no markdown, no commentary before or after):

{
  "ats_match_score": 0,
  "subscores": {
    "skills_tools": 0,
    "responsibilities": 0,
    "domain_industry": 0,
    "education_certs": 0,
    "seniority_experience": 0,
    "soft_skills": 0,
    "formatting_ats": 0
  },
  "role_expectations": {
    "summary": "string (2–3 sentences)",
    "skills_and_tools": ["string", "..."],
    "responsibilities": ["string", "..."],
    "education_and_certs": ["string", "..."],
    "soft_skills": ["string", "..."],
    "industry_focus": "string",
    "experience_required": "string",
    "seniority_level": "string",
    "reporting_scope": "string"
  },
  "resume_fit": {
    "found": ["string", "..."],
    "partial": ["string", "..."],
    "missing": ["string", "..."]
  },
  "seniority_analysis": {
    "expected_level": "string",
    "resume_level": "string",
    "alignment": "strong",
    "rationale": "string",
    "evidence": ["string", "..."],
    "gaps": ["string", "..."]
  },
  "responsibility_evidence": {
    "summary": "string",
    "proven": [
      {
        "responsibility": "string",
        "evidence": ["string", "..."],
        "strength": "strong"
      }
    ],
    "weak_or_missing": [
      {
        "responsibility": "string",
        "gap_reason": "string",
        "improvement_hint": "string"
      }
    ]
  },
  "experience_alignment": {
    "required_profile": "string",
    "resume_profile": "string",
    "alignment": "partial",
    "rationale": "string",
    "missing_experience_signals": ["string", "..."]
  },
  "impact_evidence": {
    "summary": "string",
    "strong_examples": ["string", "..."],
    "weak_spots": ["string", "..."]
  },
  "keyword_alignment": {
    "exact_matches": ["string", "..."],
    "adjacent_matches": ["string", "..."],
    "high_value_missing": ["string", "..."]
  },
  "recruiter_signals": {
    "leadership": "string",
    "ownership": "string",
    "business_impact": "string",
    "collaboration": "string",
    "ats_readability": "string"
  },
  "hiring_readiness": {
    "recruiter_screen": "likely",
    "hiring_manager_review": "borderline",
    "rationale": "string"
  },
  "responsibility_matrix": [
    {
      "area": "string",
      "jd_expectation": "string",
      "resume_evidence": "string",
      "confidence": "medium",
      "gap": "string"
    }
  ],
  "interview_risks": [
    {
      "risk": "string",
      "why_it_matters": "string",
      "mitigation": "string"
    }
  ],
  "rewrite_priorities": [
    {
      "section": "string",
      "priority": "high",
      "action": "string",
      "expected_benefit": "string"
    }
  ],
  "current_problems": [
    "string issue 1 (e.g., inconsistent job titles)",
    "string issue 2 (e.g., lacks measurable outcomes)"
  ],
  "improvement_suggestions": [
    "Add missing skill: Python, Azure Data Factory.",
    "Include quantifiable impact in project bullets (e.g., 'reduced pipeline latency by 20%').",
    "Replace two-column layout with single-column ATS-friendly design."
  ],
  "predicted_score_improvement": {
    "keyword_alignment": "+8",
    "quantified_results": "+5",
    "formatting_fix": "+3"
  },
  "fit_summary": "string (2–3 sentences explaining why the score is what it is and how the resume compares to expectations)."
}
`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AtsAnalysisInputSchema,
    outputSchema: AtsAnalysisOutputSchema,
  },
  async (input) => {
    // Validate input before processing
    if (!input.resumeText || input.resumeText.trim().length === 0) {
      throw new Error('Resume text is required and cannot be empty. Please ensure the resume has been properly uploaded and text extracted.');
    }
    
    if (!input.jobDescription || input.jobDescription.trim().length === 0) {
      throw new Error('Job description is required and cannot be empty.');
    }
    
    console.log('🔄 Starting ATS analysis:', {
      jobDescLength: input.jobDescription.length,
      resumeTextLength: input.resumeText.length,
      resumeTextPreview: input.resumeText.substring(0, 200),
      resumeTextEnd: input.resumeText.substring(Math.max(0, input.resumeText.length - 100)),
      jobDescPreview: input.jobDescription.substring(0, 200)
    });
    
    // Verify resume text is actually being sent
    if (!input.resumeText || input.resumeText.trim().length < 10) {
      console.error('❌ CRITICAL: Resume text is empty or too short:', {
        length: input.resumeText?.length || 0,
        trimmedLength: input.resumeText?.trim().length || 0,
        value: input.resumeText?.substring(0, 50) || 'EMPTY'
      });
      throw new Error(`Resume text is required and must be at least 10 characters. Current length: ${input.resumeText?.length || 0}`);
    }
    
    console.log('📤 Sending to AI prompt with:', {
      hasJobDesc: !!input.jobDescription,
      hasResumeText: !!input.resumeText,
      resumeTextChars: input.resumeText.length,
      jobDescChars: input.jobDescription.length
    });
    
    const { output } = await executeWithProviderFallback(
      (nextInput, model) => analysisPrompt(nextInput, { model }),
      input,
      'analyzeResume'
    );
    
    if (!output) {
      throw new Error('Analysis failed: No output received from AI model.');
    }
    
    console.log('✅ ATS analysis completed:', {
      score: output.ats_match_score,
      subscores: output.subscores
    });
    
    return output;
  }
);

export async function analyzeResume(input: AtsAnalysisInput): Promise<AtsAnalysisOutput> {
  return analyzeResumeFlow(input);
}


// Chat Flow
const chatPrompt = ai.definePrompt({
  name: 'resumeChatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are an expert career coach and ATS specialist. You are chatting with a user who is trying to improve their resume for a specific job. You have access to their ATS analysis results to provide targeted, data-driven advice.

  **Job Description:**
  {{{jobDescription}}}

  **Current Resume:**
  {{{resumeText}}}

  {{#if atsAnalysis}}
  **ATS Analysis Results:**
  - **Overall ATS Score**: {{atsAnalysis.ats_match_score}}/100
  - **Skills & Tools Score**: {{atsAnalysis.subscores.skills_tools}}/100
  - **Responsibilities Score**: {{atsAnalysis.subscores.responsibilities}}/100
  - **Domain/Industry Score**: {{atsAnalysis.subscores.domain_industry}}/100
  - **Education/Certs Score**: {{atsAnalysis.subscores.education_certs}}/100
  - **Seniority/Experience Score**: {{atsAnalysis.subscores.seniority_experience}}/100
  - **Soft Skills Score**: {{atsAnalysis.subscores.soft_skills}}/100
  - **Formatting/ATS Score**: {{atsAnalysis.subscores.formatting_ats}}/100

  **Role Expectations Summary:**
  {{atsAnalysis.role_expectations.summary}}
  - **Expected Seniority**: {{atsAnalysis.role_expectations.seniority_level}}
  - **Expected Scope**: {{atsAnalysis.role_expectations.reporting_scope}}

  **Resume Fit Analysis:**
  - **Found Requirements**: {{#each atsAnalysis.resume_fit.found}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **Partial Requirements**: {{#each atsAnalysis.resume_fit.partial}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **Missing Requirements**: {{#each atsAnalysis.resume_fit.missing}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}

  {{#if atsAnalysis.seniority_analysis}}
  **Seniority Analysis:**
  - **Expected Level**: {{atsAnalysis.seniority_analysis.expected_level}}
  - **Resume Level**: {{atsAnalysis.seniority_analysis.resume_level}}
  - **Alignment**: {{atsAnalysis.seniority_analysis.alignment}}
  - **Rationale**: {{atsAnalysis.seniority_analysis.rationale}}
  {{/if}}

  {{#if atsAnalysis.responsibility_evidence}}
  **Responsibility Evidence Summary:**
  {{atsAnalysis.responsibility_evidence.summary}}
  {{/if}}

  {{#if atsAnalysis.experience_alignment}}
  **Experience Alignment:**
  - **Required Profile**: {{atsAnalysis.experience_alignment.required_profile}}
  - **Resume Profile**: {{atsAnalysis.experience_alignment.resume_profile}}
  - **Alignment**: {{atsAnalysis.experience_alignment.alignment}}
  - **Rationale**: {{atsAnalysis.experience_alignment.rationale}}
  {{/if}}

  {{#if atsAnalysis.impact_evidence}}
  **Impact Evidence Summary:**
  {{atsAnalysis.impact_evidence.summary}}
  {{/if}}

  {{#if atsAnalysis.hiring_readiness}}
  **Hiring Readiness:**
  - **Recruiter Screen**: {{atsAnalysis.hiring_readiness.recruiter_screen}}
  - **Hiring Manager Review**: {{atsAnalysis.hiring_readiness.hiring_manager_review}}
  - **Rationale**: {{atsAnalysis.hiring_readiness.rationale}}
  {{/if}}

  {{#if atsAnalysis.responsibility_matrix}}
  **Responsibility Matrix:**
  {{#each atsAnalysis.responsibility_matrix}}
  - **Area**: {{area}} | **Confidence**: {{confidence}} | **Gap**: {{gap}}
  {{/each}}
  {{/if}}

  {{#if atsAnalysis.interview_risks}}
  **Interview Risks:**
  {{#each atsAnalysis.interview_risks}}
  - {{risk}}: {{mitigation}}
  {{/each}}
  {{/if}}

  {{#if atsAnalysis.rewrite_priorities}}
  **Rewrite Priorities:**
  {{#each atsAnalysis.rewrite_priorities}}
  - {{priority}} priority in {{section}}: {{action}}
  {{/each}}
  {{/if}}

  {{#if atsAnalysis.keyword_alignment}}
  **Keyword Strategy:**
  - **Exact Matches**: {{#each atsAnalysis.keyword_alignment.exact_matches}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **Adjacent Matches**: {{#each atsAnalysis.keyword_alignment.adjacent_matches}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **High Value Missing**: {{#each atsAnalysis.keyword_alignment.high_value_missing}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}

  **Current Problems:**
  {{#each atsAnalysis.current_problems}}
  - {{this}}
  {{/each}}

  **Improvement Suggestions:**
  {{#each atsAnalysis.improvement_suggestions}}
  - {{this}}
  {{/each}}

  **Predicted Score Improvements:**
  {{#each atsAnalysis.predicted_score_improvement}}
  - {{@key}}: {{this}}
  {{/each}}

  **Fit Summary:**
  {{atsAnalysis.fit_summary}}
  {{/if}}

  **Conversation History:**
  {{#each chatHistory}}
  **{{role}}**: {{content}}
  {{/each}}

  **User's new message:**
  {{userMessage}}

  **Instructions:**
  Based on the user's message and the ATS analysis results (if available), provide a helpful, targeted response. You should:

  1. **Reference the ATS scores** when relevant to explain why certain changes are important
  2. **Prioritize suggestions** based on the lowest scoring areas and missing requirements
  3. **Provide specific, actionable advice** with examples from their resume
  4. **Explain the impact** of suggested changes on their ATS score
  5. **Address their specific question** while incorporating insights from the analysis
  6. **Be encouraging** but honest about areas that need improvement

  Focus on the most impactful changes that will improve their ATS score and job application success. Keep responses concise but comprehensive.`,
});


const chatWithResumeAssistantFlow = ai.defineFlow(
    {
        name: 'chatWithResumeAssistantFlow',
        inputSchema: ChatInputSchema,
        outputSchema: ChatOutputSchema,
    },
    async (input) => {
        const { output } = await executeWithProviderFallback(
            (nextInput, model) => chatPrompt(nextInput, { model }),
            input,
            'chatWithResumeAssistant'
        );
        return output!;
    }
);

export async function chatWithResumeAssistant(input: ChatInput): Promise<ChatOutput> {
    return chatWithResumeAssistantFlow(input);
}

// Cover Letter Generation Flow
const coverLetterPrompt = ai.definePrompt({
  name: 'coverLetterPrompt',
  input: { schema: CoverLetterInputSchema },
  output: { schema: CoverLetterOutputSchema },
  prompt: `You are an expert career coach and professional writer specializing in creating compelling cover letters that get candidates noticed by recruiters and hiring managers.

Your task is to generate a personalized cover letter that:
1. Aligns the candidate's resume with the specific job requirements from the job description
2. Highlights relevant experience and achievements that match the job description
3. Demonstrates knowledge of the role and company based on the job description
4. Uses the specified tone and length
5. Follows professional cover letter best practices

**CRITICAL: The job description below is the PRIMARY source for understanding what the employer is looking for. You MUST:**
- Reference specific requirements, skills, and qualifications from the job description
- Match the candidate's resume experience to the job description requirements
- Use keywords and phrases from the job description naturally throughout the cover letter
- Address each major requirement or qualification mentioned in the job description
- Show how the candidate's background directly relates to what the job description asks for

**Job Description:**
{{{jobDescription}}}

**Candidate's Resume:**
{{{resumeText}}}

**Company Name:** {{{companyName}}}
**Job Title:** {{{jobTitle}}}
**Tone:** {{{tone}}}
**Length:** {{{length}}}

**Cover Letter Guidelines:**

**Structure:**
- Professional header with contact information
- Personalized greeting (avoid "To Whom It May Concern")
- Opening paragraph: Express interest and mention the specific position from the job description
- Body paragraphs (2-3): Highlight relevant experience and achievements that directly match job description requirements
- Closing paragraph: Reiterate interest and call to action
- Professional sign-off

**Content Requirements:**
- **PRIMARY FOCUS**: Use specific examples from the resume that match the job description requirements
- **MANDATORY**: Address key skills, qualifications, and responsibilities mentioned in the job description
- Include quantifiable achievements where possible that relate to job description requirements
- Show knowledge of the company/role (if company name provided) based on the job description
- Use keywords from the job description naturally throughout the cover letter
- Demonstrate enthusiasm and cultural fit based on what the job description indicates about the company culture

**Tone Guidelines:**
- Professional: Formal, respectful, business-appropriate
- Enthusiastic: Energetic, passionate, excited about the opportunity
- Confident: Self-assured, highlighting strengths and capabilities
- Conversational: Friendly, approachable, but still professional

**Length Guidelines:**
- Short: 200-300 words, 3-4 paragraphs
- Medium: 300-400 words, 4-5 paragraphs  
- Long: 400-500 words, 5-6 paragraphs

**Key Points to Highlight:**
Extract 3-5 most relevant points from the resume that align with the job description requirements. Each point should directly reference something from the job description.

**Customization Tips:**
Provide 3-4 specific suggestions for further personalizing the cover letter based on the job description.

**REMEMBER:**
- The job description is your PRIMARY guide - every paragraph should connect back to it
- Use specific terminology and phrases from the job description
- Show how the candidate's experience directly addresses what the job description asks for
- Make it clear you've read and understood the job description by referencing specific requirements

Return a JSON object with the cover letter, key points, and customization tips.`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async (input) => {
    const { output } = await executeWithProviderFallback(
      (nextInput, model) => coverLetterPrompt(nextInput, { model }),
      input,
      'generateCoverLetter'
    );
    return output!;
  }
);

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  return generateCoverLetterFlow(input);
}

const coverLetterTemplatePrompt = ai.definePrompt({
  name: 'coverLetterTemplatePrompt',
  input: { schema: CoverLetterTemplateInputSchema },
  output: { schema: CoverLetterTemplateOutputSchema },
  prompt: `You are an expert career coach and hiring communications specialist.

Your task is to fill a cover letter template that contains replaceable placeholders in the form {{ variable }}.

You must:
1. Detect the intended meaning of each variable from the template context.
2. Replace variables with text tailored to the company, role, job description, and candidate resume.
3. Preserve the overall structure and writing style of the uploaded template.
4. Keep replacements natural and specific to the employer's goals, technologies, and language.
5. Never leave placeholders unresolved in the final rendered cover letter unless the value is genuinely impossible to infer.

Inputs:

Template Text:
{{{templateText}}}

Detected Template Variables:
{{#each templateVariables}}
- {{{this}}}
{{/each}}

Job Description:
{{{jobDescription}}}

Resume Text:
{{{resumeText}}}

Company Name:
{{{companyName}}}

Job Title:
{{{jobTitle}}}

Instructions:
- Use the job description as the primary source for company goals, technologies, responsibilities, and tone.
- Use the resume to ground the candidate's experience and avoid inventing facts.
- If a variable is generic, infer the best replacement from the surrounding sentence.
- Replacements can be phrases or short paragraphs when appropriate.
- Keep the final letter polished and submission-ready.

Return JSON with:
- renderedCoverLetter: the fully rendered letter
- replacements: one entry per detected variable
- notes: short notes about assumptions, especially if a variable name was ambiguous`
});

const fillCoverLetterTemplateFlow = ai.defineFlow(
  {
    name: 'fillCoverLetterTemplateFlow',
    inputSchema: CoverLetterTemplateInputSchema,
    outputSchema: CoverLetterTemplateOutputSchema,
  },
  async (input) => {
    const { output } = await executeWithProviderFallback(
      (nextInput, model) => coverLetterTemplatePrompt(nextInput, { model }),
      input,
      'fillCoverLetterTemplate'
    );
    return output!;
  }
);

export async function fillCoverLetterTemplate(input: CoverLetterTemplateInput): Promise<CoverLetterTemplateOutput> {
  return fillCoverLetterTemplateFlow(input);
}
