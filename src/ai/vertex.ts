import { extractJsonFromText } from './utils';

export async function generateForTask(task: string, input: any): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set.');

  // Use 1.5-flash for higher stability and better rate limits in the free tier
  const MODEL_NAME = "gemini-2.5-flash"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  // SHARED CONTEXT: Minified to save tokens
  const marketData = JSON.stringify(input.actualMarketData || input.marketData || {});
  const newsData = typeof input.googleNews === 'string' ? input.googleNews : JSON.stringify(input.googleNews || []);

  let prompt = "";
  
  switch (task) {
    case 'managementTrustScore':
  prompt = `
    TASK: Act as a Forensic Financial Auditor. Calculate a "Management Trust Score" (0-100).
    
    FORMULA WEIGHTING:
    1. Truth Gap (50%): Match verbal promises in Transcript against Yahoo Finance numbers. 
    2. Operational Integrity (20%): Verification of margin and growth claims.
    3. Sentiment Alignment (30%): Cross-check management tone against Google News headlines.

    AUDIT RULES:
    - If a specific promise (e.g., "reducing debt") is contradicted by numbers (e.g., rising debt), deduct 30 points.
    - If management is silent on a major risk found in Google News, deduct 15 points.
    - If numbers perfectly support the verbal guidance, score should be above 85.

    INPUT DATA:
    - Transcript: ${JSON.stringify(input.transcriptText)}
    - Yahoo Stats: ${JSON.stringify(input.actualMarketData)}
    - News Headlines: ${input.googleNews}

    RETURN JSON:
    {
      "managementTrustScore": number,
      "reasoning": "A 3-paragraph breakdown of the Truth Gaps found.",
      "citations": [{"text": "the promise made", "source": "the contradictory metric or headline"}]
    }
  `;
  break;
    case 'macroShock':
      prompt = `Simulate Macro Shock.
      Only output JSON 
      Holdings: ${input.portfolioHoldings} 
      Event: ${input.macroEvent}
      Market Data: ${marketData}
      Output JSON Schema: {"expectedDrawdown": "string", "downsideRisk": "string", "sectorSensitivity": "string", "reasoning": "string"}`;
      break;

    case 'riskAnalysis':
      prompt = `Identify risk factors from report: ${JSON.stringify(input.financialReport)}
      Market Data: ${marketData}
      Output JSON Schema: {"riskFactorSummary": ["string"]}`;
      break;

    case 'regulatoryWatch':
      prompt = `Scan filing for red flags: ${JSON.stringify(input.filingText)}
      Market Data: ${marketData}
      Output JSON Schema: {"redFlags": [{"riskLevel": "High|Medium|Low", "description": "string", "implication": "string"}]}`;
      break;

    default:
      prompt = `Process following as JSON: ${JSON.stringify(input)}`;
  }

  // Helper function to handle the fetch with a retry for Rate Limits (429)
  async function callApiWithRetry(attempt: number = 1): Promise<Response> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            response_mime_type: "application/json" // CRITICAL: Forces valid JSON
          }
        })
      });

      // If rate limited (429), wait and retry once
      if (res.status === 429 && attempt < 2) {
        console.warn("Rate limited. Retrying in 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return callApiWithRetry(attempt + 1);
      }

      return res;
    } catch (e: any) {
      if (attempt < 2) {
        console.warn("Fetch failed, retrying...", e.message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return callApiWithRetry(attempt + 1);
      }
      throw e;
    }
  }

  try {
    const response = await callApiWithRetry();
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API Error ${response.status}: ${errorBody}`);
      throw new Error(`API Error ${response.status}: ${errorBody.substring(0, 200)}`);
    }

    const json = await response.json();
    
    // Validate response structure
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid response format from API');
    }
    
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText || typeof rawText !== 'string') {
      console.warn('No text content in API response', { json: JSON.stringify(json).substring(0, 200) });
      throw new Error('No text content in API response');
    }
    
    // Safety check to ensure we only return the JSON part
    const extracted = extractJsonFromText(rawText);
    if (extracted) {
      return extracted;
    }
    
    // If extraction failed, try parsing the raw text
    console.warn('JSON extraction failed, attempting raw parse', { rawText: rawText.substring(0, 300) });
    try {
      JSON.parse(rawText);
      return rawText;
    } catch (parseError) {
      // Last resort: return the raw text for downstream processing to handle
      console.error('Model response failed JSON validation. Returning raw text for recovery:', { rawText: rawText.substring(0, 400) });
      return rawText;
    }
    
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);
    throw error;
  }
}