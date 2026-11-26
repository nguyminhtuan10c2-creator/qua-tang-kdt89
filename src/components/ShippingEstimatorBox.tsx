import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Navigation,
  Truck,
  Loader2,
  ExternalLink,
  Search,
} from 'lucide-react';
import {
  ShippingConfig,
  ShippingEstimateResult,
  VIETNAM_AREA_POINTS,
  resolveShippingConfig,
  estimateDistanceByAddress,
  fetchOsrmRoadKm,
  haversineKm,
  calculateShippingFeeFromDistance,
  buildOpenStreetMapDirectionsUrl,
} from '../lib/shipping';

interface ShippingEstimatorBoxProps {
  addressValue: string;
  onAddressChange?: (nextAddress: string) => void;
  orderSubtotal?: number;
  shippingConfig?: Partial<ShippingConfig> | null;
  onEstimateChange?: (estimate: ShippingEstimateResult | null) => void;
  compact?: boolean;
}

export const ShippingEstimatorBox: React.FC<ShippingEstimatorBoxProps> = ({
  addressValue,
  onAddressChange,
  orderSubtotal = 0,
  shippingConfig,
  onEstimateChange,
  compact = false,
}) => {
  const cfg = resolveShippingConfig(shippingConfig);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<ShippingEstimateResult | null>(null);

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

  const handleSelectArea = async (areaId: string) => {
    setSelectedAreaId(areaId);
    setErrorMsg(null);
    if (!areaId) {
      updateEstimate(null);
      return;
    }
    const pt = VIETNAM_AREA_POINTS.find((p) => p.id === areaId);
    if (pt && onAddressChange && !addressValue.trim()) {
      onAddressChange(pt.label);
    }
    setLoading(true);
    try {
      const res = await estimateDistanceByAddress({
        address: pt?.label || '',
        areaPointId: areaId,
        orderSubtotal,
        config: cfg,
      });
      updateEstimate(res);
    } finally {
      setLoading(false);
    }
  };

  const handleMeasureAddress = async () => {
    const trimmed = addressValue.trim();
    if (!trimmed && !selectedAreaId) {
      setErrorMsg('Vui lòng nhập địa chỉ hoặc chọn Quận/Huyện ở trên trước.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await estimateDistanceByAddress({
        address: trimmed,
        areaPointId: trimmed ? undefined : selectedAreaId,
        orderSubtotal,
        config: cfg,
      });
      if (!res) {
        setErrorMsg(
          'Chưa nhận diện được địa chỉ trên bản đồ. Anh/chị chọn nhanh Quận/Huyện ở khung bên trên để tính ngay nhé!'
        );
        updateEstimate(null);
      } else {
        updateEstimate(res);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Trình duyệt không hỗ trợ định vị GPS. Anh/chị chọn Quận/Huyện nhé.');
      return;
    }
    setErrorMsg(null);
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const roadKm = await fetchOsrmRoadKm(cfg.warehouseLat, cfg.warehouseLng, lat, lng);
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
          if (onAddressChange && !addressValue.trim()) {
            onAddressChange(`Vị trí GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          }
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        setErrorMsg('Không lấy được vị trí GPS (cần cấp quyền vị trí) — anh/chị chọn Quận/Huyện giúp em nhé.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const hcmAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'TP.HCM');
  const nearbyAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'Vùng lân cận');
  const otherAreas = VIETNAM_AREA_POINTS.filter((p) => p.group === 'Tỉnh thành khác');

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50/50 ${compact ? 'p-3' : 'p-3.5'} space-y-2.5`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Tính khoảng cách từ kho &amp; Tạm tính phí ship</span>
        </div>
        <span className="text-[10px] font-medium text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
          Bản đồ OpenStreetMap
        </span>
      </div>

      <div className="text-[11px] text-neutral-600 flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
        <span>
          Kho xuất: <strong className="text-neutral-800">{cfg.warehouseName}</strong> — {cfg.warehouseAddress}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <select
          value={selectedAreaId}
          onChange={(e) => void handleSelectArea(e.target.value)}
          className="w-full px-2.5 py-2 text-xs rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-800"
        >
          <option value="">-- Chọn nhanh Quận/Huyện hoặc Tỉnh --</option>
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleMeasureAddress()}
            disabled={loading}
            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Đo theo địa chỉ</span>
          </button>

          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            title="Lấy vị trí GPS hiện tại để đo khoảng cách"
            className="py-2 px-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-100 disabled:opacity-60 text-emerald-900 text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {gpsLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>GPS</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          {errorMsg}
        </div>
      )}

      {estimate && (
        <div className="rounded-xl bg-white border border-emerald-200 p-3 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-neutral-700">
              Khoảng cách ước tính:{' '}
              <strong className="text-sm font-black text-emerald-800 font-mono">
                ~{estimate.distanceKm} km
              </strong>
            </div>
            <div className="text-xs">
              Phí ship tạm tính:{' '}
              {estimate.isFreeShipping ? (
                <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                  MIỄN PHÍ (0đ)
                </span>
              ) : (
                <span className="font-black text-rose-700 font-mono text-sm">
                  {estimate.estimatedFee.toLocaleString('vi-VN')}đ
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-neutral-600">{estimate.explanation}</div>
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-[10px] text-neutral-500">
            <span className="truncate">Điểm đến: {estimate.matchedLabel}</span>
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
              className="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-0.5 shrink-0"
            >
              <span>Xem đường đi</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
