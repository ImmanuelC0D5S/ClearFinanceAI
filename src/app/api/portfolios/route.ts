import { NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firestoreAdmin';

const DEFAULT_USER_ID = 'default_user';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, holdings } = body;

    const db = getFirestore();
    // We save to 'portfolios/default_user' to keep the AI logic simple
    const docRef = db.collection('portfolios').doc(DEFAULT_USER_ID);

    const sanitizedData = {
      userId: DEFAULT_USER_ID,
      portfolioName: name || "My Portfolio",
      // We force lowercase 'ticker' and 'quantity' here
      holdings: holdings.map((h: any) => ({
        ticker: String(h.ticker || "").toUpperCase().trim(), 
        quantity: Number(h.quantity || 0),
        avgPrice: Number(h.avgPrice || 0)
      })),
      updatedAt: new Date().toISOString(),
    };

    await docRef.set(sanitizedData, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET handler to make sure the UI can read it back
export async function GET() {
  try {
    const db = getFirestore();
    const doc = await db.collection('portfolios').doc(DEFAULT_USER_ID).get();
    return NextResponse.json({ portfolio: doc.exists ? doc.data() : null });
  } catch (e) {
    return NextResponse.json({ portfolio: null });
  }
}