/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Camera, ShieldCheck, LogOut, EyeOff, Tag, Cloud, CloudCheck, Share2, Plus, Pencil, Eye } from 'lucide-react';

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
import { PRODUCTS, ComboItem, ProductItem } from './data/products';
import {
  subscribeToSiteSettings,
  saveSiteSettingsToFirestore,
  subscribeToCustomImages,
  saveCustomImageToFirestore,
  deleteCustomImageFromFirestore,
  auth,
  logoutFirebaseAuth,
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
              onClick={() => handleOpenAddProduct()}
              className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 font-bold text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 shadow-xs"
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

        {/* 3. Suggested Combos with Hide/Unhide Support */}
        <ComboSection
          onSelectCombo={handleSelectCombo}
          isAdmin={isAdmin}
          hiddenComboIds={hiddenComboIds}
          onToggleHideCombo={handleToggleHideCombo}
        />

        {/* 4. Thoughtful Greeting Card Builder */}
        <GiftCardBuilder onAttachMessage={handleAttachMessage} />

        {/* 5. 5 Product Groups with Budget Filter, Custom Images, Prices, Edit & Visibility */}
        <ProductCatalog
          selectedProductIds={selectedProductIds}
          allProducts={allProducts}
          customImages={customImages}
          customPrices={customPrices}
          onToggleProduct={handleToggleProduct}
          onConsultProduct={(product) =>
            handleOpenConsultation(
              `${product.name}${product.modelCode ? ` (Mã: ${product.modelCode})` : ''}`
            )
          }
          onOpenImageUpdater={handleOpenImageUpdater}
          onOpenPriceEditor={handleOpenPriceEditor}
          onOpenAddProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={handleDeleteProduct}
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
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* 15. Persistent Floating Action Buttons: ONLY visible to Admin */}
      {isAdmin && (
        <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-40 flex flex-col items-end gap-2">
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
        onOpenPriceEditor={() => handleOpenPriceEditor()}
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
    </div>
  );
}
