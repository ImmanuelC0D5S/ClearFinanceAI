'use server';

/**
 * @fileOverview Calculates a Management Trust Score for a given company based on earnings call transcripts and financial reports.
 *
 * - `calculateManagementTrustScore` - A function that calculates the management trust score.
 * - `ManagementTrustScoreInput` - The input type for the `calculateManagementTrustScore` function.
 * - `ManagementTrustScoreOutput` - The return type for the `calculateManagementTrustScore` function.
 */

import { generateForTask } from '@/ai/vertex';
import { z } from 'zod';

const ManagementTrustScoreInputSchema = z.object({
  companyName: z.string(),
  financialData: z.array(z.string()),
});
export type ManagementTrustScoreInput = z.infer<typeof ManagementTrustScoreInputSchema>;

const ManagementTrustScoreOutputSchema = z.object({
  managementTrustScore: z.number().min(0).max(100),
  reasoning: z.string(),
  citations: z.array(z.object({
    text: z.string(),
    source: z.string(),
  })),
});
export type ManagementTrustScoreOutput = z.infer<typeof ManagementTrustScoreOutputSchema>;

export async function calculateManagementTrustScore(input: ManagementTrustScoreInput): Promise<ManagementTrustScoreOutput> {
  const text = await generateForTask('managementTrustScore', input);
  
  // Parse and validate using zod
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    // Try to extract JSON from markdown/code fences
    try {
      const { extractJsonFromText, repairTruncatedJson } = await import('@/ai/utils');
      let extracted = extractJsonFromText(text || '');
      
      // If extraction found something but it's not valid JSON, try to repair it
      if (extracted) {
        try {
          parsed = JSON.parse(extracted);
        } catch (parseError) {
          // Try to repair the truncated/incomplete JSON
          const repaired = repairTruncatedJson(extracted);
          try {
            parsed = JSON.parse(repaired);
          } catch (repairError) {
            console.warn('Could not parse even after repair', { repairError });
          }
        }
      }
      
      // If still no luck, try repairing the raw text
      if (!parsed) {
        const repaired = repairTruncatedJson(text || '');
        try {
          parsed = JSON.parse(repaired);
        } catch (rawRepairError) {
          console.error('Failed to repair raw text');
        }
      }
    } catch (ex) {
      console.error('Error during JSON extraction/repair:', ex instanceof Error ? ex.message : String(ex));
    }
  }

  if (!parsed) {
    throw new Error('Model returned non-JSON or invalid JSON for management trust score: ' + (text || '').substring(0, 300));
  }

  // Try direct validation
  let validated = ManagementTrustScoreOutputSchema.safeParse(parsed);
  if (validated.success) return validated.data;

  // Attempt to normalize alternative shapes
  let candidate: any = {
    managementTrustScore: 0,
    reasoning: '',
    citations: []
  };

  // Map potential field names
  if (typeof parsed.managementTrustScore === 'number') {
    candidate.managementTrustScore = Math.max(0, Math.min(100, parsed.managementTrustScore));
  } else if (typeof parsed.score === 'number') {
    candidate.managementTrustScore = Math.max(0, Math.min(100, parsed.score));
  } else if (typeof parsed.trust_score === 'number') {
    candidate.managementTrustScore = Math.max(0, Math.min(100, parsed.trust_score));
  }

  if (typeof parsed.reasoning === 'string') {
    candidate.reasoning = parsed.reasoning;
  } else if (typeof parsed.reason === 'string') {
    candidate.reasoning = parsed.reason;
  } else if (typeof parsed.analysis === 'string') {
    candidate.reasoning = parsed.analysis;
  }

  // Handle citations
  if (Array.isArray(parsed.citations)) {
    candidate.citations = parsed.citations.map((c: any) => ({
      text: String(c.text || c.quote || ''),
      source: String(c.source || c.location || '')
    }));
  } else if (Array.isArray(parsed.gaps)) {
    candidate.citations = parsed.gaps.map((g: any) => ({
      text: String(g.text || g.promise || ''),
      source: String(g.source || g.metric || '')
    }));
  }

  // Validate normalized output
  validated = ManagementTrustScoreOutputSchema.safeParse(candidate);
  if (validated.success) return validated.data;

  // If still invalid, throw with debug info
  throw new Error('Model returned unexpected shape for management trust score. Expected managementTrustScore, reasoning, and citations: ' + JSON.stringify(parsed).substring(0, 300));
}
