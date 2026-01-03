'use server';

/**
 * @fileOverview Summarizes key risk factors for a given company from financial documents.
 *
 * - summarizeRiskFactors - A function that summarizes risk factors.
 * - SummarizeRiskFactorsInput - The input type for the summarizeRiskFactors function.
 * - SummarizeRiskFactorsOutput - The return type for the summarizeRiskFactors function.
 */

import { generateForTask } from '@/ai/vertex';
import { z } from 'zod';

const SummarizeRiskFactorsInputSchema = z.object({
  companyName: z.string(),
  financialReport: z.string(),
});
export type SummarizeRiskFactorsInput = z.infer<typeof SummarizeRiskFactorsInputSchema>;

const SummarizeRiskFactorsOutputSchema = z.object({
  riskFactorSummary: z.array(z.string()),
});
export type SummarizeRiskFactorsOutput = z.infer<typeof SummarizeRiskFactorsOutputSchema>;

export async function summarizeRiskFactors(input: SummarizeRiskFactorsInput): Promise<SummarizeRiskFactorsOutput> {
  const text = await generateForTask('riskAnalysis', input);
  
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
    throw new Error('Model returned non-JSON or invalid JSON for risk summary: ' + (text || '').substring(0, 300));
  }

  // Validate and normalize output
  let validated = SummarizeRiskFactorsOutputSchema.safeParse(parsed);
  if (validated.success) return validated.data;

  // Attempt to normalize alternative shapes
  if (Array.isArray(parsed)) {
    // If model returned just an array, wrap it
    const candidate = { riskFactorSummary: parsed.map(item => String(item)) };
    validated = SummarizeRiskFactorsOutputSchema.safeParse(candidate);
    if (validated.success) return validated.data;
  }

  // If we have a risks field or similar
  const candidate: any = { riskFactorSummary: [] };
  if (Array.isArray(parsed.risks)) {
    candidate.riskFactorSummary = parsed.risks.map((r: any) => String(r.description || r));
  } else if (Array.isArray(parsed.riskFactorSummary)) {
    candidate.riskFactorSummary = parsed.riskFactorSummary.map((r: any) => String(r));
  } else if (typeof parsed.riskFactorSummary === 'string') {
    candidate.riskFactorSummary = [parsed.riskFactorSummary];
  }

  if (candidate.riskFactorSummary.length > 0) {
    return candidate as SummarizeRiskFactorsOutput;
  }

  throw new Error('Model returned unexpected shape for risk summary. Expected riskFactorSummary array: ' + JSON.stringify(parsed).substring(0, 300));
}
