import { getFirestore } from './firestoreAdmin';
import crypto from 'crypto';
import { logStructured } from './logging';

const collectionName = 'ai_cache';
const DEFAULT_TTL_SECONDS = Number(process.env.AI_CACHE_TTL_SECONDS ?? 60 * 60 * 24); // 24h default

function hashInput(input: any) {
  try {
    return crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  } catch (e) {
    return String(input);
  }
}

export async function getCachedResult(analysisType: string, opts: { portfolioId?: string; input?: any }) {
  const db = getFirestore();
  const keyParts = [analysisType];
  if (opts.portfolioId) keyParts.push(`portfolio:${opts.portfolioId}`);
  if (opts.input) keyParts.push(`input:${hashInput(opts.input)}`);
  const docId = keyParts.join('|');

  const doc = await db.collection(collectionName).doc(docId).get();
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  const created = data.createdAt ? new Date(data.createdAt) : null;
  if (created) {
    const ageSec = (Date.now() - created.getTime()) / 1000;
    if (ageSec > DEFAULT_TTL_SECONDS) {
      logStructured('INFO', 'AI cache expired', { analysisType, portfolioId: opts.portfolioId, docId });
      // stale
      return null;
    }
  }

  logStructured('INFO', 'AI cache hit', { analysisType, portfolioId: opts.portfolioId, docId });
  return data as { resultJson: string; model?: string; latencyMs?: number; createdAt?: string };
}

export async function setCachedResult(analysisType: string, opts: { portfolioId?: string; input?: any; resultJson: string; model?: string; latencyMs?: number }) {
  const db = getFirestore();
  const keyParts = [analysisType];
  if (opts.portfolioId) keyParts.push(`portfolio:${opts.portfolioId}`);
  if (opts.input) keyParts.push(`input:${hashInput(opts.input)}`);
  const docId = keyParts.join('|');

  const payload = {
    analysisType,
    portfolioId: opts.portfolioId ?? null,
    inputHash: opts.input ? hashInput(opts.input) : null,
    resultJson: opts.resultJson,
    model: opts.model ?? null,
    latencyMs: opts.latencyMs ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection(collectionName).doc(docId).set(payload);
  logStructured('INFO', 'AI cache set', { analysisType, portfolioId: opts.portfolioId, docId, latencyMs: opts.latencyMs });
}
