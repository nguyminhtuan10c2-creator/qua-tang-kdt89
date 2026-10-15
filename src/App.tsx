/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Camera, ShieldCheck, LogOut, EyeOff } from 'lucide-react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ComboSection } from './components/ComboSection';
import { GiftCardBuilder } from './components/GiftCardBuilder';
import { ProductCatalog } from './components/ProductCatalog';
import { WhyChooseKDT } from './components/WhyChooseKDT';
import { OrderSteps } from './components/OrderSteps';
import { RegistrationSection } from './components/RegistrationSection';
import { Footer } from './components/Footer';
import { MobileStickyCTA } from './components/MobileStickyCTA';
import { ConsultationModal } from './components/ConsultationModal';
import { ImageUpdateModal, SPECIAL_SITE_ITEMS } from './components/ImageUpdateModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ProductVisibilityModal } from './components/ProductVisibilityModal';
import { PRODUCTS, ComboItem, ProductItem } from './data/products';

export default function App() {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [consultationPrefill, setConsultationPrefill] = useState<string>('');
  const [consultationRecipient, setConsultationRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>('Vợ');
  const [consultationNote, setConsultationNote] = useState<string>('');

  // Admin authentication state: only admin can view/use image update buttons
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('admin') === 'true' || urlParams.get('admin') === '89' || urlParams.get('admin') === '1') {
          localStorage.setItem('kdt89_admin_authenticated', 'true');
          return true;
        }
      }
      return localStorage.getItem('kdt89_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    try {
      localStorage.setItem('kdt89_admin_authenticated', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem('kdt89_admin_authenticated');
    } catch (e) {
      console.error(e);
    }
  };

  // Custom user-uploaded images persisted in localStorage
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Hidden products state: persists list of product IDs hidden from customers
  const [hiddenProductIds, setHiddenProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_hidden_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState<boolean>(false);

  const handleToggleHideProduct = (productId: string) => {
    setHiddenProductIds((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('kdt89_hidden_product_ids', JSON.stringify(updated));
      } catch (e) {
        console.error('Không thể lưu trạng thái ẩn sản phẩm', e);
      }
      return updated;
    });
  };

  const handleUnhideAllProducts = () => {
    setHiddenProductIds([]);
    try {
      localStorage.removeItem('kdt89_hidden_product_ids');
    } catch (e) {
      console.error(e);
    }
  };

  // Image updater modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [targetImageProduct, setTargetImageProduct] = useState<any>(null);

  const handleSaveCustomImage = (productId: string, imageDataUrl: string) => {
    setCustomImages((prev) => {
      const updated = { ...prev, [productId]: imageDataUrl };
      try {
        localStorage.setItem('kdt89_custom_images', JSON.stringify(updated));
      } catch (e) {
        console.error('Không thể lưu ảnh vào bộ nhớ trình duyệt', e);
      }
      return updated;
    });
  };

  const handleResetCustomImage = (productId: string) => {
    setCustomImages((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      try {
        localStorage.setItem('kdt89_custom_images', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const handleOpenImageUpdater = (target?: ProductItem | string) => {
    if (typeof target === 'string') {
      const special = SPECIAL_SITE_ITEMS.find((s) => s.id === target);
      if (special) {
        setTargetImageProduct(special);
      } else {
        const prod = PRODUCTS.find((p) => p.id === target);
        setTargetImageProduct(prod || PRODUCTS[0]);
      }
    } else if (target) {
      setTargetImageProduct(target);
    } else {
      setTargetImageProduct(PRODUCTS[0]);
    }
    setIsImageModalOpen(true);
  };

  const handleToggleProduct = (product: ProductItem) => {
    setSelectedProductIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        return prev.filter((id) => id !== product.id);
      } else {
        return [...prev, product.id];
      }
    });
  };

  const handleSelectCombo = (combo: ComboItem) => {
    setConsultationPrefill(`${combo.name} (${combo.subtitle})`);
    if (combo.id === 'combo-me') {
      setConsultationRecipient('Mẹ');
    } else if (combo.id === 'combo-sum-vay') {
      setConsultationRecipient('Người thân');
    } else {
      setConsultationRecipient('Vợ');
    }
    setIsConsultationOpen(true);
  };

  const handleOpenConsultation = (prefillNote?: string) => {
    if (prefillNote) {
      setConsultationPrefill(prefillNote);
    } else if (selectedProductIds.length > 0) {
      const names = selectedProductIds
        .map((id) => PRODUCTS.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      setConsultationPrefill(names);
    }
    setIsConsultationOpen(true);
  };

  const handleAttachMessage = (message: string, recipientLabel: string) => {
    setConsultationNote(message);
    if (recipientLabel === 'Mẹ') {
      setConsultationRecipient('Mẹ');
    } else if (recipientLabel === 'Vợ') {
      setConsultationRecipient('Vợ');
    } else {
      setConsultationRecipient('Người thân');
    }
    setIsConsultationOpen(true);
  };

  const handleExploreProducts = () => {
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectedProductNames = selectedProductIds
    .map((id) => PRODUCTS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Admin Top Notification Strip (Only visible when logged in as admin) */}
      {isAdmin && (
        <aside className="bg-amber-500 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold">
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-black uppercase tracking-wider">
              👑 Admin KDT-89
            </span>
            <span>Quyền Quản trị viên: Anh có thể ẩn/hiện sản phẩm và cập nhật hình ảnh.</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsVisibilityModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Quản lý danh sách ẩn / hiện sản phẩm với khách hàng"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-200" />
              <span>Quản lý Ẩn/Hiện {hiddenProductIds.length > 0 ? `(${hiddenProductIds.length} đã ẩn)` : ''}</span>
            </button>
            <button
              onClick={() => handleOpenImageUpdater()}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Đổi ảnh</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-2.5 py-1 rounded-lg bg-white text-neutral-900 hover:bg-neutral-100 font-bold transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Thoát quyền Admin để xem giao diện như khách bình thường"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Thoát Admin</span>
            </button>
          </div>
        </aside>
      )}

      {/* 1. Header with Top Bar Contract */}
      <Header
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenImageUpdater={handleOpenImageUpdater}
        onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
        hiddenCount={hiddenProductIds.length}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        customLogo={customImages['site-logo']}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onOpenConsultation={handleOpenConsultation}
          onExploreProducts={handleExploreProducts}
          onOpenImageUpdater={handleOpenImageUpdater}
          isAdmin={isAdmin}
          customHeroImage={customImages['site-hero-image']}
        />

        {/* 3. Suggested Combos (Now including Combo Sum Vầy Tivi) */}
        <ComboSection onSelectCombo={handleSelectCombo} />

        {/* 4. Thoughtful 20/10 Greeting Card Builder */}
        <GiftCardBuilder onAttachMessage={handleAttachMessage} />

        {/* 5. 5 Product Groups (including Tivi) with Budget Filter & Custom Images */}
        <ProductCatalog
          selectedProductIds={selectedProductIds}
          customImages={customImages}
          onToggleProduct={handleToggleProduct}
          onConsultProduct={(product) =>
            handleOpenConsultation(
              `${product.name}${product.modelCode ? ` (Mã: ${product.modelCode})` : ''}`
            )
          }
          onOpenImageUpdater={handleOpenImageUpdater}
          onOpenConsultation={() => handleOpenConsultation()}
          isAdmin={isAdmin}
          hiddenProductIds={hiddenProductIds}
          onToggleHideProduct={handleToggleHideProduct}
          onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
        />

        {/* 6. Why choose KDT-89 */}
        <WhyChooseKDT />

        {/* 7. Order Steps */}
        <OrderSteps onOpenConsultation={() => handleOpenConsultation()} />

        {/* 8. On-page Registration Form */}
        <RegistrationSection />
      </main>

      {/* 9. Official Footer */}
      <Footer
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        customLogo={customImages['site-logo']}
      />

      {/* 10. Mobile Sticky Action Bar */}
      <MobileStickyCTA
        onOpenConsultation={() => handleOpenConsultation()}
        onOpenImageUpdater={handleOpenImageUpdater}
        onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
        hiddenCount={hiddenProductIds.length}
        selectedCount={selectedProductIds.length}
        isAdmin={isAdmin}
      />

      {/* 11. Consultation & Reservation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedProductNames={
          consultationPrefill ? [consultationPrefill] : selectedProductNames
        }
        initialRecipient={consultationRecipient}
        initialNote={consultationNote}
      />

      {/* 12. Product Image Update Modal */}
      <ImageUpdateModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        targetProduct={targetImageProduct}
        customImages={customImages}
        onSaveImage={handleSaveCustomImage}
        onResetImage={handleResetCustomImage}
      />

      {/* 13. Persistent Floating Action Buttons: ONLY visible to Admin */}
      {isAdmin && (
        <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để Quản lý Ẩn / Hiện các sản phẩm với khách hàng"
          >
            <EyeOff className="w-4 h-4 text-amber-400" />
            <span>Ẩn / Hiện sản phẩm</span>
            {hiddenProductIds.length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 rounded-full text-[10px] font-black">
                {hiddenProductIds.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => handleOpenImageUpdater()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để mở bảng Cập nhật / Đổi hình ảnh sản phẩm"
          >
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Camera className="w-3.5 h-3.5 text-white animate-pulse" />
            </span>
            <span className="font-bold">Cập nhật hình</span>
            {Object.keys(customImages).length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-orange-600 rounded-full text-[10px] font-black">
                {Object.keys(customImages).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 14. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        isAdmin={isAdmin}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        onOpenImageUpdater={() => handleOpenImageUpdater()}
        onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
        hiddenCount={hiddenProductIds.length}
      />

      {/* 15. Product Visibility Modal (Admin only) */}
      <ProductVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        hiddenProductIds={hiddenProductIds}
        onToggleHideProduct={handleToggleHideProduct}
        onUnhideAllProducts={handleUnhideAllProducts}
        customImages={customImages}
      />
    </div>
  );
}
