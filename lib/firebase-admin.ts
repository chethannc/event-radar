import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
}

export function getAdminDb() {
  const config = getFirebaseAdminConfig();

  if (!config) {
    return null;
  }

  const app = getApps()[0] ?? initializeApp(config);
  return getFirestore(app);
}
