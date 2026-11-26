import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const FIRESTORE_DATABASE_ID: string =
  (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-kdt89qu2010choan-50d6ee59-b9d5-4577-a226-e1557bd24956';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firestoreDatabaseId according to Firebase Skill; enable local persistence to reduce repeated reads
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    FIRESTORE_DATABASE_ID
  );
} catch {
  firestoreInstance = getFirestore(app, FIRESTORE_DATABASE_ID);
}
export const db = firestoreInstance;
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

export function isFirestoreQuotaError(error: unknown): boolean {
  const code = (error as any)?.code || '';
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return code === 'resource-exhausted' || msg.includes('quota') || msg.includes('resource-exhausted');
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
import type { ProductItem, ComboItem, CategoryItem } from '../data/products';
import type { VoucherItem } from '../data/vouchers';
import type {
  HeroSlideConfig,
  HeroAspectRatio,
  HeroMobileAspectRatio,
  HeroSlideFit,
} from '../data/heroSlides';
import { SHEETS_SCOPES, setSheetsAccessToken } from './googleSheets';
import type { ShippingConfig } from './shipping';

export interface CategoryOverride {
  name?: string;
  subTitle?: string;
  tagline?: string;
}

export interface MegaSaleCampaignConfig {
  enabled: boolean;
  campaignId: string; // 'double_11' | 'black_friday' | 'double_12' | 'tet_holiday' | 'year_end' | 'custom'
  title: string;
  badge: string;
  subtitle: string;
  startDate: string; // ISO format e.g. '2026-11-09T00:00'
  endDate: string; // ISO format e.g. '2026-11-13T23:59'
  teaserStartDate: string; // ISO format e.g. '2026-11-08T00:00' (hoặc '2026-11-02T00:00')
  highlights?: string;
  theme?: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  buttonTextUpcoming?: string;
  buttonTextLive?: string;
  earlyBirdSlots?: number;
}

export interface SiteDecorSettings {
  showCountdown?: boolean;
  activeSaleCampaignId?: string; // 'double_11' | 'black_friday' | 'double_12' | 'tet_holiday' | 'year_end' | 'daily_flash'
  allowCustomerSwitchCampaign?: boolean; // Allow visitors to click and preview countdown of other upcoming big sales
  countdownTitle?: string;
  countdownSubtitle?: string;
  countdownTargetDate?: string;
  countdownMode?: 'daily' | 'target_date' | 'campaign';
  countdownBadge?: string;
  countdownSoldPercent?: number;
  countdownButtonText?: string;
  countdownTheme?: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  fallingEffect?: 'none' | 'sakura' | 'red_envelope' | 'confetti' | 'snow' | 'stars' | 'hearts';
  fallingSpeed?: 'slow' | 'normal' | 'fast';
  showLiveOrderTicker?: boolean;
  showCornerRibbon?: boolean;
  cornerRibbonText?: string;
  enablePulsingCta?: boolean;
  showBudgetFilter?: boolean; // Bật / Tắt bộ lọc bảng giá ngân sách (Price Range Slider)
  megaSaleConfig?: MegaSaleCampaignConfig;
  flashSaleMode?: 'auto' | 'teaser' | 'live'; // 'auto': tự động theo ngày | 'teaser': đếm đến ngày sale | 'live': đang diễn ra flash sale ngay bây giờ
  showFlagshipDeals?: boolean; // Bật / Tắt khối Deal Chủ Lực / Flash Sale đầu danh mục
  flagshipProductIds?: string[]; // Danh sách ID sản phẩm hiển thị trong khối Deal Chủ Lực / Flash Sale (theo thứ tự)
  showWelcomePopup?: boolean; // Bật / Tắt Pop-up / Slide chào mừng hướng dẫn đăng ký & giỏ hàng cho khách mới
  customVouchers?: VoucherItem[]; // Danh sách Voucher tùy chỉnh giá trị từ Admin
  heroLayoutMode?: 'slider' | 'classic'; // 'slider': Slide ảnh kiểu ĐMX | 'classic': Chữ + Ảnh
  heroAspectRatio?: HeroAspectRatio; // Tỉ lệ khung slide trên Máy tính ('5/1' | '16/7' | '2/1' | '16/9')
  mobileHeroAspectRatio?: HeroMobileAspectRatio; // Tỉ lệ khung slide riêng trên Điện thoại ('16/9' | '2/1' | '4/3')
  memberVisualFit?: HeroSlideFit; // Cách hiển thị ảnh bên trái Slide #1 trên Máy tính
  mobileMemberVisualFit?: HeroSlideFit; // Cách hiển thị ảnh Slide #1 trên Điện thoại
  showMemberHeroSlide?: boolean; // Hiện Slide #1 Ảnh minh họa & Đăng nhập SĐT trên Máy tính
  showMemberHeroSlideMobile?: boolean; // Hiện Slide #1 trên Điện thoại (mặc định theo PC nếu chưa chỉnh)
  heroSlides?: HeroSlideConfig[]; // Danh sách Slide ảnh banner đầu trang
  googleSheetId?: string; // ID Google Sheet đồng bộ đơn hàng & khách hàng
  googleSheetTitle?: string; // Tên bảng tính Google Sheet đang liên kết
  googleSheetUrl?: string; // Link mở nhanh Google Sheet
  googleSheetWebhookUrl?: string; // Link Google Apps Script Web App nhận đơn tự động 24/7 khi livestream
  googleSheetAutoSyncOnAdmin?: boolean; // Tự động đẩy đơn mới vào Sheet khi đang mở /admin
  shippingConfig?: ShippingConfig; // Cấu hình tọa độ kho & bảng giá tính tạm phí ship (OpenStreetMap)
}

export interface SiteSettingsData {
  hiddenProductIds?: string[];
  hiddenComboIds?: string[];
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  customProducts?: ProductItem[];
  deletedProductIds?: string[];
  editedProducts?: Record<string, Partial<ProductItem>>;
  customCombos?: ComboItem[];
  deletedComboIds?: string[];
  customCategories?: Record<string, CategoryOverride>;
  customTexts?: Record<string, string>;
  customSeo?: { title?: string; description?: string };
  hiddenSections?: string[];
  addedCategories?: CategoryItem[];
  deletedCategoryIds?: string[];
  decorSettings?: SiteDecorSettings;
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
      if (isFirestoreQuotaError(error)) {
        console.warn('Firestore daily read quota reached on settings/site; falling back to local cache.');
        if (onError) onError(error);
        return;
      }
      try {
        handleFirestoreError(error, OperationType.GET, SETTINGS_DOC_PATH);
      } catch (e) {
        if (onError) onError(e);
      }
    }
  );
}

/**
 * Recursively strip all keys with `undefined` values so Firestore setDoc/updateDoc never throws
 * "Unsupported field value: undefined".
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

/**
 * Save site settings (hidden products & prices) to Firestore without overflowing 1MB document limit
 */
export async function saveSiteSettingsToFirestore(data: Partial<SiteSettingsData>): Promise<void> {
  const docRef = doc(db, 'settings', 'site');
  const payload: SiteSettingsData = stripUndefinedDeep({
    ...data,
    updatedAt: new Date().toISOString(),
  });

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
      if (isFirestoreQuotaError(error)) {
        console.warn('Firestore daily read quota reached on custom_images; falling back to local cache.');
        if (onError) onError(error);
        return;
      }
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
 * Client-side smart high-clarity image compressor using HTML5 Canvas.
 * - Preserves original pixel-for-pixel data URL if already within maxWidth and <= 520KB (zero quality loss!).
 * - Otherwise scales smoothly and encodes as crisp WebP (or high-quality JPEG fallback) within Firestore's 1MB doc limit.
 */
export function compressImageFile(file: File, maxWidth = 1000, quality = 0.92): Promise<string> {
  const MAX_DATA_URL_LENGTH = 860_000; // ~645KB binary, safely under Firestore 1MB doc limit
  const PASSTHROUGH_MAX_BYTES = 520_000; // ~508KB raw file (~690KB base64)

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const originalDataUrl = reader.result as string;
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // 1. Keep crisp original untouched when already sized nicely for Firestore
        if (
          img.width <= maxWidth &&
          file.size <= PASSTHROUGH_MAX_BYTES &&
          originalDataUrl.length <= MAX_DATA_URL_LENGTH
        ) {
          resolve(originalDataUrl);
          return;
        }

        let targetWidth = img.width;
        let targetHeight = img.height;

        if (targetWidth > maxWidth) {
          targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
          targetWidth = maxWidth;
        }

        const renderWithParams = (w: number, h: number, mime: string, q: number): string => {
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return originalDataUrl;

          if (mime === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          return canvas.toDataURL(mime, q);
        };

        // Prefer WebP for crisp banner text + alpha transparency support; fallback to JPEG
        const probe = renderWithParams(Math.min(targetWidth, 16), Math.min(targetHeight, 16), 'image/webp', 0.9);
        const preferredMime = probe.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';

        // Try requested crisp quality first, then gently step down only if still too large for Firestore
        const qualitySteps = Array.from(
          new Set([
            Math.max(quality, 0.92),
            quality,
            0.88,
            0.82,
            0.75,
          ])
        ).sort((a, b) => b - a);

        let bestOutput = '';
        for (const q of qualitySteps) {
          const candidate = renderWithParams(targetWidth, targetHeight, preferredMime, q);
          bestOutput = candidate;
          if (candidate.length <= MAX_DATA_URL_LENGTH) {
            resolve(candidate);
            return;
          }
        }

        // If still over cap on huge high-res images, reduce dimensions 20% and encode at 0.85
        const scaledW = Math.round(targetWidth * 0.8);
        const scaledH = Math.round(targetHeight * 0.8);
        const smallerOutput = renderWithParams(scaledW, scaledH, preferredMime, 0.85);
        resolve(smallerOutput.length < bestOutput.length ? smallerOutput : bestOutput);
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export interface ConsultationLeadPayload {
  fullName: string;
  phoneNumber: string;
  recipient?: 'Vợ' | 'Mẹ' | 'Người thân' | string;
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

  const payload = stripUndefinedDeep({
    ...lead,
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
}

export const ADMIN_OWNER_EMAIL = 'nguyminhtuan10C2@gmail.com';
export const ADMIN_PASSWORD_LOGIN_EMAIL = 'ngmtuan241@gmail.com';
export const ADMIN_ALLOWED_UIDS = [
  '3STmRAtnyWgEupbAxIkbzfC7vSk1',
  'Eal5QIU6ALSidbA5Zb06s0s0hQU2',
  'Eal5QlU6ALSidbA5Zb06s0s0hQU2',
  'EaI5QIU6ALSidbA5Zb06s0s0hQU2',
  'SUk5r6tl8NhvjdNa7bqUGG4vcK53',
];
export const ADMIN_NOTIFICATION_EMAIL = ADMIN_OWNER_EMAIL;

export function isAuthorizedAdminUser(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.uid && ADMIN_ALLOWED_UIDS.includes(user.uid)) {
    return true;
  }
  if (!user.email) return false;
  return (
    user.email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase() &&
    user.emailVerified === true
  );
}

export function isOwnerEmailUnverified(user: User | null | undefined): boolean {
  if (!user || !user.email) return false;
  return (
    user.email.toLowerCase() === ADMIN_OWNER_EMAIL.toLowerCase() &&
    user.emailVerified !== true
  );
}

/**
 * Google Sign-In for Admin
 */
export async function loginAdminWithGoogle(): Promise<{
  email: string | null;
  isAdmin: boolean;
  needsVerification?: boolean;
  cancelled?: boolean;
}> {
  const provider = new GoogleAuthProvider();
  SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;
    if (credential?.accessToken) {
      setSheetsAccessToken(credential.accessToken, user.email);
    }
    return {
      email: user.email,
      isAdmin: isAuthorizedAdminUser(user),
      needsVerification: isOwnerEmailUnverified(user),
    };
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      return { email: null, isAdmin: false, cancelled: true };
    }
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'Trình duyệt đã chặn cửa sổ đăng nhập Google popup. Vui lòng bật cho phép popup rồi thử lại.'
      );
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      throw new Error(
        `Domain "${host}" chưa được thêm vào Authorized domains trong Firebase Authentication. Bạn có thể đăng nhập bằng Email/Mật khẩu ở trên hoặc thêm domain này trong Firebase Console.`
      );
    }
    console.warn('Google Sign-In status:', error?.message || error);
    throw error;
  }
}

export function resolveAdminLoginIdentifier(identifier: string): string {
  const clean = identifier.trim();
  if (!clean) {
    throw new Error('Vui lòng nhập tên đăng nhập (ví dụ: admin) hoặc email.');
  }
  if (clean.toLowerCase() === 'admin') {
    return ADMIN_PASSWORD_LOGIN_EMAIL;
  }
  if (clean.includes('@')) {
    return clean;
  }
  throw new Error(
    `Tên đăng nhập "${clean}" không hợp lệ. Vui lòng nhập "admin" hoặc địa chỉ email đầy đủ.`
  );
}

export interface AdminAccessVerificationResult {
  email: string | null;
  uid: string | null;
  isAdmin: boolean;
  needsVerification: boolean;
  diagnosticError: string | null;
}

/**
 * Optional handover check against Firestore /admins/{uid}
 */
export async function checkAdminAllowlistDoc(
  uid: string
): Promise<'found' | 'not_found' | 'permission_denied'> {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() ? 'found' : 'not_found';
  } catch (err: any) {
    const code = err?.code || '';
    const msg = String(err?.message || '').toLowerCase();
    if (code === 'permission-denied' || msg.includes('permission')) {
      return 'permission_denied';
    }
    return 'not_found';
  }
}

export async function verifyAdminAccess(
  user: User | null | undefined
): Promise<AdminAccessVerificationResult> {
  if (!user) {
    return {
      email: null,
      uid: null,
      isAdmin: false,
      needsVerification: false,
      diagnosticError: null,
    };
  }

  const isOwner = isAuthorizedAdminUser(user);
  if (isOwner) {
    return {
      email: user.email,
      uid: user.uid,
      isAdmin: true,
      needsVerification: false,
      diagnosticError: null,
    };
  }

  // Check Firestore /admins/{uid} first (safe for Console-created handover accounts)
  const allowlistStatus = await checkAdminAllowlistDoc(user.uid);
  if (allowlistStatus === 'found') {
    return {
      email: user.email,
      uid: user.uid,
      isAdmin: true,
      needsVerification: false,
      diagnosticError: null,
    };
  }

  if (isOwnerEmailUnverified(user)) {
    return {
      email: user.email,
      uid: user.uid,
      isAdmin: false,
      needsVerification: true,
      diagnosticError: null,
    };
  }

  if (allowlistStatus === 'permission_denied') {
    return {
      email: user.email,
      uid: user.uid,
      isAdmin: false,
      needsVerification: false,
      diagnosticError: `Đã đăng nhập ${user.email} (UID: ${user.uid}), nhưng Firestore Rules trên server chưa cho phép đọc "admins/${user.uid}" (lỗi permission-denied). Hãy mở Firestore Rules của database "${FIRESTORE_DATABASE_ID}" và thêm rule match /admins/{adminId} rồi bấm Publish.`,
    };
  }

  return {
    email: user.email,
    uid: user.uid,
    isAdmin: false,
    needsVerification: false,
    diagnosticError: `Tài khoản ${user.email} chưa có document "admins/${user.uid}" trong database "${FIRESTORE_DATABASE_ID}". Hãy kiểm tra lại đúng Database ID và Document ID = ${user.uid}.`,
  };
}

/**
 * Email/Username + Password Sign-In for Admin (Firebase Auth)
 */
export async function loginAdminWithEmailPassword(
  identifier: string,
  password: string
): Promise<AdminAccessVerificationResult> {
  const resolvedEmail = resolveAdminLoginIdentifier(identifier);
  try {
    const result = await signInWithEmailAndPassword(auth, resolvedEmail, password);
    return verifyAdminAccess(result.user);
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Phương thức Email/Password chưa được bật trong Firebase Console (Authentication → Sign-in method → Email/Password).'
      );
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-email'
    ) {
      throw new Error('Tên đăng nhập hoặc mật khẩu quản trị chưa đúng. Vui lòng kiểm tra lại.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Nhập sai quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.');
    }
    if (code === 'auth/user-disabled') {
      throw new Error('Tài khoản này đã bị vô hiệu hóa trong Firebase Authentication.');
    }
    throw new Error(error?.message || 'Đăng nhập bằng Tài khoản/Mật khẩu thất bại.');
  }
}

export async function sendAdminVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Chưa có phiên đăng nhập hiện tại.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function reloadAdminAuthUser(): Promise<AdminAccessVerificationResult> {
  if (!auth.currentUser) {
    return {
      email: null,
      uid: null,
      isAdmin: false,
      needsVerification: false,
      diagnosticError: null,
    };
  }
  await auth.currentUser.reload();
  return verifyAdminAccess(auth.currentUser);
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

export interface StoredLead extends ConsultationLeadPayload {
  id: string;
  createdAt: string;
}

/**
 * Real-time subscription to consultation leads (Admin only)
 */
export function subscribeToLeads(
  onLeads: (leads: StoredLead[]) => void,
  onError?: (error: Error) => void
): () => void {
  const leadsRef = collection(db, 'leads');
  const q = query(leadsRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoredLead[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StoredLead);
      });
      onLeads(list);
    },
    (err) => {
      console.warn('Firestore leads sync:', err);
      if (onError) onError(err);
    }
  );
}

export interface OrderItem {
  id: string;
  name: string;
  modelCode?: string;
  price: string;
  quantity: number;
  imageUrl?: string;
}

export interface OrderPayload {
  customerName: string;
  phoneNumber: string;
  address: string;
  items: OrderItem[];
  totalAmount: string;
  recipient?: string;
  giftCardRequested?: boolean;
  paymentMethod?: string;
  appliedVoucher?: string;
  voucherDiscount?: string;
  note?: string;
  status?: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy';
}

export interface StoredOrder extends OrderPayload {
  id: string;
  createdAt: string;
}


/**
 * Submit order to Firestore
 */
export async function submitOrderToFirestore(order: OrderPayload): Promise<string> {
  const id = `kdt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const path = `orders/${id}`;
  const docRef = doc(db, 'orders', id);

  const payload: StoredOrder = stripUndefinedDeep({
    ...order,
    id,
    paymentMethod: order.paymentMethod || 'Thanh toán khi nhận hàng & kiểm tra (COD)',
    status: order.status || 'Mới',
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(docRef, payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return id;
  }
}

/**
 * Send order notification email to admin email (nguyminhtuan10C2@gmail.com)
 * Uses FormSubmit.co background dispatch with HTML formatting + fallback mailto link
 */
export async function sendOrderEmailNotification(order: StoredOrder, targetEmail = ADMIN_NOTIFICATION_EMAIL): Promise<{ success: boolean; message: string }> {
  try {
    const itemsListHtml = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.name} ${it.modelCode ? `(${it.modelCode})` : ''} - Số lượng: ${it.quantity} - Đơn giá: ${it.price}`
      )
      .join('\n');

    const bodyPayload: Record<string, string> = {
      _subject: `🔔 [ĐƠN HÀNG MỚI KDT-89] Khách hàng ${order.customerName} - SĐT: ${order.phoneNumber}`,
      _template: 'table',
      _captcha: 'false',
      'Mã đơn hàng': order.id,
      'Tên khách hàng': order.customerName,
      'Số điện thoại': order.phoneNumber,
      'Địa chỉ giao hàng': order.address,
      'Người nhận / Mục đích': order.recipient || 'Tự dùng / Không chỉ định',
      'Yêu cầu gói quà & thiệp': order.giftCardRequested ? 'CÓ (Miễn phí 100%)' : 'Không',
      'Danh sách sản phẩm': itemsListHtml,
      'Tổng tiền tạm tính': order.totalAmount,
      'Hình thức thanh toán': order.paymentMethod || 'COD',
      'Ghi chú của khách': order.note || 'Không có',
      'Thời gian đặt': new Date(order.createdAt).toLocaleString('vi-VN'),
    };

    const res = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok || data.success === 'true' || (data.message && data.message.includes('Activation'))) {
      return { success: true, message: 'Đã gửi thông báo đơn hàng qua email' };
    }
    return { success: true, message: 'Đã lưu đơn hàng lên hệ thống' };
  } catch (error) {
    console.warn('Lỗi khi gửi thông báo email tự động:', error);
    // Non-blocking error, Firestore has saved it
    return { success: false, message: 'Đã ghi nhận đơn hàng lên hệ thống Firestore' };
  }
}

/**
 * Generate mailto URI for manual 1-click fallback
 */
export function generateOrderMailtoUri(order: StoredOrder, targetEmail = ADMIN_NOTIFICATION_EMAIL): string {
  const subject = encodeURIComponent(`[ĐƠN HÀNG MỚI KDT-89] ${order.customerName} - ${order.phoneNumber}`);
  const itemsText = order.items
    .map((it, idx) => `  ${idx + 1}. ${it.name} ${it.modelCode ? `[${it.modelCode}]` : ''} x${it.quantity}: ${it.price}`)
    .join('\n');

  const body = encodeURIComponent(
    `THÔNG TIN ĐƠN HÀNG KHO ĐIỆN TỬ KDT-89\n` +
    `Mã đơn: ${order.id}\n` +
    `Ngày đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}\n` +
    `----------------------------------------\n` +
    `Khách hàng: ${order.customerName}\n` +
    `Số điện thoại: ${order.phoneNumber}\n` +
    `Địa chỉ giao hàng: ${order.address}\n` +
    `Người nhận quà: ${order.recipient || 'Tự dùng / Không chỉ định'}\n` +
    `Gói quà & Thiệp: ${order.giftCardRequested ? 'CÓ (Miễn phí 100%)' : 'Không'}\n` +
    `Ghi chú: ${order.note || 'Không có'}\n` +
    `----------------------------------------\n` +
    `SẢN PHẨM ĐẶT MUA:\n${itemsText}\n` +
    `----------------------------------------\n` +
    `TỔNG TIỀN TẠM TÍNH: ${order.totalAmount}\n` +
    `Hình thức: ${order.paymentMethod || 'COD'}\n`
  );

  return `mailto:${targetEmail}?subject=${subject}&body=${body}`;
}

/**
 * Real-time subscription to orders (Admin only)
 */
export function subscribeToOrders(
  onOrders: (orders: StoredOrder[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ordersRef = collection(db, 'orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoredOrder[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as StoredOrder);
      });
      onOrders(list);
    },
    (err) => {
      console.warn('Firestore orders sync:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: 'Mới' | 'Đã liên hệ' | 'Đang giao' | 'Hoàn thành' | 'Đã hủy'
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const path = `orders/${orderId}`;

  try {
    await updateDoc(docRef, { status: newStatus });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Update delivery address and optional note on an existing order (Step 2 of 2-step hold flow)
 */
export async function updateOrderAddressInFirestore(
  orderId: string,
  address: string,
  note?: string
): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const path = `orders/${orderId}`;
  const updates: Record<string, string> = {
    address: address.trim().slice(0, 300),
  };
  if (note && note.trim()) {
    updates.note = note.trim().slice(0, 500);
  }

  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  const docRef = doc(db, 'orders', orderId);
  const path = `orders/${orderId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   CUSTOMER ACCOUNT & VOUCHER REDEMPTION
   Khách hàng tạo tài khoản đăng nhập (Họ tên, SĐT, Mật khẩu, Địa chỉ)
   Mỗi số điện thoại nhận ví voucher, và mỗi voucher chỉ dùng 1 lần/SĐT
   ========================================================================= */

import type { CustomerAccount, VoucherRedemptionRecord } from '../data/vouchers';

/**
 * Register a new customer account
 */
export async function registerCustomerAccount(data: {
  fullName: string;
  phoneNumber: string;
  password?: string;
  address?: string;
  voucherCodes?: string[];
}): Promise<CustomerAccount> {
  const cleanPhone = data.phoneNumber.replace(/[^0-9]/g, '').slice(0, 25);
  if (cleanPhone.length < 8) {
    throw new Error('Số điện thoại phải có ít nhất 8 chữ số hợp lệ.');
  }

  const cleanName = data.fullName.trim().slice(0, 100);
  if (!cleanName) {
    throw new Error('Vui lòng nhập họ và tên hợp lệ.');
  }

  const docRef = doc(db, 'customers', cleanPhone);
  const path = `customers/${cleanPhone}`;

  const existingSnap = await getDocFromServer(docRef).catch(() => getDoc(docRef).catch(() => null));
  if (existingSnap && existingSnap.exists()) {
    throw new Error('Số điện thoại này đã được đăng ký tài khoản trước đó. Vui lòng bấm sang tab Đăng Nhập!');
  }

  const rawCodes =
    data.voucherCodes && data.voucherCodes.length > 0
      ? data.voucherCodes
      : ['KDT89-50K', 'KDT89-100K', 'KDT89-200K'];
  const claimedCodes = rawCodes
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .slice(0, 20);

  const nowIso = new Date().toISOString();
  const newAccount: CustomerAccount = stripUndefinedDeep({
    fullName: cleanName,
    phoneNumber: cleanPhone,
    registeredAt: nowIso,
    lastLoginAt: nowIso,
    vouchersClaimed: claimedCodes,
    ...(data.password && data.password.trim()
      ? { password: data.password.trim().slice(0, 100) }
      : {}),
    ...(data.address && data.address.trim()
      ? { address: data.address.trim().slice(0, 300) }
      : {}),
  });

  try {
    await setDoc(docRef, newAccount);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return newAccount;
}

/**
 * Sync delivery address back to registered customer profile when they place/update an order
 */
export async function updateCustomerAddressIfRegistered(
  phoneNumber: string,
  address?: string,
  fullName?: string
): Promise<void> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(0, 25);
  if (cleanPhone.length < 8) return;
  const docRef = doc(db, 'customers', cleanPhone);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const updates: Record<string, string> = {
      lastLoginAt: new Date().toISOString(),
    };
    const trimmedAddr = (address || '').trim();
    if (
      trimmedAddr &&
      !trimmedAddr.startsWith('Sale xác nhận tồn')
    ) {
      updates.address = trimmedAddr.slice(0, 300);
    }
    const trimmedName = (fullName || '').trim();
    if (trimmedName) {
      updates.fullName = trimmedName.slice(0, 100);
    }
    await updateDoc(docRef, updates);
  } catch {
    // Non-blocking profile enrichment
  }
}

/**
 * Non-blocking email alert when a customer registers an account
 */
export async function sendCustomerRegistrationEmailNotification(
  account: CustomerAccount,
  targetEmail = ADMIN_NOTIFICATION_EMAIL
): Promise<void> {
  try {
    await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        _subject: `👤 [KHÁCH ĐĂNG KÝ MỚI KDT-89] ${account.fullName} - ${account.phoneNumber}`,
        _template: 'table',
        _captcha: 'false',
        'Họ và tên': account.fullName,
        'Số điện thoại / Zalo': account.phoneNumber,
        'Địa chỉ': account.address || 'Chưa cập nhật',
        'Voucher đã nhận': (account.vouchersClaimed || []).join(', '),
        'Thời gian đăng ký': new Date(account.registeredAt).toLocaleString('vi-VN'),
      }),
    });
  } catch {
    // Non-blocking; Firestore already persisted the customer record
  }
}

/**
 * Admin: Delete a customer record from Firestore
 */
export async function deleteCustomerFromFirestore(phoneNumber: string): Promise<void> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanPhone) return;
  const path = `customers/${cleanPhone}`;
  try {
    await deleteDoc(doc(db, 'customers', cleanPhone));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Customer login with Phone number & optional password
 */
export async function loginCustomerAccount(
  phoneNumber: string,
  password?: string
): Promise<CustomerAccount> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const docRef = doc(db, 'customers', cleanPhone);

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Số điện thoại này chưa có tài khoản. Vui lòng bấm sang tab "Tạo tài khoản" để kích hoạt ví voucher!');
  }

  const account = snap.data() as CustomerAccount;

  // If account has password and user provided password, verify
  if (account.password && password) {
    if (account.password !== password.trim()) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
    }
  }

  // Update last login
  try {
    await updateDoc(docRef, { lastLoginAt: new Date().toISOString() });
    account.lastLoginAt = new Date().toISOString();
  } catch (e) {
    // ignore
  }

  return account;
}

/**
 * Quick register or login customer by Name & Phone number (for backwards compatibility)
 */
export async function registerOrLoginCustomer(fullName: string, phoneNumber: string): Promise<CustomerAccount> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const docRef = doc(db, 'customers', cleanPhone);

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as CustomerAccount;
      if (fullName && fullName.trim() !== data.fullName) {
        await updateDoc(docRef, { fullName: fullName.trim() });
        data.fullName = fullName.trim();
      }
      return data;
    } else {
      const newAccount: CustomerAccount = {
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        registeredAt: new Date().toISOString(),
        vouchersClaimed: ['KDT89-100K', 'KDT89-200K', 'KDT89-500K'],
      };
      await setDoc(docRef, newAccount);
      return newAccount;
    }
  } catch (error) {
    console.warn('Firestore customer account sync fallback:', error);
    return {
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      registeredAt: new Date().toISOString(),
      vouchersClaimed: ['KDT89-100K', 'KDT89-200K', 'KDT89-500K'],
    };
  }
}

/**
 * Check if a voucher code has already been redeemed by this phone number
 * Rule: "mỗi sdt mua 1 lần sẽ được dùng voucher 1 lần"
 */
export async function checkVoucherRedeemed(phoneNumber: string, voucherCode: string): Promise<boolean> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const redemptionId = `${voucherCode}_${cleanPhone}`;
  const docRef = doc(db, 'voucher_redemptions', redemptionId);

  try {
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (error) {
    console.warn('Check voucher redemption error:', error);
    return false;
  }
}

/**
 * Record a voucher redemption for a phone number
 */
export async function recordVoucherRedemption(
  phoneNumber: string,
  customerName: string,
  voucherCode: string,
  discountAmount: number,
  orderId: string
): Promise<void> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const redemptionId = `${voucherCode}_${cleanPhone}`;
  const path = `voucher_redemptions/${redemptionId}`;
  const docRef = doc(db, 'voucher_redemptions', redemptionId);

  const payload: VoucherRedemptionRecord = {
    id: redemptionId,
    phoneNumber: cleanPhone,
    customerName,
    voucherCode,
    discountAmount,
    orderId,
    usedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Get all redeemed vouchers for a specific phone number
 */
export async function getCustomerRedeemedVouchers(
  phoneNumber: string,
  voucherCodes?: string[]
): Promise<string[]> {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const vouchersToCheck =
    voucherCodes && voucherCodes.length > 0
      ? voucherCodes
      : ['KDT89-50K', 'KDT89-100K', 'KDT89-200K', 'KDT89-500K'];
  const redeemed: string[] = [];

  for (const vCode of vouchersToCheck) {
    const isRedeemed = await checkVoucherRedeemed(cleanPhone, vCode);
    if (isRedeemed) redeemed.push(vCode);
  }

  return redeemed;
}

/**
 * Admin: Subscribe to all voucher redemptions
 */
export function subscribeToVoucherRedemptions(
  onRedemptions: (records: VoucherRedemptionRecord[]) => void
): () => void {
  const colRef = collection(db, 'voucher_redemptions');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: VoucherRedemptionRecord[] = [];
      snapshot.forEach((snap) => {
        list.push({ ...snap.data(), id: snap.id } as VoucherRedemptionRecord);
      });
      onRedemptions(list);
    },
    (err) => {
      console.warn('Voucher redemptions sync error:', err);
    }
  );
}

/**
 * Admin: Reset a voucher redemption for a phone number
 */
export async function resetVoucherRedemption(redemptionId: string): Promise<void> {
  const docRef = doc(db, 'voucher_redemptions', redemptionId);
  const path = `voucher_redemptions/${redemptionId}`;

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Admin: Real-time subscription to registered customer accounts (First-party customer data)
 */
export function subscribeToCustomers(
  onCustomers: (customers: CustomerAccount[]) => void,
  onError?: (error: Error) => void
): () => void {
  const customersRef = collection(db, 'customers');
  const q = query(customersRef, orderBy('registeredAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: CustomerAccount[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CustomerAccount);
      });
      onCustomers(list);
    },
    (err) => {
      console.warn('Firestore customers sync:', err);
      if (onError) onError(err);
    }
  );
}



