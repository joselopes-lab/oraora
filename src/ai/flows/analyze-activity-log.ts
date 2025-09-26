'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing user activity logs and identifying suspicious activities.
 *
 * - analyzeActivityLog -  A function that takes activity logs as input and returns a summary of suspicious activities.
 * - AnalyzeActivityLogInput - The input type for the analyzeActivityLog function.
 * - AnalyzeActivityLogOutput - The return type for the analyzeActivityLog function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeActivityLogInputSchema = z.object({
  activityLog: z.string().describe('The user activity log data to analyze.'),
});

export type AnalyzeActivityLogInput = z.infer<typeof AnalyzeActivityLogInputSchema>;

const AnalyzeActivityLogOutputSchema = z.object({
  summary: z.string().describe('A summary of any suspicious activities detected in the log.'),
  flaggedActivities: z.array(z.string()).describe('A list of specific activities flagged as suspicious.'),
});

export type AnalyzeActivityLogOutput = z.infer<typeof AnalyzeActivityLogOutputSchema>;

export async function analyzeActivityLog(input: AnalyzeActivityLogInput): Promise<AnalyzeActivityLogOutput> {
  return analyzeActivityLogFlow(input);
}

const analyzeActivityLogPrompt = ai.definePrompt({
  name: 'analyzeActivityLogPrompt',
  input: {schema: AnalyzeActivityLogInputSchema},
  output: {schema: AnalyzeActivityLogOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing user activity logs to identify suspicious behavior.

  Analyze the following activity log and provide a summary of any suspicious activities detected. Also, list the specific activities that were flagged as suspicious.

  Activity Log:
  {{activityLog}}`,
});

const analyzeActivityLogFlow = ai.defineFlow(
  {
    name: 'analyzeActivityLogFlow',
    inputSchema: AnalyzeActivityLogInputSchema,
    outputSchema: AnalyzeActivityLogOutputSchema,
  },
  async input => {
    const {output} = await analyzeActivityLogPrompt(input);
    return output!;
  }
);
