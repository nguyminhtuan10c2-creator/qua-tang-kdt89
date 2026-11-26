export interface ShippingTier {
  id: string;
  maxKm: number; // Áp dụng cho khoảng cách <= maxKm (vd: 5 -> dưới 5km; 7 -> từ 5-7km)
  fee: number; // Phí ship VNĐ (0 = Miễn phí)
}

export interface ShippingConfig {
  enabled: boolean;
  warehouseName: string;
  warehouseAddress: string;
  warehouseLat: number;
  warehouseLng: number;
  pricingMode: 'tiers' | 'per_km';
  tiers: ShippingTier[];
  freeRadiusKm: number; // Miễn phí giao trong X km đầu (chế độ tính từng km)
  freeOrderThreshold: number; // Đơn từ X đ được freeship (nếu trong freeOrderMaxKm)
  freeOrderMaxKm: number; // Bán kính tối đa áp dụng freeship theo giá trị đơn
  baseFee: number; // Phí cơ bản ngoài bán kính miễn phí (VNĐ)
  pricePerKm: number; // Phí mỗi km vượt mốc (VNĐ/km)
  maxLocalKm: number; // Trên mức này hiện "Thương lượng / Trao đổi" (mặc định 30km)
  provinceBaseFee: number; // Giữ tương thích cấu hình cũ
  negotiateThresholdConfigured?: boolean; // Đánh dấu admin đã tự chỉnh ngưỡng thương lượng
}

export const DEFAULT_SHIPPING_TIERS: ShippingTier[] = [
  { id: 'tier-5', maxKm: 5, fee: 0 },
  { id: 'tier-7', maxKm: 7, fee: 25000 },
  { id: 'tier-10', maxKm: 10, fee: 35000 },
  { id: 'tier-15', maxKm: 15, fee: 50000 },
  { id: 'tier-25', maxKm: 25, fee: 70000 },
];

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  enabled: true,
  warehouseName: 'Kho KDT-89 (Q. Chánh Hưng / Q.8)',
  warehouseAddress: 'Số 89-91 Đường số 1, Khu Hiệp Ân, Phường Chánh Hưng, TP.HCM',
  warehouseLat: 10.7407,
  warehouseLng: 106.6634,
  pricingMode: 'tiers',
  tiers: DEFAULT_SHIPPING_TIERS,
  freeRadiusKm: 5,
  freeOrderThreshold: 3000000,
  freeOrderMaxKm: 15,
  baseFee: 25000,
  pricePerKm: 6000,
  maxLocalKm: 30,
  provinceBaseFee: 0,
};

export interface VietnamAreaPoint {
  id: string;
  label: string;
  group: 'TP.HCM' | 'Vùng lân cận' | 'Tỉnh thành khác';
  lat: number;
  lng: number;
  keywords: string[];
}

export const VIETNAM_AREA_POINTS: VietnamAreaPoint[] = [
  // TP.HCM Districts
  { id: 'hcm-q8', label: 'Quận 8 / P. Chánh Hưng (TP.HCM)', group: 'TP.HCM', lat: 10.7376, lng: 106.6562, keywords: ['quan 8', 'q8', 'q.8', 'chanh hung', 'hiep an', 'pham the hien', 'ta quang buu'] },
  { id: 'hcm-q5', label: 'Quận 5 (TP.HCM)', group: 'TP.HCM', lat: 10.754, lng: 106.6634, keywords: ['quan 5', 'q5', 'q.5', 'an duong vuong', 'tran hung dao q5'] },
  { id: 'hcm-q6', label: 'Quận 6 (TP.HCM)', group: 'TP.HCM', lat: 10.7481, lng: 106.6352, keywords: ['quan 6', 'q6', 'q.6', 'hau giang', 'binh tien'] },
  { id: 'hcm-q10', label: 'Quận 10 (TP.HCM)', group: 'TP.HCM', lat: 10.7746, lng: 106.6679, keywords: ['quan 10', 'q10', 'q.10', 'su van hanh', '3 thang 2'] },
  { id: 'hcm-q11', label: 'Quận 11 (TP.HCM)', group: 'TP.HCM', lat: 10.7639, lng: 106.6474, keywords: ['quan 11', 'q11', 'q.11', 'dam sen', 'lac long quan'] },
  { id: 'hcm-q4', label: 'Quận 4 (TP.HCM)', group: 'TP.HCM', lat: 10.7578, lng: 106.7013, keywords: ['quan 4', 'q4', 'q.4', 'ben van don', 'khanh hoi'] },
  { id: 'hcm-q1', label: 'Quận 1 (TP.HCM)', group: 'TP.HCM', lat: 10.7756, lng: 106.7004, keywords: ['quan 1', 'q1', 'q.1', 'ben thanh', 'nguyen hue', 'da kao'] },
  { id: 'hcm-q3', label: 'Quận 3 (TP.HCM)', group: 'TP.HCM', lat: 10.7844, lng: 106.6844, keywords: ['quan 3', 'q3', 'q.3', 'vo van tan', 'cach mang thang 8'] },
  { id: 'hcm-q7', label: 'Quận 7 / Phú Mỹ Hưng (TP.HCM)', group: 'TP.HCM', lat: 10.734, lng: 106.7218, keywords: ['quan 7', 'q7', 'q.7', 'phu my hung', 'nguyen thi thap', 'huynh tan phat'] },
  { id: 'hcm-binhchanh', label: 'Huyện Bình Chánh (TP.HCM)', group: 'TP.HCM', lat: 10.6994, lng: 106.6122, keywords: ['binh chanh', 'trung son', 'quoc lo 50', 'vinh loc', 'tan kien'] },
  { id: 'hcm-binhtan', label: 'Quận Bình Tân (TP.HCM)', group: 'TP.HCM', lat: 10.7652, lng: 106.6038, keywords: ['binh tan', 'ten lua', 'huong lo 2', 'an lac'] },
  { id: 'hcm-tanbinh', label: 'Quận Tân Bình (TP.HCM)', group: 'TP.HCM', lat: 10.8015, lng: 106.6526, keywords: ['tan binh', 'cong hoa', 'hoang hoa tham', 'san bay'] },
  { id: 'hcm-tanphu', label: 'Quận Tân Phú (TP.HCM)', group: 'TP.HCM', lat: 10.7901, lng: 106.6281, keywords: ['tan phu', 'luy ban bich', 'aeon tan phu'] },
  { id: 'hcm-phunhuan', label: 'Quận Phú Nhuận (TP.HCM)', group: 'TP.HCM', lat: 10.7992, lng: 106.6802, keywords: ['phu nhuan', 'phan xich long', 'nguyen van troi'] },
  { id: 'hcm-binhthanh', label: 'Quận Bình Thạnh (TP.HCM)', group: 'TP.HCM', lat: 10.8106, lng: 106.7091, keywords: ['binh thanh', 'hang xanh', 'xo viet nghe tinh', 'landmark'] },
  { id: 'hcm-govap', label: 'Quận Gò Vấp (TP.HCM)', group: 'TP.HCM', lat: 10.8387, lng: 106.6653, keywords: ['go vap', 'quang trung', 'phan van tri'] },
  { id: 'hcm-q12', label: 'Quận 12 (TP.HCM)', group: 'TP.HCM', lat: 10.8671, lng: 106.6413, keywords: ['quan 12', 'q12', 'q.12', 'to ky', 'an suong', 'thanh loc'] },
  { id: 'hcm-thuduc', label: 'TP. Thủ Đức / Q.2 / Q.9 (TP.HCM)', group: 'TP.HCM', lat: 10.8494, lng: 106.7537, keywords: ['thu duc', 'quan 2', 'q2', 'q.2', 'quan 9', 'q9', 'q.9', 'thao dien', 'linh trung'] },
  { id: 'hcm-nhabe', label: 'Huyện Nhà Bè (TP.HCM)', group: 'TP.HCM', lat: 10.6716, lng: 106.7279, keywords: ['nha be', 'phuoc kien', 'nguyen huu tho'] },
  { id: 'hcm-hocmon', label: 'Huyện Hóc Môn (TP.HCM)', group: 'TP.HCM', lat: 10.8861, lng: 106.5924, keywords: ['hoc mon', 'ba diem', 'xuan thoi'] },
  { id: 'hcm-cuchi', label: 'Huyện Củ Chi (TP.HCM)', group: 'TP.HCM', lat: 11.0067, lng: 106.5132, keywords: ['cu chi'] },
  { id: 'hcm-cangio', label: 'Huyện Cần Giờ (TP.HCM)', group: 'TP.HCM', lat: 10.5082, lng: 106.8634, keywords: ['can gio'] },

  // Vùng lân cận TP.HCM
  { id: 'bd-dian', label: 'TP. Dĩ An (Bình Dương)', group: 'Vùng lân cận', lat: 10.9068, lng: 106.7697, keywords: ['di an'] },
  { id: 'bd-thuanan', label: 'TP. Thuận An (Bình Dương)', group: 'Vùng lân cận', lat: 10.9355, lng: 106.7012, keywords: ['thuan an', 'lai thieu'] },
  { id: 'bd-thudaumot', label: 'TP. Thủ Dầu Một (Bình Dương)', group: 'Vùng lân cận', lat: 10.9805, lng: 106.6519, keywords: ['thu dau mot', 'binh duong'] },
  { id: 'dn-bienhoa', label: 'TP. Biên Hòa (Đồng Nai)', group: 'Vùng lân cận', lat: 10.9574, lng: 106.8427, keywords: ['bien hoa', 'dong nai'] },
  { id: 'dn-longthanh', label: 'Long Thành / Nhơn Trạch (Đồng Nai)', group: 'Vùng lân cận', lat: 10.7793, lng: 106.9532, keywords: ['long thanh', 'nhon trach'] },
  { id: 'la-benluc', label: 'Bến Lức / Cần Giuộc (Long An)', group: 'Vùng lân cận', lat: 10.642, lng: 106.4946, keywords: ['ben luc', 'can giuoc', 'can duoc', 'duc hoa'] },
  { id: 'la-tanan', label: 'TP. Tân An (Long An)', group: 'Vùng lân cận', lat: 10.5359, lng: 106.4137, keywords: ['tan an', 'long an'] },
  { id: 'tn-tayninh', label: 'Tây Ninh', group: 'Vùng lân cận', lat: 11.3108, lng: 106.0983, keywords: ['tay ninh', 'trang bang'] },
  { id: 'brvt-vungtau', label: 'Bà Rịa - Vũng Tàu', group: 'Vùng lân cận', lat: 10.4114, lng: 107.1362, keywords: ['vung tau', 'ba ria', 'phu my'] },
  { id: 'tg-mytho', label: 'Mỹ Tho (Tiền Giang)', group: 'Vùng lân cận', lat: 10.3601, lng: 106.36, keywords: ['my tho', 'tien giang'] },

  // Tỉnh thành khác
  { id: 'ct-cantho', label: 'TP. Cần Thơ', group: 'Tỉnh thành khác', lat: 10.0452, lng: 105.7469, keywords: ['can tho'] },
  { id: 'bt-bentre', label: 'Bến Tre', group: 'Tỉnh thành khác', lat: 10.2434, lng: 106.3756, keywords: ['ben tre'] },
  { id: 'vl-vinhlong', label: 'Vĩnh Long', group: 'Tỉnh thành khác', lat: 10.2537, lng: 105.9722, keywords: ['vinh long'] },
  { id: 'ag-longxuyen', label: 'Long Xuyên (An Giang)', group: 'Tỉnh thành khác', lat: 10.3864, lng: 105.4352, keywords: ['an giang', 'long xuyen'] },
  { id: 'kg-rachgia', label: 'Kiên Giang / Phú Quốc', group: 'Tỉnh thành khác', lat: 10.0125, lng: 105.0809, keywords: ['kien giang', 'rach gia', 'phu quoc'] },
  { id: 'ld-dalat', label: 'Đà Lạt (Lâm Đồng)', group: 'Tỉnh thành khác', lat: 11.9404, lng: 108.4583, keywords: ['da lat', 'lam dong', 'bao loc'] },
  { id: 'kh-nhatrang', label: 'Nha Trang (Khánh Hòa)', group: 'Tỉnh thành khác', lat: 12.2388, lng: 109.1967, keywords: ['nha trang', 'khanh hoa'] },
  { id: 'dn-danang', label: 'TP. Đà Nẵng', group: 'Tỉnh thành khác', lat: 16.0544, lng: 108.2022, keywords: ['da nang'] },
  { id: 'hn-hanoi', label: 'TP. Hà Nội', group: 'Tỉnh thành khác', lat: 21.0285, lng: 105.8542, keywords: ['ha noi', 'hanoi'] },
];

export function stripVietnameseAccents(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function matchAreaFromAddressText(address: string): VietnamAreaPoint | null {
  const norm = stripVietnameseAccents(address);
  if (!norm) return null;

  // Match longer / more specific keywords first
  let bestMatch: { point: VietnamAreaPoint; len: number } | null = null;
  for (const pt of VIETNAM_AREA_POINTS) {
    for (const kw of pt.keywords) {
      if (norm.includes(kw)) {
        if (!bestMatch || kw.length > bestMatch.len) {
          bestMatch = { point: pt, len: kw.length };
        }
      }
    }
  }
  return bestMatch ? bestMatch.point : null;
}

export interface ShippingEstimateResult {
  distanceKm: number;
  estimatedFee: number;
  isFreeShipping: boolean;
  isInterProvince: boolean;
  isNegotiable?: boolean;
  source: 'road_osrm' | 'gps' | 'area_estimate';
  matchedLabel: string;
  explanation: string;
  customerLat?: number;
  customerLng?: number;
}

export function sortShippingTiers(tiers: ShippingTier[]): ShippingTier[] {
  return [...tiers]
    .map((t, idx) => ({
      id: t.id || `tier-${idx + 1}`,
      maxKm: Math.max(0.5, Number(t.maxKm) || 0),
      fee: Math.max(0, Number(t.fee) || 0),
    }))
    .sort((a, b) => a.maxKm - b.maxKm);
}

export function resolveShippingConfig(partial?: Partial<ShippingConfig> | null): ShippingConfig {
  const merged = {
    ...DEFAULT_SHIPPING_CONFIG,
    ...(partial || {}),
  };
  const tiers = Array.isArray(partial?.tiers)
    ? sortShippingTiers(partial.tiers)
    : DEFAULT_SHIPPING_TIERS;
  const rawMaxLocalKm = Number(partial?.maxLocalKm);
  const effectiveMaxLocalKm = partial?.negotiateThresholdConfigured
    ? Math.max(1, Number.isFinite(rawMaxLocalKm) && rawMaxLocalKm > 0 ? rawMaxLocalKm : 30)
    : Math.min(30, Number.isFinite(rawMaxLocalKm) && rawMaxLocalKm > 0 ? rawMaxLocalKm : 30);

  return {
    ...merged,
    maxLocalKm: effectiveMaxLocalKm,
    pricingMode: partial?.pricingMode === 'per_km' ? 'per_km' : 'tiers',
    tiers,
  };
}

export function calculateShippingFeeFromDistance(params: {
  distanceKm: number;
  orderSubtotal?: number;
  config?: Partial<ShippingConfig> | null;
  source: ShippingEstimateResult['source'];
  matchedLabel: string;
  customerLat?: number;
  customerLng?: number;
}): ShippingEstimateResult {
  const cfg = resolveShippingConfig(params.config);
  const roundedKm = Math.max(0.5, Math.round(params.distanceKm * 10) / 10);
  const orderSubtotal = params.orderSubtotal || 0;

  if (roundedKm > cfg.maxLocalKm) {
    return {
      distanceKm: roundedKm,
      estimatedFee: 0,
      isFreeShipping: false,
      isInterProvince: true,
      isNegotiable: true,
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation: `Khoảng cách trên ${cfg.maxLocalKm} km: Phí ship thương lượng / trao đổi trực tiếp với Sale theo tuyến giao thực tế.`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

  if (
    cfg.freeOrderThreshold > 0 &&
    orderSubtotal >= cfg.freeOrderThreshold &&
    roundedKm <= cfg.freeOrderMaxKm
  ) {
    return {
      distanceKm: roundedKm,
      estimatedFee: 0,
      isFreeShipping: true,
      isInterProvince: false,
      isNegotiable: false,
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation: `Freeship đơn từ ${cfg.freeOrderThreshold.toLocaleString('vi-VN')}đ (trong ${cfg.freeOrderMaxKm} km)`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

  // Mode 1: Tiered milestone pricing (dưới 5km freeship, 5-7km = X, 7-10km = Y...)
  if (cfg.pricingMode === 'tiers' && cfg.tiers.length > 0) {
    const sorted = sortShippingTiers(cfg.tiers);
    const matchedIdx = sorted.findIndex((t) => roundedKm <= t.maxKm);

    if (matchedIdx !== -1) {
      const tier = sorted[matchedIdx];
      const prevMaxKm = matchedIdx === 0 ? 0 : sorted[matchedIdx - 1].maxKm;
      const rangeText =
        matchedIdx === 0
          ? `dưới ${tier.maxKm} km`
          : `từ ${prevMaxKm} – ${tier.maxKm} km`;

      if (tier.fee <= 0) {
        return {
          distanceKm: roundedKm,
          estimatedFee: 0,
          isFreeShipping: true,
          isInterProvince: false,
          source: params.source,
          matchedLabel: params.matchedLabel,
          explanation: `Miễn phí giao hàng (mốc ${rangeText})`,
          customerLat: params.customerLat,
          customerLng: params.customerLng,
        };
      }

      return {
        distanceKm: roundedKm,
        estimatedFee: Math.round(tier.fee),
        isFreeShipping: false,
        isInterProvince: false,
        source: params.source,
        matchedLabel: params.matchedLabel,
        explanation: `Áp dụng mốc ${rangeText}: ${Math.round(tier.fee).toLocaleString('vi-VN')}đ`,
        customerLat: params.customerLat,
        customerLng: params.customerLng,
      };
    }

    // Fallback if exceeded all configured local tiers within maxLocalKm

    const lastTier = sorted[sorted.length - 1];
    const extraKm = Math.max(0, Math.ceil(roundedKm - lastTier.maxKm));
    const rawFee = lastTier.fee + extraKm * cfg.pricePerKm;
    const roundedFee = Math.round(rawFee / 1000) * 1000;

    return {
      distanceKm: roundedKm,
      estimatedFee: roundedFee,
      isFreeShipping: roundedFee <= 0,
      isInterProvince: false,
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation:
        cfg.pricePerKm > 0
          ? `Trên mốc ${lastTier.maxKm} km: ${lastTier.fee.toLocaleString('vi-VN')}đ + ${extraKm} km × ${cfg.pricePerKm.toLocaleString('vi-VN')}đ/km`
          : `Áp dụng mức từ ${lastTier.maxKm} – ${cfg.maxLocalKm} km`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

  // Mode 2: Linear per-km pricing
  if (roundedKm <= cfg.freeRadiusKm) {
    return {
      distanceKm: roundedKm,
      estimatedFee: 0,
      isFreeShipping: true,
      isInterProvince: false,
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation: `Miễn phí giao hàng trong bán kính ${cfg.freeRadiusKm} km từ kho`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

  // Linear calculation for distances within maxLocalKm

  const extraKm = Math.max(0, Math.ceil(roundedKm - cfg.freeRadiusKm));
  const rawFee = cfg.baseFee + extraKm * cfg.pricePerKm;
  // Round to nearest 1,000 VND
  const roundedFee = Math.round(rawFee / 1000) * 1000;

  return {
    distanceKm: roundedKm,
    estimatedFee: roundedFee,
    isFreeShipping: false,
    isInterProvince: false,
    source: params.source,
    matchedLabel: params.matchedLabel,
    explanation: `Phí cơ bản ${cfg.baseFee.toLocaleString('vi-VN')}đ + ${extraKm} km × ${cfg.pricePerKm.toLocaleString('vi-VN')}đ/km`,
    customerLat: params.customerLat,
    customerLng: params.customerLng,
  };
}

const osrmRouteCache = new Map<string, number>();
const nominatimGeocodeCache = new Map<string, { lat: number; lng: number; label: string }>();

/**
 * Free geocoding via OpenStreetMap Nominatim + OSRM driving route distance,
 * automatically falling back to Vietnam district/province estimation if unavailable.
 */
export async function estimateDistanceByAddress(params: {
  address: string;
  areaPointId?: string;
  orderSubtotal?: number;
  config?: Partial<ShippingConfig> | null;
}): Promise<ShippingEstimateResult | null> {
  const cfg = resolveShippingConfig(params.config);

  if (params.areaPointId) {
    const pt = VIETNAM_AREA_POINTS.find((p) => p.id === params.areaPointId);
    if (pt) {
      const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, pt.lat, pt.lng);
      const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, pt.lat, pt.lng) * 1.28;
      return calculateShippingFeeFromDistance({
        distanceKm: km,
        orderSubtotal: params.orderSubtotal,
        config: cfg,
        source: roadKm !== null ? 'road_osrm' : 'area_estimate',
        matchedLabel: pt.label,
        customerLat: pt.lat,
        customerLng: pt.lng,
      });
    }
  }

  const trimmed = params.address.trim();
  if (!trimmed) return null;

  const areaHint = matchAreaFromAddressText(trimmed);
  const exactPreset = VIETNAM_AREA_POINTS.find(
    (p) => stripVietnameseAccents(p.label) === stripVietnameseAccents(trimmed)
  );
  if (exactPreset) {
    const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, exactPreset.lat, exactPreset.lng);
    const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, exactPreset.lat, exactPreset.lng) * 1.28;
    return calculateShippingFeeFromDistance({
      distanceKm: km,
      orderSubtotal: params.orderSubtotal,
      config: cfg,
      source: roadKm !== null ? 'road_osrm' : 'area_estimate',
      matchedLabel: exactPreset.label,
      customerLat: exactPreset.lat,
      customerLng: exactPreset.lng,
    });
  }

  // If user typed a broad district/province name without street detail, use exact district center directly
  const hasStreetDetail = /\d+/.test(trimmed.replace(/quận\s*\d+|q\.?\s*\d+|tp\.?hcm/gi, '')) || trimmed.includes(',');

  // 1. Try OpenStreetMap Nominatim (cached + sanity-checked against areaHint)
  if (hasStreetDetail || !areaHint) {
    const cacheKey = stripVietnameseAccents(trimmed);
    const cachedGeo = nominatimGeocodeCache.get(cacheKey);
    if (cachedGeo) {
      const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, cachedGeo.lat, cachedGeo.lng);
      const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, cachedGeo.lat, cachedGeo.lng) * 1.28;
      return calculateShippingFeeFromDistance({
        distanceKm: km,
        orderSubtotal: params.orderSubtotal,
        config: cfg,
        source: roadKm !== null ? 'road_osrm' : 'area_estimate',
        matchedLabel: cachedGeo.label,
        customerLat: cachedGeo.lat,
        customerLng: cachedGeo.lng,
      });
    }

    try {
      const q = trimmed.toLowerCase().includes('viet') ? trimmed : `${trimmed}, Vietnam`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(q)}`,
        {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      if (geoRes.ok) {
        const geoData = (await geoRes.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
        if (Array.isArray(geoData) && geoData.length > 0) {
          const lat = parseFloat(geoData[0].lat);
          const lng = parseFloat(geoData[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            // Sanity check: if user named a known district (e.g. "Quận 7"), discard Nominatim outlier > 25km away
            const isOutlierFromHint =
              areaHint !== null && haversineKm(areaHint.lat, areaHint.lng, lat, lng) > 25;
            if (!isOutlierFromHint) {
              const label =
                geoData[0].display_name?.split(',').slice(0, 3).join(', ') || trimmed;
              nominatimGeocodeCache.set(cacheKey, { lat, lng, label });
              const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng);
              const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng) * 1.28;
              return calculateShippingFeeFromDistance({
                distanceKm: km,
                orderSubtotal: params.orderSubtotal,
                config: cfg,
                source: roadKm !== null ? 'road_osrm' : 'area_estimate',
                matchedLabel: label,
                customerLat: lat,
                customerLng: lng,
              });
            }
          }
        }
      }
    } catch {
      // Fallback cleanly to areaHint below
    }
  }

  // 2. Reliable offline fallback via Vietnam District/Province matching (also uses cached OSRM road km)
  if (!areaHint) return null;

  const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, areaHint.lat, areaHint.lng);
  const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, areaHint.lat, areaHint.lng) * 1.28;
  return calculateShippingFeeFromDistance({
    distanceKm: km,
    orderSubtotal: params.orderSubtotal,
    config: cfg,
    source: roadKm !== null ? 'road_osrm' : 'area_estimate',
    matchedLabel: areaHint.label,
    customerLat: areaHint.lat,
    customerLng: areaHint.lng,
  });
}

export interface AddressSuggestion {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  source: 'area_preset' | 'osm_place';
}

const suggestNominatimCache = new Map<string, AddressSuggestion[]>();

export async function searchAddressSuggestions(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  const norm = stripVietnameseAccents(trimmed);
  if (!norm) {
    return VIETNAM_AREA_POINTS.slice(0, 6).map((p) => ({
      id: p.id,
      label: p.label,
      sublabel: p.group,
      lat: p.lat,
      lng: p.lng,
      source: 'area_preset',
    }));
  }

  const presetMatches: AddressSuggestion[] = [];
  for (const pt of VIETNAM_AREA_POINTS) {
    const labelNorm = stripVietnameseAccents(pt.label);
    const matchedKw = pt.keywords.some((kw) => labelNorm.includes(norm) || kw.includes(norm) || norm.includes(kw));
    if (labelNorm.includes(norm) || matchedKw) {
      presetMatches.push({
        id: pt.id,
        label: pt.label,
        sublabel: pt.group,
        lat: pt.lat,
        lng: pt.lng,
        source: 'area_preset',
      });
    }
  }

  const topPresets = presetMatches.slice(0, 4);

  // Query Nominatim only when the user is typing a specific street/address (>= 4 chars)
  if (norm.length < 4) {
    return topPresets;
  }

  const cached = suggestNominatimCache.get(norm);
  if (cached) {
    return [...topPresets, ...cached].slice(0, 6);
  }

  try {
    const q = trimmed.toLowerCase().includes('viet') ? trimmed : `${trimmed}, Vietnam`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=4&addressdetails=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!res.ok) return topPresets;
    const data = (await res.json()) as Array<{
      place_id?: number;
      lat: string;
      lon: string;
      display_name?: string;
    }>;

    const osmHits: AddressSuggestion[] = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) continue;
        const parts = (item.display_name || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const shortLabel = parts.slice(0, 3).join(', ') || trimmed;
        const sublabel = parts.slice(3, 5).join(', ');
        osmHits.push({
          id: `osm-${item.place_id || `${lat}-${lng}`}`,
          label: shortLabel,
          sublabel: sublabel || 'OpenStreetMap',
          lat,
          lng,
          source: 'osm_place',
        });
      }
    }
    suggestNominatimCache.set(norm, osmHits);
    return [...topPresets, ...osmHits].slice(0, 6);
  } catch {
    return topPresets;
  }
}

export async function geocodeVietnameseAddress(
  address: string
): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  try {
    const q = trimmed.toLowerCase().includes('viet') ? trimmed : `${trimmed}, Vietnam`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng, displayName: data[0].display_name || trimmed };
        }
      }
    }
  } catch {
    // ignore
  }
  const matched = matchAreaFromAddressText(trimmed);
  if (matched) {
    return { lat: matched.lat, lng: matched.lng, displayName: matched.label };
  }
  return null;
}

export async function fetchOsrmRoadKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const cacheKey = `${fromLat.toFixed(4)},${fromLng.toFixed(4)}->${toLat.toFixed(4)},${toLng.toFixed(4)}`;
  const cached = osrmRouteCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: Array<{ distance?: number }> };
    const meters = data?.routes?.[0]?.distance;
    if (typeof meters === 'number' && meters >= 0) {
      const km = meters / 1000;
      osrmRouteCache.set(cacheKey, km);
      return km;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildOpenStreetMapDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat?: number,
  toLng?: number,
  toAddress?: string
): string {
  if (typeof toLat === 'number' && typeof toLng === 'number') {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${fromLat}%2C${fromLng}%3B${toLat}%2C${toLng}`;
  }
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(toAddress || `${fromLat},${fromLng}`)}`;
}
