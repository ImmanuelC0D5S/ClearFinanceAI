import { getFirestore } from './firestoreAdmin';
import { Portfolio } from '@/types/portfolio';

let cache: { ts: number; portfolios: Record<string, Portfolio> } | null = null;
const CACHE_TTL = 1000 * 60 * 1; // 1 minute

export async function getPortfolioById(id: string): Promise<Portfolio | null> {
  if (!id) return null;
  if (cache && Date.now() - cache.ts < CACHE_TTL && cache.portfolios[id]) return cache.portfolios[id];
  const db = getFirestore();
  const doc = await db.collection('portfolios').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as Portfolio;
  data.id = doc.id;
  cache = cache || { ts: Date.now(), portfolios: {} };
  cache.ts = Date.now();
  cache.portfolios[id] = data;
  return data;
}

export function portfolioHoldingsToText(portfolio: Portfolio) {
  // Convert holdings to a string e.g., 'Reliance: 20 shares @ 2300, HDFC Bank: 10 shares @ 1200'
  if (!portfolio) return '';
  return portfolio.holdings.map((h) => `${h.companyId}: ${h.quantity} shares @ ${h.avgPrice}`).join(', ');
}
