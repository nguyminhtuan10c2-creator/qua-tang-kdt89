import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import {
  db as currentDb,
  SiteSettingsData,
  StoredOrder,
  stripUndefinedDeep,
  saveCustomImageToFirestore,
  saveSiteSettingsToFirestore,
} from './firebase';
import { PRODUCTS, COMBOS } from '../data/products';
import type { CustomerAccount } from '../data/vouchers';

export interface LegacyFirebaseConfigInput {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  databaseId: string;
}

export const DEFAULT_LEGACY_SECOND_SPANNER_CONFIG: LegacyFirebaseConfigInput = {
  apiKey: 'AIzaSyAGYPxozTlBfGA3srpEylZoHdO3sFLJp_c',
  authDomain: 'second-spanner-gvxch.firebaseapp.com',
  projectId: 'second-spanner-gvxch',
  storageBucket: 'second-spanner-gvxch.firebasestorage.app',
  messagingSenderId: '172180773273',
  appId: '1:172180773273:web:eaaad5d99e525cdbb6db08',
  databaseId: 'ai-studio-kdt89qu2010choan-50d6ee59-b9d5-4577-a226-e1557bd24956',
};

export const EXTRA_SPECIAL_IMAGE_IDS = [
  'site-hero-slide-1',
  'site-hero-slide-1-mobile',
  'site-hero-slide-2',
  'site-hero-slide-2-mobile',
  'site-hero-slide-3',
  'site-hero-slide-3-mobile',
  'site-hero-slide-4',
  'site-hero-slide-4-mobile',
  'site-hero-slide-5',
  'site-hero-slide-5-mobile',
  'site-hero-slide-6',
  'site-hero-slide-6-mobile',
  'site-hero-image',
  'site-hero-banner',
  'site-logo',
  'site-member-slide-visual',
  'site-member-slide-visual-mobile',
  'site-welcome-mascot',
];

export interface LegacyScanResult {
  databaseIdUsed: string;
  signedInEmail: string | null;
  settings: Partial<SiteSettingsData> | null;
  images: Record<string, string>;
  orders: StoredOrder[];
  customers: CustomerAccount[];
  ordersAccessDenied: boolean;
  customersAccessDenied: boolean;
  warnings: string[];
}

export interface LegacyImportProgress {
  phase: 'images' | 'settings' | 'orders' | 'customers' | 'done';
  current: number;
  total: number;
  message: string;
}

export interface LegacyImportResult {
  imagesImported: number;
  imagesSkipped: number;
  settingsImported: boolean;
  ordersImported: number;
  customersImported: number;
  errors: string[];
}

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

function getOrCreateLegacyApp(config: LegacyFirebaseConfigInput): FirebaseApp {
  const safeKey = `${config.projectId}-${config.apiKey.slice(-6)}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const appName = `legacy_recovery_${safeKey}`;
  const existing = getApps().find((a) => a.name === appName);
  if (existing) return existing;
  return initializeApp(
    {
      apiKey: config.apiKey.trim(),
      authDomain: config.authDomain.trim(),
      projectId: config.projectId.trim(),
      storageBucket: config.storageBucket?.trim() || `${config.projectId.trim()}.firebasestorage.app`,
      messagingSenderId: config.messagingSenderId?.trim() || '',
      appId: config.appId.trim(),
    },
    appName
  );
}

function getLegacyFirestore(app: FirebaseApp, databaseId: string): Firestore {
  const cleanDbId = databaseId.trim() || '(default)';
  return cleanDbId === '(default)' ? getFirestore(app) : getFirestore(app, cleanDbId);
}

export function getLegacyAuthCurrentEmail(config: LegacyFirebaseConfigInput): string | null {
  try {
    const app = getOrCreateLegacyApp(config);
    return getAuth(app).currentUser?.email || null;
  } catch {
    return null;
  }
}

export async function signInLegacyWithGoogle(config: LegacyFirebaseConfigInput): Promise<string | null> {
  const app = getOrCreateLegacyApp(config);
  const legacyAuth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(legacyAuth, provider);
  return cred.user?.email || null;
}

export async function signOutLegacyGoogle(config: LegacyFirebaseConfigInput): Promise<void> {
  const app = getOrCreateLegacyApp(config);
  const legacyAuth = getAuth(app);
  if (legacyAuth.currentUser) {
    await signOut(legacyAuth);
  }
}

export function parseFirebaseConfigSnippet(raw: string): Partial<LegacyFirebaseConfigInput> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    // Allow pasting JS `const firebaseConfig = { ... };` or plain JSON
    const extractField = (field: string): string | undefined => {
      const m = trimmed.match(new RegExp(`["']?${field}["']?\\s*:\\s*["']([^"']+)["']`));
      return m?.[1]?.trim();
    };
    const apiKey = extractField('apiKey');
    const projectId = extractField('projectId');
    if (!apiKey || !projectId) return null;
    return {
      apiKey,
      projectId,
      authDomain: extractField('authDomain') || `${projectId}.firebaseapp.com`,
      storageBucket: extractField('storageBucket') || `${projectId}.firebasestorage.app`,
      messagingSenderId: extractField('messagingSenderId') || '',
      appId: extractField('appId') || '',
      databaseId: extractField('firestoreDatabaseId') || extractField('databaseId'),
    };
  } catch {
    return null;
  }
}

export async function scanLegacyFirebaseProject(
  config: LegacyFirebaseConfigInput,
  extraCandidateIds: string[] = []
): Promise<LegacyScanResult> {
  const app = getOrCreateLegacyApp(config);
  const legacyAuth = getAuth(app);
  const signedInEmail = legacyAuth.currentUser?.email || null;
  const warnings: string[] = [];

  const candidateDbs = Array.from(
    new Set(
      [
        config.databaseId?.trim(),
        'ai-studio-kdt89qu2010choan-50d6ee59-b9d5-4577-a226-e1557bd24956',
        '(default)',
      ].filter((v): v is string => Boolean(v))
    )
  );

  let selectedDb: Firestore | null = null;
  let databaseIdUsed = candidateDbs[0] || '(default)';
  let settings: Partial<SiteSettingsData> | null = null;

  for (const dbId of candidateDbs) {
    const testDb = getLegacyFirestore(app, dbId);
    try {
      const snap = await getDocFromServer(doc(testDb, 'settings', 'site'));
      selectedDb = testDb;
      databaseIdUsed = dbId;
      if (snap.exists()) {
        settings = snap.data() as Partial<SiteSettingsData>;
        break;
      }
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      if (msg.includes('does not exist') || msg.includes('not_found')) {
        continue;
      }
      // Database exists even if permission-denied or transient
      selectedDb = testDb;
      databaseIdUsed = dbId;
      break;
    }
  }

  if (!selectedDb) {
    selectedDb = getLegacyFirestore(app, databaseIdUsed);
  }

  const images: Record<string, string> = {};

  // 1. Extract legacy inline customImages map inside settings/site if present
  const inlineImages = (settings as any)?.customImages;
  if (inlineImages && typeof inlineImages === 'object') {
    for (const [k, v] of Object.entries(inlineImages)) {
      if (typeof v === 'string' && v.trim()) {
        images[k] = v.trim();
      }
    }
  }

  // 2. Try full collection list (works if signed in as admin on legacy project or list is public)
  let listedCollectionSucceeded = false;
  try {
    const colSnap = await getDocsFromServer(collection(selectedDb, 'custom_images'));
    listedCollectionSucceeded = true;
    colSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
        images[docSnap.id] = data.imageUrl.trim();
      }
    });
  } catch {
    listedCollectionSucceeded = false;
  }

  // 3. Always probe known product/combo/banner/slide/customProduct IDs via single-doc getDocFromServer
  // (Old firestore.rules often allow `get` by ID without allowing `list`!)
  if (!listedCollectionSucceeded) {
    const candidateIdSet = new Set<string>([
      ...EXTRA_SPECIAL_IMAGE_IDS,
      ...PRODUCTS.map((p) => p.id),
      ...COMBOS.map((c) => c.id),
      ...extraCandidateIds,
    ]);

    if (Array.isArray(settings?.customProducts)) {
      for (const cp of settings.customProducts) {
        if (cp?.id) candidateIdSet.add(cp.id);
      }
    }
    if (settings?.editedProducts && typeof settings.editedProducts === 'object') {
      for (const id of Object.keys(settings.editedProducts)) {
        candidateIdSet.add(id);
      }
    }
    if (Array.isArray(settings?.decorSettings?.heroSlides)) {
      for (const s of settings.decorSettings.heroSlides) {
        if (s?.imageKey) candidateIdSet.add(s.imageKey);
        if (s?.mobileImageKey) candidateIdSet.add(s.mobileImageKey);
      }
    }

    const ids = Array.from(candidateIdSet).filter((id) => VALID_ID_REGEX.test(id));
    const BATCH_SIZE = 12;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (id) => {
          if (images[id]) return;
          try {
            const snap = await getDocFromServer(doc(selectedDb!, 'custom_images', id));
            if (snap.exists()) {
              const data = snap.data();
              if (data && typeof data.imageUrl === 'string' && data.imageUrl.trim()) {
                images[id] = data.imageUrl.trim();
              }
            }
          } catch {
            // Ignore missing or denied individual docs
          }
        })
      );
    }
  }

  // 4. Try reading orders & customers (available if signed in as admin on legacy project)
  let orders: StoredOrder[] = [];
  let ordersAccessDenied = false;
  try {
    const ordersSnap = await getDocsFromServer(collection(selectedDb, 'orders'));
    orders = ordersSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<StoredOrder, 'id'>),
    }));
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('permission') || err?.code === 'permission-denied') {
      ordersAccessDenied = true;
    } else {
      warnings.push(`Không đọc được đơn hàng cũ: ${err?.message || 'Lỗi kết nối'}`);
    }
  }

  let customers: CustomerAccount[] = [];
  let customersAccessDenied = false;
  try {
    const custSnap = await getDocsFromServer(collection(selectedDb, 'customers'));
    customers = custSnap.docs.map((d) => d.data() as CustomerAccount);
  } catch (err: any) {
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('permission') || err?.code === 'permission-denied') {
      customersAccessDenied = true;
    } else {
      warnings.push(`Không đọc được danh sách khách cũ: ${err?.message || 'Lỗi kết nối'}`);
    }
  }

  return {
    databaseIdUsed,
    signedInEmail,
    settings,
    images,
    orders,
    customers,
    ordersAccessDenied,
    customersAccessDenied,
    warnings,
  };
}

function sanitizeSiteSettingsForCurrentRules(
  legacySettings: Partial<SiteSettingsData>,
  currentSettings: Partial<SiteSettingsData>
): Partial<SiteSettingsData> {
  const patch: Partial<SiteSettingsData> = {};

  if (Array.isArray(legacySettings.hiddenProductIds)) {
    patch.hiddenProductIds = legacySettings.hiddenProductIds.slice(0, 300);
  }
  if (legacySettings.customPrices && typeof legacySettings.customPrices === 'object') {
    patch.customPrices = legacySettings.customPrices;
  }
  if (Array.isArray(legacySettings.hiddenComboIds)) {
    patch.hiddenComboIds = legacySettings.hiddenComboIds.slice(0, 100);
  }
  if (Array.isArray(legacySettings.customProducts)) {
    patch.customProducts = legacySettings.customProducts.slice(0, 200);
  }
  if (Array.isArray(legacySettings.deletedProductIds)) {
    patch.deletedProductIds = legacySettings.deletedProductIds.slice(0, 300);
  }
  if (legacySettings.editedProducts && typeof legacySettings.editedProducts === 'object') {
    patch.editedProducts = legacySettings.editedProducts;
  }
  if (Array.isArray(legacySettings.customCombos)) {
    patch.customCombos = legacySettings.customCombos.slice(0, 50);
  }
  if (Array.isArray(legacySettings.deletedComboIds)) {
    patch.deletedComboIds = legacySettings.deletedComboIds.slice(0, 50);
  }
  if (legacySettings.customCategories && typeof legacySettings.customCategories === 'object') {
    patch.customCategories = legacySettings.customCategories;
  }
  if (legacySettings.customTexts && typeof legacySettings.customTexts === 'object') {
    patch.customTexts = legacySettings.customTexts;
  }
  if (legacySettings.customSeo && typeof legacySettings.customSeo === 'object') {
    patch.customSeo = legacySettings.customSeo;
  }
  if (Array.isArray(legacySettings.hiddenSections)) {
    patch.hiddenSections = legacySettings.hiddenSections.slice(0, 50);
  }
  if (Array.isArray(legacySettings.addedCategories)) {
    patch.addedCategories = legacySettings.addedCategories.slice(0, 50);
  }
  if (Array.isArray(legacySettings.deletedCategoryIds)) {
    patch.deletedCategoryIds = legacySettings.deletedCategoryIds.slice(0, 100);
  }

  if (legacySettings.decorSettings && typeof legacySettings.decorSettings === 'object') {
    const curDecor = currentSettings.decorSettings || {};
    patch.decorSettings = {
      ...legacySettings.decorSettings,
      // Keep active Google Sheets config if already connected in current database
      googleSheetId: curDecor.googleSheetId || legacySettings.decorSettings.googleSheetId,
      googleSheetTitle: curDecor.googleSheetTitle || legacySettings.decorSettings.googleSheetTitle,
      googleSheetUrl: curDecor.googleSheetUrl || legacySettings.decorSettings.googleSheetUrl,
      googleSheetWebhookUrl:
        curDecor.googleSheetWebhookUrl || legacySettings.decorSettings.googleSheetWebhookUrl,
      googleSheetAutoSyncOnAdmin:
        curDecor.googleSheetAutoSyncOnAdmin ?? legacySettings.decorSettings.googleSheetAutoSyncOnAdmin,
    };
  }

  return stripUndefinedDeep(patch);
}

async function ensureImageWithinLimit(imageUrl: string): Promise<string> {
  if (imageUrl.length <= 880_000) return imageUrl;
  if (!imageUrl.startsWith('data:image/')) return imageUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.width, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/webp', 0.82);
      resolve(compressed.length < imageUrl.length ? compressed : imageUrl);
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

function sanitizeOrderForRules(o: StoredOrder): Record<string, unknown> | null {
  if (!o.id || !VALID_ID_REGEX.test(o.id)) return null;
  if (!o.customerName || !o.phoneNumber || !o.address || !Array.isArray(o.items) || o.items.length === 0) {
    return null;
  }
  const allowedStatuses = ['Mới', 'Đã liên hệ', 'Đang giao', 'Hoàn thành', 'Đã hủy'];
  const status = o.status && allowedStatuses.includes(o.status) ? o.status : 'Mới';
  return stripUndefinedDeep({
    id: String(o.id).slice(0, 128),
    customerName: String(o.customerName).slice(0, 100),
    phoneNumber: String(o.phoneNumber).slice(0, 25),
    address: String(o.address).slice(0, 300),
    items: o.items.slice(0, 30),
    totalAmount: String(o.totalAmount || '0đ').slice(0, 50),
    recipient: o.recipient ? String(o.recipient).slice(0, 100) : undefined,
    giftCardRequested: typeof o.giftCardRequested === 'boolean' ? o.giftCardRequested : undefined,
    paymentMethod: o.paymentMethod ? String(o.paymentMethod).slice(0, 80) : undefined,
    appliedVoucher: o.appliedVoucher ? String(o.appliedVoucher).slice(0, 50) : undefined,
    voucherDiscount: o.voucherDiscount ? String(o.voucherDiscount).slice(0, 50) : undefined,
    note: o.note ? String(o.note).slice(0, 1000) : undefined,
    status,
    createdAt: String(o.createdAt || new Date().toISOString()).slice(0, 60),
  });
}

function sanitizeCustomerForRules(c: CustomerAccount): { id: string; payload: Record<string, unknown> } | null {
  const id = String(c.phoneNumber || '').trim();
  if (!id || !VALID_ID_REGEX.test(id)) return null;
  if (!c.fullName || id.length < 8 || id.length > 25) return null;
  return {
    id,
    payload: stripUndefinedDeep({
      fullName: String(c.fullName).slice(0, 100),
      phoneNumber: id,
      registeredAt: String(c.registeredAt || new Date().toISOString()).slice(0, 60),
      vouchersClaimed: Array.isArray(c.vouchersClaimed) ? c.vouchersClaimed.slice(0, 20) : undefined,
      password: c.password ? String(c.password).slice(0, 100) : undefined,
      address: c.address ? String(c.address).slice(0, 300) : undefined,
      lastLoginAt: c.lastLoginAt ? String(c.lastLoginAt).slice(0, 60) : undefined,
    }),
  };
}

export async function importLegacyDataIntoCurrentProject(params: {
  scan: LegacyScanResult;
  currentSettings: Partial<SiteSettingsData>;
  existingOrderIds: string[];
  existingCustomerPhones: string[];
  importImages: boolean;
  importSettings: boolean;
  importOrdersAndCustomers: boolean;
  onProgress?: (p: LegacyImportProgress) => void;
}): Promise<LegacyImportResult> {
  const {
    scan,
    currentSettings,
    existingOrderIds,
    existingCustomerPhones,
    importImages,
    importSettings,
    importOrdersAndCustomers,
    onProgress,
  } = params;

  const result: LegacyImportResult = {
    imagesImported: 0,
    imagesSkipped: 0,
    settingsImported: false,
    ordersImported: 0,
    customersImported: 0,
    errors: [],
  };

  // 1. Import images to custom_images
  if (importImages) {
    const entries = Object.entries(scan.images);
    for (let i = 0; i < entries.length; i++) {
      const [id, rawUrl] = entries[i];
      onProgress?.({
        phase: 'images',
        current: i + 1,
        total: entries.length,
        message: `Đang khôi phục ảnh ${i + 1}/${entries.length}: ${id}`,
      });
      if (!VALID_ID_REGEX.test(id) || !rawUrl) {
        result.imagesSkipped++;
        continue;
      }
      try {
        const safeUrl = await ensureImageWithinLimit(rawUrl);
        if (safeUrl.length > 900_000) {
          result.imagesSkipped++;
          result.errors.push(`Ảnh ${id} vượt quá 900KB nên bỏ qua.`);
          continue;
        }
        await saveCustomImageToFirestore(id, safeUrl);
        result.imagesImported++;
      } catch (err: any) {
        result.imagesSkipped++;
        result.errors.push(`Lỗi lưu ảnh ${id}: ${err?.message || 'Unknown error'}`);
      }
    }
  }

  // 2. Import settings/site
  if (importSettings && scan.settings) {
    onProgress?.({
      phase: 'settings',
      current: 1,
      total: 1,
      message: 'Đang khôi phục cài đặt sản phẩm, giá bán, chữ & slide banner...',
    });
    try {
      const sanitizedPatch = sanitizeSiteSettingsForCurrentRules(scan.settings, currentSettings);
      await saveSiteSettingsToFirestore(sanitizedPatch);
      result.settingsImported = true;
    } catch (err: any) {
      result.errors.push(`Lỗi lưu settings/site: ${err?.message || 'Unknown error'}`);
    }
  }

  // 3. Import missing orders & customers
  if (importOrdersAndCustomers) {
    const existingOrderSet = new Set(existingOrderIds);
    const missingOrders = scan.orders.filter((o) => o.id && !existingOrderSet.has(o.id));
    for (let i = 0; i < missingOrders.length; i++) {
      const order = missingOrders[i];
      onProgress?.({
        phase: 'orders',
        current: i + 1,
        total: missingOrders.length,
        message: `Đang chép đơn hàng cũ ${i + 1}/${missingOrders.length}...`,
      });
      const sanitized = sanitizeOrderForRules(order);
      if (!sanitized) continue;
      try {
        await setDoc(doc(currentDb, 'orders', order.id), sanitized, { merge: true });
        result.ordersImported++;
      } catch (err: any) {
        result.errors.push(`Lỗi chép đơn ${order.id}: ${err?.message || 'Unknown error'}`);
      }
    }

    const existingCustSet = new Set(existingCustomerPhones);
    const missingCustomers = scan.customers.filter(
      (c) => c.phoneNumber && !existingCustSet.has(c.phoneNumber)
    );
    for (let i = 0; i < missingCustomers.length; i++) {
      const cust = missingCustomers[i];
      onProgress?.({
        phase: 'customers',
        current: i + 1,
        total: missingCustomers.length,
        message: `Đang chép khách hàng cũ ${i + 1}/${missingCustomers.length}...`,
      });
      const sanitized = sanitizeCustomerForRules(cust);
      if (!sanitized) continue;
      try {
        await setDoc(doc(currentDb, 'customers', sanitized.id), sanitized.payload, { merge: true });
        result.customersImported++;
      } catch (err: any) {
        result.errors.push(`Lỗi chép khách ${sanitized.id}: ${err?.message || 'Unknown error'}`);
      }
    }
  }

  onProgress?.({
    phase: 'done',
    current: 1,
    total: 1,
    message: 'Hoàn tất khôi phục dữ liệu!',
  });

  return result;
}
