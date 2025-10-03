'use server';
/**
 * @fileOverview An AI agent that predicts the likelihood of success for job applications.
 *
 * - improveJobApplicationSuccessPredictions - A function that handles the prediction process.
 * - ImproveJobApplicationSuccessPredictionsInput - The input type for the improveJobApplicationSuccessPredictions function.
 * - ImproveJobApplicationSuccessPredictionsOutput - The return type for the improveJobApplicationSuccessPredictions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveJobApplicationSuccessPredictionsInputSchema = z.object({
  jobDescription: z.string().describe('The description of the job.'),
  resumeText: z.string().describe('The text content of the resume.'),
});
export type ImproveJobApplicationSuccessPredictionsInput = z.infer<typeof ImproveJobApplicationSuccessPredictionsInputSchema>;

const ImproveJobApplicationSuccessPredictionsOutputSchema = z.object({
  successLikelihood: z.string().describe('The predicted likelihood of success for the job application.'),
  reasoning: z.string().describe('The reasoning behind the success likelihood prediction.'),
});
export type ImproveJobApplicationSuccessPredictionsOutput = z.infer<typeof ImproveJobApplicationSuccessPredictionsOutputSchema>;

export async function improveJobApplicationSuccessPredictions(input: ImproveJobApplicationSuccessPredictionsInput): Promise<ImproveJobApplicationSuccessPredictionsOutput> {
  return improveJobApplicationSuccessPredictionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveJobApplicationSuccessPredictionsPrompt',
  input: {schema: ImproveJobApplicationSuccessPredictionsInputSchema},
  output: {schema: ImproveJobApplicationSuccessPredictionsOutputSchema},
  prompt: `You are an AI assistant that analyzes job descriptions and resumes to predict the likelihood of success for a job application.

  Based on the job description and resume provided, predict the likelihood of success (high, medium, low) and provide a brief explanation for your prediction.

  Job Description: {{{jobDescription}}}
  Resume Text: {{{resumeText}}}

  Format your response as follows:
  Likelihood of Success: [high/medium/low]
  Reasoning: [explanation] `,
});

const improveJobApplicationSuccessPredictionsFlow = ai.defineFlow(
  {
    name: 'improveJobApplicationSuccessPredictionsFlow',
    inputSchema: ImproveJobApplicationSuccessPredictionsInputSchema,
    outputSchema: ImproveJobApplicationSuccessPredictionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
