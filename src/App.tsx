/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, ShieldCheck, LogOut, EyeOff, Tag, Cloud, CloudCheck, Share2, Plus, Pencil, Eye, ShoppingBag, Type, Sliders, Layers, Palette } from 'lucide-react';

function checkAdminAuth(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    if (
      urlParams.get('admin') === 'true' ||
      urlParams.get('admin') === '89' ||
      urlParams.get('admin') === '1' ||
      hash.includes('admin')
    ) {
      persistAdminAuth(true);
      return true;
    }
    const local = localStorage.getItem('kdt89_admin_authenticated') === 'true';
    const cookie = document.cookie.includes('kdt89_admin=89');
    return local || cookie;
  } catch {
    return false;
  }
}

function persistAdminAuth(value: boolean) {
  try {
    if (value) {
      localStorage.setItem('kdt89_admin_authenticated', 'true');
      document.cookie = 'kdt89_admin=89; max-age=31536000; path=/; SameSite=Lax';
    } else {
      localStorage.removeItem('kdt89_admin_authenticated');
      document.cookie = 'kdt89_admin=; max-age=0; path=/; SameSite=Lax';
    }
  } catch (e) {
    console.error(e);
  }
}

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { FlashSaleCountdown } from './components/FlashSaleCountdown';
import { StoreDecorations } from './components/StoreDecorations';
import { StoreDecorationModal, DEFAULT_DECOR_SETTINGS } from './components/StoreDecorationModal';
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
import { ProductPriceModal, CustomPrice } from './components/ProductPriceModal';
import { ProductFormModal } from './components/ProductFormModal';
import { CategoryEditModal } from './components/CategoryEditModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SectionVisibilityModal } from './components/SectionVisibilityModal';
import { OrderModal } from './components/OrderModal';
import { OrderManagementModal } from './components/OrderManagementModal';
import { SiteTextEditorModal, DEFAULT_SITE_TEXTS, DEFAULT_SITE_SEO } from './components/SiteTextEditorModal';
import { PRODUCTS, CATEGORIES, ComboItem, ProductItem, CategoryItem } from './data/products';
import {
  subscribeToSiteSettings,
  saveSiteSettingsToFirestore,
  subscribeToCustomImages,
  saveCustomImageToFirestore,
  deleteCustomImageFromFirestore,
  auth,
  logoutFirebaseAuth,
  CategoryOverride,
  subscribeToOrders,
  StoredOrder,
  SiteDecorSettings,
} from './lib/firebase';

export default function App() {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isConsultationOpen, setIsConsultationOpen] = useState<boolean>(false);
  const [consultationPrefill, setConsultationPrefill] = useState<string>('');
  const [consultationRecipient, setConsultationRecipient] = useState<'Vợ' | 'Mẹ' | 'Người thân'>('Vợ');
  const [consultationNote, setConsultationNote] = useState<string>('');

  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => checkAdminAuth());
  const [copiedAdminLink, setCopiedAdminLink] = useState<boolean>(false);

  const handleCopyAdminLink = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('admin', '89');
      navigator.clipboard.writeText(url.toString());
      setCopiedAdminLink(true);
      setTimeout(() => setCopiedAdminLink(false), 3500);
    } catch {
      // fallback
    }
  };

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

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

  // Section visibility modal state (Admin)
  const [isSectionVisibilityOpen, setIsSectionVisibilityOpen] = useState<boolean>(false);

  // Category Manager modal state (Admin)
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState<boolean>(false);
  const [categoryManagerTargetId, setCategoryManagerTargetId] = useState<string | null>(null);

  // Order checkout modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [orderSingleProduct, setOrderSingleProduct] = useState<ProductItem | null>(null);
  const [orderSelectedCombo, setOrderSelectedCombo] = useState<ComboItem | null>(null);

  // Order management modal state (Admin)
  const [isOrderManagementOpen, setIsOrderManagementOpen] = useState<boolean>(false);
  const [ordersList, setOrdersList] = useState<StoredOrder[]>([]);

  // Site text & SEO edit modal state (Admin)
  const [isSiteTextEditorOpen, setIsSiteTextEditorOpen] = useState<boolean>(false);

  // Store decorations & Flash sale countdown state
  const [decorSettings, setDecorSettings] = useState<SiteDecorSettings>(() => {
    try {
      const saved = localStorage.getItem('kdt89_decor_settings');
      return saved ? JSON.parse(saved) : DEFAULT_DECOR_SETTINGS;
    } catch {
      return DEFAULT_DECOR_SETTINGS;
    }
  });
  const [isDecorationModalOpen, setIsDecorationModalOpen] = useState<boolean>(false);

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

  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Real-time synchronization with Firebase Cloud Firestore
  useEffect(() => {
    // 1. Subscribe to Firebase Auth state
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setAdminEmail(user.email);
        if (user.email === 'nguyminhtuan10C2@gmail.com') {
          setIsAdmin(true);
          try {
            localStorage.setItem('kdt89_admin_authenticated', 'true');
          } catch (e) {
            console.error(e);
          }
        }
      } else {
        setAdminEmail(null);
      }
    });

    // 2. Real-time subscription to site settings in Firestore (hidden products, hidden combos, prices, custom products)
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
        setCustomImages((prev) => {
          const merged = { ...prev, ...images };
          try {
            localStorage.setItem('kdt89_custom_images', JSON.stringify(merged));
          } catch (e) {
            console.error(e);
          }
          return merged;
        });
      },
      (err) => {
        console.warn('Real-time custom images sync status:', err);
      }
    );

    return () => {
      unsubscribeAuth();
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

  // Real-time subscription to customer orders for admin
  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribeOrders = subscribeToOrders(
      (orders) => setOrdersList(orders),
      (err) => console.warn('Orders sync error:', err)
    );
    return () => unsubscribeOrders();
  }, [isAdmin]);

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    persistAdminAuth(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    persistAdminAuth(false);
    logoutFirebaseAuth();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    } catch {
      // Ignore
    }
  };

  // Visibility modal state
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
      saveSiteSettingsToFirestore({ hiddenProductIds: updated }).catch((e) =>
        console.error('Lỗi lưu hiddenProductIds lên Firebase', e)
      );
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
    saveSiteSettingsToFirestore({ hiddenProductIds: [] }).catch((e) =>
      console.error('Lỗi unhide all lên Firebase', e)
    );
  };

  // Toggle hide combo
  const handleToggleHideCombo = (comboId: string) => {
    setHiddenComboIds((prev) => {
      const exists = prev.includes(comboId);
      const updated = exists ? prev.filter((id) => id !== comboId) : [...prev, comboId];
      try {
        localStorage.setItem('kdt89_hidden_combo_ids', JSON.stringify(updated));
      } catch (e) {
        console.error('Không thể lưu trạng thái ẩn combo', e);
      }
      saveSiteSettingsToFirestore({ hiddenComboIds: updated }).catch((e) =>
        console.error('Lỗi lưu hiddenComboIds lên Firebase', e)
      );
      return updated;
    });
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

    saveCustomImageToFirestore(productId, imageDataUrl).catch((e) =>
      console.error('Lỗi lưu ảnh lên Firebase custom_images', e)
    );
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

    deleteCustomImageFromFirestore(productId).catch((e) =>
      console.error('Lỗi xóa ảnh trên Firebase custom_images', e)
    );
  };

  const handleOpenImageUpdater = (target?: ProductItem | string) => {
    if (typeof target === 'string') {
      const special = SPECIAL_SITE_ITEMS.find((s) => s.id === target);
      if (special) {
        setTargetImageProduct(special);
      } else {
        const prod = allProducts.find((p) => p.id === target);
        setTargetImageProduct(prod || allProducts[0]);
      }
    } else if (target) {
      setTargetImageProduct(target);
    } else {
      setTargetImageProduct(allProducts[0]);
    }
    setIsImageModalOpen(true);
  };

  // Price Editor modal state
  const [isPriceModalOpen, setIsPriceModalOpen] = useState<boolean>(false);
  const [targetPriceProduct, setTargetPriceProduct] = useState<ProductItem | null>(null);

  const handleOpenPriceEditor = (target?: ProductItem) => {
    setTargetPriceProduct(target || allProducts[0]);
    setIsPriceModalOpen(true);
  };

  const handleSaveCustomPrice = (productId: string, price: CustomPrice) => {
    setCustomPrices((prev) => {
      const updated = { ...prev, [productId]: price };
      try {
        localStorage.setItem('kdt89_custom_prices', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ customPrices: updated }).catch((e) =>
        console.error('Lỗi lưu customPrices lên Firebase', e)
      );
      return updated;
    });
  };

  const handleResetCustomPrice = (productId: string) => {
    setCustomPrices((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      try {
        localStorage.setItem('kdt89_custom_prices', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ customPrices: updated }).catch((e) =>
        console.error('Lỗi reset customPrices lên Firebase', e)
      );
      return updated;
    });
  };

  // Decoration & Flash Sale Settings Handlers
  const handleSaveDecorSettings = (newSettings: SiteDecorSettings, hideRecipient?: boolean) => {
    setDecorSettings(newSettings);
    try {
      localStorage.setItem('kdt89_decor_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }

    let updatedHidden = hiddenSections;
    if (typeof hideRecipient === 'boolean') {
      if (hideRecipient && !hiddenSections.includes('gift_recipient')) {
        updatedHidden = [...hiddenSections, 'gift_recipient'];
        setHiddenSections(updatedHidden);
      } else if (!hideRecipient && hiddenSections.includes('gift_recipient')) {
        updatedHidden = hiddenSections.filter((s) => s !== 'gift_recipient');
        setHiddenSections(updatedHidden);
      }
      try {
        localStorage.setItem('kdt89_hidden_sections', JSON.stringify(updatedHidden));
      } catch (e) {
        console.error(e);
      }
    }

    saveSiteSettingsToFirestore({
      decorSettings: newSettings,
      hiddenSections: updatedHidden,
    }).catch((e) => console.error('Lỗi lưu decorSettings lên Firebase', e));
  };

  const handleResetDecorSettings = () => {
    setDecorSettings(DEFAULT_DECOR_SETTINGS);
    try {
      localStorage.setItem('kdt89_decor_settings', JSON.stringify(DEFAULT_DECOR_SETTINGS));
    } catch (e) {
      console.error(e);
    }
    saveSiteSettingsToFirestore({ decorSettings: DEFAULT_DECOR_SETTINGS }).catch((e) =>
      console.error('Lỗi reset decorSettings lên Firebase', e)
    );
  };

  // Product Form Modal state (Add / Edit / Delete Product)
  const [isProductFormOpen, setIsProductFormOpen] = useState<boolean>(false);
  const [productFormTarget, setProductFormTarget] = useState<ProductItem | null>(null);
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit'>('add');

  const handleOpenAddProduct = (categoryId?: string) => {
    setProductFormMode('add');
    if (categoryId) {
      setProductFormTarget({
        id: '',
        name: '',
        category: categoryId as any,
        categoryLabel: '',
        budgetTier: '>4m',
        budgetLabel: 'Trên 4 triệu',
        programPrice: '[Liên hệ Sale nhận giá thợ]',
        referencePrice: '[Giá hãng]',
        stockStatus: 'Sẵn kho',
        warranty: '[Chính hãng 24 tháng]',
        deliveryCondition: 'Giá chương trình đã bao gồm hỗ trợ giao lắp',
        practicalValue: '',
      });
    } else {
      setProductFormTarget(null);
    }
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (product: ProductItem) => {
    setProductFormMode('edit');
    setProductFormTarget(product);
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = (updatedProduct: ProductItem) => {
    // If updating an image attached in form
    if (updatedProduct.imageUrl && updatedProduct.imageUrl.startsWith('data:image')) {
      handleSaveCustomImage(updatedProduct.id, updatedProduct.imageUrl);
    }

    if (productFormMode === 'add') {
      const updated = [updatedProduct, ...customProducts];
      setCustomProducts(updated);
      try {
        localStorage.setItem('kdt89_custom_products', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ customProducts: updated }).catch((e) =>
        console.error('Lỗi lưu customProducts lên Firebase', e)
      );
    } else {
      // Edit mode
      const isCustom = customProducts.some((p) => p.id === updatedProduct.id);
      if (isCustom) {
        const updated = customProducts.map((p) =>
          p.id === updatedProduct.id ? updatedProduct : p
        );
        setCustomProducts(updated);
        try {
          localStorage.setItem('kdt89_custom_products', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        saveSiteSettingsToFirestore({ customProducts: updated }).catch((e) =>
          console.error('Lỗi lưu customProducts lên Firebase', e)
        );
      } else {
        // Built-in product: store in editedProducts
        const updated = {
          ...editedProducts,
          [updatedProduct.id]: {
            name: updatedProduct.name,
            modelCode: updatedProduct.modelCode,
            category: updatedProduct.category,
            categoryLabel: updatedProduct.categoryLabel,
            budgetTier: updatedProduct.budgetTier,
            budgetLabel: updatedProduct.budgetLabel,
            programPrice: updatedProduct.programPrice,
            referencePrice: updatedProduct.referencePrice,
            stockStatus: updatedProduct.stockStatus,
            stockCountNumber: updatedProduct.stockCountNumber,
            warranty: updatedProduct.warranty,
            deliveryCondition: updatedProduct.deliveryCondition,
            highlightTag: updatedProduct.highlightTag,
            practicalValue: updatedProduct.practicalValue,
            specs: updatedProduct.specs,
          },
        };
        setEditedProducts(updated);
        try {
          localStorage.setItem('kdt89_edited_products', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        saveSiteSettingsToFirestore({ editedProducts: updated }).catch((e) =>
          console.error('Lỗi lưu editedProducts lên Firebase', e)
        );
      }
    }
  };

  const handleDeleteProduct = (productId: string) => {
    // 1. Add to deletedProductIds
    const updatedDeleted = Array.from(new Set([...deletedProductIds, productId]));
    setDeletedProductIds(updatedDeleted);
    try {
      localStorage.setItem('kdt89_deleted_product_ids', JSON.stringify(updatedDeleted));
    } catch (e) {
      console.error(e);
    }

    // 2. Filter out of customProducts if present
    const updatedCustom = customProducts.filter((p) => p.id !== productId);
    setCustomProducts(updatedCustom);
    try {
      localStorage.setItem('kdt89_custom_products', JSON.stringify(updatedCustom));
    } catch (e) {
      console.error(e);
    }

    // 3. Save to Firebase
    saveSiteSettingsToFirestore({
      deletedProductIds: updatedDeleted,
      customProducts: updatedCustom,
    }).catch((e) => console.error('Lỗi lưu deletedProductIds lên Firebase', e));
  };

  // Section Visibility toggle handlers
  const handleToggleSection = (sectionId: string) => {
    setHiddenSections((prev) => {
      const exists = prev.includes(sectionId);
      const updated = exists ? prev.filter((id) => id !== sectionId) : [...prev, sectionId];
      try {
        localStorage.setItem('kdt89_hidden_sections', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ hiddenSections: updated }).catch((e) =>
        console.error('Lỗi lưu hiddenSections lên Firebase', e)
      );
      return updated;
    });
  };

  const handleShowAllSections = () => {
    setHiddenSections([]);
    try {
      localStorage.removeItem('kdt89_hidden_sections');
    } catch (e) {
      console.error(e);
    }
    saveSiteSettingsToFirestore({ hiddenSections: [] }).catch((e) =>
      console.error('Lỗi show all sections lên Firebase', e)
    );
  };

  // Category Manager modal & handlers
  const handleOpenCategoryManager = (catId?: string) => {
    setCategoryManagerTargetId(catId || null);
    setIsCategoryManagerOpen(true);
  };

  const handleAddCategory = (newCat: CategoryItem) => {
    setAddedCategories((prev) => {
      const updated = [...prev, newCat];
      try {
        localStorage.setItem('kdt89_added_categories', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ addedCategories: updated }).catch((e) =>
        console.error('Lỗi lưu addedCategories lên Firebase', e)
      );
      return updated;
    });
  };

  const handleDeleteCategory = (catId: string) => {
    const updatedAdded = addedCategories.filter((c) => c.id !== catId);
    setAddedCategories(updatedAdded);
    try {
      localStorage.setItem('kdt89_added_categories', JSON.stringify(updatedAdded));
    } catch (e) {
      console.error(e);
    }

    const updatedDeleted = Array.from(new Set([...deletedCategoryIds, catId]));
    setDeletedCategoryIds(updatedDeleted);
    try {
      localStorage.setItem('kdt89_deleted_category_ids', JSON.stringify(updatedDeleted));
    } catch (e) {
      console.error(e);
    }

    saveSiteSettingsToFirestore({
      addedCategories: updatedAdded,
      deletedCategoryIds: updatedDeleted,
    }).catch((e) => console.error('Lỗi xóa danh mục trên Firebase', e));
  };

  const handleRestoreCategory = (catId: string) => {
    setDeletedCategoryIds((prev) => {
      const updated = prev.filter((id) => id !== catId);
      try {
        localStorage.setItem('kdt89_deleted_category_ids', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ deletedCategoryIds: updated }).catch((e) =>
        console.error('Lỗi khôi phục danh mục trên Firebase', e)
      );
      return updated;
    });
  };

  // Category Editor modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);

  const handleOpenCategoryEditor = (categoryId?: string) => {
    setTargetCategoryId(categoryId || 'water_heaters');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (categoryId: string, override: CategoryOverride) => {
    setCustomCategories((prev) => {
      const updated = { ...prev, [categoryId]: override };
      try {
        localStorage.setItem('kdt89_custom_categories', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ customCategories: updated }).catch((e) =>
        console.error('Lỗi lưu customCategories lên Firebase', e)
      );
      return updated;
    });
  };

  const handleResetCategory = (categoryId: string) => {
    setCustomCategories((prev) => {
      const updated = { ...prev };
      delete updated[categoryId];
      try {
        localStorage.setItem('kdt89_custom_categories', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      saveSiteSettingsToFirestore({ customCategories: updated }).catch((e) =>
        console.error('Lỗi reset customCategories lên Firebase', e)
      );
      return updated;
    });
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

  // Site text save/reset handlers
  const handleSaveSiteTexts = (
    newTexts: Record<string, string>,
    newSeo: { title: string; description: string }
  ) => {
    setCustomTexts(newTexts);
    setCustomSeo(newSeo);
    try {
      localStorage.setItem('kdt89_custom_texts', JSON.stringify(newTexts));
      localStorage.setItem('kdt89_custom_seo', JSON.stringify(newSeo));
    } catch (e) {
      console.error(e);
    }
    saveSiteSettingsToFirestore({
      customTexts: newTexts,
      customSeo: newSeo,
    }).catch((e) => console.error('Lỗi lưu customTexts lên Firebase', e));
  };

  const handleResetSiteTexts = () => {
    setCustomTexts(DEFAULT_SITE_TEXTS);
    setCustomSeo(DEFAULT_SITE_SEO);
    try {
      localStorage.removeItem('kdt89_custom_texts');
      localStorage.removeItem('kdt89_custom_seo');
    } catch (e) {
      console.error(e);
    }
    saveSiteSettingsToFirestore({
      customTexts: DEFAULT_SITE_TEXTS,
      customSeo: DEFAULT_SITE_SEO,
    }).catch((e) => console.error('Lỗi reset customTexts lên Firebase', e));
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      {/* Admin Top Notification Strip */}
      {isAdmin && (
        <aside className="bg-amber-500 text-white px-3 sm:px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2 font-bold flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-black uppercase tracking-wider">
              👑 Admin KDT-89
            </span>
            <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>Firebase Cloud: {isCloudSynced ? 'Đã đồng bộ tức thì' : 'Đang kết nối'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={() => setIsOrderManagementOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-sm ring-1 ring-white/30"
              title="Xem danh sách đơn đặt hàng của khách hàng (đồng thời gửi thông báo về email)"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Đơn hàng {ordersList.length > 0 ? `(${ordersList.length})` : ''}</span>
            </button>

            <button
              onClick={() => setIsSiteTextEditorOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              title="Sửa nội dung chữ trên website và tiêu đề khi chia sẻ link qua Zalo / Facebook"
            >
              <Type className="w-3.5 h-3.5 text-sky-200" />
              <span>Sửa chữ & SEO Zalo</span>
            </button>

            <button
              onClick={() => handleOpenAddProduct()}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              title="Thêm sản phẩm mới (máy lạnh, tivi, bếp, gia dụng) vào kho"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>+ Thêm sản phẩm</span>
            </button>

            <button
              onClick={() => handleOpenPriceEditor()}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Sửa giá chương trình & giá niêm yết"
            >
              <Tag className="w-3.5 h-3.5 text-rose-200" />
              <span>Sửa giá {Object.keys(customPrices).length > 0 ? `(${Object.keys(customPrices).length} món)` : ''}</span>
            </button>

            <button
              onClick={() => setIsSectionVisibilityOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
              title="Quyền Admin: Bật / Tắt các phần hiển thị trên Landing Page (Hero, Combo, Quà tặng, Sản phẩm, Lý do chọn...)"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-200" />
              <span>Bật/Tắt phần {hiddenSections.length > 0 ? `(${hiddenSections.length} ẩn)` : ''}</span>
            </button>

            <button
              onClick={() => handleOpenCategoryManager()}
              className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/35 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 border border-white/20"
              title="Quyền Admin: Thêm bớt danh mục mới, xóa danh mục hoặc sửa đổi đề mục nhóm sản phẩm"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span>Quản lý Danh mục</span>
            </button>

            <button
              onClick={() => handleOpenCategoryEditor()}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Sửa đề mục (Máy tắm nóng, Máy lạnh...) và dòng điều kiện lắp đặt / vật tư"
            >
              <Pencil className="w-3.5 h-3.5 text-amber-300" />
              <span>Sửa đề mục {Object.keys(customCategories).length > 0 ? `(${Object.keys(customCategories).length})` : ''}</span>
            </button>

            <button
              onClick={() => setIsVisibilityModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Quản lý danh sách ẩn / hiện sản phẩm với khách hàng"
            >
              <EyeOff className="w-3.5 h-3.5 text-amber-200" />
              <span>Ẩn/Hiện SP {hiddenProductIds.length > 0 ? `(${hiddenProductIds.length} ẩn)` : ''}</span>
            </button>

            {hiddenComboIds.length > 0 && (
              <button
                onClick={() => handleToggleHideCombo('combo-nha-mat')}
                className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                title="Bấm để bật/tắt hiển thị combo máy lạnh"
              >
                <EyeOff className="w-3.5 h-3.5 text-emerald-300" />
                <span>Combo đang ẩn ({hiddenComboIds.length})</span>
              </button>
            )}

            <button
              onClick={() => handleOpenImageUpdater()}
              className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Đổi ảnh {Object.keys(customImages).length > 0 ? `(${Object.keys(customImages).length})` : ''}</span>
            </button>

            <button
              onClick={handleCopyAdminLink}
              className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/35 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              title="Sao chép link Admin để gửi qua Zalo mở trên điện thoại (tự động vào thẳng quyền Admin vĩnh viễn)"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>{copiedAdminLink ? '✓ Đã copy link!' : '📱 Link cho đt'}</span>
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

      {/* Interactive Store Decorations (Confetti/Snow/Petals falling, Live social proof ticker, Floating gift deal ribbon) */}
      <StoreDecorations
        decorSettings={decorSettings}
        onExploreProducts={handleExploreProducts}
        onOpenOrderModal={handleOpenOrderCart}
      />

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
        customTexts={customTexts}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        {(!hiddenSections.includes('hero') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('hero') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Banner mở đầu (Hero) đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('hero')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <Hero
              onOpenConsultation={handleOpenConsultation}
              onExploreProducts={handleExploreProducts}
              onOpenImageUpdater={handleOpenImageUpdater}
              onOpenSiteTextEditor={() => setIsSiteTextEditorOpen(true)}
              isAdmin={isAdmin}
              customHeroImage={customImages['site-hero-image']}
              customTexts={customTexts}
            />
          </div>
        )}

        {/* 2.5. Flash Sale Urgency Countdown Timer Banner */}
        {(!hiddenSections.includes('flash_sale') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('flash_sale') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Thanh Flash Sale đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('flash_sale')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <FlashSaleCountdown
              decorSettings={decorSettings}
              onExploreProducts={handleExploreProducts}
              onOpenOrderModal={handleOpenOrderCart}
              isAdmin={isAdmin}
              onOpenDecorationModal={() => setIsDecorationModalOpen(true)}
            />
          </div>
        )}

        {/* 3. Suggested Combos */}
        {(!hiddenSections.includes('combos') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('combos') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Gói Combo gia đình đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('combos')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <ComboSection
              onSelectCombo={handleSelectCombo}
              onBuyCombo={handleOpenOrderCombo}
              isAdmin={isAdmin}
              hiddenComboIds={hiddenComboIds}
              onToggleHideCombo={handleToggleHideCombo}
              customImages={customImages}
              onOpenImageUpdater={handleOpenImageUpdater}
              customTexts={customTexts}
            />
          </div>
        )}

        {/* 4. Thoughtful Greeting Card Builder */}
        {(!hiddenSections.includes('gift_card') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('gift_card') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Bộ chọn quà & thiệp chúc mừng đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('gift_card')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <GiftCardBuilder onAttachMessage={handleAttachMessage} customTexts={customTexts} />
          </div>
        )}

        {/* 5. 5+ Product Groups with Budget Filter, Custom Images, Prices, Buy Now, Categories & Visibility */}
        {(!hiddenSections.includes('product_catalog') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('product_catalog') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Danh mục & Lưới toàn bộ sản phẩm đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('product_catalog')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <ProductCatalog
              selectedProductIds={selectedProductIds}
              allProducts={allProducts}
              allCategories={allCategories}
              deletedCategoryIds={deletedCategoryIds}
              customImages={customImages}
              customPrices={customPrices}
              customCategories={customCategories}
              customTexts={customTexts}
              onToggleProduct={handleToggleProduct}
              onBuyProduct={handleOpenOrderProduct}
              onOpenOrderModal={handleOpenOrderCart}
              onConsultProduct={(product) =>
                handleOpenConsultation(
                  `${product.name}${product.modelCode ? ` (Mã: ${product.modelCode})` : ''}`
                )
              }
              onOpenImageUpdater={handleOpenImageUpdater}
              onOpenPriceEditor={handleOpenPriceEditor}
              onOpenAddProduct={handleOpenAddProduct}
              onOpenCategoryEditor={handleOpenCategoryEditor}
              onOpenCategoryManager={handleOpenCategoryManager}
              onEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenConsultation={() => handleOpenConsultation()}
              isAdmin={isAdmin}
              hiddenProductIds={hiddenProductIds}
              onToggleHideProduct={handleToggleHideProduct}
              onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
            />
          </div>
        )}

        {/* 6. Why choose KDT-89 */}
        {(!hiddenSections.includes('why_choose') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('why_choose') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Mục Lý do chọn KDT-89 đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('why_choose')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <WhyChooseKDT customTexts={customTexts} />
          </div>
        )}

        {/* 7. Order Steps */}
        {(!hiddenSections.includes('order_steps') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('order_steps') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">4 Bước đặt hàng đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('order_steps')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <OrderSteps onOpenConsultation={() => handleOpenConsultation()} customTexts={customTexts} />
          </div>
        )}

        {/* 8. On-page Registration Form */}
        {(!hiddenSections.includes('registration') || isAdmin) && (
          <div className="relative">
            {isAdmin && hiddenSections.includes('registration') && (
              <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
                <EyeOff className="w-3.5 h-3.5 text-purple-300" />
                <span className="font-semibold">Form đăng ký nhận tư vấn đang ẩn với khách hàng</span>
                <button
                  type="button"
                  onClick={() => handleToggleSection('registration')}
                  className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
                >
                  Hiện lại
                </button>
              </div>
            )}
            <RegistrationSection
              customTexts={customTexts}
              isAdmin={isAdmin}
              isRecipientHidden={isGiftRecipientHidden}
              onToggleRecipient={() => handleToggleSection('gift_recipient')}
            />
          </div>
        )}
      </main>

      {/* 9. Official Footer */}
      {(!hiddenSections.includes('footer') || isAdmin) && (
        <div className="relative">
          {isAdmin && hiddenSections.includes('footer') && (
            <div className="bg-purple-900/95 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 border-b border-purple-700">
              <EyeOff className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-semibold">Chân trang Footer đang ẩn với khách hàng</span>
              <button
                type="button"
                onClick={() => handleToggleSection('footer')}
                className="px-2 py-0.5 rounded bg-purple-700 hover:bg-purple-600 text-white font-bold ml-2 transition-colors cursor-pointer text-[11px]"
              >
                Hiện lại
              </button>
            </div>
          )}
          <Footer
            isAdmin={isAdmin}
            onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
            customLogo={customImages['site-logo']}
            customTexts={customTexts}
          />
        </div>
      )}

      {/* 10. Mobile Sticky Action Bar - 1-tap Buy Now & Consultation */}
      {(!hiddenSections.includes('mobile_cta') || isAdmin) && (
        <MobileStickyCTA
          onOpenConsultation={() => handleOpenConsultation()}
          onOpenOrderModal={handleOpenOrderCart}
          onOpenImageUpdater={handleOpenImageUpdater}
          onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
          hiddenCount={hiddenProductIds.length}
          selectedCount={selectedProductIds.length}
          isAdmin={isAdmin}
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

      {/* 12. Product Image Update Modal */}
      <ImageUpdateModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        targetProduct={targetImageProduct}
        customImages={customImages}
        onSaveImage={handleSaveCustomImage}
        onResetImage={handleResetCustomImage}
      />

      {/* 13. Product Price Edit Modal */}
      <ProductPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        targetProduct={targetPriceProduct}
        customPrices={customPrices}
        onSavePrice={handleSaveCustomPrice}
        onResetPrice={handleResetCustomPrice}
      />

      {/* 14. Product Add / Edit / Delete Modal */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        mode={productFormMode}
        initialProduct={productFormTarget}
        categories={allCategories.filter((c) => !deletedCategoryIds.includes(c.id))}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* 15. Persistent Floating Action Buttons: ONLY visible to Admin */}
      {isAdmin && (
        <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setIsOrderManagementOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Xem danh sách đơn đặt hàng của khách (đã gửi thông báo về email)"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span>Đơn hàng</span>
            {ordersList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-rose-800 rounded-full text-[10px] font-black">
                {ordersList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsDecorationModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Cài đặt đếm ngược Flash Sale, hiệu ứng rơi lãng mạn & trang trí website"
          >
            <Palette className="w-4 h-4 text-yellow-300" />
            <span>Trang trí & Flash Sale</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSectionVisibilityOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bật / Tắt các phần trên Landing Page (Hero, Combo, Quà tặng, Sản phẩm...)"
          >
            <Sliders className="w-4 h-4 text-purple-200" />
            <span>Bật/Tắt phần</span>
            {hiddenSections.length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-purple-900 rounded-full text-[10px] font-black">
                {hiddenSections.length} ẩn
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenCategoryManager()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Thêm bớt danh mục mới hoặc sửa đề mục nhóm sản phẩm"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Quản lý Danh mục</span>
            <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 rounded-full text-[10px] font-black">
              {allCategories.filter((c) => !deletedCategoryIds.includes(c.id)).length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSiteTextEditorOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Sửa chữ trang web và tiêu đề hiển thị khi share link Zalo/Facebook"
          >
            <Type className="w-4 h-4 text-sky-200" />
            <span>Sửa chữ & SEO Zalo</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddProduct()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để thêm sản phẩm mới vào danh mục"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Thêm sản phẩm</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPriceEditor()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để sửa giá chương trình và giá niêm yết sản phẩm"
          >
            <Tag className="w-4 h-4 text-white" />
            <span>Sửa giá</span>
            {Object.keys(customPrices).length > 0 && (
              <span className="px-1.5 py-0.2 bg-white text-rose-700 rounded-full text-[10px] font-black">
                {Object.keys(customPrices).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleOpenCategoryEditor()}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để sửa đề mục các nhóm (Máy tắm nóng, Máy lạnh, Tivi...) và điều kiện giao lắp"
          >
            <Pencil className="w-4 h-4 text-amber-400" />
            <span>Sửa đề mục</span>
            {Object.keys(customCategories).length > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 rounded-full text-[10px] font-black">
                {Object.keys(customCategories).length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsVisibilityModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm shadow-xl active:scale-95 transition-all border-2 border-white cursor-pointer group"
            title="Quyền Admin: Bấm để Quản lý Ẩn / Hiện các sản phẩm với khách hàng"
          >
            <EyeOff className="w-4 h-4 text-amber-400" />
            <span>Ẩn / Hiện</span>
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

      {/* 16. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        isAdmin={isAdmin}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        onOpenImageUpdater={() => handleOpenImageUpdater()}
        onOpenManageVisibility={() => setIsVisibilityModalOpen(true)}
        onOpenSectionVisibility={() => setIsSectionVisibilityOpen(true)}
        onOpenCategoryManager={() => handleOpenCategoryManager()}
        onOpenPriceEditor={() => handleOpenPriceEditor()}
        onOpenCategoryEditor={() => handleOpenCategoryEditor()}
        onOpenOrders={() => setIsOrderManagementOpen(true)}
        onOpenSiteTextEditor={() => setIsSiteTextEditorOpen(true)}
        onOpenDecoration={() => setIsDecorationModalOpen(true)}
        hiddenCount={hiddenProductIds.length}
        adminEmail={adminEmail}
      />

      {/* 17. Product Visibility Modal (Admin only) */}
      <ProductVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        hiddenProductIds={hiddenProductIds}
        onToggleHideProduct={handleToggleHideProduct}
        onUnhideAllProducts={handleUnhideAllProducts}
        customImages={customImages}
      />

      {/* 18. Category Headings & Subtitles Edit Modal (Admin only) */}
      <CategoryEditModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        targetCategoryId={targetCategoryId}
        customCategories={customCategories}
        onSaveCategory={handleSaveCategory}
        onResetCategory={handleResetCategory}
      />

      {/* 19. Customer Order & Instant Notification Checkout Modal */}
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
        isAdmin={isAdmin}
        onToggleRecipient={() => handleToggleSection('gift_recipient')}
        onOrderSuccess={() => {
          setSelectedProductIds([]);
        }}
      />

      {/* 20. Admin Order Management Modal */}
      <OrderManagementModal
        isOpen={isOrderManagementOpen}
        onClose={() => setIsOrderManagementOpen(false)}
        isAdmin={isAdmin}
      />

      {/* 21. Site Text & Zalo Share SEO Customizer Modal (Admin only) */}
      <SiteTextEditorModal
        isOpen={isSiteTextEditorOpen}
        onClose={() => setIsSiteTextEditorOpen(false)}
        customTexts={customTexts}
        customSeo={customSeo}
        onSaveTexts={handleSaveSiteTexts}
        onResetTexts={handleResetSiteTexts}
      />

      {/* 22. Landing Page Section Visibility Modal (Admin only) */}
      <SectionVisibilityModal
        isOpen={isSectionVisibilityOpen}
        onClose={() => setIsSectionVisibilityOpen(false)}
        hiddenSections={hiddenSections}
        onToggleSection={handleToggleSection}
        onShowAllSections={handleShowAllSections}
      />

      {/* 23. Category Manager Modal (Admin only: Add/Remove/Edit Categories & Headings) */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => {
          setIsCategoryManagerOpen(false);
          setCategoryManagerTargetId(null);
        }}
        allCategories={allCategories}
        allProducts={allProducts}
        customCategories={customCategories}
        deletedCategoryIds={deletedCategoryIds}
        targetCategoryId={categoryManagerTargetId}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onRestoreCategory={handleRestoreCategory}
        onSaveCategoryOverride={handleSaveCategory}
        onResetCategoryOverride={handleResetCategory}
      />

      {/* 24. Store Decoration & Flash Sale Customizer Modal (Admin only) */}
      <StoreDecorationModal
        isOpen={isDecorationModalOpen}
        onClose={() => setIsDecorationModalOpen(false)}
        decorSettings={decorSettings}
        isRecipientHidden={isGiftRecipientHidden}
        onSaveDecorSettings={handleSaveDecorSettings}
        onResetDecorSettings={handleResetDecorSettings}
      />
    </div>
  );
}
