import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDocFromServer,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId according to Firebase Skill
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Persist login state in browser local storage across tabs and sessions
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch {
  // Ignore in non-browser environments
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL: Validate connection to Firestore at boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'site'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface SiteSettingsData {
  hiddenProductIds?: string[];
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  updatedAt: string;
}

const SETTINGS_DOC_PATH = 'settings/site';

/**
 * Listen to real-time updates of site settings (hidden products, prices)
 */
export function subscribeToSiteSettings(
  onUpdate: (data: SiteSettingsData | null) => void,
  onError?: (err: unknown) => void
) {
  const docRef = doc(db, 'settings', 'site');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SiteSettingsData);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH);
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save site settings (hidden products & prices) to Firestore without overflowing 1MB document limit
 */
export async function saveSiteSettingsToFirestore(data: Partial<SiteSettingsData>): Promise<void> {
  const docRef = doc(db, 'settings', 'site');
  const payload: SiteSettingsData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SETTINGS_DOC_PATH);
  }
}

/**
 * Listen to real-time custom images stored across the custom_images collection
 * Each image has its own document (preventing the 1MB single-document limit)
 */
export function subscribeToCustomImages(
  onUpdate: (images: Record<string, string>) => void,
  onError?: (err: unknown) => void
) {
  const colRef = collection(db, 'custom_images');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.imageUrl) {
          images[docSnap.id] = data.imageUrl;
        }
      });
      onUpdate(images);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'custom_images');
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Save an individual product/site image to its own Firestore document in custom_images/{productId}
 */
export async function saveCustomImageToFirestore(productId: string, imageUrl: string): Promise<void> {
  const docRef = doc(db, 'custom_images', productId);
  const path = `custom_images/${productId}`;
  const payload = {
    imageUrl,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Reset/Delete an image from custom_images collection in Firestore
 */
export async function deleteCustomImageFromFirestore(productId: string): Promise<void> {
  const docRef = doc(db, 'custom_images', productId);
  const path = `custom_images/${productId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Client-side high efficiency image compressor using HTML5 Canvas.
 * Compresses any 3MB-10MB mobile camera photo to ~40KB - 80KB crisp Web/JPEG format.
 */
export function compressImageFile(file: File, maxWidth = 900, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface ConsultationLeadPayload {
  fullName: string;
  phoneNumber: string;
  recipient?: 'Vợ' | 'Mẹ' | 'Người thân';
  budgetTier?: string;
  interestedProducts?: string;
  deliveryArea?: string;
  giftNote?: string;
}

/**
 * Submit consultation lead to Firestore
 */
export async function submitConsultationLead(lead: ConsultationLeadPayload): Promise<string> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const path = `leads/${id}`;
  const docRef = doc(db, 'leads', id);

  const payload = {
    ...lead,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
}

/**
 * Google Sign-In for Admin
 */
export async function loginAdminWithGoogle(): Promise<{ email: string | null; isAdmin: boolean }> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const isOwner = user.email === 'nguyminhtuan10C2@gmail.com';
    return { email: user.email, isAdmin: isOwner };
  } catch (error) {
    console.error('Google Sign-In failed', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function logoutFirebaseAuth(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed', error);
  }
}
