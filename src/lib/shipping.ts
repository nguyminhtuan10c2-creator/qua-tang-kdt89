export interface ShippingConfig {
  enabled: boolean;
  warehouseName: string;
  warehouseAddress: string;
  warehouseLat: number;
  warehouseLng: number;
  freeRadiusKm: number; // Miễn phí giao trong X km đầu
  freeOrderThreshold: number; // Đơn từ X đ được freeship (nếu trong freeOrderMaxKm)
  freeOrderMaxKm: number; // Bán kính tối đa áp dụng freeship theo giá trị đơn
  baseFee: number; // Phí cơ bản ngoài bán kính miễn phí (VNĐ)
  pricePerKm: number; // Phí mỗi km vượt quá freeRadiusKm (VNĐ/km)
  maxLocalKm: number; // Tối đa giao nội vùng (trên mức này chuyển sang giao chành xe / liên tỉnh)
  provinceBaseFee: number; // Phí gửi chành xe / liên tỉnh tham khảo (VNĐ)
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  enabled: true,
  warehouseName: 'Kho KDT-89 (Q. Chánh Hưng / Q.8)',
  warehouseAddress: 'Số 89-91 Đường số 1, Khu Hiệp Ân, Phường Chánh Hưng, TP.HCM',
  warehouseLat: 10.7407,
  warehouseLng: 106.6634,
  freeRadiusKm: 5,
  freeOrderThreshold: 3000000,
  freeOrderMaxKm: 15,
  baseFee: 25000,
  pricePerKm: 6000,
  maxLocalKm: 40,
  provinceBaseFee: 50000,
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
  source: 'road_osrm' | 'gps' | 'area_estimate';
  matchedLabel: string;
  explanation: string;
  customerLat?: number;
  customerLng?: number;
}

export function resolveShippingConfig(partial?: Partial<ShippingConfig> | null): ShippingConfig {
  return {
    ...DEFAULT_SHIPPING_CONFIG,
    ...(partial || {}),
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
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation: `Freeship đơn từ ${cfg.freeOrderThreshold.toLocaleString('vi-VN')}đ (trong ${cfg.freeOrderMaxKm} km)`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

  if (roundedKm > cfg.maxLocalKm) {
    return {
      distanceKm: roundedKm,
      estimatedFee: cfg.provinceBaseFee,
      isFreeShipping: false,
      isInterProvince: true,
      source: params.source,
      matchedLabel: params.matchedLabel,
      explanation: `Ngoài ${cfg.maxLocalKm} km: gửi chành xe / bưu cục (tham khảo từ ${cfg.provinceBaseFee.toLocaleString('vi-VN')}đ, sale báo chính xác)`,
      customerLat: params.customerLat,
      customerLng: params.customerLng,
    };
  }

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

  // 1. Try OpenStreetMap Nominatim free geocoder for exact street address
  try {
    const q = trimmed.toLowerCase().includes('viet') ? trimmed : `${trimmed}, Vietnam`;
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(q)}`,
      {
        headers: { Accept: 'application/json' },
      }
    );
    if (geoRes.ok) {
      const geoData = (await geoRes.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
      if (Array.isArray(geoData) && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lng = parseFloat(geoData[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng);
          const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng) * 1.28;
          return calculateShippingFeeFromDistance({
            distanceKm: km,
            orderSubtotal: params.orderSubtotal,
            config: cfg,
            source: roadKm !== null ? 'road_osrm' : 'area_estimate',
            matchedLabel: geoData[0].display_name?.split(',').slice(0, 3).join(', ') || trimmed,
            customerLat: lat,
            customerLng: lng,
          });
        }
      }
    }
  } catch {
    // Fallback to offline Vietnam area table below
  }

  // 2. Reliable offline fallback via Vietnam District/Province matching
  const matched = matchAreaFromAddressText(trimmed);
  if (!matched) return null;

  const approxKm = haversineKm(cfg.warehouseLat, cfg.warehouseLng, matched.lat, matched.lng) * 1.28;
  return calculateShippingFeeFromDistance({
    distanceKm: approxKm,
    orderSubtotal: params.orderSubtotal,
    config: cfg,
    source: 'area_estimate',
    matchedLabel: matched.label,
    customerLat: matched.lat,
    customerLng: matched.lng,
  });
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
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: Array<{ distance?: number }> };
    const meters = data?.routes?.[0]?.distance;
    if (typeof meters === 'number' && meters >= 0) {
      return meters / 1000;
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
