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

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Schema for Initial Analysis
const AtsAnalysisInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  resumeText: z.string().describe('The text content of the resume.'),
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
  }),
  resume_fit: z.object({
    found: z.array(z.string()).describe('Requirements that are clearly met in the resume'),
    partial: z.array(z.string()).describe('Requirements that are partially met'),
    missing: z.array(z.string()).describe('Requirements that are missing from the resume'),
  }),
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

7. **Current Problems**
   List tangible resume issues lowering the ATS score or recruiter impression (format, keyword gaps, clarity, etc.).

8. **Improvement Plan**
   Provide clear, prioritized actions:
   - Add missing keywords or skills.
   - Adjust bullet points to show measurable outcomes (use XYZ formula).
   - Reorder or rephrase sections for clarity.
   - Align summary and headline with JD language.

9. **Predicted Impact**
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
    "experience_required": "string"
  },
  "resume_fit": {
    "found": ["string", "..."],
    "partial": ["string", "..."],
    "missing": ["string", "..."]
  },
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
    const { output } = await analysisPrompt(input);
    return output!;
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

  **Resume Fit Analysis:**
  - **Found Requirements**: {{#each atsAnalysis.resume_fit.found}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **Partial Requirements**: {{#each atsAnalysis.resume_fit.partial}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}
  - **Missing Requirements**: {{#each atsAnalysis.resume_fit.missing}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}

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
        const { output } = await chatPrompt(input);
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
1. Aligns the candidate's resume with the specific job requirements
2. Highlights relevant experience and achievements
3. Demonstrates knowledge of the role and company
4. Uses the specified tone and length
5. Follows professional cover letter best practices

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
- Opening paragraph: Express interest and mention the specific position
- Body paragraphs (2-3): Highlight relevant experience and achievements
- Closing paragraph: Reiterate interest and call to action
- Professional sign-off

**Content Requirements:**
- Use specific examples from the resume that match job requirements
- Include quantifiable achievements where possible
- Show knowledge of the company/role (if company name provided)
- Address key skills and qualifications mentioned in the job description
- Demonstrate enthusiasm and cultural fit

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
Extract 3-5 most relevant points from the resume that align with the job requirements.

**Customization Tips:**
Provide 3-4 specific suggestions for further personalizing the cover letter.

Return a JSON object with the cover letter, key points, and customization tips.`,
});

const generateCoverLetterFlow = ai.defineFlow(
  {
    name: 'generateCoverLetterFlow',
    inputSchema: CoverLetterInputSchema,
    outputSchema: CoverLetterOutputSchema,
  },
  async (input) => {
    const { output } = await coverLetterPrompt(input);
    return output!;
  }
);

export async function generateCoverLetter(input: CoverLetterInput): Promise<CoverLetterOutput> {
  return generateCoverLetterFlow(input);
}
