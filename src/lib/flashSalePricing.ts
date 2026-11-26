import type { ProductItem } from '../data/products';
import type { SiteDecorSettings } from './firebase';

export interface EffectiveCustomPrice {
  programPrice?: string;
  referencePrice?: string;
  regularSalePrice?: string;
  isFlashSaleActive?: boolean;
}

export interface FlashSaleWindowStatus {
  isActive: boolean;
  isExpired: boolean;
  targetEndMs: number | null;
  mode: 'custom_timer' | 'daily' | 'disabled';
}

export function parseLivestreamEndMs(livestreamEndTime?: string): number | null {
  const raw = (livestreamEndTime || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function getFlashSaleWindowStatus(
  decorSettings?: SiteDecorSettings,
  hiddenSections: string[] = [],
  nowMs: number = Date.now()
): FlashSaleWindowStatus {
  if (
    decorSettings?.showFlagshipDeals === false ||
    hiddenSections.includes('flash_sale') ||
    decorSettings?.flashSalePricesEnabled === false
  ) {
    return {
      isActive: false,
      isExpired: false,
      targetEndMs: null,
      mode: 'disabled',
    };
  }

  const customEndMs = parseLivestreamEndMs(decorSettings?.livestreamEndTime);
  if (customEndMs !== null) {
    if (nowMs > customEndMs) {
      return {
        isActive: false,
        isExpired: true,
        targetEndMs: customEndMs,
        mode: 'custom_timer',
      };
    }
    return {
      isActive: true,
      isExpired: false,
      targetEndMs: customEndMs,
      mode: 'custom_timer',
    };
  }

  const endOfDay = new Date(nowMs);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    isActive: true,
    isExpired: false,
    targetEndMs: endOfDay.getTime(),
    mode: 'daily',
  };
}

export function buildEffectiveCustomPrices(params: {
  products: ProductItem[];
  baseCustomPrices: Record<string, { programPrice?: string; referencePrice?: string }>;
  decorSettings?: SiteDecorSettings;
  hiddenSections?: string[];
  nowMs?: number;
}): {
  effectivePrices: Record<string, EffectiveCustomPrice>;
  windowStatus: FlashSaleWindowStatus;
} {
  const {
    products,
    baseCustomPrices,
    decorSettings,
    hiddenSections = [],
    nowMs = Date.now(),
  } = params;

  const windowStatus = getFlashSaleWindowStatus(decorSettings, hiddenSections, nowMs);
  const flashMap = decorSettings?.flashSalePrices || {};
  const effectivePrices: Record<string, EffectiveCustomPrice> = {};

  for (const prod of products) {
    const base = baseCustomPrices[prod.id];
    const regularSalePrice = (base?.programPrice || prod.programPrice || '').trim();
    const baseReferencePrice = (base?.referencePrice || prod.referencePrice || '').trim();
    const flashRaw = (flashMap[prod.id] || '').trim();

    if (windowStatus.isActive && flashRaw) {
      const hasDistinctRegular = regularSalePrice !== '' && regularSalePrice !== flashRaw;
      effectivePrices[prod.id] = {
        programPrice: flashRaw,
        referencePrice:
          baseReferencePrice && baseReferencePrice !== flashRaw
            ? baseReferencePrice
            : regularSalePrice || baseReferencePrice,
        regularSalePrice: hasDistinctRegular ? regularSalePrice : undefined,
        isFlashSaleActive: true,
      };
    } else if (base) {
      effectivePrices[prod.id] = {
        programPrice: base.programPrice,
        referencePrice: base.referencePrice,
      };
    }
  }

  // Also preserve any orphaned customPrice keys if not in products list
  for (const [pid, base] of Object.entries(baseCustomPrices)) {
    if (!effectivePrices[pid] && base) {
      effectivePrices[pid] = {
        programPrice: base.programPrice,
        referencePrice: base.referencePrice,
      };
    }
  }

  return { effectivePrices, windowStatus };
}
