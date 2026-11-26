/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FlashSaleCountdown } from './components/FlashSaleCountdown';
import { MegaSaleCampaignCountdown } from './components/MegaSaleCampaignCountdown';
import { StoreDecorations } from './components/StoreDecorations';
import { DEFAULT_DECOR_SETTINGS } from './components/StoreDecorationModal';
import { ComboSection } from './components/ComboSection';
import { GiftCardBuilder } from './components/GiftCardBuilder';
import { ProductCatalog } from './components/ProductCatalog';
import { WhyChooseKDT } from './components/WhyChooseKDT';
import { OrderSteps } from './components/OrderSteps';
import { RegistrationSection } from './components/RegistrationSection';
import { Footer } from './components/Footer';
import { MobileStickyCTA } from './components/MobileStickyCTA';
import { ConsultationModal } from './components/ConsultationModal';
import { CustomPrice } from './components/ProductPriceModal';
import { OrderModal } from './components/OrderModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { VoucherWalletModal } from './components/VoucherWalletModal';
import { CartDrawerModal } from './components/CartDrawerModal';
import { WelcomeOnboardingModal } from './components/WelcomeOnboardingModal';
import { FloatingWelcomeMascot } from './components/FloatingWelcomeMascot';
import { DEFAULT_SITE_TEXTS, DEFAULT_SITE_SEO } from './components/SiteTextEditorModal';
import { PRODUCTS, CATEGORIES, ComboItem, ProductItem, CategoryItem } from './data/products';
import {
  CustomerAccount,
  VoucherItem,
  resolveVouchers,
  formatShortVnd,
  getTotalVoucherAmount,
} from './data/vouchers';
import {
  subscribeToSiteSettings,
  subscribeToCustomImages,
  testConnection,
  CategoryOverride,
  SiteDecorSettings,
} from './lib/firebase';
import { trackEvent } from './lib/tracking';

export default function App() {
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(() => {
    try {
      const saved = localStorage.getItem('kdt89_customer_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    try {
      const savedAccRaw = localStorage.getItem('kdt89_customer_account');
      const savedAcc = savedAccRaw ? (JSON.parse(savedAccRaw) as CustomerAccount) : null;
      const key = savedAcc?.phoneNumber ? `kdt89_cart_${savedAcc.phoneNumber}` : 'kdt89_cart_guest';
      const savedCart = localStorage.getItem(key);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [consultationPrefill, setConsultationPrefill] = useState<string>('');
  const [consultationRecipient, setConsultationRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>('Vợ');
  const [consultationNote, setConsultationNote] = useState<string>('');

  // Custom user-uploaded images persisted in localStorage & synchronized with Firebase
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Hidden products state
  const [hiddenProductIds, setHiddenProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_hidden_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Hidden combos state: default hide combo-nha-mat (combo máy lạnh) as requested by user
  const [hiddenComboIds, setHiddenComboIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_hidden_combo_ids');
      return saved ? JSON.parse(saved) : ['combo-nha-mat'];
    } catch {
      return ['combo-nha-mat'];
    }
  });

  // Custom price overrides (program price & reference price)
  const [customPrices, setCustomPrices] = useState<Record<string, CustomPrice>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_prices');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom products added by admin
  const [customProducts, setCustomProducts] = useState<ProductItem[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deleted product IDs
  const [deletedProductIds, setDeletedProductIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_deleted_product_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Edited product overrides (names, models, specs, warranty, etc.)
  const [editedProducts, setEditedProducts] = useState<Record<string, Partial<ProductItem>>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_edited_products');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom category heading overrides (names, subtitles, installation notes)
  const [customCategories, setCustomCategories] = useState<Record<string, CategoryOverride>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom site texts (hero titles, descriptions, announcements, guarantees)
  const [customTexts, setCustomTexts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_texts');
      return saved ? JSON.parse(saved) : DEFAULT_SITE_TEXTS;
    } catch {
      return DEFAULT_SITE_TEXTS;
    }
  });

  // Custom SEO and Zalo share preview card title/description
  const [customSeo, setCustomSeo] = useState<{ title?: string; description?: string }>(() => {
    try {
      const saved = localStorage.getItem('kdt89_custom_seo');
      return saved ? JSON.parse(saved) : DEFAULT_SITE_SEO;
    } catch {
      return DEFAULT_SITE_SEO;
    }
  });

  // Hidden landing page sections state (hero, combos, gift_card, product_catalog, why_choose, order_steps, registration, footer, mobile_cta)
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_hidden_sections');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom categories added by admin
  const [addedCategories, setAddedCategories] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_added_categories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Deleted / hidden category IDs
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kdt89_deleted_category_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Order checkout modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderSingleProduct, setOrderSingleProduct] = useState<ProductItem | null>(null);
  const [orderSelectedCombo, setOrderSelectedCombo] = useState<ComboItem | null>(null);

  const [isCustomerAuthOpen, setIsCustomerAuthOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authInitialPhone, setAuthInitialPhone] = useState<string>('');
  const [isVoucherWalletOpen, setIsVoucherWalletOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(false);
  const [selectedVoucherForOrder, setSelectedVoucherForOrder] = useState<VoucherItem | null>(null);

  const handleCustomerLoginSuccess = (acc: CustomerAccount) => {
    setCustomerAccount(acc);
    try {
      const userCartKey = `kdt89_cart_${acc.phoneNumber}`;
      const savedUserCartRaw = localStorage.getItem(userCartKey);
      const savedUserCart = savedUserCartRaw ? (JSON.parse(savedUserCartRaw) as string[]) : [];
      const mergedCart = Array.from(new Set([...savedUserCart, ...selectedProductIds]));
      setSelectedProductIds(mergedCart);
      localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
      localStorage.setItem('kdt89_welcome_seen_v1', '1');
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogoutCustomer = () => {
    setCustomerAccount(null);
    try {
      localStorage.removeItem('kdt89_customer_account');
      const guestCartRaw = localStorage.getItem('kdt89_cart_guest');
      setSelectedProductIds(guestCartRaw ? JSON.parse(guestCartRaw) : []);
    } catch (e) {
      console.error(e);
    }
  };


  // Store decorations & Flash sale countdown state
  const [decorSettings, setDecorSettings] = useState<SiteDecorSettings>(() => {
    try {
      const saved = localStorage.getItem('kdt89_decor_settings');
      return saved ? JSON.parse(saved) : DEFAULT_DECOR_SETTINGS;
    } catch {
      return DEFAULT_DECOR_SETTINGS;
    }
  });

  // Dynamic vouchers configured by Admin (fallback to defaults)
  const activeVouchers = useMemo(
    () => resolveVouchers(decorSettings?.customVouchers),
    [decorSettings?.customVouchers]
  );
  const voucherTotalLabel = useMemo(
    () => formatShortVnd(getTotalVoucherAmount(activeVouchers)),
    [activeVouchers]
  );

  // Combined all categories (CATEGORIES + addedCategories)
  const allCategories = useMemo(() => {
    const customOnly = (addedCategories || []).filter(
      (ac) => !CATEGORIES.some((c) => c.id === ac.id)
    );
    return [...CATEGORIES, ...customOnly];
  }, [addedCategories]);

  // Combined all active products list
  const allProducts = useMemo(() => {
    // 1. Default products excluding deleted
    let list = PRODUCTS.filter((p) => !deletedProductIds.includes(p.id));

    // 2. Apply any field edits
    list = list.map((p) => {
      if (editedProducts[p.id]) {
        return { ...p, ...editedProducts[p.id] };
      }
      return p;
    });

    // 3. Append custom products (excluding deleted)
    const validCustom = (customProducts || []).filter(
      (cp) => !deletedProductIds.includes(cp.id)
    );

    return [...list, ...validCustom];
  }, [deletedProductIds, editedProducts, customProducts]);

  // Check if gift recipient selector is hidden either via hiddenSections or customTexts
  const isGiftRecipientHidden = useMemo(() => {
    if (hiddenSections.includes('gift_recipient')) return true;
    if (customTexts.showGiftRecipient === 'false') return true;
    return false;
  }, [hiddenSections, customTexts]);

  // Compute category IDs that actually have >= 1 visible product (or all non-deleted if admin)
  const visibleCategoryIds = useMemo(() => {
    return allCategories
      .filter((cat) => !deletedCategoryIds.includes(cat.id))
      .filter((cat) =>
        allProducts.some((p) => p.category === cat.id && !hiddenProductIds.includes(p.id))
      )
      .map((cat) => cat.id);
  }, [allCategories, deletedCategoryIds, allProducts, hiddenProductIds]);

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Track landing page view & verify Firestore connection once on mount
  useEffect(() => {
    trackEvent('page_view');
    testConnection();
  }, []);

  // Persist personal cart per logged-in customer phone (or guest)
  useEffect(() => {
    try {
      const key = customerAccount?.phoneNumber
        ? `kdt89_cart_${customerAccount.phoneNumber}`
        : 'kdt89_cart_guest';
      localStorage.setItem(key, JSON.stringify(selectedProductIds));
    } catch (e) {
      console.error(e);
    }
  }, [selectedProductIds, customerAccount?.phoneNumber]);

  // Real-time synchronization with Firebase Cloud Firestore (public customer read-only)
  useEffect(() => {
    // 1. Real-time subscription to site settings in Firestore
    const unsubscribeSettings = subscribeToSiteSettings(
      (data) => {
        if (data) {
          setIsCloudSynced(true);
          if (data.hiddenProductIds) {
            setHiddenProductIds(data.hiddenProductIds);
            try {
              localStorage.setItem('kdt89_hidden_product_ids', JSON.stringify(data.hiddenProductIds));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.hiddenComboIds) {
            setHiddenComboIds(data.hiddenComboIds);
            try {
              localStorage.setItem('kdt89_hidden_combo_ids', JSON.stringify(data.hiddenComboIds));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.customPrices) {
            setCustomPrices(data.customPrices);
            try {
              localStorage.setItem('kdt89_custom_prices', JSON.stringify(data.customPrices));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.customProducts) {
            setCustomProducts(data.customProducts);
            try {
              localStorage.setItem('kdt89_custom_products', JSON.stringify(data.customProducts));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.deletedProductIds) {
            setDeletedProductIds(data.deletedProductIds);
            try {
              localStorage.setItem('kdt89_deleted_product_ids', JSON.stringify(data.deletedProductIds));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.editedProducts) {
            setEditedProducts(data.editedProducts);
            try {
              localStorage.setItem('kdt89_edited_products', JSON.stringify(data.editedProducts));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.customCategories) {
            setCustomCategories(data.customCategories);
            try {
              localStorage.setItem('kdt89_custom_categories', JSON.stringify(data.customCategories));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.customTexts) {
            setCustomTexts(data.customTexts);
            try {
              localStorage.setItem('kdt89_custom_texts', JSON.stringify(data.customTexts));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.customSeo) {
            setCustomSeo(data.customSeo);
            try {
              localStorage.setItem('kdt89_custom_seo', JSON.stringify(data.customSeo));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.hiddenSections) {
            setHiddenSections(data.hiddenSections);
            try {
              localStorage.setItem('kdt89_hidden_sections', JSON.stringify(data.hiddenSections));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.addedCategories) {
            setAddedCategories(data.addedCategories);
            try {
              localStorage.setItem('kdt89_added_categories', JSON.stringify(data.addedCategories));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.deletedCategoryIds) {
            setDeletedCategoryIds(data.deletedCategoryIds);
            try {
              localStorage.setItem('kdt89_deleted_category_ids', JSON.stringify(data.deletedCategoryIds));
            } catch (e) {
              console.error(e);
            }
          }
          if (data.decorSettings) {
            setDecorSettings(data.decorSettings);
            try {
              localStorage.setItem('kdt89_decor_settings', JSON.stringify(data.decorSettings));
            } catch (e) {
              console.error(e);
            }
          }
        }
      },
      (err) => {
        console.warn('Real-time settings sync status:', err);
      }
    );

    // 3. Real-time subscription to individual custom images (under custom_images collection)
    const unsubscribeImages = subscribeToCustomImages(
      (images) => {
        setIsCloudSynced(true);
        setCustomImages(images);
        try {
          localStorage.setItem('kdt89_custom_images', JSON.stringify(images));
        } catch (e) {
          console.error(e);
        }
      },
      (err) => {
        console.warn('Real-time custom images sync status:', err);
      }
    );

    return () => {
      unsubscribeSettings();
      unsubscribeImages();
    };
  }, []);

  // Dynamic SEO & Zalo preview title/description sync
  useEffect(() => {
    if (customSeo?.title) {
      document.title = customSeo.title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', customSeo.title);
    }
    if (customSeo?.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', customSeo.description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', customSeo.description);
    }
  }, [customSeo]);

  // Check if Mega Sale campaign (e.g. 11.11) is actively running or in teaser
  const isMegaSaleActive = useMemo(() => {
    if (hiddenSections.includes('mega_sale_countdown')) return false;
    const cfg = decorSettings?.megaSaleConfig;
    if (cfg && cfg.enabled === false) return false;
    const teaserTime = new Date(cfg?.teaserStartDate || '2026-11-02T00:00').getTime();
    const endTime = new Date(cfg?.endDate || '2026-11-13T23:59').getTime();
    const nowTime = Date.now();
    return nowTime >= teaserTime && nowTime <= endTime;
  }, [hiddenSections, decorSettings?.megaSaleConfig]);

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
    if (combo.targetAudience.includes('Mẹ')) {
      setConsultationRecipient('Mẹ');
    } else {
      setConsultationRecipient('Vợ');
    }
    setIsConsultationOpen(true);
  };

  const handleOpenConsultation = (prefill?: string) => {
    if (prefill) {
      setConsultationPrefill(prefill);
    } else {
      setConsultationPrefill('');
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
    .map((id) => allProducts.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  // Order open handlers
  const handleOpenOrderProduct = (product: ProductItem) => {
    setOrderSingleProduct(product);
    setOrderSelectedCombo(null);
    setIsOrderModalOpen(true);
  };

  const handleOpenOrderCombo = (combo: ComboItem) => {
    setOrderSingleProduct(null);
    setOrderSelectedCombo(combo);
    setIsOrderModalOpen(true);
  };

  const handleOpenOrderCart = () => {
    setOrderSingleProduct(null);
    setOrderSelectedCombo(null);
    setIsOrderModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-neutral-50 text-neutral-900">
      {/* Interactive Store Decorations (Confetti/Snow/Petals falling, Floating gift deal ribbon) */}
      <StoreDecorations
        decorSettings={decorSettings}
        onExploreProducts={handleExploreProducts}
        onOpenOrderModal={handleOpenOrderCart}
      />

      {/* 1. Header with Top Bar Contract */}
      <Header
        onOpenConsultation={() => handleOpenConsultation()}
        isAdmin={false}
        customLogo={customImages['site-logo']}
        customTexts={customTexts}
        customerAccount={customerAccount}
        onOpenCustomerAuth={() => {
          setAuthInitialMode('login');
          setAuthInitialPhone('');
          setIsCustomerAuthOpen(true);
        }}
        onOpenVoucherWallet={() => setIsVoucherWalletOpen(true)}
        cartCount={selectedProductIds.length}
        onOpenCartDrawer={() => setIsCartOpen(true)}
        onOpenWelcomeGuide={() => setIsWelcomeOpen(true)}
        voucherTotalLabel={voucherTotalLabel}
      />

      <main className="flex-1">
        {/* 2. Hero Section (Slide ảnh & Mascot đầu trang kiểu ĐMX) */}
        {!hiddenSections.includes('hero') && (
          <div className="relative">
            <Hero
              onOpenConsultation={handleOpenConsultation}
              onExploreProducts={handleExploreProducts}
              onOpenVoucherWallet={() => setIsVoucherWalletOpen(true)}
              onOpenWelcomeGuide={() => setIsWelcomeOpen(true)}
              onOpenCartDrawer={() => setIsCartOpen(true)}
              onQuickPhoneContinue={(phone, mode) => {
                setAuthInitialPhone(phone);
                setAuthInitialMode(mode || 'login');
                setIsCustomerAuthOpen(true);
              }}
              isAdmin={false}
              customerAccount={customerAccount}
              voucherTotalLabel={voucherTotalLabel}
              customHeroImage={customImages['site-hero-image']}
              customImages={customImages}
              customTexts={customTexts}
              decorSettings={decorSettings}
              visibleCategoryIds={visibleCategoryIds}
            />
          </div>
        )}

        {/* 2.4. Mega Sale Campaign Countdown */}
        {isMegaSaleActive && !hiddenSections.includes('mega_sale_countdown') && (
          <div className="relative">
            <MegaSaleCampaignCountdown
              decorSettings={decorSettings}
              onExploreProducts={handleExploreProducts}
              onOpenOrderModal={handleOpenOrderCart}
              onOpenConsultation={(note) => handleOpenConsultation(note || 'Tư vấn săn deal Siêu Sale 11.11')}
              isAdmin={false}
            />
          </div>
        )}

        {/* 2.5. Flash Sale Hằng Ngày */}
        {!isMegaSaleActive && !hiddenSections.includes('flash_sale') && (
          <div className="relative">
            <FlashSaleCountdown
              decorSettings={decorSettings}
              onExploreProducts={handleExploreProducts}
              onOpenOrderModal={handleOpenOrderCart}
              onOpenConsultation={(note) => handleOpenConsultation(note || 'Tư vấn săn deal sale lớn')}
              isAdmin={false}
            />
          </div>
        )}

        {/* 3. Suggested Combos */}
        {!hiddenSections.includes('combos') && (
          <div className="relative">
            <ComboSection
              onSelectCombo={handleSelectCombo}
              onBuyCombo={handleOpenOrderCombo}
              isAdmin={false}
              hiddenComboIds={hiddenComboIds}
              customImages={customImages}
              customTexts={customTexts}
            />
          </div>
        )}

        {/* 4. Thoughtful Greeting Card Builder */}
        {!hiddenSections.includes('gift_card') && (
          <div className="relative">
            <GiftCardBuilder onAttachMessage={handleAttachMessage} customTexts={customTexts} />
          </div>
        )}

        {/* 5. Product Catalog */}
        {!hiddenSections.includes('product_catalog') && (
          <div className="relative">
            <ProductCatalog
              selectedProductIds={selectedProductIds}
              allProducts={allProducts}
              allCategories={allCategories}
              deletedCategoryIds={deletedCategoryIds}
              customImages={customImages}
              customPrices={customPrices}
              customCategories={customCategories}
              customTexts={customTexts}
              decorSettings={decorSettings}
              showBudgetFilter={
                !hiddenSections.includes('budget_filter') &&
                Boolean(decorSettings?.showBudgetFilter)
              }
              onToggleProduct={handleToggleProduct}
              onBuyProduct={handleOpenOrderProduct}
              onOpenOrderModal={handleOpenOrderCart}
              onConsultProduct={(product) =>
                handleOpenConsultation(
                  `${product.name}${product.modelCode ? ` (Mã: ${product.modelCode})` : ''}`
                )
              }
              onOpenConsultation={() => handleOpenConsultation()}
              isAdmin={false}
              hiddenProductIds={hiddenProductIds}
              onOpenVoucherWallet={() => setIsVoucherWalletOpen(true)}
            />
          </div>
        )}

        {/* 6. Why choose KDT-89 */}
        {!hiddenSections.includes('why_choose') && (
          <div className="relative">
            <WhyChooseKDT customTexts={customTexts} />
          </div>
        )}

        {/* 7. Order Steps */}
        {!hiddenSections.includes('order_steps') && (
          <div className="relative">
            <OrderSteps onOpenConsultation={() => handleOpenConsultation()} customTexts={customTexts} />
          </div>
        )}

        {/* 8. On-page Registration Form */}
        {!hiddenSections.includes('registration') && (
          <div className="relative">
            <RegistrationSection
              customTexts={customTexts}
              isAdmin={false}
              isRecipientHidden={isGiftRecipientHidden}
            />
          </div>
        )}
      </main>

      {/* 9. Official Footer */}
      {!hiddenSections.includes('footer') && (
        <div className="relative">
          <Footer
            isAdmin={false}
            customLogo={customImages['site-logo']}
            customTexts={customTexts}
          />
        </div>
      )}

      {/* 10. Mobile Sticky Action Bar */}
      {!hiddenSections.includes('mobile_cta') && (
        <MobileStickyCTA
          onOpenConsultation={() => handleOpenConsultation()}
          onOpenOrderModal={handleOpenOrderCart}
          selectedCount={selectedProductIds.length}
          isAdmin={false}
          customTexts={customTexts}
        />
      )}

      {/* 11. Consultation & Reservation Modal */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedProductNames={
          consultationPrefill ? [consultationPrefill] : selectedProductNames
        }
        initialRecipient={consultationRecipient}
        initialNote={consultationNote}
        isRecipientHidden={isGiftRecipientHidden}
        customTexts={customTexts}
      />

      {/* 12. Customer Order Checkout Modal */}
      <OrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        singleProduct={orderSingleProduct}
        selectedProducts={
          orderSingleProduct || orderSelectedCombo
            ? []
            : allProducts.filter((p) => selectedProductIds.includes(p.id))
        }
        selectedCombo={orderSelectedCombo}
        customPrices={customPrices}
        customImages={customImages}
        isRecipientHidden={isGiftRecipientHidden}
        isAdmin={false}
        customerAccount={customerAccount}
        initialSelectedVoucher={selectedVoucherForOrder}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        vouchers={activeVouchers}
        googleSheetWebhookUrl={decorSettings?.googleSheetWebhookUrl}
        onOrderSuccess={() => {
          setSelectedProductIds([]);
          setSelectedVoucherForOrder(null);
        }}
      />

      {/* 13. Customer Registration & Login Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthOpen}
        onClose={() => setIsCustomerAuthOpen(false)}
        initialMode={authInitialMode}
        initialPhone={authInitialPhone}
        currentAccount={customerAccount}
        onLogoutCustomer={handleLogoutCustomer}
        vouchers={activeVouchers}
        googleSheetWebhookUrl={decorSettings?.googleSheetWebhookUrl}
        onOpenVoucherWallet={() => {
          setIsCustomerAuthOpen(false);
          setIsVoucherWalletOpen(true);
        }}
        onLoginSuccess={(acc) => {
          handleCustomerLoginSuccess(acc);
          setIsVoucherWalletOpen(true);
        }}
      />

      {/* 14. Customer Voucher Wallet Modal */}
      <VoucherWalletModal
        isOpen={isVoucherWalletOpen}
        onClose={() => setIsVoucherWalletOpen(false)}
        customerAccount={customerAccount}
        vouchers={activeVouchers}
        onOpenLogin={() => {
          setIsVoucherWalletOpen(false);
          setIsCustomerAuthOpen(true);
        }}
        onLogoutCustomer={handleLogoutCustomer}
        onSelectVoucherToShop={(voucher) => {
          setSelectedVoucherForOrder(voucher);
          setIsVoucherWalletOpen(false);
          handleExploreProducts();
        }}
      />

      {/* 15. Personal Cart Drawer Modal */}
      <CartDrawerModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartProducts={allProducts.filter((p) => selectedProductIds.includes(p.id))}
        customPrices={customPrices}
        customImages={customImages}
        customerAccount={customerAccount}
        vouchers={activeVouchers}
        onRemoveProduct={(product) => handleToggleProduct(product)}
        onClearCart={() => setSelectedProductIds([])}
        onCheckout={handleOpenOrderCart}
        onOpenCustomerAuth={() => setIsCustomerAuthOpen(true)}
        onExploreProducts={handleExploreProducts}
      />

      {/* 16. First-Visit Welcome Onboarding Slide / Popup */}
      <WelcomeOnboardingModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onDismissForever={() => {
          try {
            localStorage.setItem('kdt89_welcome_seen_v1', '1');
          } catch (e) {
            console.error(e);
          }
        }}
        onLoginSuccess={(acc) => {
          handleCustomerLoginSuccess(acc);
        }}
        customTexts={customTexts}
        customHeroImage={customImages['site-hero-image']}
        customMascotImage={customImages['site-welcome-mascot']}
        vouchers={activeVouchers}
        googleSheetWebhookUrl={decorSettings?.googleSheetWebhookUrl}
      />

      {/* 17. Floating Welcome Mascot (Tụt vào mép màn hình khi lướt mobile, bấm để mở Voucher & Đăng ký) */}
      <FloatingWelcomeMascot
        onOpenWelcome={() => setIsWelcomeOpen(true)}
        onOpenVoucherWallet={() => setIsVoucherWalletOpen(true)}
        customerAccount={customerAccount}
        customMascotImage={customImages['site-welcome-mascot']}
        customTexts={customTexts}
        vouchers={activeVouchers}
        enabled={
          decorSettings?.showWelcomePopup !== false &&
          !hiddenSections.includes('welcome_popup')
        }
      />
    </div>
  );
}
