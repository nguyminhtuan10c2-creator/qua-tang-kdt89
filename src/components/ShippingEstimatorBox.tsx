import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  Truck,
  Loader2,
  ExternalLink,
  Search,
  X,
} from 'lucide-react';
import {
  AddressSuggestion,
  ShippingConfig,
  ShippingEstimateResult,
  VIETNAM_AREA_POINTS,
  resolveShippingConfig,
  estimateDistanceByAddress,
  fetchOsrmRoadKm,
  haversineKm,
  calculateShippingFeeFromDistance,
  buildOpenStreetMapDirectionsUrl,
  searchAddressSuggestions,
  sortShippingTiers,
} from '../lib/shipping';

interface ShippingEstimatorBoxProps {
  addressValue: string;
  onAddressChange?: (nextAddress: string) => void;
  orderSubtotal?: number;
  shippingConfig?: Partial<ShippingConfig> | null;
  onEstimateChange?: (estimate: ShippingEstimateResult | null) => void;
  compact?: boolean;
  embedded?: boolean;
  showAddressInput?: boolean;
}

const POPULAR_AREA_IDS = [
  'hcm-q8',
  'hcm-q7',
  'hcm-q5',
  'hcm-q6',
  'hcm-binhchanh',
  'hcm-q1',
];

export const ShippingEstimatorBox: React.FC<ShippingEstimatorBoxProps> = ({
  addressValue,
  onAddressChange,
  orderSubtotal = 0,
  shippingConfig,
  onEstimateChange,
  compact = false,
  embedded = false,
  showAddressInput = true,
}) => {
  const cfg = useMemo(() => resolveShippingConfig(shippingConfig), [shippingConfig]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<ShippingEstimateResult | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSearchingSuggest, setIsSearchingSuggest] = useState(false);

  const requestIdRef = useRef(0);
  const lastAutoLabelRef = useRef('');
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateEstimate = (next: ShippingEstimateResult | null) => {
    setEstimate(next);
    onEstimateChange?.(next);
  };

  const configKey = JSON.stringify(cfg);

  // Recalculate fee if order subtotal or shipping pricing config changes while we already have distance
  useEffect(() => {
    if (!estimate) return;
    const updated = calculateShippingFeeFromDistance({
      distanceKm: estimate.distanceKm,
      orderSubtotal,
      config: cfg,
      source: estimate.source,
      matchedLabel: estimate.matchedLabel,
      customerLat: estimate.customerLat,
      customerLng: estimate.customerLng,
    });
    setEstimate(updated);
    onEstimateChange?.(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSubtotal, configKey]);

  // Debounced live address autocomplete (instant local districts + OpenStreetMap places)
  useEffect(() => {
    if (!showAddressInput || !isSuggestOpen) return;
    const trimmed = addressValue.trim();

    // Immediately show matching local districts (0ms)
    const ac = new AbortController();
    let mounted = true;

    const timer = setTimeout(async () => {
      if (trimmed.length >= 4) setIsSearchingSuggest(true);
      try {
        const list = await searchAddressSuggestions(trimmed, ac.signal);
        if (mounted) {
          setSuggestions(list);
        }
      } finally {
        if (mounted) setIsSearchingSuggest(false);
      }
    }, trimmed.length >= 4 ? 260 : 40);

    return () => {
      mounted = false;
      clearTimeout(timer);
      ac.abort();
    };
  }, [addressValue, isSuggestOpen, showAddressInput]);

  const pricingSummaryText = useMemo(() => {
    if (cfg.pricingMode === 'tiers' && cfg.tiers.length > 0) {
      const sorted = sortShippingTiers(cfg.tiers).slice(0, 3);
      return sorted
        .map((t, i) => {
          const prev = i === 0 ? 0 : sorted[i - 1].maxKm;
          const label = i === 0 ? `≤${t.maxKm}km` : `${prev}–${t.maxKm}km`;
          const feeLabel = t.fee <= 0 ? 'Freeship' : `${Math.round(t.fee / 1000)}k`;
          return `${label}: ${feeLabel}`;
        })
        .join(' · ');
    }
    return `Miễn phí trong ${cfg.freeRadiusKm}km đầu`;
  }, [cfg]);

  const handleSelectSuggestion = async (s: AddressSuggestion) => {
    setIsSuggestOpen(false);
    setErrorMsg(null);
    const reqId = ++requestIdRef.current;

    if (s.source === 'area_preset') {
      setSelectedAreaId(s.id);
    } else {
      setSelectedAreaId('');
    }

    lastAutoLabelRef.current = s.label;
    onAddressChange?.(s.label);

    setLoading(true);
    try {
      const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, s.lat, s.lng);
      if (requestIdRef.current !== reqId) return;
      const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, s.lat, s.lng) * 1.28;
      const res = calculateShippingFeeFromDistance({
        distanceKm: km,
        orderSubtotal,
        config: cfg,
        source: roadKm !== null ? 'road_osrm' : 'area_estimate',
        matchedLabel: s.label,
        customerLat: s.lat,
        customerLng: s.lng,
      });
      updateEstimate(res);
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  const handleSelectArea = async (areaId: string) => {
    setSelectedAreaId(areaId);
    setErrorMsg(null);
    setIsSuggestOpen(false);
    const reqId = ++requestIdRef.current;

    if (!areaId) {
      updateEstimate(null);
      return;
    }

    const pt = VIETNAM_AREA_POINTS.find((p) => p.id === areaId);
    if (pt && onAddressChange) {
      const currentTrim = addressValue.trim();
      const wasPresetLabel =
        currentTrim === '' ||
        currentTrim === lastAutoLabelRef.current ||
        VIETNAM_AREA_POINTS.some((a) => a.label === currentTrim);
      if (wasPresetLabel) {
        lastAutoLabelRef.current = pt.label;
        onAddressChange(pt.label);
      }
    }

    setLoading(true);
    try {
      const res = await estimateDistanceByAddress({
        address: pt?.label || '',
        areaPointId: areaId,
        orderSubtotal,
        config: cfg,
      });
      if (requestIdRef.current !== reqId) return;
      updateEstimate(res);
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  const handleMeasureAddress = async () => {
    setIsSuggestOpen(false);
    const trimmed = addressValue.trim();
    if (!trimmed && !selectedAreaId) {
      setErrorMsg('Vui lòng nhập số nhà/đường hoặc chọn Quận/Huyện bên dưới.');
      return;
    }
    setErrorMsg(null);
    const reqId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await estimateDistanceByAddress({
        address: trimmed,
        areaPointId: trimmed ? undefined : selectedAreaId,
        orderSubtotal,
        config: cfg,
      });
      if (requestIdRef.current !== reqId) return;
      if (!res) {
        setErrorMsg(
          'Chưa định vị được chính xác số nhà này — anh/chị chọn nhanh Quận/Huyện bên dưới để tính ngay nhé.'
        );
      } else {
        updateEstimate(res);
      }
    } finally {
      if (requestIdRef.current === reqId) {
        setLoading(false);
      }
    }
  };

  const handleUseGps = () => {
    setIsSuggestOpen(false);
    if (!navigator.geolocation) {
      setErrorMsg('Trình duyệt không hỗ trợ định vị GPS. Anh/chị chọn Quận/Huyện nhé.');
      return;
    }
    setErrorMsg(null);
    const reqId = ++requestIdRef.current;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng);
          if (requestIdRef.current !== reqId) return;
          const km = roadKm ?? haversineKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng) * 1.28;
          const res = calculateShippingFeeFromDistance({
            distanceKm: km,
            orderSubtotal,
            config: cfg,
            source: 'gps',
            matchedLabel: 'Vị trí GPS hiện tại của anh/chị',
            customerLat: lat,
            customerLng: lng,
          });
          updateEstimate(res);
          if (onAddressChange && (!addressValue.trim() || addressValue.trim() === lastAutoLabelRef.current)) {
            const gpsLabel = `Vị trí GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            lastAutoLabelRef.current = gpsLabel;
            onAddressChange(gpsLabel);
          }
        } finally {
          if (requestIdRef.current === reqId) {
            setGpsLoading(false);
          }
        }
      },
      () => {
        if (requestIdRef.current === reqId) {
          setGpsLoading(false);
          setErrorMsg('Không lấy được vị trí GPS (cần cấp quyền vị trí) — anh/chị chọn Quận/Huyện giúp em nhé.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const hcmAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'TP.HCM');
  const nearbyAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'Vùng lân cận');
  const otherAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'Tỉnh thành khác');
  const quickAreas = POPULAR_AREA_IDS.map((id) => VIETNAM_AREA_POINTS.find((p) => p.id === id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p)
  );

  const outerClass = embedded
    ? 'space-y-3'
    : `rounded-2xl border border-neutral-200 bg-neutral-50/70 ${compact ? 'p-3' : 'p-4'} space-y-3`;

  return (
    <div className={outerClass}>
      {!embedded && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Tính khoảng cách &amp; Tạm tính phí ship</span>
          </div>
          <span className="text-[11px] text-neutral-500">{pricingSummaryText}</span>
        </div>
      )}

      {/* Warehouse origin & pricing summary as quiet inline metadata (no boxes/pills) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-600">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span className="truncate">
            Từ <strong className="text-neutral-800">{cfg.warehouseName}</strong>
          </span>
        </div>
        {embedded && (
          <span className="text-[11px] text-neutral-500 shrink-0">{pricingSummaryText}</span>
        )}
      </div>

      {/* Unified Searchable Address Input + 1-Tap Check & GPS */}
      {showAddressInput && (
        <div className="relative">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={addressValue}
                onFocus={() => {
                  if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
                  setIsSuggestOpen(true);
                }}
                onBlur={() => {
                  blurTimeoutRef.current = setTimeout(() => setIsSuggestOpen(false), 180);
                }}
                onChange={(e) => {
                  onAddressChange?.(e.target.value);
                  setIsSuggestOpen(true);
                  setErrorMsg(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleMeasureAddress();
                  }
                }}
                placeholder="Nhập số nhà, tên đường hoặc Quận/Huyện..."
                className="w-full pl-8 pr-8 py-2 text-base sm:text-sm rounded-xl border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/15 focus:border-neutral-500 text-neutral-900"
              />
              {addressValue && (
                <button
                  type="button"
                  onClick={() => {
                    onAddressChange?.('');
                    setSelectedAreaId('');
                    setErrorMsg(null);
                    setIsSuggestOpen(true);
                  }}
                  aria-label="Xóa địa chỉ"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void handleMeasureAddress()}
                disabled={loading}
                className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Đo phí ship</span>
              </button>

              <button
                type="button"
                onClick={handleUseGps}
                disabled={gpsLoading}
                title="Dùng vị trí GPS hiện tại để tính nhanh"
                className="py-2 px-3 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-60 text-neutral-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
              >
                {gpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>Vị trí GPS</span>
              </button>
            </div>
          </div>

          {/* Instant Autocomplete Suggestions Dropdown */}
          {isSuggestOpen && (suggestions.length > 0 || isSearchingSuggest) && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden max-h-52 overflow-y-auto divide-y divide-neutral-100">
              {isSearchingSuggest && suggestions.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-neutral-500 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tìm địa chỉ gợi ý...</span>
                </div>
              ) : (
                suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent input blur before selection fires
                      e.preventDefault();
                      void handleSelectSuggestion(s);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-start justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 truncate">
                          {s.label}
                        </div>
                        {s.sublabel && (
                          <div className="text-[11px] text-neutral-500 truncate">{s.sublabel}</div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-700 shrink-0 mt-0.5">
                      Chọn
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 1-Tap Quick Area Picker (Popular Districts + Full Dropdown) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          <span className="text-[11px] text-neutral-500 shrink-0">Chọn nhanh:</span>
          {quickAreas.map((a) => {
            const active = selectedAreaId === a.id;
            const shortName = a.label.replace(' (TP.HCM)', '').replace(' / P. Chánh Hưng', '');
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => void handleSelectArea(a.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {shortName}
              </button>
            );
          })}
        </div>

        <select
          value={selectedAreaId}
          onChange={(e) => void handleSelectArea(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/15 text-neutral-700"
        >
          <option value="">Hoặc chọn Quận/Huyện / Tỉnh thành khác...</option>
          <optgroup label="TP. Hồ Chí Minh">
            {hcmAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Tỉnh lân cận">
            {nearbyAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Tỉnh thành khác">
            {otherAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {errorMsg && (
        <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {errorMsg}
        </div>
      )}

      {/* Clean Single-Surface Shipping Estimate Output */}
      {estimate && (
        <div
          className={`rounded-xl bg-white border border-neutral-200 p-3 space-y-1.5 transition-opacity duration-150 ${
            loading || gpsLoading ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-baseline gap-2 text-xs text-neutral-700">
              <span>Khoảng cách:</span>
              <strong className="text-sm font-bold text-neutral-900 tabular-nums">
                ~{estimate.distanceKm} km
              </strong>
            </div>
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="text-neutral-600">Phí ship:</span>
              {estimate.isFreeShipping ? (
                <strong className="text-sm font-bold text-emerald-700 tabular-nums">
                  Miễn phí (0đ)
                </strong>
              ) : (
                <strong className="text-sm font-bold text-rose-700 tabular-nums">
                  {estimate.estimatedFee.toLocaleString('vi-VN')}đ
                </strong>
              )}
            </div>
          </div>

          <div className="text-[11px] text-neutral-600">{estimate.explanation}</div>

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-neutral-100 text-[11px] text-neutral-500">
            <span className="truncate">{estimate.matchedLabel}</span>
            <a
              href={buildOpenStreetMapDirectionsUrl(
                cfg.warehouseLat,
                cfg.warehouseLng,
                estimate.customerLat,
                estimate.customerLng,
                estimate.matchedLabel
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-800 hover:text-rose-700 font-semibold inline-flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <span>Xem lộ trình</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
