import admin from 'firebase-admin';

export function getFirestore() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase credentials missing in .env.local");
    }

    // ROBUST KEY CLEANING:
    // 1. Remove literal quotes if they got stuck in the string
    // 2. Replace the string '\n' with actual line breaks
    const formattedKey = privateKey
      .replace(/^['"]|['"]$/g, '') 
      .replace(/\\n/g, '\n');

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
      });
      console.log("✅ Firebase Admin Authenticated");
    } catch (error: any) {
      console.error("❌ Auth Error:", error.message);
      throw error;
    }
  }
  return admin.firestore();
}