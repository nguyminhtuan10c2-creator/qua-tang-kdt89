import { Auth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import type { StoredOrder } from './firebase';
import type { CustomerAccount } from '../data/vouchers';

export const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'] as const;

// In-memory only access token cache (never stored in localStorage / sessionStorage)
let cachedSheetsAccessToken: string | null = null;
let cachedSheetsEmail: string | null = null;

export function setSheetsAccessToken(token: string | null, email?: string | null) {
  cachedSheetsAccessToken = token;
  if (email !== undefined) {
    cachedSheetsEmail = email;
  }
}

export function getSheetsAccessToken(): string | null {
  return cachedSheetsAccessToken;
}

export function getSheetsConnectedEmail(): string | null {
  return cachedSheetsEmail;
}

export function clearSheetsAccessToken() {
  cachedSheetsAccessToken = null;
  cachedSheetsEmail = null;
}

export function initSheetsAuthListener(
  auth: Auth,
  onStatusChange?: (connected: boolean, email: string | null) => void
): () => void {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (!user) {
      clearSheetsAccessToken();
      if (onStatusChange) onStatusChange(false, null);
    } else if (cachedSheetsAccessToken) {
      if (onStatusChange) onStatusChange(true, cachedSheetsEmail || user.email);
    } else {
      if (onStatusChange) onStatusChange(false, null);
    }
  });
}

/**
 * Authenticate with Google Popup requesting Google Sheets access scope.
 * Uses the existing Firebase Auth instance (no duplicate initializeApp).
 */
export async function connectGoogleSheetsPopup(
  auth: Auth
): Promise<{ accessToken: string; email: string | null; uid: string } | null> {
  const provider = new GoogleAuthProvider();
  SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({
    prompt: 'consent select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error(
        'Không nhận được quyền truy cập Google Sheets từ Google. Vui lòng thử lại và tích chọn cấp quyền bảng tính.'
      );
    }
    cachedSheetsAccessToken = token;
    cachedSheetsEmail = result.user.email;
    return {
      accessToken: token,
      email: result.user.email,
      uid: result.user.uid,
    };
  } catch (error: any) {
    const code = error?.code || '';
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/user-cancelled'
    ) {
      return null;
    }
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'Trình duyệt đang chặn cửa sổ bật lên (popup). Anh vui lòng cho phép popup rồi bấm kết nối lại.'
      );
    }
    throw error;
  }
}

export function extractSpreadsheetId(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{15,}$/.test(trimmed)) return trimmed;
  return null;
}

export interface SpreadsheetMeta {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheetNames: string[];
}

async function sheetsFetch(url: string, accessToken: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiMsg = data?.error?.message || `Google Sheets API HTTP ${res.status}`;
    if (res.status === 401) {
      clearSheetsAccessToken();
      throw new Error('Phiên kết nối Google Sheets đã hết hạn (1 giờ). Anh vui lòng bấm kết nối lại Google.');
    }
    if (res.status === 403) {
      throw new Error(
        `Tài khoản Google chưa có quyền sửa bảng tính này hoặc Google Sheets API chưa được bật (${apiMsg}).`
      );
    }
    throw new Error(apiMsg);
  }
  return data;
}

export async function fetchSpreadsheetMeta(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMeta> {
  const data = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`,
    accessToken
  );

  const sheetNames: string[] = Array.isArray(data.sheets)
    ? data.sheets
        .map((s: any) => s?.properties?.title)
        .filter((t: unknown): t is string => typeof t === 'string' && t.length > 0)
    : [];

  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    title: data.properties?.title || 'Google Sheet KDT-89',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetNames,
  };
}

export const ORDER_SHEET_TAB = 'Don_Hang_Kho';
export const CUSTOMER_SHEET_TAB = 'Khach_Hang_Livestream';

const ORDER_HEADERS = [
  'Mã đơn',
  'Thời gian đặt',
  'Tên khách hàng',
  'SĐT / Zalo',
  'Địa chỉ giao hàng',
  'Sản phẩm & Số lượng',
  'Tổng tiền',
  'Mã Voucher',
  'Giảm giá',
  'Ghi chú',
  'Trạng thái kho',
];

const CUSTOMER_HEADERS = [
  'Họ và tên',
  'SĐT / Zalo',
  'Địa chỉ',
  'Ngày đăng ký',
  'Đăng nhập gần nhất',
  'Voucher đã nhận',
];

export async function createWarehouseSpreadsheet(
  accessToken: string,
  title = 'Kho Điện Tử KDT-89 - Đơn Hàng Livestream & Vận Kho'
): Promise<SpreadsheetMeta> {
  const created = await sheetsFetch(
    'https://sheets.googleapis.com/v4/spreadsheets',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
        sheets: [
          {
            properties: {
              title: ORDER_SHEET_TAB,
              gridProperties: { frozenRowCount: 1 },
            },
          },
          {
            properties: {
              title: CUSTOMER_SHEET_TAB,
              gridProperties: { frozenRowCount: 1 },
            },
          },
        ],
      }),
    }
  );

  const spreadsheetId: string = created.spreadsheetId;
  const orderSheetId: number | undefined = created.sheets?.[0]?.properties?.sheetId;
  const custSheetId: number | undefined = created.sheets?.[1]?.properties?.sheetId;

  // Populate initial bold headers cleanly
  await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values:batchUpdate`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: `'${ORDER_SHEET_TAB}'!A1:K1`, values: [ORDER_HEADERS] },
          { range: `'${CUSTOMER_SHEET_TAB}'!A1:F1`, values: [CUSTOMER_HEADERS] },
        ],
      }),
    }
  );

  // Format header rows cleanly
  const formatRequests: any[] = [];
  for (const sid of [orderSheetId, custSheetId]) {
    if (typeof sid === 'number') {
      formatRequests.push({
        repeatCell: {
          range: { sheetId: sid, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.78, green: 0.12, blue: 0.18 },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      });
    }
  }
  if (formatRequests.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ requests: formatRequests }),
      }
    ).catch(() => {});
  }

  return {
    spreadsheetId,
    title: created.properties?.title || title,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetNames: [ORDER_SHEET_TAB, CUSTOMER_SHEET_TAB],
  };
}

function formatOrderToRow(order: StoredOrder): string[] {
  const itemsSummary = (order.items || [])
    .map((it) => `${it.name}${it.modelCode ? ` [${it.modelCode}]` : ''} × ${it.quantity}`)
    .join(' | ');
  const createdTime = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN')
    : '';
  // Prefix phone with apostrophe only if starting with 0 so Sheets preserves leading zero cleanly
  const phoneText = order.phoneNumber?.startsWith('0')
    ? `'${order.phoneNumber}`
    : order.phoneNumber || '';

  return [
    order.id || '',
    createdTime,
    order.customerName || '',
    phoneText,
    order.address || '',
    itemsSummary,
    order.totalAmount || '',
    order.appliedVoucher || '',
    order.voucherDiscount || '',
    order.note || '',
    order.status || 'Mới',
  ];
}

function formatCustomerToRow(c: CustomerAccount): string[] {
  const phoneText = c.phoneNumber?.startsWith('0')
    ? `'${c.phoneNumber}`
    : c.phoneNumber || '';
  return [
    c.fullName || '',
    phoneText,
    c.address || '',
    c.registeredAt ? new Date(c.registeredAt).toLocaleString('vi-VN') : '',
    c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString('vi-VN') : '',
    (c.vouchersClaimed || []).join(' | '),
  ];
}

async function ensureTabsExist(
  accessToken: string,
  spreadsheetId: string,
  desiredTabs: string[]
): Promise<SpreadsheetMeta> {
  const meta = await fetchSpreadsheetMeta(accessToken, spreadsheetId);
  const missing = desiredTabs.filter((t) => !meta.sheetNames.includes(t));
  if (missing.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: missing.map((title) => ({
            addSheet: {
              properties: { title, gridProperties: { frozenRowCount: 1 } },
            },
          })),
        }),
      }
    );
    return fetchSpreadsheetMeta(accessToken, spreadsheetId);
  }
  return meta;
}

export interface SheetSyncResult {
  addedOrders: number;
  updatedOrders: number;
  addedCustomers: number;
  spreadsheetUrl: string;
  orderTabName: string;
  customerTabName: string;
}

/**
 * Sync orders & registered livestream customers into Google Sheets cleanly without duplicating rows.
 * Dynamically checks tab names and writes headers automatically if empty.
 */
export async function syncOrdersAndCustomersToSheet(params: {
  accessToken: string;
  spreadsheetId: string;
  orders: StoredOrder[];
  customers: CustomerAccount[];
  preferredOrderTab?: string;
  preferredCustomerTab?: string;
}): Promise<SheetSyncResult> {
  const { accessToken, spreadsheetId, orders, customers } = params;
  const orderTab = params.preferredOrderTab || ORDER_SHEET_TAB;
  const customerTab = params.preferredCustomerTab || CUSTOMER_SHEET_TAB;

  const meta = await ensureTabsExist(accessToken, spreadsheetId, [orderTab, customerTab]);

  // 1. Read existing order IDs in Column A
  const existingOrderRes = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(`'${orderTab}'!A1:K`)}`,
    accessToken
  );
  const existingOrderRows: string[][] = Array.isArray(existingOrderRes.values)
    ? existingOrderRes.values
    : [];

  const orderRowIndexById = new Map<string, number>();
  existingOrderRows.forEach((row, idx) => {
    const idVal = (row[0] || '').trim();
    if (idx > 0 && idVal) {
      orderRowIndexById.set(idVal, idx + 1); // 1-indexed sheet row
    }
  });

  const batchUpdates: Array<{ range: string; values: string[][] }> = [];
  const rowsToAppend: string[][] = [];

  if (existingOrderRows.length === 0) {
    batchUpdates.push({
      range: `'${orderTab}'!A1:K1`,
      values: [ORDER_HEADERS],
    });
  }

  let updatedOrders = 0;
  let addedOrders = 0;

  // Sort oldest-first when appending so newest stays at bottom chronologically, or keep chronological
  const sortedOrders = [...orders].sort((a, b) =>
    (a.createdAt || '').localeCompare(b.createdAt || '')
  );

  for (const order of sortedOrders) {
    const rowData = formatOrderToRow(order);
    const existingRowNum = orderRowIndexById.get(order.id);
    if (existingRowNum) {
      batchUpdates.push({
        range: `'${orderTab}'!A${existingRowNum}:K${existingRowNum}`,
        values: [rowData],
      });
      updatedOrders++;
    } else {
      rowsToAppend.push(rowData);
      addedOrders++;
    }
  }

  // 2. Read existing customers in Column B (phone)
  const existingCustRes = await sheetsFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${encodeURIComponent(`'${customerTab}'!A1:F`)}`,
    accessToken
  );
  const existingCustRows: string[][] = Array.isArray(existingCustRes.values)
    ? existingCustRes.values
    : [];

  const custRowIndexByPhone = new Map<string, number>();
  existingCustRows.forEach((row, idx) => {
    const rawPhone = (row[1] || '').replace(/[^0-9]/g, '');
    if (idx > 0 && rawPhone) {
      custRowIndexByPhone.set(rawPhone, idx + 1);
    }
  });

  if (existingCustRows.length === 0) {
    batchUpdates.push({
      range: `'${customerTab}'!A1:F1`,
      values: [CUSTOMER_HEADERS],
    });
  }

  const custToAppend: string[][] = [];
  let addedCustomers = 0;

  for (const cust of customers) {
    const cleanPhone = (cust.phoneNumber || '').replace(/[^0-9]/g, '');
    const rowData = formatCustomerToRow(cust);
    const existingRowNum = cleanPhone ? custRowIndexByPhone.get(cleanPhone) : undefined;
    if (existingRowNum) {
      batchUpdates.push({
        range: `'${customerTab}'!A${existingRowNum}:F${existingRowNum}`,
        values: [rowData],
      });
    } else {
      custToAppend.push(rowData);
      addedCustomers++;
    }
  }

  if (batchUpdates.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values:batchUpdate`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: batchUpdates,
        }),
      }
    );
  }

  if (rowsToAppend.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${encodeURIComponent(`'${orderTab}'!A:K`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ values: rowsToAppend }),
      }
    );
  }

  if (custToAppend.length > 0) {
    await sheetsFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        spreadsheetId
      )}/values/${encodeURIComponent(`'${customerTab}'!A:F`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({ values: custToAppend }),
      }
    );
  }

  return {
    addedOrders,
    updatedOrders,
    addedCustomers,
    spreadsheetUrl: meta.spreadsheetUrl,
    orderTabName: orderTab,
    customerTabName: customerTab,
  };
}

/**
 * Push real-time livestream order / address update to Google Apps Script Webhook (works 24/7 even when /admin is closed).
 */
export async function pushOrderToSheetWebhook(
  webhookUrl: string | undefined,
  eventType: 'new_order' | 'update_address' | 'test',
  order: Partial<StoredOrder> & { id: string }
): Promise<void> {
  const url = (webhookUrl || '').trim();
  if (!url || (!url.startsWith('https://script.google.com/') && !url.startsWith('https://'))) {
    return;
  }

  const itemsText = Array.isArray(order.items)
    ? order.items
        .map((it) => `${it.name}${it.modelCode ? ` [${it.modelCode}]` : ''} × ${it.quantity}`)
        .join(' | ')
    : '';

  const payload = {
    eventType,
    orderId: order.id,
    createdAt: order.createdAt
      ? new Date(order.createdAt).toLocaleString('vi-VN')
      : new Date().toLocaleString('vi-VN'),
    customerName: order.customerName || '',
    phoneNumber: order.phoneNumber || '',
    address: order.address || '',
    itemsText,
    totalAmount: order.totalAmount || '',
    appliedVoucher: order.appliedVoucher || '',
    voucherDiscount: order.voucherDiscount || '',
    note: order.note || '',
    status: order.status || 'Mới',
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('Webhook Google Sheet non-blocking warning:', err);
  }
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Dán toàn bộ đoạn mã này vào Google Sheet -> Tiện ích mở rộng -> Apps Script
// Sau đó bấm: Triển khai (Deploy) -> Tùy chọn triển khai mới -> Ứng dụng web
// Quyền truy cập: "Bất kỳ ai" (Anyone) -> Sao chép URL dán vào trang Quản trị KDT-89!

const SHEET_NAME = 'Don_Hang_Kho';
const NOTIFY_EMAIL = ''; // (Tùy chọn) Nhập Gmail của anh nếu muốn nhận thêm email khi có đơn mới

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        'Mã đơn', 'Thời gian đặt', 'Tên khách hàng', 'SĐT / Zalo',
        'Địa chỉ giao hàng', 'Sản phẩm & Số lượng', 'Tổng tiền',
        'Mã Voucher', 'Giảm giá', 'Ghi chú', 'Trạng thái kho'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        .setFontWeight('bold').setBackground('#C81E2E').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    const phoneText = (data.phoneNumber || '').toString().startsWith('0')
      ? "'" + data.phoneNumber
      : (data.phoneNumber || '');

    // Nếu là cập nhật địa chỉ Bước 2 -> tìm đúng dòng Mã đơn để cập nhật địa chỉ & ghi chú
    if (data.eventType === 'update_address' && data.orderId) {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        const ids = sheet.getRange(1, 1, lastRow, 1).getValues();
        for (let i = 1; i < ids.length; i++) {
          if (String(ids[i][0]).trim() === String(data.orderId).trim()) {
            if (data.address) sheet.getRange(i + 1, 5).setValue(data.address);
            if (data.note) sheet.getRange(i + 1, 10).setValue(data.note);
            return ContentService.createTextOutput(JSON.stringify({ ok: true, updated: true }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    }

    sheet.appendRow([
      data.orderId || '',
      data.createdAt || new Date().toLocaleString('vi-VN'),
      data.customerName || '',
      phoneText,
      data.address || '',
      data.itemsText || '',
      data.totalAmount || '',
      data.appliedVoucher || '',
      data.voucherDiscount || '',
      data.note || '',
      data.status || 'Mới'
    ]);

    if (NOTIFY_EMAIL && data.eventType === 'new_order') {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: '[ĐƠN LIVESTREAM MỚI] ' + (data.customerName || '') + ' - ' + (data.phoneNumber || ''),
        body: 'Sản phẩm: ' + (data.itemsText || '') + '\\nTổng: ' + (data.totalAmount || '') + '\\nĐịa chỉ: ' + (data.address || '')
      });
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
