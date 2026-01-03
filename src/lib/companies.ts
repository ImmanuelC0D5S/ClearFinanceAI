import { getFirestore } from './firestoreAdmin';
import { Company } from '@/types/portfolio';
import { logStructured } from './logging';

let cache: { ts: number; companies: Company[] } | null = null;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getCompanies(): Promise<Company[]> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) return cache.companies;

  // Try to fetch from Firestore; if it fails (credentials, missing file, etc.), fall back to an in-memory seed.
    let db: any;
    try {
      db = getFirestore();
    } catch (e) {
      db = null;
    }

    // If Firestore is unavailable, always return seed data
    const seed: Company[] = [
      { id: 'reliance', name: 'Reliance Industries', ticker: 'RELIANCE.NS', sector: 'Energy' },
      { id: 'hdfcbank', name: 'HDFC Bank', ticker: 'HDFCBANK.NS', sector: 'Financials' },
      { id: 'infosys', name: 'Infosys', ticker: 'INFY.NS', sector: 'Technology' },
    ];

    if (!db) {
      cache = { ts: Date.now(), companies: seed };
      return seed;
    }

    try {
      const snapshot = await db.collection('companies').get();
      if (!snapshot.empty) {
        const companies = snapshot.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) } as Company));
        cache = { ts: Date.now(), companies };
        return companies;
      }

      // Seed with a few example companies if none exist
      if (db.batch) {
        const batch = db.batch();
        seed.forEach((c) => {
          const ref = db.collection('companies').doc(c.id);
          batch.set(ref, { name: c.name, ticker: c.ticker, sector: c.sector });
        });
        await batch.commit();
      }
      cache = { ts: Date.now(), companies: seed };
      return seed;
    } catch (e) {
      cache = { ts: Date.now(), companies: seed };
      return seed;
    }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  if (cache) {
    const found = cache.companies.find((c) => c.id === id);
    if (found) return found;
  }

  try {
    const db = getFirestore();
    const doc = await db.collection('companies').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...(doc.data() as any) } as Company;
  } catch (e: any) {
    logStructured('WARN', 'Could not fetch single company from Firestore; falling back to cached seed', { id, error: e.message });
    if (cache) return cache.companies.find((c) => c.id === id) ?? null;
    return null;
  }
}

export async function isFirestoreAvailable(): Promise<boolean> {
  try {
    const db = getFirestore();
    await db.collection('companies').limit(1).get();
    return true;
  } catch (e) {
    return false;
  }
}
