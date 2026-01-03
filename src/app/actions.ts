'use server';

import { calculateManagementTrustScore } from '@/ai/flows/management-trust-score';
import { getYahooFinanceData } from '@/lib/yahoofinance';
import { 
  scrapeLatestTranscript, 
  extractCompanyNames, 
  searchMultipleCompanies, 
  formatTavilyResultsForAI 
} from '@/lib/tavily';
import { getGoogleNewsRSS, NewsItem } from '@/lib/googlenews';
import { simulatePortfolioImpact } from '@/ai/flows/portfolio-impact-of-macro-events';
import { summarizeRiskFactors } from '@/ai/flows/summarize-risk-factors';
import { checkForRedFlags } from '@/ai/flows/regulatory-watch';
import { getFirestore } from '@/lib/firestoreAdmin';
/**
 * 1. MANAGEMENT TRUST SCORE
 * Gathers Transcript (Text), Market Data (Numbers), and News (Sentiment)
 */
export async function handleManagementTrustScore(input: {
  companyName: string;
  ticker: string;
}) {
  try {
    // Parallel scraping for speed
    const [transcript, marketData, news] = await Promise.all([
      scrapeLatestTranscript(input.companyName),
      getYahooFinanceData(input.ticker),
      getGoogleNewsRSS(input.companyName)
    ]);

    if (!transcript) throw new Error("Could not find a valid transcript for this company.");

    // This payload matches the keys expected by vertex.ts and the AI flow
    const aiInput = {
      companyName: input.companyName,
      transcriptText: transcript.substring(0, 8000), // Keep under token limit
      actualMarketData: marketData || "Market data currently unavailable.",
      googleNews: news
    };

    // Use 'as any' to bypass the strict old Schema validation until flow files are updated
    const output = await calculateManagementTrustScore(aiInput as any);
    
    return { data: output, error: null };
  } catch (e: any) {
    console.error('Forensic Action Error:', e.message);
    return { data: null, error: e.message || 'Analysis failed.' };
  }
}

/**
 * 2. MACRO SHOCK SIMULATION
 * Analyzes how a macro event affects the specific portfolio companies
 */
export async function handleMacroShock(input: {
  portfolioHoldings: string;
  macroEvent: string;
}) {
  try {
    const companyNames = extractCompanyNames(input.portfolioHoldings);
    const news = await getGoogleNewsRSS(input.macroEvent);

    const aiInput = {
      portfolioHoldings: input.portfolioHoldings,
      macroEvent: input.macroEvent,
      googleNews: news,
      actualMarketData: {} // Context holder
    };

    const output = await simulatePortfolioImpact(aiInput as any);
    return { data: output, error: null };
  } catch (e: any) {
    console.error('Macro Shock Error:', e.message);
    return { data: null, error: e.message };
  }
}

/**
 * 3. RISK FACTOR SUMMARY
 */
export async function handleRiskSummary(input: {
  companyName: string;
  financialReport: string;
}) {
  try {
    const news = await getGoogleNewsRSS(input.companyName);
    
    const aiInput = {
      companyName: input.companyName,
      financialReport: input.financialReport,
      googleNews: news
    };

    const data = await summarizeRiskFactors(aiInput as any);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

/**
 * 4. REGULATORY WATCH
 */
export async function handleRegulatoryWatch(input: {
  companyName: string;
  filingText: string;
}) {
  try {
    const news = await getGoogleNewsRSS(input.companyName);
    
    const aiInput = {
      companyName: input.companyName,
      filingText: input.filingText,
      googleNews: news
    };

    const data = await checkForRedFlags(aiInput as any);
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

/**
 * 5. DASHBOARD INSIGHTS (Generic search for portfolio)
 */
export async function fetchPortfolioInsights(holdingsText: string) {
  try {
    const companyNames = extractCompanyNames(holdingsText);
    if (companyNames.length === 0) return { data: {}, error: null };

    const tavilyResults = await searchMultipleCompanies(companyNames, 5);
    const resultsObj: Record<string, any> = {};
    
    // Convert Map to Object for serialization
    tavilyResults.forEach((value, key) => {
      resultsObj[key] = value;
    });
    
    return { data: resultsObj, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

/**
 * 6. MARKET NEWS MODULE
 * Dedicated action for the News module UI
 */
export async function fetchNewsAction(query: string = 'Indian Stock Market'): Promise<{ data: NewsItem[]; error: string | null }> {
  try {
    if (!query || typeof query !== 'string') {
      console.warn('Invalid query provided to fetchNewsAction', { query });
      return { data: [], error: 'Invalid query parameter' };
    }
    
    const news = await getGoogleNewsRSS(query);
    
    // Ensure data is always a valid array of NewsItem objects
    if (!Array.isArray(news)) {
      console.error('Expected array from getGoogleNewsRSS, got:', typeof news);
      return { data: [], error: 'Invalid news data format' };
    }
    
    // Validate each news item
    const validNews = news.filter(item => 
      item && typeof item === 'object' && 'title' in item && 'link' in item
    );
    
    return { data: validNews, error: null };
  } catch (e: any) {
    console.error('Fetch News Error:', e instanceof Error ? e.message : String(e));
    return { data: [], error: e instanceof Error ? e.message : 'Failed to fetch news' };
  }
}

export async function saveUserPortfolioAction(data: { 
  name: string, 
  holdings: { ticker: string, quantity: number }[] 
}) {
  try {
    const db = getFirestore();
    
    // We'll use a hardcoded 'default_user' for now since auth isn't fully setup
    // You can later replace this with a real user ID from Firebase Auth
    const docRef = db.collection('portfolios').doc('default_user');
    
    await docRef.set({
      portfolioName: data.name,
      holdings: data.holdings,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("Firestore Save Error:", error);
    return { error: error.message };
  }
}