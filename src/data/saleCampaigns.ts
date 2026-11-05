/**
 * Danh sách các chương trình Siêu Sale Lớn trong năm tại Kho Điện Tử KDT-89
 */

export interface MajorSaleCampaign {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  badge: string;
  title: string;
  subtitle: string;
  targetDate: string; // ISO format or 'daily'
  displayDateLabel: string;
  theme: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  highlights: string;
  soldPercent: number;
  remainingSlots: number;
  buttonText: string;
  bgGradient: string;
  accentColor: string;
  cardGlow: string;
}

export const MAJOR_SALE_CAMPAIGNS: MajorSaleCampaign[] = [
  {
    id: 'double_11',
    name: 'Siêu Sale Ngày Đôi 11.11',
    shortName: '11.11 Ngày Đôi',
    icon: '⚡',
    badge: '⚡ ĐẠI HỘI SALE 11.11',
    title: 'SIÊU SALE NGÀY ĐÔI 11.11 | BÃO GIÁ SỈ TẬN KHO KDT-89',
    subtitle: 'Bão giảm giá lớn nhất tháng 11 – Ưu đãi độc quyền cho anh em thợ & đối tác chốt đơn giữ suất tại kho.',
    targetDate: '2026-11-11T23:59:59',
    displayDateLabel: '11/11/2026',
    theme: 'red',
    highlights: 'Flash Sale Nồi cơm Cuckoo · Bếp từ đôi nhập khẩu · Smart Tivi 32-55" trợ giá sốc · Máy tắm nước nóng',
    soldPercent: 88,
    remainingSlots: 15,
    buttonText: 'Săn Deal 11.11 Ngay',
    bgGradient: 'from-red-700 via-rose-700 to-amber-600',
    accentColor: 'text-yellow-300',
    cardGlow: 'bg-yellow-400/20',
  },
  {
    id: 'black_friday',
    name: 'Black Friday - Thứ Sáu Đen',
    shortName: 'Black Friday',
    icon: '🖤',
    badge: '🖤 BÃO SALE ĐẾN 50%',
    title: 'BLACK FRIDAY 2026 | THỨ SÁU ĐEN BÙNG NỔ GIẢM ĐẾN 50%',
    subtitle: 'Cơ hội săn điện máy & gia dụng giá chạm đáy lớn nhất năm – Khóa giá giữ suất 24h, kiểm tra ưng ý mới thanh toán.',
    targetDate: '2026-11-27T23:59:59',
    displayDateLabel: '27/11/2026',
    theme: 'black',
    highlights: 'Smart Tivi giảm kịch sàn · Nồi cơm Cuckoo bão giá Black Friday · Bếp từ đôi Sunhouse · Máy nước nóng Ariston',
    soldPercent: 93,
    remainingSlots: 9,
    buttonText: 'Khóa Giá Black Friday',
    bgGradient: 'from-neutral-950 via-neutral-900 to-rose-950',
    accentColor: 'text-amber-400',
    cardGlow: 'bg-rose-500/20',
  },
  {
    id: 'double_12',
    name: 'Đại Tiệc Siêu Sale 12.12',
    shortName: '12.12 Sinh Nhật Sale',
    icon: '🎁',
    badge: '🎁 ĐẠI TIỆC 12.12',
    title: 'ĐẠI TIỆC SIÊU SALE 12.12 | BÃO DEAL SINH NHẬT CUỐI NĂM',
    subtitle: 'Đợt siêu sale ngày đôi cuối cùng trong năm – Trợ giá sỉ trực tiếp tại kho cho đại lý, thợ và gia đình.',
    targetDate: '2026-12-12T23:59:59',
    displayDateLabel: '12/12/2026',
    theme: 'orange',
    highlights: 'Combo Căn bếp ấm · Smart Tivi 43-55" giá thợ · Máy nước nóng mùa lạnh · Bếp điện từ Sunhouse',
    soldPercent: 84,
    remainingSlots: 18,
    buttonText: 'Săn Deal 12.12 Giá Kho',
    bgGradient: 'from-amber-600 via-orange-600 to-red-600',
    accentColor: 'text-yellow-200',
    cardGlow: 'bg-amber-400/20',
  },
  {
    id: 'year_end',
    name: 'Đại Tiệc Xả Kho Cuối Năm',
    shortName: 'Xả Kho Cuối Năm',
    icon: '🔥',
    badge: '🔥 XẢ KHO ĐÓN LÔ MỚI',
    title: 'ĐẠI TIỆC XẢ KHO CUỐI NĂM | THANH LÝ GIÁ GỐC TẬN KHO',
    subtitle: 'Thanh lý giá gốc toàn bộ tivi, máy lạnh, nồi cơm, máy nước nóng để đón lô hàng mới – Cam kết rẻ hơn mọi siêu thị.',
    targetDate: '2026-12-31T23:59:59',
    displayDateLabel: '31/12/2026',
    theme: 'rose',
    highlights: 'Smart Tivi xả kho · Nồi cơm Cuckoo thanh lý kho · Máy lạnh giá thợ · Máy nước nóng trực tiếp',
    soldPercent: 95,
    remainingSlots: 7,
    buttonText: 'Nhận Bảng Giá Xả Kho',
    bgGradient: 'from-rose-700 via-red-700 to-orange-600',
    accentColor: 'text-yellow-300',
    cardGlow: 'bg-rose-400/20',
  },
  {
    id: 'tet_holiday',
    name: 'Sắm Điện Máy Đón Tết Sum Vầy 2027',
    shortName: 'Tết Sum Vầy 2027',
    icon: '🧧',
    badge: '🧧 KHAI XUÂN ĐÓN LỘC',
    title: 'SẮM ĐIỆN MÁY ĐÓN TẾT SUM VẦY 2027 | HÀNG SẴN KHO GIAO HỎA TỐC',
    subtitle: 'Tân trang căn bếp, nâng cấp Smart Tivi xem Táo Quân – Khóa lịch giao lắp sớm trước Tết, không lo sốt giá.',
    targetDate: '2027-02-06T23:59:59',
    displayDateLabel: '29 Tết Đinh Mùi',
    theme: 'gold',
    highlights: 'Smart Tivi xem Táo Quân · Nồi cơm nấu mâm cỗ Tết · Bếp từ lẩu sum vầy · Máy nước nóng mùa lạnh',
    soldPercent: 81,
    remainingSlots: 22,
    buttonText: 'Giữ Suất Sắm Tết Giá Gốc',
    bgGradient: 'from-red-800 via-amber-700 to-yellow-600',
    accentColor: 'text-amber-200',
    cardGlow: 'bg-yellow-400/25',
  },
  {
    id: 'daily_flash',
    name: 'Flash Sale Giờ Vàng Hôm Nay',
    shortName: 'Flash Sale Hôm Nay',
    icon: '⏰',
    badge: '⚡ GIỜ VÀNG TRONG NGÀY',
    title: 'FLASH SALE GIỜ VÀNG TRONG NGÀY | GIÁ SỈ TẬN KHO KDT-89',
    subtitle: 'Đồng hồ đếm lùi kết thúc 23:59:59 hôm nay – Áp dụng giá thợ tận kho, kiểm tra máy ưng ý mới thanh toán.',
    targetDate: 'daily',
    displayDateLabel: 'Hết ngày hôm nay',
    theme: 'red',
    highlights: 'Nồi cơm Cuckoo giá rẻ rẻ · Bếp từ đôi & đơn · Smart Tivi 32-55" · Máy tắm nước nóng Ariston',
    soldPercent: 86,
    remainingSlots: 11,
    buttonText: 'Săn Deal Giờ Vàng Ngay',
    bgGradient: 'from-rose-700 via-red-600 to-amber-600',
    accentColor: 'text-yellow-300',
    cardGlow: 'bg-red-400/20',
  },
];

export const getCampaignById = (id?: string): MajorSaleCampaign => {
  return MAJOR_SALE_CAMPAIGNS.find((c) => c.id === id) || MAJOR_SALE_CAMPAIGNS[0];
};

export interface MegaSalePreset {
  id: string;
  campaignId: string;
  name: string;
  shortName: string;
  icon: string;
  badge: string;
  title: string;
  subtitle: string;
  teaserStartDate: string; // e.g. '2026-11-08T00:00'
  startDate: string; // e.g. '2026-11-09T00:00'
  endDate: string; // e.g. '2026-11-13T23:59'
  displayRangeLabel: string; // '09/11 – 13/11'
  theme: 'red' | 'black' | 'gold' | 'rose' | 'orange';
  highlights: string;
  buttonTextUpcoming: string;
  buttonTextLive: string;
}

export const MEGA_SALE_PRESETS: MegaSalePreset[] = [
  {
    id: 'double_11',
    campaignId: 'double_11',
    name: 'Đại Tiệc Siêu Sale 11.11 (Chạy 09/11 – 13/11)',
    shortName: '11.11 Ngày Đôi',
    icon: '⚡',
    badge: '⚡ SIÊU SALE 11.11',
    title: 'ĐẠI HỘI SIÊU SALE 11.11 | BÃO GIÁ SỈ TẬN KHO KDT-89',
    subtitle: 'Chính thức diễn ra từ ngày 09/11 đến hết 13/11 – Đặt gạch giữ suất trước để nhận trọn vẹn giá thợ kho.',
    teaserStartDate: '2026-11-02T00:00', // Đang kích hoạt đếm ngược đón đầu ngay thời điểm hiện tại!
    startDate: '2026-11-09T00:00',
    endDate: '2026-11-13T23:59',
    displayRangeLabel: '09/11 – 13/11/2026',
    theme: 'red',
    highlights: 'Smart Tivi 32-55" trợ giá sốc · Nồi cơm Cuckoo · Bếp từ đôi · Máy tắm nước nóng Ariston',
    buttonTextUpcoming: 'Đặt gạch giữ suất 11.11',
    buttonTextLive: 'Săn deal 11.11 ngay',
  },
  {
    id: 'black_friday',
    campaignId: 'black_friday',
    name: 'Black Friday 2026 (Chạy 25/11 – 29/11)',
    shortName: 'Black Friday',
    icon: '🖤',
    badge: '🖤 BLACK FRIDAY -50%',
    title: 'BLACK FRIDAY 2026 | THỨ SÁU ĐEN BÙNG NỔ GIẢM ĐẾN 50%',
    subtitle: 'Chính thức diễn ra từ ngày 25/11 đến hết 29/11 – Cơ hội săn điện máy & gia dụng giá chạm đáy duy nhất trong năm.',
    teaserStartDate: '2026-11-24T00:00',
    startDate: '2026-11-25T00:00',
    endDate: '2026-11-29T23:59',
    displayRangeLabel: '25/11 – 29/11/2026',
    theme: 'black',
    highlights: 'Smart Tivi giảm kịch sàn · Nồi cơm Cuckoo bão giá Black Friday · Bếp từ đôi Sunhouse',
    buttonTextUpcoming: 'Đăng ký giữ giá Black Friday',
    buttonTextLive: 'Khóa giá Black Friday ngay',
  },
  {
    id: 'double_12',
    campaignId: 'double_12',
    name: 'Đại Tiệc Siêu Sale 12.12 (Chạy 10/12 – 14/12)',
    shortName: '12.12 Sinh Nhật Sale',
    icon: '🎁',
    badge: '🎁 ĐẠI TIỆC 12.12',
    title: 'ĐẠI TIỆC SIÊU SALE 12.12 | BÃO DEAL SINH NHẬT CUỐI NĂM',
    subtitle: 'Chính thức diễn ra từ ngày 10/12 đến hết 14/12 – Đợt bão sale ngày đôi cuối cùng trong năm tại kho KDT-89.',
    teaserStartDate: '2026-12-09T00:00',
    startDate: '2026-12-10T00:00',
    endDate: '2026-12-14T23:59',
    displayRangeLabel: '10/12 – 14/12/2026',
    theme: 'orange',
    highlights: 'Combo Căn bếp ấm · Smart Tivi 43-55" giá thợ · Máy nước nóng mùa lạnh',
    buttonTextUpcoming: 'Đặt gạch deal 12.12',
    buttonTextLive: 'Săn deal 12.12 ngay',
  },
  {
    id: 'year_end',
    campaignId: 'year_end',
    name: 'Đại Tiệc Xả Kho Cuối Năm (Chạy 26/12 – 31/12)',
    shortName: 'Xả Kho Cuối Năm',
    icon: '🔥',
    badge: '🔥 XẢ KHO ĐÓN LÔ MỚI',
    title: 'ĐẠI TIỆC XẢ KHO CUỐI NĂM | THANH LÝ GIÁ GỐC TẬN KHO',
    subtitle: 'Chính thức diễn ra từ ngày 26/12 đến hết 31/12 – Thanh lý toàn bộ tivi, máy lạnh, nồi cơm đón lô hàng mới.',
    teaserStartDate: '2026-12-25T00:00',
    startDate: '2026-12-26T00:00',
    endDate: '2026-12-31T23:59',
    displayRangeLabel: '26/12 – 31/12/2026',
    theme: 'rose',
    highlights: 'Smart Tivi xả kho · Nồi cơm Cuckoo thanh lý kho · Máy lạnh giá thợ',
    buttonTextUpcoming: 'Đăng ký giữ suất xả kho',
    buttonTextLive: 'Nhận bảng giá xả kho',
  },
  {
    id: 'tet_holiday',
    campaignId: 'tet_holiday',
    name: 'Khai Xuân Đón Tết 2027 (Chạy 02/02 – 06/02)',
    shortName: 'Tết Sum Vầy 2027',
    icon: '🧧',
    badge: '🧧 KHAI XUÂN ĐÓN LỘC',
    title: 'SẮM ĐIỆN MÁY ĐÓN TẾT SUM VẦY | KHAI XUÂN ĐÓN LỘC 2027',
    subtitle: 'Chính thức diễn ra từ ngày 02/02 đến hết 06/02/2027 – Smart Tivi xem Táo Quân, nồi cơm mâm cỗ Tết.',
    teaserStartDate: '2027-02-01T00:00',
    startDate: '2027-02-02T00:00',
    endDate: '2027-02-06T23:59',
    displayRangeLabel: '02/02 – 06/02/2027',
    theme: 'gold',
    highlights: 'Smart Tivi 43-55" xem Táo Quân · Nồi cơm nấu mâm cỗ Tết · Bếp từ lẩu sum vầy',
    buttonTextUpcoming: 'Đặt trước quà Tết giá sỉ',
    buttonTextLive: 'Sắm Tết giá kho ngay',
  },
];

export const DEFAULT_MEGA_SALE_CONFIG = {
  enabled: true,
  campaignId: 'double_11',
  title: 'ĐẠI HỘI SIÊU SALE 11.11 | BÃO GIÁ SỈ TẬN KHO KDT-89',
  badge: '🔥 SẮP BÙNG NỔ SIÊU SALE 11.11',
  subtitle: 'Áp dụng chính thức từ ngày 09/11 đến hết 13/11 – Đặt gạch giữ suất trước tại kho KDT-89',
  startDate: '2026-11-09T00:00',
  endDate: '2026-11-13T23:59',
  teaserStartDate: '2026-11-02T00:00', // Đang kích hoạt đếm ngược đón đầu ngay
  highlights: 'Smart Tivi 32-55" trợ giá sốc · Nồi cơm Cuckoo · Bếp từ đôi · Máy tắm nước nóng Ariston',
  theme: 'red' as const,
  buttonTextUpcoming: 'Đặt gạch giữ suất 11.11',
  buttonTextLive: 'Săn deal 11.11 ngay',
  earlyBirdSlots: 20,
};
