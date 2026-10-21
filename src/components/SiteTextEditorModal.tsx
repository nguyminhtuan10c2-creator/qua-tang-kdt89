import React, { useState, useEffect } from 'react';
import {
  X,
  Type,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Globe,
  Phone,
  HelpCircle,
  Copy,
  Calendar,
  Gift,
  Heart,
  Flame,
  Sun,
  Layers,
  CheckCircle2,
  Tag,
  Building,
  Sliders,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SiteTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customTexts: Record<string, string>;
  customSeo?: { title?: string; description?: string };
  onSaveTexts: (texts: Record<string, string>, seo: { title: string; description: string }) => void;
  onResetTexts: () => void;
}

export const DEFAULT_SITE_TEXTS: Record<string, string> = {
  // 1. Header & Announcement
  headerAnnouncement: '🎉 KHO ĐIỆN TỬ KDT-89 | Phân phối thiết bị điện máy, điện gia dụng chính hãng – Hỗ trợ giao tận nơi & lắp đặt chu đáo',
  navProducts: 'Sản phẩm',
  headerConsultationBtn: 'Nhờ sale tư vấn',

  // 2. Hero Section
  partnerBadge: 'Ưu đãi riêng cho đối tác & khách hàng KDT-89',
  heroTitle: 'Kho Điện Tử KDT-89 | Thiết Bị Điện Máy & Gia Dụng Chính Hãng Giá Tốt',
  heroSubtitle: 'Chọn món quà thiết thực – dùng được mỗi ngày – giá tận kho KDT-89.',
  heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra hàng ưng ý mới thanh toán.',
  heroHighlights: 'Nồi cơm Cuckoo giá kho · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy lạnh · Máy tắm nóng',

  // 3. Combos
  comboBadge: 'Gợi ý quà tặng thiết thực',
  comboTitle: 'Các combo quà tặng thiết thực được chọn nhiều nhất',
  comboSubtitle: 'Đã phối sẵn tinh tế, thiết thực – anh chỉ việc chọn, KDT-89 lo đóng gói và giao tận nơi.',

  // 4. Gift Card
  giftCardBadge: 'Tặng kèm miễn phí',
  giftCardTitle: 'Tặng kèm thiệp chúc mừng viết tay chu đáo',
  giftCardSubtitle: 'KDT-89 in thiệp trang trọng, gói quà chu đáo gửi kèm đơn hàng hoàn toàn miễn phí.',
  giftCardTagVo: 'Tặng Vợ',
  giftCardTagMe: 'Tặng Mẹ',
  giftCardTagNguoiThan: 'Người thân',

  // 5. Catalog
  catalogBadge: 'Danh mục sản phẩm có sẵn tại kho',
  catalogTitle: 'Thiết bị điện máy & gia dụng giá tốt tại kho',
  catalogSubtitle: 'Ưu đãi riêng cho đối tác – Hàng chính hãng 100% – Hỗ trợ giao tận nơi & lắp đặt chu đáo',

  // 6. Why Choose KDT
  whyBadge: 'Đồng hành cùng anh em kỹ thuật',
  whyTitle: 'Vì sao nên đặt tại Kho Điện Tử KDT-89?',
  whySubtitle: 'KDT-89 hiểu anh em thợ bận rộn trên các công trình. Mọi khâu tư vấn, đóng gói, giữ hàng và lắp đặt đều được tối ưu tiện lợi nhất.',

  // 7. Order Steps
  orderStepsBadge: 'Quy trình 4 bước nhanh gọn',
  orderStepsTitle: 'Hướng dẫn đặt hàng cho đối tác',
  orderStepsSubtitle: 'Chỉ mất 1 phút để giữ hàng món quà ưng ý nhất tại kho KDT-89',

  // 8. Registration
  registerBadge: 'Đăng ký giữ hàng & nhận báo giá thợ',
  registerTitle: 'Điền thông tin – Sale KDT-89 hỗ trợ giữ hàng ngay',
  registerSubtitle: 'Ưu đãi riêng cho đối tác · Hàng có sẵn – giao nhanh · Giá và điều kiện lắp đặt sẽ được sale báo cụ thể trước khi anh chốt đơn.',
  showGiftRecipient: 'true',
  recipientLabel: 'Anh muốn mua quà cho:',

  // 9. Footer & Contact
  footerIntro: 'Kho Điện Tử KDT-89 – Đồng hành cùng anh em thợ, kỹ thuật viên và đại lý đối tác thân thiết chuẩn bị thiết bị điện máy, điện gia dụng chính hãng, uy tín tận tâm.',
  hotline: '0397.017.013',
  address: '89-91 Đường số 1, P. Tân Tạo A, Q. Bình Tân, TP.HCM',
  workingHours: 'Mở cửa từ 8:00 - 20:00 (Cả Thứ 7 & Chủ Nhật)',
};

export const DEFAULT_SITE_SEO = {
  title: 'Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng Chính Hãng',
  description: 'Chương trình ưu đãi thiết bị điện máy, điện gia dụng chính hãng giá tốt tại CÔNG TY TNHH KDT-89. Hàng sẵn kho – giao nhanh – kiểm tra mới thanh toán.',
};

export interface HolidayPreset {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  colorClass: string;
  texts: Partial<typeof DEFAULT_SITE_TEXTS>;
  seo: { title: string; description: string };
}

export const createDoubleDayTexts = (day: string = '11.11'): Record<string, string> => ({
  headerAnnouncement: `⚡ SIÊU SALE NGÀY ĐÔI ${day} | Bão Giảm Giá Giờ Vàng – Điện Máy & Gia Dụng Giá Sỉ Tận Kho`,
  navProducts: `Deal ${day}`,
  headerConsultationBtn: `Săn deal ${day}`,
  partnerBadge: `Đại hội Siêu Sale Ngày Đôi ${day} KDT-89`,
  heroTitle: `Siêu Sale Ngày Đôi ${day} | Săn Deal Điện Máy & Gia Dụng Chạm Đáy Kho`,
  heroSubtitle: `Giá rẻ nhất năm – Ưu đãi độc quyền cho anh em thợ & đối tác thân thiết KDT-89.`,
  heroContext: `Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh hỏa tốc, giữ suất ưu đãi trong 24h, kiểm tra hàng ưng ý mới thanh toán.`,
  heroHighlights: `Flash Sale Nồi cơm Cuckoo · Bếp từ đôi giá kho · Smart Tivi 32-55" trợ giá sốc · Máy lạnh · Máy tắm nước nóng`,
  comboBadge: `Combo Siêu Hời Ngày Đôi`,
  comboTitle: `Các combo ngày đôi ${day} – Mua trọn bộ tiết kiệm nhất`,
  comboSubtitle: `Gói Căn bếp hiện đại, Tiện nghi phòng khách – Giảm thêm 10-20% khi chốt combo trong đợt sale ngày đôi.`,
  giftCardBadge: `Voucher & Quà tặng`,
  giftCardTitle: `Tặng kèm voucher & quà tri ân ngày đôi`,
  giftCardSubtitle: `KDT-89 gửi kèm thiệp cảm ơn đối tác và quà tặng tri ân cho tất cả đơn hàng đặt trong dịp sale ${day}.`,
  giftCardTagVo: `Quà Cho Vợ`,
  giftCardTagMe: `Quà Cho Mẹ`,
  giftCardTagNguoiThan: `Gia đình & Bản thân`,
  catalogBadge: `Bảng giá Flash Sale ${day}`,
  catalogTitle: `Toàn bộ sản phẩm tham gia Đại Tiệc Siêu Sale ${day}`,
  catalogSubtitle: `Hàng mới chính hãng 100% nguyên seal – Trợ giá trực tiếp từ kho phân phối – Số lượng giới hạn theo khung giờ`,
  whyBadge: `Đặc quyền săn sale tại kho`,
  whyTitle: `Vì sao nên chốt đơn Siêu Sale Ngày Đôi tại KDT-89?`,
  whySubtitle: `KDT-89 giữ đúng giá sỉ niêm yết, không nâng giá ảo rồi giảm, cam kết hàng mới 100% nguyên thùng sẵn sàng giao ngay.`,
  orderStepsBadge: `Săn deal 4 bước siêu tốc`,
  orderStepsTitle: `Cách săn deal ngày đôi ${day} nhanh nhất`,
  orderStepsSubtitle: `Chỉ 30 giây gửi thông tin giữ suất giá sale ngày đôi trước khi hết số lượng`,
  registerBadge: `Đăng ký săn sale giờ vàng`,
  registerTitle: `Điền thông tin – Sale KDT-89 giữ giá siêu sale ${day} ngay`,
  registerSubtitle: `Áp dụng duy nhất trong đợt Sale Ngày Đôi ${day} · Sale gọi lại trong 5 phút chốt lịch giao lắp chu đáo.`,
  showGiftRecipient: 'false',
  recipientLabel: 'Nhu cầu mua hàng cho:',
  footerIntro: `Kho Điện Tử KDT-89 – Điểm hẹn săn sale thiết bị điện máy, điện tử, gia dụng chính hãng giá gốc mùa lễ hội ngày đôi.`,
});

export const createDoubleDaySeo = (day: string = '11.11') => ({
  title: `Siêu Sale Ngày Đôi ${day} | Săn Deal Điện Máy & Gia Dụng KDT-89 Giá Kho`,
  description: `Lễ hội siêu sale ngày đôi ${day} bùng nổ: Smart Tivi, Nồi cơm Cuckoo, Bếp từ, Máy nước nóng giảm giá cực sốc tại Kho KDT-89. Giao hỏa tốc, kiểm tra ưng ý mới trả tiền.`,
});

export const HOLIDAY_PRESETS: HolidayPreset[] = [
  {
    id: 'double_day',
    name: 'Siêu Sale Ngày Đôi (9.9 · 10.10 · 11.11 · 12.12)',
    badge: '⚡ BÃO GIẢM GIÁ GIỜ VÀNG',
    icon: '⚡',
    colorClass: 'border-red-400 bg-gradient-to-br from-red-50 to-orange-50/70 hover:from-red-100/90 hover:to-orange-100/90 text-red-950',
    description: 'Đại tiệc săn sale ngày đôi (9.9, 10.10, 11.11, 12.12): Flash sale chớp nhoáng, giá sỉ tại kho, voucher và quà tặng tri ân.',
    texts: createDoubleDayTexts('11.11'),
    seo: createDoubleDaySeo('11.11'),
  },
  {
    id: 'black_friday',
    name: 'Black Friday - Thứ Sáu Đen (Bão Sale Lớn Nhất Năm)',
    badge: '🖤 GIẢM ĐẾN 50%',
    icon: '🏷️',
    colorClass: 'border-neutral-900 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white hover:border-amber-400',
    description: 'Bão sale Black Friday lớn nhất năm: Giảm sốc kịch sàn toàn bộ Tivi, Máy lạnh, Nồi cơm, Bếp từ. Khóa giá giữ suất 24h tại kho.',
    texts: {
      headerAnnouncement: '🖤 BLACK FRIDAY - THỨ SÁU ĐEN BÙNG NỔ GIẢM GIÁ ĐẾN 50% | Đại Tiệc Bão Sale Lớn Nhất Năm Tại KDT-89',
      navProducts: 'Deal Black Friday',
      headerConsultationBtn: 'Báo giá Black Friday',
      partnerBadge: 'Tuần lễ Black Friday độc quyền cho đối tác & khách hàng',
      heroTitle: 'BLACK FRIDAY 2026 | Bão Giảm Giá Điện Máy & Gia Dụng Lớn Nhất Năm',
      heroSubtitle: 'Cơ hội duy nhất trong năm – Toàn bộ Tivi, Nồi cơm, Bếp từ, Máy lạnh chạm đáy giá gốc tận kho.',
      heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, áp dụng duy nhất tuần lễ Black Friday, số lượng có hạn, kiểm tra máy thoải mái mới thanh toán.',
      heroHighlights: 'Smart Tivi giảm sốc kịch sàn · Nồi cơm Cuckoo bão giá Black Friday · Bếp từ đôi nhập khẩu hạ giá sâu · Máy tắm nước nóng',
      comboBadge: 'Combo Black Friday Cực Khủng',
      comboTitle: 'Các combo Black Friday càn quét giá gốc – Giảm sâu chưa từng có',
      comboSubtitle: 'Gói thiết bị gia đình & công trình ưu đãi kép: Vừa giảm giá sốc, vừa tặng thêm quà tặng giá trị cao.',
      giftCardBadge: 'Đặc quyền Black Friday',
      giftCardTitle: 'Quà tặng & Voucher tri ân Black Friday',
      giftCardSubtitle: 'Tặng kèm phiếu bảo hành chính hãng, gói phụ kiện và thiệp tri ân đối tác KDT-89 chu đáo.',
      giftCardTagVo: 'Săn Sale Cho Vợ',
      giftCardTagMe: 'Săn Sale Cho Mẹ',
      giftCardTagNguoiThan: 'Gia đình & Đối tác',
      catalogBadge: 'Bảng giá Black Friday sẵn kho',
      catalogTitle: 'Toàn bộ kho hàng bão giá Black Friday giảm đến 50%',
      catalogSubtitle: 'Hàng mới 100% nguyên đai nguyên kiện – Đầy đủ VAT & Bảo hành chính hãng toàn quốc – Rẻ hơn mọi siêu thị điện máy',
      whyBadge: 'Cam kết Black Friday Thật',
      whyTitle: 'Black Friday tại KDT-89: Giá Thật – Giảm Thật – Hàng Chuẩn Hãng',
      whySubtitle: 'Nói không với nâng giá ảo rồi giảm sốc. KDT-89 niêm yết giá kho minh bạch, kiểm tra ưng ý mới thanh toán.',
      orderStepsBadge: 'Khóa giá 4 bước nhanh gọn',
      orderStepsTitle: 'Cách khóa deal Black Friday trước khi hết suất',
      orderStepsSubtitle: 'Chỉ mất 30 giây để khóa giá ưu đãi Black Friday trước khi kho đóng cổng khuyến mãi',
      registerBadge: 'Đăng ký khóa giá Black Friday',
      registerTitle: 'Điền thông tin – Sale KDT-89 khóa ngay giá Black Friday cho anh',
      registerSubtitle: 'Số lượng máy trợ giá Black Friday có hạn · Cam kết giữ hàng trong 24h để anh bố trí lịch nhận.',
      showGiftRecipient: 'false',
      recipientLabel: 'Nhu cầu mua hàng cho:',
      footerIntro: 'Kho Điện Tử KDT-89 – Sự kiện Black Friday thường niên dành cho đại lý, thợ kỹ thuật và khách hàng thân thiết.',
    },
    seo: {
      title: 'Black Friday 2026 | Bão Giảm Giá Điện Máy & Gia Dụng Giá Sốc KDT-89',
      description: 'Tuần lễ Black Friday siêu bão giảm giá tại Kho Điện Tử KDT-89: Smart Tivi, Máy lạnh, Nồi cơm Cuckoo, Bếp từ giảm đến 50%. Hàng sẵn kho giao nhanh.',
    },
  },
  {
    id: 'women_day',
    name: 'Dịp 20/10 & 8/3 (Ngày Phụ Nữ)',
    badge: 'Quà Tặng Mẹ & Vợ',
    icon: '🌸',
    colorClass: 'border-pink-300 bg-pink-50/70 hover:bg-pink-100/80 text-pink-900',
    description: 'Chuyên đề quà tặng thiết thực cho mẹ và vợ: Nồi cơm Cuckoo, máy tắm nóng, bếp từ, Smart Tivi kèm thiệp viết tay chu đáo.',
    texts: {
      headerAnnouncement: '💐 ĐẠI TIỆC 20/10 - TRI ÂN PHỤ NỮ VIỆT NAM | Tặng thiệp viết tay & Gói quà chu đáo miễn phí',
      navProducts: 'Quà 20/10',
      headerConsultationBtn: 'Nhờ tư vấn chọn quà',
      partnerBadge: 'Chương trình quà tặng 20/10 thiết thực',
      heroTitle: 'Quà Tặng 20/10 Thiết Thực | Điện Máy & Gia Dụng Cho Mẹ & Vợ',
      heroSubtitle: 'Chọn món quà thiết thực – dùng được mỗi ngày – mẹ và vợ đều ưng ý, giá tận kho KDT-89.',
      heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo, kiểm tra hàng ưng ý mới thanh toán.',
      heroHighlights: 'Nồi cơm Cuckoo giá kho · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy tắm nóng · Máy lạnh',
      comboBadge: 'Gói quà 20/10 phối sẵn',
      comboTitle: 'Các combo quà tặng 20/10 thiết thực được chọn nhiều nhất',
      comboSubtitle: 'Đã phối sẵn tinh tế: Nồi cơm, Bếp từ, Tivi – Anh chỉ việc chọn, KDT-89 lo đóng gói và giao tận nơi.',
      giftCardBadge: 'Tặng kèm miễn phí',
      giftCardTitle: 'Tặng kèm thiệp viết tay 20/10 chu đáo',
      giftCardSubtitle: 'Anh em không khéo ăn nói? KDT-89 gợi ý sẵn lời chúc ý nghĩa, in thiệp nắn nót bỏ kèm thùng quà hoàn toàn miễn phí.',
      giftCardTagVo: 'Tặng Vợ',
      giftCardTagMe: 'Tặng Mẹ',
      giftCardTagNguoiThan: 'Người thân',
      catalogBadge: 'Danh mục quà tặng có sẵn tại kho',
      catalogTitle: 'Gợi ý quà tặng 20/10 thiết thực cho mẹ và vợ',
      catalogSubtitle: 'Ưu đãi riêng cho đối tác – Hàng mới chính hãng 100% – Hỗ trợ giao tận nơi & lắp đặt',
      orderStepsSubtitle: 'Chỉ mất 1 phút để giữ hàng món quà ưng ý nhất dịp 20/10',
      registerTitle: 'Điền thông tin – Sale KDT-89 hỗ trợ giữ quà ngay',
      registerSubtitle: 'Ưu đãi riêng dịp 20/10 · Hàng có sẵn – giao nhanh · Báo giá và điều kiện lắp đặt trước khi chốt đơn.',
      footerIntro: 'Kho Điện Tử KDT-89 – Đồng hành cùng anh em thợ, kỹ thuật viên và đại lý đối tác thân thiết chuẩn bị món quà thiết thực, trọn vẹn yêu thương ngày 20/10.',
    },
    seo: {
      title: 'Quà Tặng 20/10 Cho Mẹ & Vợ | Kho Điện Máy KDT-89 Giá Tốt',
      description: 'Chương trình ưu đãi quà tặng 20/10 thiết thực: Nồi cơm Cuckoo, bếp từ, Smart Tivi, máy tắm nóng chính hãng. Tặng kèm thiệp viết tay, giao nhanh tận nơi.',
    },
  },
  {
    id: 'tet_holiday',
    name: 'Tết Nguyên Đán (Xuân Sum Vầy & Đón Lộc)',
    badge: 'Khai Xuân Đón Lộc',
    icon: '🧧',
    colorClass: 'border-red-300 bg-red-50/70 hover:bg-red-100/80 text-red-950',
    description: 'Sắm sửa tivi xem Táo Quân, nồi cơm nấu mâm cỗ Tết, máy nước nóng mùa lạnh, bếp từ nấu lẩu ngày Tết sum vầy.',
    texts: {
      headerAnnouncement: '🧧 KHAI XUÂN ĐÓN LỘC - Điện Máy Giá Kho Sắm Tết Sum Vầy | Hàng sẵn kho giao hỏa tốc 24h',
      navProducts: 'Điện máy Tết',
      headerConsultationBtn: 'Tư vấn sắm Tết',
      partnerBadge: 'Chương trình sắm điện máy đón Tết sum vầy',
      heroTitle: 'Sắm Điện Máy Đón Tết Sum Vầy | Hàng Sẵn Kho KDT-89 Giá Gốc',
      heroSubtitle: 'Tân trang căn bếp, nâng cấp phòng khách – đón Tết đủ đầy cùng gia đình với giá thợ tận gốc.',
      heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh hỏa tốc, hỗ trợ lắp đặt trước Tết, kiểm tra máy ưng ý mới thanh toán.',
      heroHighlights: 'Smart Tivi xem Táo Quân · Nồi cơm nấu mâm cỗ Tết · Bếp từ lẩu Tết · Máy tắm nước nóng mùa lạnh',
      comboBadge: 'Combo sắm Tết trọn gói',
      comboTitle: 'Các gói combo sắm Tết đủ đầy – Tiết kiệm tối đa',
      comboSubtitle: 'Gói Căn bếp ấm ngày Tết, Phòng khách sum vầy – Phối sẵn trọn gói giá gốc cho gia đình.',
      giftCardBadge: 'Thiệp chúc Tết',
      giftCardTitle: 'Tặng kèm thiệp chúc Tết An Khang Thịnh Vượng',
      giftCardSubtitle: 'KDT-89 in thiệp mừng năm mới trang trọng, gửi lời chúc lộc tài đến gia đình và người thân.',
      giftCardTagVo: 'Biếu Vợ',
      giftCardTagMe: 'Biếu Bố Mẹ',
      giftCardTagNguoiThan: 'Biếu Họ Hàng',
      catalogBadge: 'Kho hàng Tết sẵn sàng phục vụ',
      catalogTitle: 'Thiết bị điện máy & gia dụng sắm Tết sum vầy',
      catalogSubtitle: 'Cam kết 100% hàng mới chính hãng nguyên thùng, bảo hành chính hãng toàn quốc – Giao nhanh kịp đón Tết',
      orderStepsSubtitle: 'Chỉ mất 1 phút để giữ suất hàng Tết giá tốt trước khi cháy kho',
      registerTitle: 'Điền thông tin – Sale KDT-89 hỗ trợ giữ hàng Tết ngay',
      registerSubtitle: 'Giữ máy và lịch giao lắp sớm trước Tết nguyên đán · Không lo tăng giá mùa cao điểm.',
      footerIntro: 'Kho Điện Tử KDT-89 – Kính chúc quý khách hàng, anh em thợ và đối tác năm mới An Khang Thịnh Vượng, Vạn Sự Như Ý!',
    },
    seo: {
      title: 'Sắm Điện Máy Đón Tết Sum Vầy | Kho KDT-89 Giá Gốc Sẵn Kho',
      description: 'Ưu đãi điện máy đón Tết: Smart Tivi xem Táo Quân, nồi cơm Cuckoo, bếp từ lẩu Tết, máy tắm nóng. Hàng sẵn kho giao hỏa tốc tận nhà.',
    },
  },
  {
    id: 'year_end_clearance',
    name: 'Đại Tiệc Xả Kho Cuối Năm (Thanh Lý Giá Gốc)',
    badge: '🔥 XẢ KHO ĐÓN LÔ MỚI',
    icon: '🔥',
    colorClass: 'border-orange-300 bg-orange-50/70 hover:bg-orange-100/80 text-orange-950',
    description: 'Chương trình xả kho đón lô mới: Thanh lý giá gốc toàn bộ tivi, máy lạnh, nồi cơm, bếp từ cho thợ và đối tác.',
    texts: {
      headerAnnouncement: '🔥 ĐẠI TIỆC XẢ KHO CUỐI NĂM - Giá Gốc Tận Kho Cho Đối Tác & Thợ | Số lượng có hạn',
      navProducts: 'Hàng xả kho',
      headerConsultationBtn: 'Nhận bảng giá xả kho',
      partnerBadge: 'Đại tiệc xả kho giá gốc KDT-89',
      heroTitle: 'Đại Tiệc Xả Kho Cuối Năm | Điện Máy & Gia Dụng Giảm Giá Cực Sốc',
      heroSubtitle: 'Xả sạch kho đón lô hàng mới – Cam kết giá rẻ nhất cho anh em thợ, kiểm tra ưng ý mới trả tiền.',
      heroContext: 'Hàng chính hãng sẵn tại kho 89-91 Đường số 1, áp dụng cho anh em đối tác và khách hàng nhanh tay nhất.',
      heroHighlights: 'Smart Tivi xả kho · Nồi cơm Cuckoo thanh lý kho · Máy lạnh giá thợ · Máy tắm nước nóng',
      comboBadge: 'Combo Xả Kho Giá Sốc',
      comboTitle: 'Các combo xả kho trọn gói siêu tiết kiệm',
      comboSubtitle: 'Mua trọn bộ giảm thêm trên giá sỉ – Cơ hội nhập hàng và sắm sửa gia đình hời nhất năm.',
      giftCardBadge: 'Tặng kèm',
      giftCardTitle: 'Tặng kèm thiệp tri ân đối tác & khách hàng',
      giftCardSubtitle: 'KDT-89 in thiệp cảm ơn đối tác đã đồng hành suốt năm qua cùng công ty.',
      giftCardTagVo: 'Tặng Vợ',
      giftCardTagMe: 'Tặng Mẹ',
      giftCardTagNguoiThan: 'Đối tác & Bạn bè',
      catalogBadge: 'Danh mục xả kho giá gốc',
      catalogTitle: 'Toàn bộ sản phẩm xả kho giảm sốc cuối năm',
      catalogSubtitle: 'Hàng mới 100% nguyên kiện, đầy đủ phiếu bảo hành hãng – Giá xả kho không đâu rẻ hơn',
      orderStepsSubtitle: 'Giữ suất giá xả kho ngay trước khi hết hàng tồn kho',
      registerTitle: 'Đăng ký giữ hàng xả kho giá gốc ngay',
      registerSubtitle: 'Số lượng tồn kho có hạn · Nhận cuộc gọi xác nhận giữ máy trong 5 phút từ sale KDT-89.',
      footerIntro: 'Kho Điện Tử KDT-89 – Xả kho thanh lý cuối năm thiết bị điện máy, điện tử, gia dụng chính hãng uy tín.',
    },
    seo: {
      title: 'Đại Tiệc Xả Kho Điện Máy Cuối Năm | KDT-89 Giá Gốc',
      description: 'Xả kho điện tử KDT-89 cuối năm: Tivi, máy lạnh, nồi cơm, máy tắm nóng giảm sốc. Hàng chính hãng 100%, bảo hành chuẩn hãng.',
    },
  },
  {
    id: 'summer_fest',
    name: 'Mùa Hè & Đại Lễ 30/4 - 1/5 (Giải Nhiệt)',
    badge: 'Giải Nhiệt Mùa Hè',
    icon: '☀️',
    colorClass: 'border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950',
    description: 'Cao điểm giải nhiệt: Máy lạnh Inverter tiết kiệm điện, Smart Tivi giải trí, máy tắm nước nóng thư giãn, gia dụng mát lành.',
    texts: {
      headerAnnouncement: '☀️ ĐẠI TIỆC GIẢI NHIỆT MÙA HÈ - Ưu Đãi Đại Lễ 30/4 & 1/5 | Máy Lạnh & Điện Máy Giá Thợ',
      navProducts: 'Hàng giải nhiệt',
      headerConsultationBtn: 'Báo giá máy lạnh',
      partnerBadge: 'Lễ hội giải nhiệt mùa hè KDT-89',
      heroTitle: 'Lễ Hội Giải Nhiệt Mùa Hè | Máy Lạnh & Gia Dụng Giá Thợ Tận Kho',
      heroSubtitle: 'Nhà mát mẻ, tiết kiệm điện năng – Giá ưu đãi riêng cho anh em thợ và đối tác KDT-89.',
      heroContext: 'Kho sẵn đủ dòng máy lạnh Inverter Casper, Daikin, Panasonic, quạt mát, máy tắm nóng – Hỗ trợ giao tận nơi và kỹ thuật lắp đặt.',
      heroHighlights: 'Máy lạnh Inverter siêu êm · Tivi giải trí cả nhà · Máy tắm nóng thư giãn · Nồi cơm gia đình',
      comboBadge: 'Combo Nhà Mát Mùa Hè',
      comboTitle: 'Các combo giải nhiệt mùa hè được lựa chọn nhiều nhất',
      comboSubtitle: 'Gói Nhà mát sảng khoái, Tiện nghi phòng khách – Tận hưởng mùa hè sảng khoái không lo tiền điện.',
      giftCardBadge: 'Tặng kèm',
      giftCardTitle: 'Gửi tặng món quà mát lành mùa đại lễ',
      giftCardSubtitle: 'KDT-89 hỗ trợ in thiệp chúc mừng, bọc hàng cẩn thận giao đến tận tay người nhận.',
      giftCardTagVo: 'Tặng Vợ',
      giftCardTagMe: 'Tặng Bố Mẹ',
      giftCardTagNguoiThan: 'Người thân',
      catalogBadge: 'Kho hàng giải nhiệt sẵn có',
      catalogTitle: 'Toàn bộ thiết bị giải nhiệt mùa hè & gia dụng tại kho',
      catalogSubtitle: 'Hàng mới chính hãng 100% nguyên đai nguyên kiện – Tiết kiệm điện năng vượt trội',
      orderStepsSubtitle: 'Giữ suất khuyến mãi và lịch lắp đặt ưu tiên mùa cao điểm nắng nóng',
      registerTitle: 'Đăng ký giữ máy lạnh & thiết bị mùa hè ngay',
      registerSubtitle: 'Ưu đãi đại lễ 30/4 - 1/5 · Giữ giá thợ tốt nhất · Hỗ trợ vật tư và giao lắp tận chân công trình.',
      footerIntro: 'Kho Điện Tử KDT-89 – Trung tâm phân phối máy lạnh, điện máy và gia dụng chính hãng mùa hè giá tốt nhất.',
    },
    seo: {
      title: 'Giải Nhiệt Mùa Hè & Đại Lễ 30/4 | Máy Lạnh & Điện Máy KDT-89',
      description: 'Đại tiệc giải nhiệt: Máy lạnh Inverter tiết kiệm điện, Smart Tivi, máy nước nóng chính hãng. Giá tận gốc cho thợ và đối tác.',
    },
  },
  {
    id: 'vu_lan',
    name: 'Mùa Vu Lan Báo Hiếu (Tri Ân Cha Mẹ)',
    badge: 'Vu Lan Báo Hiếu',
    icon: '🪷',
    colorClass: 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-950',
    description: 'Món quà hiếu kính dâng cha mẹ: Nồi cơm dẻo ngon dễ nấu, máy nước nóng an toàn cho người lớn tuổi, tivi chữ to dễ xem.',
    texts: {
      headerAnnouncement: '🪷 MÙA VU LAN BÁO HIẾU - Trao Gửi Món Quà Sức Khỏe & Bình An Dâng Cha Mẹ',
      navProducts: 'Quà Vu Lan',
      headerConsultationBtn: 'Tư vấn quà Vu Lan',
      partnerBadge: 'Mùa Vu Lan báo hiếu công ơn sinh thành',
      heroTitle: 'Vu Lan Báo Hiếu | Món Quà Thiết Thực Chăm Sóc Sức Khỏe Cha Mẹ',
      heroSubtitle: 'Bữa cơm dẻo canh ngọt mỗi ngày, dòng nước ấm thư giãn – Thay lời tri ân gửi đến đấng sinh thành.',
      heroContext: 'Hàng sẵn tại kho 89-91 Đường số 1, giao tận tay bố mẹ ở quê hay phố, hướng dẫn tận tình, kiểm tra ưng ý mới thanh toán.',
      heroHighlights: 'Nồi cơm Cuckoo nấu mềm cơm · Máy tắm nóng an toàn · Smart Tivi chữ to dễ xem · Bếp điện sạch sẽ',
      comboBadge: 'Gói Quà Cho Cha Mẹ',
      comboTitle: 'Các combo quà tặng Vu Lan hiếu kính cha mẹ',
      comboSubtitle: 'Combo Cơm dẻo canh ngọt, Tắm nước ấm an toàn – Món quà sức khỏe bền bỉ cho đấng sinh thành.',
      giftCardBadge: 'Thiệp Vu Lan Báo Hiếu',
      giftCardTitle: 'Tặng kèm thiệp viết lời chúc Vu Lan kính dâng cha mẹ',
      giftCardSubtitle: 'KDT-89 nắn nót in lời chúc hiếu kính gửi kèm gói quà dâng lên Cha Mẹ trọn vẹn yêu thương.',
      giftCardTagVo: 'Gửi Vợ Cùng Biếu',
      giftCardTagMe: 'Kính Dâng Mẹ',
      giftCardTagNguoiThan: 'Kính Dâng Cha',
      catalogBadge: 'Danh mục quà tặng Vu Lan',
      catalogTitle: 'Thiết bị điện máy chăm sóc sức khỏe cha mẹ',
      catalogSubtitle: 'Ưu tiên dòng sản phẩm an toàn cao, dễ sử dụng cho người lớn tuổi – Hàng chính hãng bền bỉ',
      orderStepsSubtitle: 'Chỉ 1 phút đặt quà trao trọn lòng hiếu kính dâng cha mẹ',
      registerTitle: 'Đăng ký gửi quà Vu Lan về tận tay cha mẹ',
      registerSubtitle: 'KDT-89 hỗ trợ giao tận nơi chu đáo, hướng dẫn người lớn tuổi sử dụng an tâm tuyệt đối.',
      footerIntro: 'Kho Điện Tử KDT-89 – Kính chúc các bậc cha mẹ luôn dồi dào sức khỏe, an lạc và bình an bên con cháu.',
    },
    seo: {
      title: 'Quà Tặng Vu Lan Báo Hiếu Cha Mẹ | Kho Điện Máy KDT-89',
      description: 'Món quà Vu Lan thiết thực dâng cha mẹ: Nồi cơm cao cấp, máy tắm nước nóng an toàn, tivi dễ dùng. Miễn phí in thiệp tri ân, giao tận nơi.',
    },
  },
  {
    id: 'default_year_round',
    name: 'Mặc Định Quanh Năm (Chuẩn KDT-89)',
    badge: 'Chính Hãng & Giá Tốt',
    icon: '🏢',
    colorClass: 'border-neutral-300 bg-neutral-50/70 hover:bg-neutral-100/80 text-neutral-900',
    description: 'Phiên bản tiêu chuẩn hoạt động quanh năm phục vụ anh em thợ và khách hàng mọi lúc.',
    texts: {
      ...DEFAULT_SITE_TEXTS,
    },
    seo: {
      ...DEFAULT_SITE_SEO,
    },
  },
];

export const SiteTextEditorModal: React.FC<SiteTextEditorModalProps> = ({
  isOpen,
  onClose,
  customTexts,
  customSeo,
  onSaveTexts,
  onResetTexts,
}) => {
  const [activeTab, setActiveTab] = useState<
    'presets' | 'header_hero' | 'combos_gift' | 'catalog_why' | 'steps_register' | 'footer_contact' | 'seo'
  >('presets');

  const [texts, setTexts] = useState<Record<string, string>>({});
  const [seo, setSeo] = useState<{ title: string; description: string }>({
    title: '',
    description: '',
  });

  const [isCopied, setIsCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedPresetMsg, setAppliedPresetMsg] = useState<string | null>(null);
  const [doubleDayDate, setDoubleDayDate] = useState<string>('11.11');

  useEffect(() => {
    if (isOpen) {
      setTexts({
        ...DEFAULT_SITE_TEXTS,
        ...customTexts,
      });
      setSeo({
        title: customSeo?.title || DEFAULT_SITE_SEO.title,
        description: customSeo?.description || DEFAULT_SITE_SEO.description,
      });
      setSavedSuccess(false);
      setAppliedPresetMsg(null);
    }
  }, [isOpen, customTexts, customSeo]);

  if (!isOpen) return null;

  const handleTextChange = (key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (preset: HolidayPreset, customDay?: string) => {
    let presetTexts = preset.texts;
    let presetSeo = preset.seo;

    if (preset.id === 'double_day') {
      const day = (customDay || doubleDayDate || '11.11').trim();
      presetTexts = createDoubleDayTexts(day);
      presetSeo = createDoubleDaySeo(day);
    }

    setTexts((prev) => {
      const updated: Record<string, string> = { ...prev };
      Object.entries(presetTexts).forEach(([k, v]) => {
        if (v !== undefined) {
          updated[k] = v;
        }
      });
      return updated;
    });
    setSeo({
      title: presetSeo.title,
      description: presetSeo.description,
    });
    const dayNotice = preset.id === 'double_day' ? ` (${customDay || doubleDayDate})` : '';
    setAppliedPresetMsg(`Đã áp dụng mẫu: "${preset.name}${dayNotice}". Anh có thể bấm "Lưu tất cả thay đổi" để cập nhật ngay!`);
    setTimeout(() => setAppliedPresetMsg(null), 5000);
  };

  const handleSave = () => {
    onSaveTexts(texts, seo);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleCopyZaloBustLink = () => {
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('v', Date.now().toString().slice(-4));
      navigator.clipboard.writeText(url.toString());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-neutral-950/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-rose-950 px-5 sm:px-6 py-4 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>Tùy Chỉnh Chữ & Tiêu Đề Theo Các Dịp Lễ / Sale Quanh Năm</span>
              </h3>
              <p className="text-xs text-neutral-300">
                Đổi toàn bộ câu chữ trên website (20/10, Tết, Mùa Hè, Vu Lan, Xả kho) & Tiêu đề share Zalo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Notification Banner if applied */}
        {appliedPresetMsg && (
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{appliedPresetMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 bg-neutral-50 border-b border-neutral-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'presets'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Chọn mẫu Dịp Lễ (1-Click)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('header_hero')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'header_hero'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>2. Đầu trang & Hero</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combos_gift')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'combos_gift'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>3. Combo & Thiệp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog_why')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'catalog_why'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>4. Sản phẩm & Cam kết</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('steps_register')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'steps_register'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>5. Quy trình & Đăng ký</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('footer_contact')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'footer_contact'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>6. Chân trang & Hotline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'seo'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-sky-500" />
            <span>7. Share Zalo / Facebook</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold text-amber-950 mb-0.5">
                    Mẹo chọn mẫu nhanh theo từng mùa lễ hội trong năm:
                  </strong>
                  Bấm <strong>&quot;Áp dụng mẫu này&quot;</strong>, toàn bộ tiêu đề trang chủ, dòng thông báo, danh mục sản phẩm, thiệp chúc mừng và link chia sẻ Zalo sẽ tự động được thay đổi đồng bộ theo dịp lễ tương ứng. Sau đó anh có thể chỉnh sửa chi tiết ở các tab bên cạnh nếu muốn!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {HOLIDAY_PRESETS.map((preset) => {
                  const isDoubleDay = preset.id === 'double_day';
                  const isBlackFriday = preset.id === 'black_friday';

                  return (
                    <div
                      key={preset.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${preset.colorClass} shadow-2xs hover:shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-2xl">{preset.icon}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isBlackFriday
                              ? 'bg-amber-400 text-neutral-950 font-black'
                              : 'bg-white/80 border border-black/10'
                          }`}>
                            {preset.badge}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base mb-1">{preset.name}</h4>
                        <p className="text-xs opacity-90 leading-relaxed mb-3">
                          {preset.description}
                        </p>

                        {/* Interactive Quick Date Picker for Double Day */}
                        {isDoubleDay && (
                          <div className="mb-3 p-2.5 rounded-xl bg-white/90 border border-red-200 text-neutral-900 shadow-2xs">
                            <div className="text-[11px] font-bold text-red-900 mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-red-600" />
                                <span>Chọn ngày đôi cần sale:</span>
                              </span>
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-black">
                                Đang chọn: {doubleDayDate}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              {['11.11', '12.12', '10.10', '9.9', '8.8'].map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    setDoubleDayDate(day);
                                    handleApplyPreset(preset, day);
                                  }}
                                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                    doubleDayDate === day
                                      ? 'bg-red-600 text-white shadow-xs scale-105'
                                      : 'bg-neutral-100 hover:bg-red-100 text-neutral-800 border border-neutral-200'
                                  }`}
                                  title={`Bấm để áp dụng ngay ngày đôi ${day}`}
                                >
                                  ⚡ {day}
                                </button>
                              ))}
                              <div className="flex items-center gap-1 ml-auto">
                                <span className="text-[10px] text-neutral-500">Khác:</span>
                                <input
                                  type="text"
                                  value={doubleDayDate}
                                  onChange={(e) => setDoubleDayDate(e.target.value)}
                                  placeholder="7.7"
                                  className="w-12 px-1 py-0.5 text-[11px] bg-white border border-red-300 rounded text-center font-bold text-red-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                                  title="Gõ ngày đôi tùy chỉnh (ví dụ 6.6, 7.7, 5.5...)"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                          isBlackFriday
                            ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black shadow-md'
                            : isDoubleDay
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-white/95 hover:bg-white text-neutral-900 border border-neutral-300'
                        }`}
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isBlackFriday ? 'text-neutral-950' : isDoubleDay ? 'text-amber-300' : 'text-amber-600'}`} />
                        <span>
                          {isDoubleDay
                            ? `Áp dụng mẫu Sale Ngày Đôi (${doubleDayDate})`
                            : isBlackFriday
                            ? 'Áp dụng mẫu Black Friday'
                            : 'Áp dụng mẫu này'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: HEADER & HERO */}
          {activeTab === 'header_hero' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Dòng chạy thông báo trên cùng website (Announcement Bar):
                </label>
                <input
                  type="text"
                  value={texts.headerAnnouncement || ''}
                  onChange={(e) => handleTextChange('headerAnnouncement', e.target.value)}
                  placeholder="Vd: 🎉 ĐẠI TIỆC KHUYẾN MÃI - Giảm giá trực tiếp cho anh em thợ & đối tác | Giao hỏa tốc"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Xuất hiện nổi bật trên cùng đầu trang web. Để trống nếu muốn ẩn thanh thông báo này.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Nhãn menu Sản phẩm (Header Nav):
                  </label>
                  <input
                    type="text"
                    value={texts.navProducts || ''}
                    onChange={(e) => handleTextChange('navProducts', e.target.value)}
                    placeholder="Vd: Quà 20/10, Sắm Tết, Điện máy..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Chữ trên nút liên hệ góc phải Header:
                  </label>
                  <input
                    type="text"
                    value={texts.headerConsultationBtn || ''}
                    onChange={(e) => handleTextChange('headerConsultationBtn', e.target.value)}
                    placeholder="Vd: Nhờ sale tư vấn, Tư vấn chọn quà..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Huy hiệu nhỏ trên đầu Hero Banner (Partner Badge):
                  </label>
                  <input
                    type="text"
                    value={texts.partnerBadge || ''}
                    onChange={(e) => handleTextChange('partnerBadge', e.target.value)}
                    placeholder="Vd: Ưu đãi riêng cho đối tác & khách hàng KDT-89"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Tiêu đề chính lớn đầu trang (Hero Title) <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={texts.heroTitle || ''}
                    onChange={(e) => handleTextChange('heroTitle', e.target.value)}
                    placeholder="Vd: Kho Điện Tử KDT-89 | Thiết Bị Điện Máy & Gia Dụng Chính Hãng"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Phụ đề kêu gọi hành động (Hero Subtitle):
                  </label>
                  <textarea
                    rows={2}
                    value={texts.heroSubtitle || ''}
                    onChange={(e) => handleTextChange('heroSubtitle', e.target.value)}
                    placeholder="Vd: Chọn món quà thiết thực – dùng được mỗi ngày – giá tận kho KDT-89."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Lời ngỏ bối cảnh chân thành (Hero Context):
                  </label>
                  <textarea
                    rows={2}
                    value={texts.heroContext || ''}
                    onChange={(e) => handleTextChange('heroContext', e.target.value)}
                    placeholder="Vd: Hàng sẵn tại kho 89-91 Đường số 1, giao nhanh tận tay, hỗ trợ lắp đặt chu đáo..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Dòng sản phẩm nổi bật sẵn kho (Hero Highlights):
                  </label>
                  <input
                    type="text"
                    value={texts.heroHighlights || ''}
                    onChange={(e) => handleTextChange('heroHighlights', e.target.value)}
                    placeholder="Vd: Nồi cơm Cuckoo giá kho · Bếp từ đôi & đơn · Smart Tivi 32-55 inch · Máy lạnh · Máy tắm nóng"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMBOS & GIFT CARD */}
          {activeTab === 'combos_gift' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-600" />
                  <span>Khu vực Combo quà tặng thiết thực</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề phần Combo:
                  </label>
                  <input
                    type="text"
                    value={texts.comboTitle || ''}
                    onChange={(e) => handleTextChange('comboTitle', e.target.value)}
                    placeholder="Vd: Các combo quà tặng thiết thực được chọn nhiều nhất"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ phần Combo:
                  </label>
                  <textarea
                    rows={2}
                    value={texts.comboSubtitle || ''}
                    onChange={(e) => handleTextChange('comboSubtitle', e.target.value)}
                    placeholder="Vd: Đã phối sẵn tinh tế, thiết thực – anh chỉ việc chọn, KDT-89 lo đóng gói và giao tận nơi."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span>Khu vực Tự tạo thiệp viết tay & Lời chúc</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề mục Thiệp:
                  </label>
                  <input
                    type="text"
                    value={texts.giftCardTitle || ''}
                    onChange={(e) => handleTextChange('giftCardTitle', e.target.value)}
                    placeholder="Vd: Tặng kèm thiệp chúc mừng viết tay chu đáo"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ mục Thiệp:
                  </label>
                  <textarea
                    rows={2}
                    value={texts.giftCardSubtitle || ''}
                    onChange={(e) => handleTextChange('giftCardSubtitle', e.target.value)}
                    placeholder="Vd: KDT-89 in thiệp trang trọng, gói quà chu đáo gửi kèm đơn hàng hoàn toàn miễn phí."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nút chọn 1:
                    </label>
                    <input
                      type="text"
                      value={texts.giftCardTagVo || ''}
                      onChange={(e) => handleTextChange('giftCardTagVo', e.target.value)}
                      placeholder="Tặng Vợ"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nút chọn 2:
                    </label>
                    <input
                      type="text"
                      value={texts.giftCardTagMe || ''}
                      onChange={(e) => handleTextChange('giftCardTagMe', e.target.value)}
                      placeholder="Tặng Mẹ"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">
                      Nút chọn 3:
                    </label>
                    <input
                      type="text"
                      value={texts.giftCardTagNguoiThan || ''}
                      onChange={(e) => handleTextChange('giftCardTagNguoiThan', e.target.value)}
                      placeholder="Người thân"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATALOG & WHY CHOOSE */}
          {activeTab === 'catalog_why' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>Khu vực Danh mục & Lưới toàn bộ sản phẩm</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Huy hiệu trên đầu Catalog:
                  </label>
                  <input
                    type="text"
                    value={texts.catalogBadge || ''}
                    onChange={(e) => handleTextChange('catalogBadge', e.target.value)}
                    placeholder="Vd: Danh mục sản phẩm có sẵn tại kho"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề chính mục Sản phẩm:
                  </label>
                  <input
                    type="text"
                    value={texts.catalogTitle || ''}
                    onChange={(e) => handleTextChange('catalogTitle', e.target.value)}
                    placeholder="Vd: Thiết bị điện máy & gia dụng giá tốt tại kho"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ mục Sản phẩm:
                  </label>
                  <textarea
                    rows={2}
                    value={texts.catalogSubtitle || ''}
                    onChange={(e) => handleTextChange('catalogSubtitle', e.target.value)}
                    placeholder="Vd: Ưu đãi riêng cho đối tác – Hàng chính hãng 100% – Hỗ trợ giao tận nơi & lắp đặt"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Khu vực Cam kết vàng (Vì sao chọn KDT-89)</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Huy hiệu cam kết:
                  </label>
                  <input
                    type="text"
                    value={texts.whyBadge || ''}
                    onChange={(e) => handleTextChange('whyBadge', e.target.value)}
                    placeholder="Vd: Đồng hành cùng anh em kỹ thuật"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề phần Cam kết:
                  </label>
                  <input
                    type="text"
                    value={texts.whyTitle || ''}
                    onChange={(e) => handleTextChange('whyTitle', e.target.value)}
                    placeholder="Vd: Vì sao nên đặt tại Kho Điện Tử KDT-89?"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ phần Cam kết:
                  </label>
                  <textarea
                    rows={2}
                    value={texts.whySubtitle || ''}
                    onChange={(e) => handleTextChange('whySubtitle', e.target.value)}
                    placeholder="Vd: KDT-89 hiểu anh em thợ bận rộn trên các công trình..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: STEPS & REGISTRATION */}
          {activeTab === 'steps_register' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Khu vực 4 Bước đặt hàng</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề 4 Bước đặt hàng:
                  </label>
                  <input
                    type="text"
                    value={texts.orderStepsTitle || ''}
                    onChange={(e) => handleTextChange('orderStepsTitle', e.target.value)}
                    placeholder="Vd: Hướng dẫn đặt hàng cho đối tác"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ 4 Bước:
                  </label>
                  <input
                    type="text"
                    value={texts.orderStepsSubtitle || ''}
                    onChange={(e) => handleTextChange('orderStepsSubtitle', e.target.value)}
                    placeholder="Vd: Chỉ mất 1 phút để giữ hàng món quà ưng ý nhất tại kho KDT-89"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                <h4 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-teal-600" />
                  <span>Khu vực Form nhận đăng ký tư vấn tại trang</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề Form:
                  </label>
                  <input
                    type="text"
                    value={texts.registerTitle || ''}
                    onChange={(e) => handleTextChange('registerTitle', e.target.value)}
                    placeholder="Vd: Điền thông tin – Sale KDT-89 hỗ trợ giữ hàng ngay"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Mô tả phụ Form:
                  </label>
                  <textarea
                    rows={2}
                    value={texts.registerSubtitle || ''}
                    onChange={(e) => handleTextChange('registerSubtitle', e.target.value)}
                    placeholder="Vd: Ưu đãi riêng cho đối tác · Hàng có sẵn – giao nhanh · Báo giá và điều kiện lắp đặt trước khi chốt đơn."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                {/* Toggle & customize "Anh muốn mua quà cho ai" */}
                <div className="pt-3 border-t border-teal-200/70 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white border border-teal-300/80 shadow-2xs">
                    <div>
                      <div className="font-bold text-xs text-neutral-900 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-pink-600" />
                        <span>Mục chọn người nhận quà (&quot;Anh muốn mua quà cho: Vợ / Mẹ / Người thân&quot;)</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Tắt đi khi chạy Black Friday, Sale Ngày Đôi, Xả kho... Bật lên cho các dịp lễ 20/10, 8/3, Vu Lan.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const current = texts.showGiftRecipient !== 'false';
                        handleTextChange('showGiftRecipient', current ? 'false' : 'true');
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        texts.showGiftRecipient !== 'false'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                      }`}
                    >
                      {texts.showGiftRecipient !== 'false' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang BẬT</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Đang TẮT (Ẩn mục này)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {texts.showGiftRecipient !== 'false' && (
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1">
                        Tiêu đề câu hỏi người nhận quà (khi Bật):
                      </label>
                      <input
                        type="text"
                        value={texts.recipientLabel || 'Anh muốn mua quà cho:'}
                        onChange={(e) => handleTextChange('recipientLabel', e.target.value)}
                        placeholder="Vd: Anh muốn mua quà cho:"
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FOOTER & CONTACT */}
          {activeTab === 'footer_contact' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Lời giới thiệu dưới chân trang (Footer Intro):
                </label>
                <textarea
                  rows={3}
                  value={texts.footerIntro || ''}
                  onChange={(e) => handleTextChange('footerIntro', e.target.value)}
                  placeholder="Vd: Kho Điện Tử KDT-89 – Đồng hành cùng anh em thợ, kỹ thuật viên và đại lý đối tác thân thiết chuẩn bị thiết bị điện máy chính hãng..."
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Số điện thoại Hotline / Zalo:
                  </label>
                  <input
                    type="text"
                    value={texts.hotline || ''}
                    onChange={(e) => handleTextChange('hotline', e.target.value)}
                    placeholder="Vd: 0397.017.013"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Thời gian mở cửa / Giờ phục vụ:
                  </label>
                  <input
                    type="text"
                    value={texts.workingHours || ''}
                    onChange={(e) => handleTextChange('workingHours', e.target.value)}
                    placeholder="Vd: Mở cửa từ 8:00 - 20:00 (Cả Thứ 7 & Chủ Nhật)"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Địa chỉ kho hàng KDT-89:
                </label>
                <input
                  type="text"
                  value={texts.address || ''}
                  onChange={(e) => handleTextChange('address', e.target.value)}
                  placeholder="Vd: 89-91 Đường số 1, P. Tân Tạo A, Q. Bình Tân, TP.HCM"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 7: SEO & ZALO SHARE */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              {/* Zalo Preview Card Demonstration */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-sky-900">
                  <span className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    <span>Xem trước ô hiển thị khi chia sẻ link trên Zalo / Tin nhắn:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-100 text-[10px] text-sky-700 font-mono">
                    Live Preview
                  </span>
                </div>

                {/* Simulated Zalo / Chat Preview Bubble */}
                <div className="bg-white rounded-xl p-3 border border-sky-200 shadow-sm space-y-1.5 max-w-md">
                  <div className="text-[11px] text-sky-600 truncate font-mono">
                    https://kdt89.vn/
                  </div>
                  <div className="text-sm font-bold text-neutral-900 line-clamp-2 leading-tight">
                    {seo.title || 'Tiêu đề trang web'}
                  </div>
                  <div className="text-xs text-neutral-600 line-clamp-2 leading-normal">
                    {seo.description || 'Mô tả tóm tắt nội dung khi share link...'}
                  </div>
                  <div className="text-[10px] text-neutral-400 pt-1">
                    kdt89.vn
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-neutral-600">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Mẹo: Zalo có cơ chế lưu cache. Nếu gửi link cũ mà chữ chưa đổi, hãy bấm nút:</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyZaloBustLink}
                    className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Đã copy link mới!' : 'Copy link gửi Zalo'}</span>
                  </button>
                </div>
              </div>

              {/* Form inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tiêu đề khi chia sẻ link (SEO Title) <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                    placeholder="Vd: Kho Điện Tử KDT-89 | Phân Phối Thiết Bị Điện Máy & Gia Dụng Chính Hãng"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-bold"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Độ dài khuyên dùng: 50 – 70 ký tự. Xuất hiện nổi bật đậm nhất trong tin nhắn Zalo.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Đoạn văn mô tả tóm tắt (SEO Description) <span className="text-rose-600">*</span>:
                  </label>
                  <textarea
                    rows={3}
                    value={seo.description}
                    onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                    placeholder="Vd: Chương trình ưu đãi thiết bị điện máy, điện gia dụng chính hãng giá tốt tại KDT-89..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Đoạn mô tả ngắn gọn giúp khách hàng tin tưởng và hào hứng bấm vào link khi nhận qua tin nhắn.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onResetTexts}
            className="px-3.5 py-2 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Khôi phục mặc định ban đầu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Đã lưu thành công lên Cloud!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Lưu tất cả thay đổi</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
