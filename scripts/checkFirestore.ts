import { getFirestore } from '@/lib/firestoreAdmin';

async function main() {
  const db = getFirestore();
  const snapshot = await db.collection('portfolios').get();
  if (snapshot.empty) {
    console.log('No portfolios found.');
  } else {
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  }
}

main().catch(console.error);
