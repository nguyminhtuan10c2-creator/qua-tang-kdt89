import type { ProductItem } from '../data/products';
import type { SiteDecorSettings } from './firebase';

export type ActivePriceTier = 'livestream' | 'flash_sale' | 'regular';

export interface EffectiveCustomPrice {
  programPrice?: string;
  referencePrice?: string;
  regularSalePrice?: string;
  isFlashSaleActive?: boolean;
  isLivestreamPriceActive?: boolean;
  activePriceTier?: ActivePriceTier;
}

export interface FlashSaleWindowStatus {
  isActive: boolean;
  isExpired: boolean;
  targetEndMs: number | null;
  mode: 'custom_timer' | 'daily' | 'disabled';
}

export interface LivestreamWindowStatus {
  isActive: boolean;
  isExpired: boolean;
  targetEndMs: number | null;
}

export function parseLivestreamEndMs(endTime?: string): number | null {
  const raw = (endTime || '').trim();
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function getLivestreamWindowStatus(
  decorSettings?: SiteDecorSettings,
  nowMs: number = Date.now()
): LivestreamWindowStatus {
  if (decorSettings?.livestreamActive !== true) {
    return {
      isActive: false,
      isExpired: false,
      targetEndMs: null,
    };
  }

  const endMs = parseLivestreamEndMs(decorSettings?.livestreamSessionEndTime);
  if (endMs !== null && nowMs > endMs) {
    return {
      isActive: false,
      isExpired: true,
      targetEndMs: endMs,
    };
  }

  return {
    isActive: true,
    isExpired: false,
    targetEndMs: endMs,
  };
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

  // Prefer dedicated flashSaleEndTime; fallback to legacy livestreamEndTime if flashSaleEndTime is unset
  const rawEndTime =
    decorSettings?.flashSaleEndTime !== undefined
      ? decorSettings.flashSaleEndTime
      : decorSettings?.livestreamEndTime;

  const customEndMs = parseLivestreamEndMs(rawEndTime);
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
  livestreamStatus: LivestreamWindowStatus;
} {
  const {
    products,
    baseCustomPrices,
    decorSettings,
    hiddenSections = [],
    nowMs = Date.now(),
  } = params;

  const windowStatus = getFlashSaleWindowStatus(decorSettings, hiddenSections, nowMs);
  const livestreamStatus = getLivestreamWindowStatus(decorSettings, nowMs);
  const flashMap = decorSettings?.flashSalePrices || {};
  const liveMap = decorSettings?.livestreamPrices || {};
  const effectivePrices: Record<string, EffectiveCustomPrice> = {};

  for (const prod of products) {
    const base = baseCustomPrices[prod.id];
    const regularSalePrice = (base?.programPrice || prod.programPrice || '').trim();
    const baseReferencePrice = (base?.referencePrice || prod.referencePrice || '').trim();
    const liveRaw = (liveMap[prod.id] || '').trim();
    const flashRaw = (flashMap[prod.id] || '').trim();

    if (livestreamStatus.isActive && liveRaw) {
      const hasDistinctRegular = regularSalePrice !== '' && regularSalePrice !== liveRaw;
      effectivePrices[prod.id] = {
        programPrice: liveRaw,
        referencePrice:
          baseReferencePrice && baseReferencePrice !== liveRaw
            ? baseReferencePrice
            : regularSalePrice || baseReferencePrice,
        regularSalePrice: hasDistinctRegular ? regularSalePrice : undefined,
        isLivestreamPriceActive: true,
        activePriceTier: 'livestream',
      };
    } else if (windowStatus.isActive && flashRaw) {
      const hasDistinctRegular = regularSalePrice !== '' && regularSalePrice !== flashRaw;
      effectivePrices[prod.id] = {
        programPrice: flashRaw,
        referencePrice:
          baseReferencePrice && baseReferencePrice !== flashRaw
            ? baseReferencePrice
            : regularSalePrice || baseReferencePrice,
        regularSalePrice: hasDistinctRegular ? regularSalePrice : undefined,
        isFlashSaleActive: true,
        activePriceTier: 'flash_sale',
      };
    } else if (base) {
      effectivePrices[prod.id] = {
        programPrice: base.programPrice,
        referencePrice: base.referencePrice,
        activePriceTier: 'regular',
      };
    }
  }

  // Also preserve any orphaned customPrice keys if not in products list
  for (const [pid, base] of Object.entries(baseCustomPrices)) {
    if (!effectivePrices[pid] && base) {
      effectivePrices[pid] = {
        programPrice: base.programPrice,
        referencePrice: base.referencePrice,
        activePriceTier: 'regular',
      };
    }
  }

  return { effectivePrices, windowStatus, livestreamStatus };
}
