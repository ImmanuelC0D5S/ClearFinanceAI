'use server';
/**
 * @fileOverview Parses regulatory filings for red flags.
 *
 * - `checkForRedFlags` - A function that checks for red flags in regulatory filings.
 * - `RegulatoryWatchInput` - The input type for the `checkForRedFlags` function.
 * - `RegulatoryWatchOutput` - The return type for the `checkForRedFlags` function.
 */

import { generateForTask } from '@/ai/vertex';
import { z } from 'zod';

const RegulatoryWatchInputSchema = z.object({
  companyName: z.string(),
  filingText: z.string(),
});
export type RegulatoryWatchInput = z.infer<typeof RegulatoryWatchInputSchema>;

const RegulatoryWatchOutputSchema = z.object({
  redFlags: z.array(z.object({
    riskLevel: z.enum(['High', 'Medium', 'Low']),
    description: z.string(),
    implication: z.string(),
  })),
});
export type RegulatoryWatchOutput = z.infer<typeof RegulatoryWatchOutputSchema>;

export async function checkForRedFlags(input: RegulatoryWatchInput): Promise<RegulatoryWatchOutput> {
  const text = await generateForTask('regulatoryWatch', input);
  
  // Parse and validate using zod
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    // Try to extract JSON from markdown/code fences
    try {
      const { extractJsonFromText } = await import('@/ai/utils');
      const extracted = extractJsonFromText(text || '');
      if (extracted) {
        parsed = JSON.parse(extracted);
      }
    } catch (ex) {
      // ignore and fall through to throw
    }
  }

  if (!parsed) {
    throw new Error('Model returned non-JSON or invalid JSON for regulatory watch: ' + (text || '').substring(0, 300));
  }

  // Try direct validation
  let validated = RegulatoryWatchOutputSchema.safeParse(parsed);
  if (validated.success) return validated.data;

  // Attempt to normalize alternative shapes
  let candidate: any = { redFlags: [] };

  // If model returned just an array of flags
  if (Array.isArray(parsed)) {
    candidate.redFlags = parsed.map(flag => ({
      riskLevel: flag.riskLevel || flag.level || 'Medium',
      description: String(flag.description || flag.text || ''),
      implication: String(flag.implication || flag.impact || '')
    }));
  }
  // If flags are nested under a different key
  else if (Array.isArray(parsed.redFlags)) {
    candidate.redFlags = parsed.redFlags.map((flag: any) => ({
      riskLevel: flag.riskLevel || flag.level || 'Medium',
      description: String(flag.description || flag.text || ''),
      implication: String(flag.implication || flag.impact || '')
    }));
  } else if (Array.isArray(parsed.flags)) {
    candidate.redFlags = parsed.flags.map((flag: any) => ({
      riskLevel: flag.riskLevel || flag.level || 'Medium',
      description: String(flag.description || flag.text || ''),
      implication: String(flag.implication || flag.impact || '')
    }));
  }

  // Validate normalized output
  validated = RegulatoryWatchOutputSchema.safeParse(candidate);
  if (validated.success) return validated.data;

  // If still invalid, throw with debug info
  throw new Error('Model returned unexpected shape for regulatory watch. Expected redFlags array: ' + JSON.stringify(parsed).substring(0, 300));
}
