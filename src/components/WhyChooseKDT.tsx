import React from 'react';
import { REASONS_WHY, COMPANY_INFO } from '../data/products';
import { Warehouse, UserCheck, Truck, Wrench, ShieldCheck, BadgePercent } from 'lucide-react';

export const WhyChooseKDT: React.FC = () => {
  const iconList = [
    <Warehouse className="w-5 h-5 text-rose-600" />,
    <UserCheck className="w-5 h-5 text-rose-600" />,
    <Truck className="w-5 h-5 text-rose-600" />,
    <Wrench className="w-5 h-5 text-rose-600" />,
    <ShieldCheck className="w-5 h-5 text-rose-600" />,
    <BadgePercent className="w-5 h-5 text-rose-600" />,
  ];

  return (
    <section id="why-kdt" className="py-12 sm:py-16 bg-white border-y border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-800 mb-2">
            Đồng hành cùng anh em kỹ thuật
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Vì sao nên đặt tại {COMPANY_INFO.name}?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 text-balance">
            KDT-89 hiểu anh em thợ bận rộn trên các công trình. Mọi khâu tư vấn, đóng gói, giữ hàng và lắp đặt đều được tối ưu tiện lợi nhất.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {REASONS_WHY.map((reason, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-200 hover:border-neutral-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center mb-3">
                {iconList[idx % iconList.length]}
              </div>
              <h3 className="font-bold text-base text-neutral-900 mb-1.5">
                {reason.title}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {reason.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
