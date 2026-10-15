import React from 'react';
import { ORDER_STEPS } from '../data/products';
import { CheckSquare, ArrowRight } from 'lucide-react';

interface OrderStepsProps {
  onOpenConsultation: () => void;
}

export const OrderSteps: React.FC<OrderStepsProps> = ({ onOpenConsultation }) => {
  return (
    <section id="order-steps" className="py-12 sm:py-16 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Quy trình 4 bước nhanh gọn</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
            Hướng dẫn đặt hàng cho đối tác
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Chỉ mất 1 phút để giữ hàng món quà ưng ý nhất dịp 20/10
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ORDER_STEPS.map((step) => (
            <div
              key={step.step}
              className="relative p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white font-bold text-sm flex items-center justify-center mb-3">
                  {step.step}
                </div>
                <h3 className="font-bold text-base text-neutral-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {step.step === '2' && (
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <button
                    onClick={onOpenConsultation}
                    className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Mở form tư vấn ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
