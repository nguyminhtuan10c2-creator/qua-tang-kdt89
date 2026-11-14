import {
  PRODUCTS,
  CATEGORIES,
  ProductItem,
  CategoryItem,
} from '../data/products';
import type { SiteSettingsData } from './firebase';

export type ProductSourceType = 'original' | 'edited_original' | 'custom';

export interface ResolvedAdminProduct extends ProductItem {
  sourceType: ProductSourceType;
  isHidden: boolean;
  isDeleted: boolean;
  customProgramPrice: string;
  customReferencePrice: string;
  effectiveProgramPrice: string;
  effectiveReferencePrice: string;
  resolvedImageUrl: string;
  hasCustomImage: boolean;
}

export interface ProductExportRow {
  id: string;
  name: string;
  modelCode: string;
  category: string;
  categoryLabel: string;
  programPrice: string;
  referencePrice: string;
  stockCountNumber: string;
  stockStatus: string;
  warranty: string;
  specs: string;
  practicalValue: string;
  isHidden: string;
  customProgramPrice: string;
  customReferencePrice: string;
  imageUrl: string;
  sourceType: string;
  isDeleted: string;
  deliveryCondition: string;
  budgetTier: string;
}

export interface BuildResolvedProductsInput {
  editedProducts?: Record<string, Partial<ProductItem>>;
  customProducts?: ProductItem[];
  customPrices?: Record<string, { programPrice?: string; referencePrice?: string }>;
  hiddenProductIds?: string[];
  deletedProductIds?: string[];
  customImages?: Record<string, string>;
}

const DATA_URL_THRESHOLD = 512;

export function sanitizeImageForExport(
  productId: string,
  imageUrl?: string
): { value: string; wasDataUrlTruncated: boolean } {
  if (!imageUrl) return { value: '', wasDataUrlTruncated: false };
  if (imageUrl.startsWith('data:') && imageUrl.length > DATA_URL_THRESHOLD) {
    const sizeKb = Math.max(1, Math.round(imageUrl.length / 1024));
    return {
      value: `[data-url-firestore:custom_images/${productId} (~${sizeKb}KB)]`,
      wasDataUrlTruncated: true,
    };
  }
  return { value: imageUrl, wasDataUrlTruncated: false };
}

export function buildResolvedAdminProducts(
  input: BuildResolvedProductsInput
): ResolvedAdminProduct[] {
  const editedMap = input.editedProducts || {};
  const customList = input.customProducts || [];
  const pricesMap = input.customPrices || {};
  const hiddenSet = new Set(input.hiddenProductIds || []);
  const deletedSet = new Set(input.deletedProductIds || []);
  const imagesMap = input.customImages || {};

  const resolvedBuiltIns: ResolvedAdminProduct[] = PRODUCTS.map((base) => {
    const override = editedMap[base.id];
    const merged: ProductItem = override ? { ...base, ...override } : { ...base };
    const priceOverride = pricesMap[base.id];
    const hasCustomImg = Boolean(imagesMap[base.id]);
    const resolvedImg = imagesMap[base.id] || merged.imageUrl || '';

    return {
      ...merged,
      sourceType: override ? 'edited_original' : 'original',
      isHidden: hiddenSet.has(base.id),
      isDeleted: deletedSet.has(base.id),
      customProgramPrice: priceOverride?.programPrice || '',
      customReferencePrice: priceOverride?.referencePrice || '',
      effectiveProgramPrice: priceOverride?.programPrice || merged.programPrice || '',
      effectiveReferencePrice: priceOverride?.referencePrice || merged.referencePrice || '',
      resolvedImageUrl: resolvedImg,
      hasCustomImage: hasCustomImg,
    };
  });

  const resolvedCustom: ResolvedAdminProduct[] = customList
    .filter((cp) => !PRODUCTS.some((bp) => bp.id === cp.id))
    .map((cp) => {
      const override = editedMap[cp.id];
      const merged: ProductItem = override ? { ...cp, ...override } : { ...cp };
      const priceOverride = pricesMap[cp.id];
      const hasCustomImg = Boolean(imagesMap[cp.id]);
      const resolvedImg = imagesMap[cp.id] || merged.imageUrl || '';

      return {
        ...merged,
        sourceType: 'custom',
        isHidden: hiddenSet.has(cp.id),
        isDeleted: deletedSet.has(cp.id),
        customProgramPrice: priceOverride?.programPrice || '',
        customReferencePrice: priceOverride?.referencePrice || '',
        effectiveProgramPrice: priceOverride?.programPrice || merged.programPrice || '',
        effectiveReferencePrice: priceOverride?.referencePrice || merged.referencePrice || '',
        resolvedImageUrl: resolvedImg,
        hasCustomImage: hasCustomImg,
      };
    });

  return [...resolvedCustom, ...resolvedBuiltIns];
}

export function prepareExportRows(products: ResolvedAdminProduct[]): {
  rows: ProductExportRow[];
  dataUrlCount: number;
} {
  let dataUrlCount = 0;

  const rows: ProductExportRow[] = products.map((p) => {
    const safeImg = sanitizeImageForExport(p.id, p.resolvedImageUrl);
    if (safeImg.wasDataUrlTruncated) {
      dataUrlCount += 1;
    }
    return {
      id: p.id,
      name: p.name || '',
      modelCode: p.modelCode || '',
      category: p.category || '',
      categoryLabel: p.categoryLabel || '',
      programPrice: p.programPrice || '',
      referencePrice: p.referencePrice || '',
      stockCountNumber:
        p.stockCountNumber !== undefined && p.stockCountNumber !== null
          ? String(p.stockCountNumber)
          : '',
      stockStatus: p.stockStatus || '',
      warranty: p.warranty || '',
      specs: p.specs || '',
      practicalValue: p.practicalValue || '',
      isHidden: p.isHidden ? 'Ẩn' : 'Hiện',
      customProgramPrice: p.customProgramPrice,
      customReferencePrice: p.customReferencePrice,
      imageUrl: safeImg.value,
      sourceType:
        p.sourceType === 'original'
          ? 'Gốc'
          : p.sourceType === 'edited_original'
          ? 'Gốc đã sửa'
          : 'Thêm mới',
      isDeleted: p.isDeleted ? 'Đã xóa mềm' : 'Hoạt động',
      deliveryCondition: p.deliveryCondition || '',
      budgetTier: p.budgetTier || '>4m',
    };
  });

  return { rows, dataUrlCount };
}

const EXPORT_HEADERS: Array<{ key: keyof ProductExportRow; label: string }> = [
  { key: 'id', label: 'ID sản phẩm' },
  { key: 'name', label: 'Tên sản phẩm' },
  { key: 'modelCode', label: 'Mã model' },
  { key: 'category', label: 'Mã danh mục' },
  { key: 'categoryLabel', label: 'Danh mục' },
  { key: 'programPrice', label: 'Giá chương trình' },
  { key: 'referencePrice', label: 'Giá niêm yết' },
  { key: 'stockCountNumber', label: 'Số lượng tồn kho' },
  { key: 'stockStatus', label: 'Trạng thái tồn kho' },
  { key: 'warranty', label: 'Bảo hành' },
  { key: 'specs', label: 'Thông số' },
  { key: 'practicalValue', label: 'Mô tả' },
  { key: 'isHidden', label: 'Trạng thái ẩn/hiện' },
  { key: 'customProgramPrice', label: 'Giá tùy chỉnh (CT)' },
  { key: 'customReferencePrice', label: 'Giá tùy chỉnh (NY)' },
  { key: 'imageUrl', label: 'URL ảnh' },
  { key: 'sourceType', label: 'Nguồn sản phẩm' },
  { key: 'isDeleted', label: 'Trạng thái xóa mềm' },
  { key: 'deliveryCondition', label: 'Điều kiện giao lắp' },
  { key: 'budgetTier', label: 'Phân khúc giá' },
];

function escapeCsvCell(val: string): string {
  const safe = val.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function escapeTsvCell(val: string): string {
  return val.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

export function triggerFileDownload(
  content: string,
  fileName: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDateStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function exportProductsCSV(products: ResolvedAdminProduct[]): {
  count: number;
  dataUrlCount: number;
  fileName: string;
} {
  const { rows, dataUrlCount } = prepareExportRows(products);
  const headerLine = EXPORT_HEADERS.map((h) => escapeCsvCell(h.label)).join(',');
  const dataLines = rows.map((r) =>
    EXPORT_HEADERS.map((h) => escapeCsvCell(r[h.key] ?? '')).join(',')
  );
  const csv = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const fileName = `kdt89-san-pham-${formatDateStamp()}.csv`;
  triggerFileDownload(csv, fileName, 'text/csv;charset=utf-8;');
  return { count: rows.length, dataUrlCount, fileName };
}

export function exportProductsTSV(products: ResolvedAdminProduct[]): {
  count: number;
  dataUrlCount: number;
  fileName: string;
} {
  const { rows, dataUrlCount } = prepareExportRows(products);
  const headerLine = EXPORT_HEADERS.map((h) => escapeTsvCell(h.label)).join('\t');
  const dataLines = rows.map((r) =>
    EXPORT_HEADERS.map((h) => escapeTsvCell(r[h.key] ?? '')).join('\t')
  );
  const tsv = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  const fileName = `kdt89-san-pham-${formatDateStamp()}.tsv`;
  triggerFileDownload(tsv, fileName, 'text/tab-separated-values;charset=utf-8;');
  return { count: rows.length, dataUrlCount, fileName };
}

export function exportProductsJSON(products: ResolvedAdminProduct[]): {
  count: number;
  dataUrlCount: number;
  fileName: string;
} {
  const { rows, dataUrlCount } = prepareExportRows(products);
  const payload = {
    schema: 'kdt89-products-export-v1',
    exportedAt: new Date().toISOString(),
    totalProducts: rows.length,
    note:
      dataUrlCount > 0
        ? `${dataUrlCount} ảnh dạng data URL lớn đã được thay bằng tham chiếu Firestore để tránh treo trình duyệt.`
        : 'Tất cả URL ảnh được xuất đầy đủ.',
    products: rows,
  };
  const fileName = `kdt89-san-pham-${formatDateStamp()}.json`;
  triggerFileDownload(
    JSON.stringify(payload, null, 2),
    fileName,
    'application/json;charset=utf-8;'
  );
  return { count: rows.length, dataUrlCount, fileName };
}

export function exportSiteSettingsBackup(
  settings: Partial<SiteSettingsData>,
  customImageKeys: string[]
): { fileName: string } {
  const backup = {
    schema: 'kdt89-site-settings-backup-v1',
    collection: 'settings/site',
    exportedAt: new Date().toISOString(),
    settings: {
      hiddenProductIds: settings.hiddenProductIds || [],
      hiddenComboIds: settings.hiddenComboIds || [],
      customPrices: settings.customPrices || {},
      customProducts: settings.customProducts || [],
      deletedProductIds: settings.deletedProductIds || [],
      editedProducts: settings.editedProducts || {},
      customCombos: settings.customCombos || [],
      deletedComboIds: settings.deletedComboIds || [],
      customCategories: settings.customCategories || {},
      customTexts: settings.customTexts || {},
      customSeo: settings.customSeo || {},
      hiddenSections: settings.hiddenSections || [],
      addedCategories: settings.addedCategories || [],
      deletedCategoryIds: settings.deletedCategoryIds || [],
      decorSettings: settings.decorSettings || {},
      updatedAt: settings.updatedAt || new Date().toISOString(),
    },
    customImageDocumentIds: customImageKeys,
    customImagesNote:
      'Ảnh tùy chỉnh (base64/URL) được lưu tách theo từng document tại collection custom_images/{id}.',
  };
  const fileName = `kdt89-backup-settings-site-${formatDateStamp()}.json`;
  triggerFileDownload(
    JSON.stringify(backup, null, 2),
    fileName,
    'application/json;charset=utf-8;'
  );
  return { fileName };
}

/* ============================================================================
   IMPORT PARSER, ANALYZER & ATOMIC MERGE BUILDER
   ============================================================================ */

export interface RawImportProductRow {
  rowNumber: number;
  id?: string;
  name?: string;
  modelCode?: string;
  category?: string;
  categoryLabel?: string;
  programPrice?: string;
  referencePrice?: string;
  stockCountNumber?: number;
  stockStatus?: string;
  warranty?: string;
  specs?: string;
  practicalValue?: string;
  isHidden?: boolean;
  customProgramPrice?: string;
  customReferencePrice?: string;
  imageUrl?: string;
  deliveryCondition?: string;
  budgetTier?: ProductItem['budgetTier'];
}

export type ImportRowStatus = 'add' | 'update' | 'duplicate' | 'error' | 'unchanged';

export interface AnalyzedImportRow {
  rowNumber: number;
  raw: RawImportProductRow;
  status: ImportRowStatus;
  matchedBy?: 'id' | 'modelCode';
  targetId: string;
  targetName: string;
  targetModelCode: string;
  isTargetBuiltIn: boolean;
  changedFields: string[];
  reason: string;
  resolvedPayload?: ProductItem;
  pricePatch?: { programPrice?: string; referencePrice?: string };
  hiddenPatch?: boolean;
}

export interface ImportAnalysisResult {
  format: 'csv' | 'tsv' | 'json';
  rows: AnalyzedImportRow[];
  counts: {
    total: number;
    add: number;
    update: number;
    duplicate: number;
    error: number;
    unchanged: number;
  };
  parseError?: string;
}

function parseRFC4180Rows(text: string, delimiter: ',' | '\t' | ';'): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  const cleanText = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < cleanText.length; i++) {
    const ch = cleanText[i];
    const next = cleanText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

const HEADER_ALIASES: Record<string, keyof RawImportProductRow> = {
  id: 'id',
  'id san pham': 'id',
  'product id': 'id',
  'ma sp': 'id',

  name: 'name',
  'ten': 'name',
  'ten san pham': 'name',
  'san pham': 'name',
  title: 'name',

  modelcode: 'modelCode',
  'model code': 'modelCode',
  model: 'modelCode',
  'ma model': 'modelCode',
  sku: 'modelCode',

  category: 'category',
  'ma danh muc': 'category',
  categoryid: 'category',

  categorylabel: 'categoryLabel',
  'danh muc': 'categoryLabel',
  'ten danh muc': 'categoryLabel',

  programprice: 'programPrice',
  'gia chuong trinh': 'programPrice',
  'gia kho': 'programPrice',
  'gia kho kdt-89': 'programPrice',
  'gia sale': 'programPrice',
  'gia ban': 'programPrice',

  referenceprice: 'referencePrice',
  'gia niem yet': 'referencePrice',
  'gia hang': 'referencePrice',
  'gia cu': 'referencePrice',

  stockcountnumber: 'stockCountNumber',
  'so luong ton kho': 'stockCountNumber',
  'ton kho': 'stockCountNumber',
  'so luong': 'stockCountNumber',
  stock: 'stockCountNumber',
  quantity: 'stockCountNumber',

  stockstatus: 'stockStatus',
  'trang thai ton kho': 'stockStatus',
  'trang thai kho': 'stockStatus',

  warranty: 'warranty',
  'bao hanh': 'warranty',

  specs: 'specs',
  'thong so': 'specs',
  'thong so ky thuat': 'specs',

  practicalvalue: 'practicalValue',
  'mo ta': 'practicalValue',
  'gia tri thuc te': 'practicalValue',
  description: 'practicalValue',

  ishidden: 'isHidden',
  'trang thai an/hien': 'isHidden',
  'an/hien': 'isHidden',
  hidden: 'isHidden',

  customprogramprice: 'customProgramPrice',
  'gia tuy chinh (ct)': 'customProgramPrice',
  'gia tuy chinh chuong trinh': 'customProgramPrice',

  customreferenceprice: 'customReferencePrice',
  'gia tuy chinh (ny)': 'customReferencePrice',
  'gia tuy chinh niem yet': 'customReferencePrice',

  imageurl: 'imageUrl',
  'url anh': 'imageUrl',
  'hinh anh': 'imageUrl',
  image: 'imageUrl',

  deliverycondition: 'deliveryCondition',
  'dieu kien giao lap': 'deliveryCondition',

  budgettier: 'budgetTier',
  'phan khuc gia': 'budgetTier',
};

function normalizeHeaderKey(rawHeader: string): string {
  return rawHeader
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseBooleanHidden(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') return val;
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim().toLowerCase();
  if (!s) return undefined;
  if (s === 'true' || s === '1' || s === 'ẩn' || s === 'an' || s === 'hidden') return true;
  if (s === 'false' || s === '0' || s === 'hiện' || s === 'hien' || s === 'visible') return false;
  return undefined;
}

function parseOptionalInt(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, Math.round(val));
  if (val === undefined || val === null) return undefined;
  const str = String(val).trim();
  if (!str) return undefined;
  const cleaned = str.replace(/[^\d]/g, '');
  if (!cleaned) return undefined;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isValidImageRefForImport(val?: string): boolean {
  if (!val) return false;
  if (val.startsWith('[data-url-firestore:')) return false; // Export reference placeholder — keep existing image untouched
  return true;
}

function detectImportFormat(content: string, fileName?: string): 'csv' | 'tsv' | 'json' {
  const lower = (fileName || '').toLowerCase();
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (lower.endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  if (lower.endsWith('.tsv') || lower.endsWith('.txt')) {
    return 'tsv';
  }
  if (lower.endsWith('.csv')) {
    return 'csv';
  }
  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  if (firstLine.includes('\t')) return 'tsv';
  return 'csv';
}

export function parseImportFileContent(
  content: string,
  fileName?: string
): { format: 'csv' | 'tsv' | 'json'; rows: RawImportProductRow[]; error?: string } {
  const trimmed = content.replace(/^\uFEFF/, '').trim();
  if (!trimmed) {
    return { format: 'csv', rows: [], error: 'File hoặc nội dung nhập đang trống.' };
  }

  const format = detectImportFormat(trimmed, fileName);

  if (format === 'json') {
    try {
      const parsed = JSON.parse(trimmed);
      let items: unknown[] = [];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).products)) {
        items = (parsed as any).products;
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray((parsed as any).settings?.customProducts)
      ) {
        return {
          format: 'json',
          rows: [],
          error:
            'Đây là file sao lưu settings/site, không phải file danh sách sản phẩm. Vui lòng chọn file xuất JSON sản phẩm hoặc CSV/TSV.',
        };
      } else {
        return {
          format: 'json',
          rows: [],
          error: 'Định dạng JSON không hợp lệ: cần là mảng [] hoặc object có thuộc tính "products": [...].',
        };
      }

      const rows: RawImportProductRow[] = items.map((item: any, idx) => {
        const obj = item && typeof item === 'object' ? item : {};
        return {
          rowNumber: idx + 1,
          id: obj.id ? String(obj.id).trim() : undefined,
          name: obj.name ? String(obj.name).trim() : undefined,
          modelCode: obj.modelCode ? String(obj.modelCode).trim() : undefined,
          category: obj.category ? String(obj.category).trim() : undefined,
          categoryLabel: obj.categoryLabel ? String(obj.categoryLabel).trim() : undefined,
          programPrice: obj.programPrice !== undefined ? String(obj.programPrice).trim() : undefined,
          referencePrice:
            obj.referencePrice !== undefined ? String(obj.referencePrice).trim() : undefined,
          stockCountNumber: parseOptionalInt(obj.stockCountNumber),
          stockStatus: obj.stockStatus !== undefined ? String(obj.stockStatus).trim() : undefined,
          warranty: obj.warranty !== undefined ? String(obj.warranty).trim() : undefined,
          specs: obj.specs !== undefined ? String(obj.specs).trim() : undefined,
          practicalValue:
            obj.practicalValue !== undefined ? String(obj.practicalValue).trim() : undefined,
          isHidden: parseBooleanHidden(obj.isHidden),
          customProgramPrice:
            obj.customProgramPrice !== undefined
              ? String(obj.customProgramPrice).trim()
              : undefined,
          customReferencePrice:
            obj.customReferencePrice !== undefined
              ? String(obj.customReferencePrice).trim()
              : undefined,
          imageUrl: obj.imageUrl !== undefined ? String(obj.imageUrl).trim() : undefined,
          deliveryCondition:
            obj.deliveryCondition !== undefined ? String(obj.deliveryCondition).trim() : undefined,
          budgetTier: obj.budgetTier as ProductItem['budgetTier'] | undefined,
        };
      });

      if (rows.length === 0) {
        return { format: 'json', rows: [], error: 'File JSON không có bản ghi sản phẩm nào.' };
      }

      return { format: 'json', rows };
    } catch (e: any) {
      return {
        format: 'json',
        rows: [],
        error: `Lỗi đọc cú pháp JSON: ${e?.message || 'Không hợp lệ'}`,
      };
    }
  }

  // CSV or TSV
  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  const delimiter: ',' | '\t' | ';' =
    format === 'tsv'
      ? '\t'
      : firstLine.includes(';') && !firstLine.includes(',')
      ? ';'
      : ',';

  const matrix = parseRFC4180Rows(trimmed, delimiter);
  if (matrix.length < 2) {
    return {
      format,
      rows: [],
      error: 'File cần có ít nhất 1 dòng tiêu đề cột và 1 dòng dữ liệu sản phẩm.',
    };
  }

  const rawHeaders = matrix[0];
  const columnMap: Array<keyof RawImportProductRow | null> = rawHeaders.map((h) => {
    const norm = normalizeHeaderKey(h);
    return HEADER_ALIASES[norm] || null;
  });

  if (!columnMap.some((c) => c === 'name' || c === 'id' || c === 'modelCode')) {
    return {
      format,
      rows: [],
      error:
        'Không nhận diện được cột tiêu đề chuẩn (cần có cột "Tên sản phẩm" / "name" hoặc "ID sản phẩm" / "Mã model"). Hãy xuất mẫu CSV/TSV từ hệ thống để đối chiếu.',
    };
  }

  const rows: RawImportProductRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i];
    const row: RawImportProductRow = { rowNumber: i + 1 };

    columnMap.forEach((field, colIdx) => {
      if (!field) return;
      const val = cells[colIdx]?.trim();
      if (val === undefined || val === '') return;

      if (field === 'stockCountNumber') {
        row.stockCountNumber = parseOptionalInt(val);
      } else if (field === 'isHidden') {
        row.isHidden = parseBooleanHidden(val);
      } else if (field === 'budgetTier') {
        if (val === '<1m' || val === '1m-2m' || val === '2m-4m' || val === '>4m') {
          row.budgetTier = val;
        }
      } else {
        (row as any)[field] = val;
      }
    });

    rows.push(row);
  }

  return { format, rows };
}

function resolveCategoryForImport(
  raw: RawImportProductRow,
  categories: CategoryItem[],
  fallbackProduct?: ProductItem
): { id: string; label: string } {
  if (raw.category) {
    const foundById = categories.find(
      (c) => c.id.toLowerCase() === raw.category!.toLowerCase()
    );
    if (foundById) {
      return { id: foundById.id, label: raw.categoryLabel || foundById.name };
    }
  }
  if (raw.categoryLabel) {
    const normTarget = normalizeHeaderKey(raw.categoryLabel);
    const foundByName = categories.find((c) => normalizeHeaderKey(c.name) === normTarget);
    if (foundByName) {
      return { id: foundByName.id, label: foundByName.name };
    }
  }
  if (fallbackProduct) {
    return {
      id: fallbackProduct.category,
      label: raw.categoryLabel || fallbackProduct.categoryLabel,
    };
  }

  const nameLower = (raw.name || '').toLowerCase();
  if (nameLower.includes('cuckoo') || nameLower.includes('nồi') || nameLower.includes('lò vi sóng')) {
    return { id: 'rice_cooker_appliances', label: 'Nồi Cơm Cuckoo & Gia Dụng' };
  }
  if (nameLower.includes('bếp') || nameLower.includes('ferroli') || nameLower.includes('sanaky')) {
    return { id: 'kitchen_stoves', label: 'Bếp Nấu Hiện Đại' };
  }
  if (nameLower.includes('nước nóng') || nameLower.includes('máy tắm') || nameLower.includes('ariston')) {
    return { id: 'water_heaters', label: 'Máy Nước Nóng Gia Đình' };
  }
  if (nameLower.includes('tivi') || nameLower.includes('tv')) {
    return { id: 'televisions', label: 'Smart Tivi & Màn Hình' };
  }

  const defaultCat = categories[0] || CATEGORIES[0];
  return {
    id: raw.category || defaultCat.id,
    label: raw.categoryLabel || defaultCat.name,
  };
}

function generateSafeSlugId(name: string, modelCode?: string, index = 0): string {
  const baseSource = modelCode || name || 'sp';
  const slug = baseSource
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
  return `import-${slug || 'sp'}-${Date.now().toString(36)}-${index}`;
}

export function analyzeImportRows(
  content: string,
  fileName: string | undefined,
  existingProducts: ResolvedAdminProduct[],
  categories: CategoryItem[]
): ImportAnalysisResult {
  const parsed = parseImportFileContent(content, fileName);
  if (parsed.error) {
    return {
      format: parsed.format,
      rows: [],
      counts: { total: 0, add: 0, update: 0, duplicate: 0, error: 0, unchanged: 0 },
      parseError: parsed.error,
    };
  }

  const byId = new Map<string, ResolvedAdminProduct>();
  const byModel = new Map<string, ResolvedAdminProduct>();
  for (const p of existingProducts) {
    byId.set(p.id.trim().toLowerCase(), p);
    if (p.modelCode && p.modelCode.trim()) {
      byModel.set(p.modelCode.trim().toLowerCase(), p);
    }
  }

  const seenIdsInFile = new Set<string>();
  const seenModelsInFile = new Set<string>();

  const analyzedRows: AnalyzedImportRow[] = parsed.rows.map((raw, idx) => {
    const normId = raw.id?.trim().toLowerCase() || '';
    const normModel = raw.modelCode?.trim().toLowerCase() || '';

    // Check matched existing record (ID takes priority, then modelCode)
    let matched: ResolvedAdminProduct | undefined;
    let matchedBy: 'id' | 'modelCode' | undefined;
    if (normId && byId.has(normId)) {
      matched = byId.get(normId);
      matchedBy = 'id';
    } else if (normModel && byModel.has(normModel)) {
      matched = byModel.get(normModel);
      matchedBy = 'modelCode';
    }

    // Check duplicate inside the import file itself
    const targetKeyId = matched ? matched.id.toLowerCase() : normId;
    if (targetKeyId && seenIdsInFile.has(targetKeyId)) {
      return {
        rowNumber: raw.rowNumber,
        raw,
        status: 'duplicate',
        targetId: matched?.id || raw.id || '',
        targetName: raw.name || matched?.name || '(Không rõ tên)',
        targetModelCode: raw.modelCode || matched?.modelCode || '',
        isTargetBuiltIn: matched ? matched.sourceType !== 'custom' : false,
        changedFields: [],
        reason: `Trùng ID "${matched?.id || raw.id}" ngay trong file nhập (đã bỏ qua để tránh trùng).`,
      };
    }
    if (normModel && seenModelsInFile.has(normModel)) {
      return {
        rowNumber: raw.rowNumber,
        raw,
        status: 'duplicate',
        targetId: matched?.id || raw.id || '',
        targetName: raw.name || matched?.name || '(Không rõ tên)',
        targetModelCode: raw.modelCode || '',
        isTargetBuiltIn: matched ? matched.sourceType !== 'custom' : false,
        changedFields: [],
        reason: `Trùng mã model "${raw.modelCode}" ngay trong file nhập (đã bỏ qua để tránh trùng).`,
      };
    }

    if (targetKeyId) seenIdsInFile.add(targetKeyId);
    if (normModel) seenModelsInFile.add(normModel);

    // Validation for new records vs updates
    if (!matched) {
      if (!raw.name || raw.name.trim().length < 2) {
        return {
          rowNumber: raw.rowNumber,
          raw,
          status: 'error',
          targetId: raw.id || '',
          targetName: raw.name || '',
          targetModelCode: raw.modelCode || '',
          isTargetBuiltIn: false,
          changedFields: [],
          reason: 'Thiếu tên sản phẩm hợp lệ để tạo mới.',
        };
      }

      if (raw.id && !/^[a-zA-Z0-9_-]{2,120}$/.test(raw.id.trim())) {
        return {
          rowNumber: raw.rowNumber,
          raw,
          status: 'error',
          targetId: raw.id,
          targetName: raw.name,
          targetModelCode: raw.modelCode || '',
          isTargetBuiltIn: false,
          changedFields: [],
          reason: 'ID sản phẩm chỉ được chứa chữ cái không dấu, số, dấu gạch ngang (-) hoặc gạch dưới (_).',
        };
      }

      const newId = raw.id?.trim() || generateSafeSlugId(raw.name, raw.modelCode, idx);
      seenIdsInFile.add(newId.toLowerCase());
      const cat = resolveCategoryForImport(raw, categories);

      const newProduct: ProductItem = {
        id: newId,
        name: raw.name.trim(),
        category: cat.id,
        categoryLabel: cat.label,
        budgetTier: raw.budgetTier || '>4m',
        budgetLabel:
          raw.budgetTier === '<1m'
            ? 'Dưới 1 triệu'
            : raw.budgetTier === '1m-2m'
            ? '1 – 2 triệu'
            : raw.budgetTier === '2m-4m'
            ? '2 – 4 triệu'
            : 'Trên 4 triệu',
        programPrice: raw.programPrice || '[Liên hệ Sale nhận giá kho]',
        referencePrice: raw.referencePrice || '',
        stockStatus: raw.stockStatus || 'Sẵn kho tại KDT-89',
        warranty: raw.warranty || 'Chính hãng 24 tháng',
        deliveryCondition: raw.deliveryCondition || 'Giá chương trình đã bao gồm hỗ trợ giao lắp',
        practicalValue:
          raw.practicalValue || 'Sản phẩm chính hãng phân phối tại kho KDT-89.',
        ...(raw.modelCode ? { modelCode: raw.modelCode.trim() } : {}),
        ...(raw.specs ? { specs: raw.specs.trim() } : {}),
        ...(raw.stockCountNumber !== undefined ? { stockCountNumber: raw.stockCountNumber } : {}),
        ...(isValidImageRefForImport(raw.imageUrl) ? { imageUrl: raw.imageUrl!.trim() } : {}),
      };

      const pricePatch =
        raw.customProgramPrice || raw.customReferencePrice
          ? {
              ...(raw.customProgramPrice ? { programPrice: raw.customProgramPrice } : {}),
              ...(raw.customReferencePrice ? { referencePrice: raw.customReferencePrice } : {}),
            }
          : undefined;

      return {
        rowNumber: raw.rowNumber,
        raw,
        status: 'add',
        targetId: newId,
        targetName: newProduct.name,
        targetModelCode: newProduct.modelCode || '',
        isTargetBuiltIn: false,
        changedFields: ['Sản phẩm mới'],
        reason: 'Chưa có ID hoặc mã model trong kho — sẽ thêm mới.',
        resolvedPayload: newProduct,
        pricePatch,
        hiddenPatch: raw.isHidden,
      };
    }

    // Matched existing record -> compute incremental update keeping omitted fields intact!
    const changedFields: string[] = [];
    const cat = resolveCategoryForImport(raw, categories, matched);

    const nextProduct: ProductItem = {
      id: matched.id,
      name: raw.name && raw.name !== matched.name ? (changedFields.push('Tên'), raw.name) : matched.name,
      category:
        raw.category && cat.id !== matched.category
          ? (changedFields.push('Danh mục'), cat.id)
          : matched.category,
      categoryLabel:
        raw.categoryLabel && cat.label !== matched.categoryLabel
          ? cat.label
          : matched.categoryLabel,
      budgetTier:
        raw.budgetTier && raw.budgetTier !== matched.budgetTier
          ? (changedFields.push('Phân khúc'), raw.budgetTier)
          : matched.budgetTier,
      budgetLabel: matched.budgetLabel,
      programPrice:
        raw.programPrice !== undefined && raw.programPrice !== '' && raw.programPrice !== matched.programPrice
          ? (changedFields.push('Giá CT'), raw.programPrice)
          : matched.programPrice,
      referencePrice:
        raw.referencePrice !== undefined && raw.referencePrice !== '' && raw.referencePrice !== matched.referencePrice
          ? (changedFields.push('Giá niêm yết'), raw.referencePrice)
          : matched.referencePrice,
      stockStatus:
        raw.stockStatus !== undefined && raw.stockStatus !== '' && raw.stockStatus !== matched.stockStatus
          ? (changedFields.push('Trạng thái kho'), raw.stockStatus)
          : matched.stockStatus,
      warranty:
        raw.warranty !== undefined && raw.warranty !== '' && raw.warranty !== matched.warranty
          ? (changedFields.push('Bảo hành'), raw.warranty)
          : matched.warranty,
      deliveryCondition:
        raw.deliveryCondition !== undefined && raw.deliveryCondition !== '' && raw.deliveryCondition !== matched.deliveryCondition
          ? (changedFields.push('Giao lắp'), raw.deliveryCondition)
          : matched.deliveryCondition,
      practicalValue:
        raw.practicalValue !== undefined && raw.practicalValue !== '' && raw.practicalValue !== matched.practicalValue
          ? (changedFields.push('Mô tả'), raw.practicalValue)
          : matched.practicalValue,
      ...(raw.modelCode
        ? {
            modelCode:
              raw.modelCode !== (matched.modelCode || '')
                ? (changedFields.push('Model'), raw.modelCode)
                : matched.modelCode,
          }
        : matched.modelCode
        ? { modelCode: matched.modelCode }
        : {}),
      ...(raw.specs !== undefined && raw.specs !== ''
        ? {
            specs:
              raw.specs !== (matched.specs || '')
                ? (changedFields.push('Thông số'), raw.specs)
                : matched.specs,
          }
        : matched.specs
        ? { specs: matched.specs }
        : {}),
      ...(raw.stockCountNumber !== undefined
        ? {
            stockCountNumber:
              raw.stockCountNumber !== matched.stockCountNumber
                ? (changedFields.push('Tồn kho'), raw.stockCountNumber)
                : matched.stockCountNumber,
          }
        : matched.stockCountNumber !== undefined
        ? { stockCountNumber: matched.stockCountNumber }
        : {}),
      ...(isValidImageRefForImport(raw.imageUrl) && raw.imageUrl !== (matched.imageUrl || '')
        ? { imageUrl: (changedFields.push('URL ảnh'), raw.imageUrl!.trim()) }
        : matched.imageUrl
        ? { imageUrl: matched.imageUrl }
        : {}),
      ...(matched.highlightTag ? { highlightTag: matched.highlightTag } : {}),
      ...(matched.promoBanner ? { promoBanner: matched.promoBanner } : {}),
      ...(matched.featureBadge ? { featureBadge: matched.featureBadge } : {}),
      ...(matched.soldText ? { soldText: matched.soldText } : {}),
      ...(matched.slotText ? { slotText: matched.slotText } : {}),
    };

    let pricePatch: { programPrice?: string; referencePrice?: string } | undefined;
    if (raw.customProgramPrice !== undefined || raw.customReferencePrice !== undefined) {
      const nextCP = raw.customProgramPrice ?? matched.customProgramPrice;
      const nextCR = raw.customReferencePrice ?? matched.customReferencePrice;
      if (nextCP !== matched.customProgramPrice || nextCR !== matched.customReferencePrice) {
        changedFields.push('Giá tùy chỉnh');
        pricePatch = {
          ...(nextCP ? { programPrice: nextCP } : {}),
          ...(nextCR ? { referencePrice: nextCR } : {}),
        };
      }
    }

    let hiddenPatch: boolean | undefined;
    if (raw.isHidden !== undefined && raw.isHidden !== matched.isHidden) {
      changedFields.push(raw.isHidden ? 'Ẩn SP' : 'Hiện SP');
      hiddenPatch = raw.isHidden;
    }

    if (changedFields.length === 0) {
      return {
        rowNumber: raw.rowNumber,
        raw,
        status: 'unchanged',
        matchedBy,
        targetId: matched.id,
        targetName: matched.name,
        targetModelCode: matched.modelCode || '',
        isTargetBuiltIn: matched.sourceType !== 'custom',
        changedFields: [],
        reason: `Khớp theo ${matchedBy === 'id' ? 'ID' : 'Mã model'} (${matched.id}) — dữ liệu không thay đổi.`,
      };
    }

    return {
      rowNumber: raw.rowNumber,
      raw,
      status: 'update',
      matchedBy,
      targetId: matched.id,
      targetName: nextProduct.name,
      targetModelCode: nextProduct.modelCode || '',
      isTargetBuiltIn: matched.sourceType !== 'custom',
      changedFields,
      reason: `Khớp ${matchedBy === 'id' ? 'ID' : 'Mã model'} (${matched.id}) — cập nhật: ${changedFields.join(', ')}.`,
      resolvedPayload: nextProduct,
      pricePatch,
      hiddenPatch,
    };
  });

  const counts = {
    total: analyzedRows.length,
    add: analyzedRows.filter((r) => r.status === 'add').length,
    update: analyzedRows.filter((r) => r.status === 'update').length,
    duplicate: analyzedRows.filter((r) => r.status === 'duplicate').length,
    error: analyzedRows.filter((r) => r.status === 'error').length,
    unchanged: analyzedRows.filter((r) => r.status === 'unchanged').length,
  };

  return {
    format: parsed.format,
    rows: analyzedRows,
    counts,
  };
}

function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = v;
    }
  }
  return clean;
}

export function buildAtomicImportSettingsPatch(
  analyzedRows: AnalyzedImportRow[],
  currentSettings: {
    customProducts: ProductItem[];
    editedProducts: Record<string, Partial<ProductItem>>;
    customPrices: Record<string, { programPrice?: string; referencePrice?: string }>;
    hiddenProductIds: string[];
  }
): {
  patch: Partial<SiteSettingsData>;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  error?: string;
} {
  const nextCustomProducts = [...currentSettings.customProducts];
  const nextEditedProducts = { ...currentSettings.editedProducts };
  const nextCustomPrices = { ...currentSettings.customPrices };
  const nextHiddenSet = new Set(currentSettings.hiddenProductIds);

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const row of analyzedRows) {
    if (row.status === 'add' && row.resolvedPayload) {
      const cleanProd = stripUndefined(row.resolvedPayload);
      nextCustomProducts.unshift(cleanProd);
      if (row.pricePatch && Object.keys(row.pricePatch).length > 0) {
        nextCustomPrices[cleanProd.id] = row.pricePatch;
      }
      if (row.hiddenPatch === true) {
        nextHiddenSet.add(cleanProd.id);
      }
      addedCount += 1;
    } else if (row.status === 'update' && row.resolvedPayload) {
      const cleanProd = stripUndefined(row.resolvedPayload);
      const customIdx = nextCustomProducts.findIndex((p) => p.id === cleanProd.id);
      if (customIdx >= 0) {
        nextCustomProducts[customIdx] = cleanProd;
      } else {
        // Built-in product: store partial override in editedProducts without touching original products.ts
        const { id: _id, ...overrideFields } = cleanProd;
        nextEditedProducts[cleanProd.id] = stripUndefined(overrideFields);
      }

      if (row.pricePatch) {
        if (Object.keys(row.pricePatch).length > 0) {
          nextCustomPrices[cleanProd.id] = row.pricePatch;
        } else {
          delete nextCustomPrices[cleanProd.id];
        }
      }
      if (row.hiddenPatch === true) {
        nextHiddenSet.add(cleanProd.id);
      } else if (row.hiddenPatch === false) {
        nextHiddenSet.delete(cleanProd.id);
      }
      updatedCount += 1;
    } else {
      skippedCount += 1;
    }
  }

  const patch: Partial<SiteSettingsData> = {
    customProducts: nextCustomProducts,
    editedProducts: nextEditedProducts,
    customPrices: nextCustomPrices,
    hiddenProductIds: Array.from(nextHiddenSet),
  };

  // Guard against Firestore 1MB single-document limit before writing
  const approxBytes = new Blob([JSON.stringify(patch)]).size;
  if (approxBytes > 900_000) {
    return {
      patch,
      addedCount: 0,
      updatedCount: 0,
      skippedCount: analyzedRows.length,
      error: `Kích thước dữ liệu cấu hình vượt quá giới hạn an toàn (${Math.round(approxBytes / 1024)}KB / 900KB). Vui lòng không nhúng ảnh base64 vào file nhập; hãy tải ảnh qua mục Đổi ảnh riêng.`,
    };
  }

  return {
    patch,
    addedCount,
    updatedCount,
    skippedCount,
  };
}
