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
  matchScore: z.number().min(0).max(100).describe('A score from 0-100 indicating how well the resume matches the job description.'),
  summary: z.string().describe('A brief summary of the analysis.'),
  suggestedChanges: z.array(z.string()).describe('A list of specific, actionable suggestions to improve the resume for this job.'),
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
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user\'s message.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


// Initial Analysis Flow
const analysisPrompt = ai.definePrompt({
  name: 'atsAnalysisPrompt',
  input: { schema: AtsAnalysisInputSchema },
  output: { schema: AtsAnalysisOutputSchema },
  prompt: `You are an expert ATS (Applicant Tracking System) reviewer and career coach.
  Your task is to analyze the provided resume against the job description and provide a detailed report.

  Job Description:
  {{{jobDescription}}}

  Resume Text:
  {{{resumeText}}}

  1.  **Match Score**: Provide a score from 0 to 100 representing the match quality.
  2.  **Summary**: Briefly explain the reasoning for the score, highlighting key strengths and weaknesses.
  3.  **Suggested Changes**: Provide a list of concrete, actionable suggestions for improving the resume. Focus on keywords, skills, and experience alignment.`,
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
  prompt: `You are a helpful career assistant. You are chatting with a user who is trying to improve their resume for a specific job.

  **Job Description:**
  {{{jobDescription}}}

  **Current Resume:**
  {{{resumeText}}}

  **Conversation History:**
  {{#each chatHistory}}
  **{{role}}**: {{content}}
  {{/each}}

  **User's new message:**
  {{userMessage}}

  Based on the user's message, provide a helpful response. You can suggest specific text changes, answer questions, or provide general advice related to the resume and job description. Keep your responses concise and focused on the user's request.`,
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
