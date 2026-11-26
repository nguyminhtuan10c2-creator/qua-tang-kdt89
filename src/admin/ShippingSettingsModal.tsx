import React, { useEffect, useState } from 'react';
import {
  X,
  Truck,
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import {
  ShippingConfig,
  DEFAULT_SHIPPING_CONFIG,
  resolveShippingConfig,
  geocodeVietnameseAddress,
} from '../lib/shipping';
import { ShippingEstimatorBox } from '../components/ShippingEstimatorBox';

interface ShippingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingConfig?: Partial<ShippingConfig> | null;
  onSaveConfig: (nextConfig: ShippingConfig) => Promise<void>;
}

export const ShippingSettingsModal: React.FC<ShippingSettingsModalProps> = ({
  isOpen,
  onClose,
  shippingConfig,
  onSaveConfig,
}) => {
  const [form, setForm] = useState<ShippingConfig>(resolveShippingConfig(shippingConfig));
  const [findingCoords, setFindingCoords] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [testAddress, setTestAddress] = useState('Quận 7, TP.HCM');

  useEffect(() => {
    if (isOpen) {
      setForm(resolveShippingConfig(shippingConfig));
      setStatusMsg(null);
    }
  }, [isOpen, shippingConfig]);

  if (!isOpen) return null;

  const handleGeocodeWarehouse = async () => {
    setFindingCoords(true);
    setStatusMsg(null);
    try {
      const geo = await geocodeVietnameseAddress(form.warehouseAddress);
      if (geo) {
        setForm((prev) => ({
          ...prev,
          warehouseLat: Number(geo.lat.toFixed(6)),
          warehouseLng: Number(geo.lng.toFixed(6)),
        }));
        setStatusMsg(`Đã cập nhật tọa độ từ bản đồ OpenStreetMap (${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}).`);
      } else {
        setStatusMsg('Không tìm thấy địa chỉ chính xác — anh có thể nhập tay tọa độ hoặc bấm GPS tại kho.');
      }
    } finally {
      setFindingCoords(false);
    }
  };

  const handleGpsWarehouse = () => {
    if (!navigator.geolocation) {
      setStatusMsg('Trình duyệt không hỗ trợ GPS.');
      return;
    }
    setGpsLoading(true);
    setStatusMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          warehouseLat: Number(pos.coords.latitude.toFixed(6)),
          warehouseLng: Number(pos.coords.longitude.toFixed(6)),
        }));
        setGpsLoading(false);
        setStatusMsg('Đã lấy tọa độ GPS hiện tại làm vị trí kho!');
      },
      () => {
        setGpsLoading(false);
        setStatusMsg('Không lấy được GPS — vui lòng cấp quyền vị trí hoặc nhập tọa độ thủ công.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await onSaveConfig({
        ...form,
        freeRadiusKm: Math.max(0, Number(form.freeRadiusKm) || 0),
        freeOrderThreshold: Math.max(0, Number(form.freeOrderThreshold) || 0),
        freeOrderMaxKm: Math.max(0, Number(form.freeOrderMaxKm) || 0),
        baseFee: Math.max(0, Number(form.baseFee) || 0),
        pricePerKm: Math.max(0, Number(form.pricePerKm) || 0),
        maxLocalKm: Math.max(1, Number(form.maxLocalKm) || 40),
        provinceBaseFee: Math.max(0, Number(form.provinceBaseFee) || 0),
      });
      setStatusMsg('Đã lưu cấu hình kho & bảng giá ship!');
    } finally {
      setSaving(false);
    }
  };

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${form.warehouseLng - 0.015}%2C${form.warehouseLat - 0.012}%2C${form.warehouseLng + 0.015}%2C${form.warehouseLat + 0.012}&layer=mapnik&marker=${form.warehouseLat}%2C${form.warehouseLng}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Khoảng cách Kho &amp; Tạm tính Phí Ship
              </h3>
              <p className="text-xs text-slate-500">
                Dùng OpenStreetMap + OSRM miễn phí 100% (không cần API key Google Maps).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                Bật khung tính khoảng cách &amp; phí ship tạm tính cho khách hàng
              </div>
              <div className="text-xs text-slate-500">
                Hiển thị trong form đặt hàng để khách biết trước khoảng cách từ kho &amp; phí ship ước tính.
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-700"
            />
          </label>

          {/* Warehouse Location */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>1. Vị trí Kho xuất hàng của anh</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên kho hiển thị</label>
                <input
                  type="text"
                  value={form.warehouseName}
                  onChange={(e) => setForm({ ...form, warehouseName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tọa độ (Vĩ độ, Kinh độ)</label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.000001"
                    value={form.warehouseLat}
                    onChange={(e) => setForm({ ...form, warehouseLat: parseFloat(e.target.value) || 0 })}
                    className="w-1/2 px-2.5 py-2 rounded-lg border border-slate-300 font-mono"
                    placeholder="Lat"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={form.warehouseLng}
                    onChange={(e) => setForm({ ...form, warehouseLng: parseFloat(e.target.value) || 0 })}
                    className="w-1/2 px-2.5 py-2 rounded-lg border border-slate-300 font-mono"
                    placeholder="Lng"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1.5">
              <label className="block font-semibold text-slate-700">Địa chỉ kho</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={form.warehouseAddress}
                  onChange={(e) => setForm({ ...form, warehouseAddress: e.target.value })}
                  className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => void handleGeocodeWarehouse()}
                  disabled={findingCoords}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  {findingCoords ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Tìm tọa độ</span>
                </button>
                <button
                  type="button"
                  onClick={handleGpsWarehouse}
                  disabled={gpsLoading}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  <span>GPS kho</span>
                </button>
              </div>
            </div>

            {/* OpenStreetMap visual pin preview */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title="Bản đồ vị trí kho OpenStreetMap"
                src={osmEmbedUrl}
                className="w-full h-36 border-0"
                loading="lazy"
              />
              <div className="px-3 py-1.5 bg-white border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span>Pin vị trí kho đang đặt tại {form.warehouseLat}, {form.warehouseLng}</span>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${form.warehouseLat}&mlon=${form.warehouseLng}#map=16/${form.warehouseLat}/${form.warehouseLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold inline-flex items-center gap-0.5 hover:underline"
                >
                  <span>Mở bản đồ lớn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Pricing Formula */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900">
              2. Bảng tính phí ship tạm tính theo km
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Miễn phí trong (km đầu)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.freeRadiusKm}
                  onChange={(e) => setForm({ ...form, freeRadiusKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phí cơ bản (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.baseFee}
                  onChange={(e) => setForm({ ...form, baseFee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá mỗi km thêm (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={form.pricePerKm}
                  onChange={(e) => setForm({ ...form, pricePerKm: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Freeship đơn từ (VNĐ, 0 = tắt)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={form.freeOrderThreshold}
                  onChange={(e) => setForm({ ...form, freeOrderThreshold: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Freeship tối đa (km)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.freeOrderMaxKm}
                  onChange={(e) => setForm({ ...form, freeOrderMaxKm: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phí chành xe ngoài {form.maxLocalKm}km (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  value={form.provinceBaseFee}
                  onChange={(e) => setForm({ ...form, provinceBaseFee: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Live Test Box */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-800">
              3. Thử đo khoảng cách &amp; phí ship ngay:
            </div>
            <input
              type="text"
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Nhập thử địa chỉ khách để kiểm tra..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <ShippingEstimatorBox
              addressValue={testAddress}
              onAddressChange={setTestAddress}
              orderSubtotal={2000000}
              shippingConfig={form}
              compact
            />
          </div>

          {statusMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setForm(DEFAULT_SHIPPING_CONFIG)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Khôi phục mặc định
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? 'Đang lưu...' : 'Lưu cài đặt Ship'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
