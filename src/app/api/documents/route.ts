import { NextResponse } from 'next/server';
import { uploadDocumentToGCS, saveDocumentMetadata } from '@/lib/gcs';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { portfolioId, filename, contentType, dataBase64 } = json;
    if (!filename || !dataBase64) return NextResponse.json({ error: 'filename and dataBase64 are required' }, { status: 400 });

    const buffer = Buffer.from(dataBase64, 'base64');
    const destPath = `documents/${portfolioId ?? 'unassigned'}/${Date.now()}-${filename}`;
    const upload = await uploadDocumentToGCS(destPath, buffer, contentType || 'application/octet-stream');

    const docId = await saveDocumentMetadata({ portfolioId, filename, contentType: contentType || 'application/octet-stream', gcsPath: `gs://${upload.bucket}/${upload.path}`, size: upload.size });

    return NextResponse.json({ ok: true, docId, gcsPath: `gs://${upload.bucket}/${upload.path}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
