import { Storage } from '@google-cloud/storage';
import { getFirestore } from './firestoreAdmin';
import { logStructured } from './logging';

const DEFAULT_BUCKET = process.env.GCS_BUCKET_NAME;

function getStorageClient() {
  if (!DEFAULT_BUCKET) throw new Error('GCS_BUCKET_NAME not set in env');
  return new Storage();
}

export async function uploadDocumentToGCS(path: string, buffer: Buffer, contentType: string) {
  const bucketName = DEFAULT_BUCKET;
  if (!bucketName) throw new Error('GCS_BUCKET_NAME is not configured in environment');

  const storage = getStorageClient();
  const bucket = storage.bucket(bucketName as string);
  const file = bucket.file(path);

  await file.save(buffer, { contentType });
  // Make object private by default
  await file.makePrivate();

  const meta = await file.getMetadata();
  logStructured('INFO', 'Uploaded document to GCS', { bucket: bucketName, path, size: meta?.[0]?.size });
  return { bucket: bucketName, path, size: Number(meta?.[0]?.size ?? 0), updated: meta?.[0]?.updated };
}

export async function saveDocumentMetadata(metadata: { portfolioId?: string; filename: string; contentType: string; gcsPath: string; size: number; uploadedBy?: string | null }) {
  const db = getFirestore();
  const docRef = await db.collection('documents').add({
    ...metadata,
    createdAt: new Date().toISOString(),
  });

  logStructured('INFO', 'Saved document metadata', { docId: docRef.id, filename: metadata.filename, portfolioId: metadata.portfolioId });
  return docRef.id;
}
