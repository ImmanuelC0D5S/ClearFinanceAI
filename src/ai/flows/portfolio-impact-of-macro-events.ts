'use server';
/**
 * @fileOverview Simulates the impact of a macro event on a user's portfolio.
 *
 * - simulatePortfolioImpact - Simulates the impact of a macro event on a user's portfolio.
 * - SimulatePortfolioImpactInput - The input type for the simulatePortfolioImpact function.
 * - SimulatePortfolioImpactOutput - The return type for the simulatePortfolioImpact function.
 */

import { generateForTask } from '@/ai/vertex';
import { z } from 'zod';

const SimulatePortfolioImpactInputSchema = z.object({
  portfolioHoldings: z.string(),
  macroEvent: z.string(),
  tavilyContext: z.string().optional(), // Real-time company data from Tavily API
});
export type SimulatePortfolioImpactInput = z.infer<typeof SimulatePortfolioImpactInputSchema>;

const SimulatePortfolioImpactOutputSchema = z.object({
  expectedDrawdown: z.string(),
  sectorSensitivity: z.string(),
  downsideRisk: z.string(),
  reasoning: z.string(),
  // Optional suggested action: the model may recommend an action and details
  suggestedAction: z
    .object({ action: z.string(), details: z.string() })
    .optional(),
});
export type SimulatePortfolioImpactOutput = z.infer<typeof SimulatePortfolioImpactOutputSchema>;

export async function simulatePortfolioImpact(input: SimulatePortfolioImpactInput): Promise<SimulatePortfolioImpactOutput> {
  const text = await generateForTask('macroShock', input);

  // Parse and validate using zod; try to normalize common alternate shapes returned by the model
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    // Try to salvage JSON if model wrapped it in markdown/code fences or returned partial JSON
    console.warn('Initial JSON parse failed, attempting extraction:', { error: e.message, textLength: text?.length });
    try {
      const { extractJsonFromText } = await import('@/ai/utils');
      let extracted = extractJsonFromText(text || '');
      
      // If extraction still fails, try to find any JSON object that looks valid
      if (!extracted && text) {
        // Try to find the last complete JSON object by looking for closing braces
        const matches = text.match(/\{[^{}]*\}/g);
        if (matches && matches.length > 0) {
          // Try each match in reverse order (likely the most complete one is last)
          for (let i = matches.length - 1; i >= 0; i--) {
            try {
              JSON.parse(matches[i]);
              extracted = matches[i];
              break;
            } catch (ex) {
              // continue to next match
            }
          }
        }
      }
      
      if (extracted) {
        parsed = JSON.parse(extracted);
      } else {
        console.error('Could not extract valid JSON from response');
      }
    } catch (ex) {
      console.error('Extraction failed:', ex instanceof Error ? ex.message : String(ex));
    }
  }

  // If parse completely failed, create a fallback response with explanation
  if (!parsed) {
    console.warn('No valid JSON found in model response. Creating fallback response.');
    const fallback = {
      expectedDrawdown: 'Unable to calculate - model response error',
      sectorSensitivity: 'Please try again',
      downsideRisk: 'Temporary service unavailable',
      reasoning: 'The AI model returned an unexpected response format. ' + (text?.substring(0, 200) || 'No response received'),
    };
    return SimulatePortfolioImpactOutputSchema.parse(fallback);
  }

  const maybe = SimulatePortfolioImpactOutputSchema.safeParse(parsed);
  if (maybe.success) return maybe.data;

  // Attempt normalization for common alternate shapes
  const candidate: Partial<SimulatePortfolioImpactOutput> = {};

  // Handle alternative structure where data might be nested under company keys
  // e.g., { "HDFCBANK": { rationale: "...", macro_event_impact: "...", ... } }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    const keys = Object.keys(parsed);
    // If the structure has keys that look like company tickers, extract data from first one
    // Check if any key contains company data (not standard fields)
    const hasStandardFields = 'expectedDrawdown' in parsed || 'reasoning' in parsed || 'downsideRisk' in parsed;
    
    if (!hasStandardFields && keys.length > 0) {
      // Likely nested structure - extract from first company key
      for (const key of keys) {
        const companyData = parsed[key];
        if (typeof companyData === 'object' && companyData !== null && !Array.isArray(companyData)) {
          // Map alternative field names from nested structure to top level
          if (companyData.rationale && typeof companyData.rationale === 'string') {
            parsed.reasoning = companyData.rationale;
          }
          if (companyData.macro_event_impact && typeof companyData.macro_event_impact === 'string') {
            parsed.downsideRisk = companyData.macro_event_impact;
          }
          if (companyData.suggested_action && typeof companyData.suggested_action === 'string') {
            parsed.suggestedAction = { action: companyData.suggested_action, details: '' };
          }
          // Try to construct expectedDrawdown from allocation info
          if (companyData.current_allocation && typeof companyData.current_allocation === 'string') {
            parsed.expectedDrawdown = `Impact on ${companyData.current_allocation} allocation`;
          }
          break; // Use first company's data
        }
      }
    }
    
    // Also check if rationale exists at top level (after potential extraction)
    if (parsed.rationale && typeof parsed.rationale === 'string' && !parsed.reasoning) {
      parsed.reasoning = parsed.rationale;
    }
    if (parsed.macro_event_impact && typeof parsed.macro_event_impact === 'string' && !parsed.downsideRisk) {
      parsed.downsideRisk = parsed.macro_event_impact;
    }
  }

  // Top-level fields
  if (typeof parsed.expectedDrawdown === 'string') candidate.expectedDrawdown = parsed.expectedDrawdown;
  if (typeof parsed.sectorSensitivity === 'string') candidate.sectorSensitivity = parsed.sectorSensitivity;
  if (typeof parsed.downsideRisk === 'string') candidate.downsideRisk = parsed.downsideRisk;
  if (typeof parsed.reasoning === 'string') candidate.reasoning = parsed.reasoning;
  // Also check for rationale as an alias for reasoning
  if (!candidate.reasoning && typeof parsed.rationale === 'string') candidate.reasoning = parsed.rationale;

  // Top-level suggestedAction normalization
  if (!candidate.suggestedAction && parsed && typeof parsed.suggestedAction === 'object') {
    const sa = parsed.suggestedAction as any;
    if (typeof sa.action === 'string' && typeof sa.details === 'string') {
      candidate.suggestedAction = { action: sa.action, details: sa.details };
    } else {
      candidate.suggestedAction = {
        action: sa.action ?? sa.recommendation ?? 'Action',
        details: sa.details ?? sa.note ?? JSON.stringify(sa),
      };
    }
  } else if (!candidate.suggestedAction && parsed && typeof parsed.suggestedAction === 'string') {
    candidate.suggestedAction = { action: 'Suggestion', details: parsed.suggestedAction };
  }

  // Nested under processedData or processed
  const pd = parsed.processedData || parsed.processed || parsed.data || null;
  if (pd) {
    if (!candidate.expectedDrawdown && typeof pd.expectedDrawdown === 'string') candidate.expectedDrawdown = pd.expectedDrawdown;
    if (!candidate.expectedDrawdown && typeof pd.drawdown === 'string') candidate.expectedDrawdown = pd.drawdown;
    if (!candidate.sectorSensitivity && typeof pd.sectorSensitivity === 'string') candidate.sectorSensitivity = pd.sectorSensitivity;
    if (!candidate.downsideRisk && typeof pd.downsideRisk === 'string') candidate.downsideRisk = pd.downsideRisk;
    if (!candidate.downsideRisk && typeof pd.risk === 'string') candidate.downsideRisk = pd.risk;
    if (!candidate.downsideRisk && typeof pd.macro_event_impact === 'string') candidate.downsideRisk = pd.macro_event_impact;
    if (!candidate.reasoning && typeof pd.analysisNote === 'string') candidate.reasoning = pd.analysisNote;
    if (!candidate.reasoning && typeof pd.rationale === 'string') candidate.reasoning = pd.rationale;
  }

  // Some models return a flattened 'insights' or 'analysis' object
  const insights = parsed.insights || parsed.analysis || null;
  if (insights) {
    if (!candidate.expectedDrawdown && typeof insights.expectedDrawdown === 'string') candidate.expectedDrawdown = insights.expectedDrawdown;
    if (!candidate.downsideRisk && typeof insights.downsideRisk === 'string') candidate.downsideRisk = insights.downsideRisk;
    if (!candidate.sectorSensitivity && typeof insights.sectorSensitivity === 'string') candidate.sectorSensitivity = insights.sectorSensitivity;
    if (!candidate.reasoning && typeof insights.reasoning === 'string') candidate.reasoning = insights.reasoning;
    if (!candidate.suggestedAction && typeof insights.suggestedAction === 'object') candidate.suggestedAction = insights.suggestedAction;
    if (!candidate.suggestedAction && typeof insights.recommendation === 'string') candidate.suggestedAction = { action: insights.recommendation, details: insights.recommendationDetails || '' };
  }


  // Debug logging to help troubleshoot
  if (!candidate.reasoning) {
    console.log('No reasoning found in candidate. Parsed object keys:', Object.keys(parsed));
    console.log('Parsed object structure:', JSON.stringify(parsed, null, 2).substring(0, 500));
  }

  // If we managed to populate the required fields, return after validation
  const normalized = {
    expectedDrawdown: candidate.expectedDrawdown ?? (candidate.reasoning ? 'See analysis below' : 'N/A'),
    sectorSensitivity: candidate.sectorSensitivity ?? (candidate.reasoning ? candidate.reasoning.substring(0, 150) + '...' : 'N/A'),
    downsideRisk: candidate.downsideRisk ?? (candidate.reasoning ? 'See analysis' : 'N/A'),
    reasoning: candidate.reasoning ?? 'No reasoning provided by the model.',
    suggestedAction: candidate.suggestedAction ?? undefined,
  };

  const validated = SimulatePortfolioImpactOutputSchema.safeParse(normalized);
  if (validated.success) {
    console.warn('Normalized model output for simulatePortfolioImpact (returned by model):', parsed);
    return validated.data;
  }

  // Attempt to salvage a free-text suggested action if present in the raw text
  if (!normalized.suggestedAction && text) {
    const match = text.match(/(?:Suggested Action|Recommendation)[:\-]\s*([\s\S]{1,500})/i);
    if (match) {
      const raw = match[1].trim();
      // Split by sentence or newline — first fragment as action, rest as details
      const [first, ...rest] = raw.split(/\n|\.|;|\r/).map((s) => s.trim()).filter(Boolean);
      if (first) {
        const made = { action: first, details: rest.join('. ').trim() };
        const finalNorm = { ...normalized, suggestedAction: made };
        const finalValidated = SimulatePortfolioImpactOutputSchema.safeParse(finalNorm);
        if (finalValidated.success) {
          console.warn('Extracted suggestedAction from model text for simulatePortfolioImpact:', raw);
          return finalValidated.data;
        }
      }
    }
  }

  // If still invalid, throw with helpful debug info
  throw new Error('Model returned unexpected shape for portfolio impact. Raw output:\n' + JSON.stringify(parsed, null, 2));
}
