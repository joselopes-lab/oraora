'use server';

import { analyzeActivityLog } from '@/ai/flows/analyze-activity-log';

export async function handleAnalyze(activityLog: string) {
  try {
    const result = await analyzeActivityLog({ activityLog });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error analyzing log:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
