import React, { useState } from 'react';
import { Heart, Copy, Check, MessageSquareHeart } from 'lucide-react';

interface GiftCardBuilderProps {
  onAttachMessage: (message: string, recipient: string) => void;
}

const SAMPLE_WISHES = {
  vo: [
    '20/10 chúc vợ yêu luôn vui vẻ, bớt vất vả. Cảm ơn em đã luôn là hậu phương ấm áp của gia đình mình!',
    'Chúc vợ 20/10 rạng rỡ, xinh đẹp. Căn bếp mới này tặng em, mong mỗi bữa cơm nhà mình luôn tràn ngập tiếng cười!',
    'Anh biết anh bận công trình ít thời gian ở nhà, món quà nhỏ này mong san sẻ việc nhà cùng em mỗi ngày. Yêu vợ!',
  ],
  me: [
    'Nhân ngày 20/10, con chúc mẹ luôn dồi dào sức khỏe, an vui bên con cháu. Con kính tặng mẹ món quà thiết thực này!',
    'Mẹ ơi, con chúc mẹ ngày 20/10 thật nhiều niềm vui. Cơm dẻo canh ngọt mỗi ngày mẹ nhớ giữ gìn sức khỏe nhé mẹ!',
    'Kính chúc Mẹ yêu quý ngày 20/10 bình an, khỏe mạnh. Cảm ơn Mẹ đã một đời hy sinh và chăm lo cho chúng con!',
  ],
  nguoi_than: [
    'Chúc bạn/chị một ngày 20/10 ngập tràn niềm vui, công việc thuận lợi và luôn hạnh phúc bên gia đình!',
    'Gửi tặng món quà thiết thực nhân ngày Phụ nữ Việt Nam 20/10. Chúc luôn an yên và ngập tràn may mắn!',
  ],
};

export const GiftCardBuilder: React.FC<GiftCardBuilderProps> = ({ onAttachMessage }) => {
  const [target, setTarget] = useState<'vo' | 'me' | 'nguoi_than'>('vo');
  const [selectedWish, setSelectedWish] = useState<string>(SAMPLE_WISHES.vo[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [attached, setAttached] = useState<boolean>(false);

  const handleSelectTab = (newTarget: 'vo' | 'me' | 'nguoi_than') => {
    setTarget(newTarget);
    setSelectedWish(SAMPLE_WISHES[newTarget][0]);
    setAttached(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedWish);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAttach = () => {
    const label = target === 'vo' ? 'Vợ' : target === 'me' ? 'Mẹ' : 'Người thân';
    onAttachMessage(selectedWish, label);
    setAttached(true);
    setTimeout(() => setAttached(false), 3000);
  };

  return (
    <section className="py-10 bg-rose-50/40 border-b border-rose-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-neutral-900 tracking-tight">
                  Tặng kèm thiệp viết tay 20/10 chu đáo
                </h3>
                <p className="text-xs text-neutral-500">
                  Anh em không khéo ăn nói? KDT-89 gợi ý sẵn lời chúc ý nghĩa, in thiệp nắn nót bỏ kèm thùng quà.
                </p>
              </div>
            </div>

            {/* Target Selectors */}
            <div className="flex items-center gap-1.5 p-1 bg-neutral-100 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => handleSelectTab('vo')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  target === 'vo' ? 'bg-white text-rose-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tặng Vợ
              </button>
              <button
                onClick={() => handleSelectTab('me')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  target === 'me' ? 'bg-white text-rose-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tặng Mẹ
              </button>
              <button
                onClick={() => handleSelectTab('nguoi_than')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  target === 'nguoi_than' ? 'bg-white text-rose-700 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Người thân
              </button>
            </div>
          </div>

          {/* Preset Wishes */}
          <div className="space-y-2 mb-4">
            {SAMPLE_WISHES[target].map((wish, index) => (
              <label
                key={index}
                onClick={() => {
                  setSelectedWish(wish);
                  setAttached(false);
                }}
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                  selectedWish === wish
                    ? 'bg-rose-50/60 border-rose-300 text-neutral-900 ring-1 ring-rose-300'
                    : 'bg-neutral-50 hover:bg-neutral-100/70 border-neutral-200 text-neutral-700'
                }`}
              >
                <input
                  type="radio"
                  name="sample-wish"
                  checked={selectedWish === wish}
                  onChange={() => setSelectedWish(wish)}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500 shrink-0"
                />
                <span className="leading-relaxed">{wish}</span>
              </label>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-100">
            <span className="text-xs text-neutral-500 italic">
              * KDT-89 hỗ trợ viết thiệp tay hoặc in thiệp hoa văn nhã nhặn hoàn toàn miễn phí.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép lời chúc'}</span>
              </button>

              <button
                onClick={handleAttach}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {attached ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-white/20" />}
                <span>{attached ? 'Đã gắn vào đơn' : 'Gắn vào yêu cầu giữ quà'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
