import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  FileSpreadsheet,
  ShoppingBag,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import {
  auth,
  verifyAdminAccess,
  logoutFirebaseAuth,
  subscribeToSiteSettings,
  saveSiteSettingsToFirestore,
  subscribeToCustomImages,
  saveCustomImageToFirestore,
  deleteCustomImageFromFirestore,
  subscribeToOrders,
  subscribeToCustomers,
  SiteSettingsData,
  SiteDecorSettings,
  CategoryOverride,
  StoredOrder,
} from '../lib/firebase';
import type { CustomerAccount } from '../data/vouchers';
import { CATEGORIES, ProductItem, CategoryItem } from '../data/products';
import { buildResolvedAdminProducts, ResolvedAdminProduct } from '../lib/productImportExport';
import { DEFAULT_SITE_TEXTS, DEFAULT_SITE_SEO, SiteTextEditorModal } from '../components/SiteTextEditorModal';
import { DEFAULT_DECOR_SETTINGS, StoreDecorationModal } from '../components/StoreDecorationModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductPriceModal, CustomPrice } from '../components/ProductPriceModal';
import { ImageUpdateModal, SPECIAL_SITE_ITEMS } from '../components/ImageUpdateModal';
import { SectionVisibilityModal } from '../components/SectionVisibilityModal';
import { AdminAuthGate } from './AdminAuthGate';
import { AdminDashboard, AdminTabId } from './AdminDashboard';
import { AdminProductTable } from './AdminProductTable';
import { AdminCategoriesPanel } from './AdminCategoriesPanel';
import { AdminImportExportPanel } from './AdminImportExportPanel';
import { AdminOrdersPanel } from './AdminOrdersPanel';
import { AdminSiteSettingsPanel } from './AdminSiteSettingsPanel';
import { FlashSaleShowcaseModal } from './FlashSaleShowcaseModal';
import { VoucherEditorModal } from './VoucherEditorModal';
import { HeroSlidesModal } from './HeroSlidesModal';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import { LegacyRecoveryModal } from './LegacyRecoveryModal';
import {
  initSheetsAuthListener,
  getSheetsAccessToken,
  syncOrdersAndCustomersToSheet,
} from '../lib/googleSheets';
import { resolveVouchers } from '../data/vouchers';
import { DEFAULT_HERO_SLIDES } from '../data/heroSlides';

const NAV_ITEMS: Array<{ id: AdminTabId; label: string; icon: React.ComponentType<any> }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Quản lý sản phẩm', icon: Package },
  { id: 'categories', label: 'Quản lý danh mục', icon: Layers },
  { id: 'import_export', label: 'Nhập / Xuất sản phẩm', icon: FileSpreadsheet },
  { id: 'orders', label: 'Quản lý đơn hàng', icon: ShoppingBag },
  { id: 'settings', label: 'Cài đặt website', icon: Settings },
];

export default function AdminApp() {
  const [authReady, setAuthReady] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [authDiagnosticError, setAuthDiagnosticError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTabId>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Firestore synced states
  const [rawSettings, setRawSettings] = useState<Partial<SiteSettingsData>>({});
  const [customImages, setCustomImages] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState<string | null>(null);

  // Sub-modals inside /admin
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit'>('add');
  const [productFormTarget, setProductFormTarget] = useState<ProductItem | null>(null);

  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [priceModalTarget, setPriceModalTarget] = useState<ProductItem | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalTarget, setImageModalTarget] = useState<any>(null);

  const [isSiteTextOpen, setIsSiteTextOpen] = useState(false);
  const [isDecorOpen, setIsDecorOpen] = useState(false);
  const [isSectionVisOpen, setIsSectionVisOpen] = useState(false);
  const [isFlashSaleShowcaseOpen, setIsFlashSaleShowcaseOpen] = useState(false);
  const [isVoucherEditorOpen, setIsVoucherEditorOpen] = useState(false);
  const [isHeroSlidesOpen, setIsHeroSlidesOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isLegacyRecoveryOpen, setIsLegacyRecoveryOpen] = useState(false);
  const [sheetsConnected, setSheetsConnected] = useState(false);
  const [sheetsEmail, setSheetsEmail] = useState<string | null>(null);
  const lastAutoSyncedSigRef = useRef<string>('');

  useEffect(() => {
    document.title = 'Quản trị Kho Điện Tử KDT-89';
  }, []);

  const syncAuthState = async (user: typeof auth.currentUser) => {
    const res = await verifyAdminAccess(user);
    setCurrentUserEmail(res.email);
    setIsAuthorizedAdmin(res.isAdmin);
    setNeedsEmailVerification(res.needsVerification);
    setAuthDiagnosticError(res.diagnosticError);
    setAuthReady(true);
  };

  // 1. Firebase Auth subscription (Single Source of Truth)
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      void syncAuthState(user);
    });
    const unsubSheets = initSheetsAuthListener(auth, (connected, email) => {
      setSheetsConnected(connected);
      setSheetsEmail(email);
    });
    return () => {
      unsub();
      unsubSheets();
    };
  }, []);

  // 2. Only attach Firestore subscriptions once Admin is verified via Firebase Auth
  useEffect(() => {
    if (!isAuthorizedAdmin) return;

    const unsubSettings = subscribeToSiteSettings(
      (data) => {
        if (data) setRawSettings(data);
      },
      (err) => console.warn('Admin settings sync error:', err)
    );

    const unsubImages = subscribeToCustomImages(
      (imgs) => setCustomImages(imgs),
      (err) => console.warn('Admin custom images sync error:', err)
    );

    setOrdersLoading(true);
    const unsubOrders = subscribeToOrders(
      (list) => {
        setOrders(list);
        setOrdersLoading(false);
        setOrdersError(null);
      },
      (err) => {
        setOrdersError(err?.message || 'Không thể tải danh sách đơn hàng.');
        setOrdersLoading(false);
      }
    );

    setCustomersLoading(true);
    const unsubCustomers = subscribeToCustomers(
      (list) => {
        setCustomers(list);
        setCustomersLoading(false);
        setCustomersError(null);
      },
      (err) => {
        setCustomersError(err?.message || 'Không thể tải danh sách khách hàng đăng ký.');
        setCustomersLoading(false);
      }
    );

    return () => {
      unsubSettings();
      unsubImages();
      unsubOrders();
      unsubCustomers();
    };
  }, [isAuthorizedAdmin]);

  // Derived states
  const hiddenProductIds = rawSettings.hiddenProductIds || [];
  const deletedProductIds = rawSettings.deletedProductIds || [];
  const editedProducts = rawSettings.editedProducts || {};
  const customProducts = (rawSettings.customProducts || []) as ProductItem[];
  const customPrices = rawSettings.customPrices || {};
  const customCategories = rawSettings.customCategories || {};
  const addedCategories = (rawSettings.addedCategories || []) as CategoryItem[];
  const deletedCategoryIds = rawSettings.deletedCategoryIds || [];
  const customTexts = rawSettings.customTexts || DEFAULT_SITE_TEXTS;
  const customSeo = rawSettings.customSeo || DEFAULT_SITE_SEO;
  const hiddenSections = rawSettings.hiddenSections || [];
  const decorSettings = rawSettings.decorSettings || DEFAULT_DECOR_SETTINGS;

  // Live auto-sync to Google Sheets while /admin stays open (when explicitly enabled & connected)
  useEffect(() => {
    const sheetId = decorSettings?.googleSheetId;
    const autoEnabled = Boolean(decorSettings?.googleSheetAutoSyncOnAdmin);
    const token = getSheetsAccessToken();
    if (!isAuthorizedAdmin || ordersLoading || customersLoading || !autoEnabled || !sheetId || !token) {
      return;
    }

    const sig = [
      sheetId,
      orders
        .map((o) => `${o.id}:${o.status || ''}:${o.address || ''}:${o.note || ''}`)
        .join('|'),
      customers
        .map((c) => `${c.phoneNumber}:${c.address || ''}:${(c.vouchersClaimed || []).join(',')}`)
        .join('|'),
    ].join('::');

    if (sig === lastAutoSyncedSigRef.current) return;

    const timer = setTimeout(() => {
      const freshToken = getSheetsAccessToken();
      if (!freshToken) return;
      syncOrdersAndCustomersToSheet({
        accessToken: freshToken,
        spreadsheetId: sheetId,
        orders,
        customers,
      })
        .then(() => {
          lastAutoSyncedSigRef.current = sig;
        })
        .catch((err) => {
          console.warn('Auto-sync Google Sheet warning:', err);
        });
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    isAuthorizedAdmin,
    ordersLoading,
    customersLoading,
    orders,
    customers,
    decorSettings?.googleSheetAutoSyncOnAdmin,
    decorSettings?.googleSheetId,
    sheetsConnected,
  ]);

  const allCategories = useMemo(() => {
    const customOnly = addedCategories.filter(
      (ac) => !CATEGORIES.some((c) => c.id === ac.id)
    );
    return [...CATEGORIES, ...customOnly];
  }, [addedCategories]);

  const resolvedProducts = useMemo(
    () =>
      buildResolvedAdminProducts({
        editedProducts,
        customProducts,
        customPrices,
        hiddenProductIds,
        deletedProductIds,
        customImages,
      }),
    [editedProducts, customProducts, customPrices, hiddenProductIds, deletedProductIds, customImages]
  );

  // Handlers
  const persistSettings = async (patch: Partial<SiteSettingsData>) => {
    setRawSettings((prev) => ({ ...prev, ...patch }));
    await saveSiteSettingsToFirestore(patch);
  };

  const handleSaveProduct = async (updatedProduct: ProductItem) => {
    if (updatedProduct.imageUrl && updatedProduct.imageUrl.startsWith('data:image')) {
      await saveCustomImageToFirestore(updatedProduct.id, updatedProduct.imageUrl);
    }

    if (productFormMode === 'add') {
      const nextCustom = [updatedProduct, ...customProducts];
      await persistSettings({ customProducts: nextCustom });
    } else {
      const isCustom = customProducts.some((p) => p.id === updatedProduct.id);
      if (isCustom) {
        const nextCustom = customProducts.map((p) =>
          p.id === updatedProduct.id ? updatedProduct : p
        );
        await persistSettings({ customProducts: nextCustom });
      } else {
        const rawOverride: Partial<ProductItem> = {
          name: updatedProduct.name,
          modelCode: updatedProduct.modelCode || '',
          category: updatedProduct.category,
          categoryLabel: updatedProduct.categoryLabel,
          budgetTier: updatedProduct.budgetTier,
          budgetLabel: updatedProduct.budgetLabel,
          programPrice: updatedProduct.programPrice,
          referencePrice: updatedProduct.referencePrice,
          stockStatus: updatedProduct.stockStatus,
          warranty: updatedProduct.warranty,
          deliveryCondition: updatedProduct.deliveryCondition,
          highlightTag: updatedProduct.highlightTag || '',
          promoBanner: updatedProduct.promoBanner || '',
          featureBadge: updatedProduct.featureBadge || '',
          soldText: updatedProduct.soldText || '',
          slotText: updatedProduct.slotText || '',
          practicalValue: updatedProduct.practicalValue,
          specs: updatedProduct.specs || '',
          ...(updatedProduct.stockCountNumber !== undefined
            ? { stockCountNumber: updatedProduct.stockCountNumber }
            : {}),
        };
        await persistSettings({
          editedProducts: { ...editedProducts, [updatedProduct.id]: rawOverride },
        });
      }
    }
  };

  // Soft-delete only (never permanently erases built-in or custom data from backup)
  const handleSoftDeleteProduct = async (productId: string) => {
    const nextDeleted = Array.from(new Set([...deletedProductIds, productId]));
    await persistSettings({ deletedProductIds: nextDeleted });
  };

  const handleRestoreProduct = async (productId: string) => {
    const nextDeleted = deletedProductIds.filter((id) => id !== productId);
    await persistSettings({ deletedProductIds: nextDeleted });
  };

  const handleToggleHideProduct = async (productId: string) => {
    const exists = hiddenProductIds.includes(productId);
    const nextHidden = exists
      ? hiddenProductIds.filter((id) => id !== productId)
      : [...hiddenProductIds, productId];
    await persistSettings({ hiddenProductIds: nextHidden });
  };

  const handleUpdateStock = async (
    product: ResolvedAdminProduct,
    stockCountNumber: number | undefined,
    stockStatus: string
  ) => {
    if (product.sourceType === 'custom') {
      const nextCustom = customProducts.map((cp) =>
        cp.id === product.id
          ? {
              ...cp,
              stockStatus,
              ...(stockCountNumber !== undefined ? { stockCountNumber } : {}),
            }
          : cp
      );
      await persistSettings({ customProducts: nextCustom });
    } else {
      const prevOverride = editedProducts[product.id] || {};
      const nextOverride: Partial<ProductItem> = {
        ...prevOverride,
        stockStatus,
        ...(stockCountNumber !== undefined ? { stockCountNumber } : {}),
      };
      await persistSettings({
        editedProducts: { ...editedProducts, [product.id]: nextOverride },
      });
    }
  };

  const handleSaveCustomPrice = async (productId: string, price: CustomPrice) => {
    await persistSettings({ customPrices: { ...customPrices, [productId]: price } });
  };

  const handleResetCustomPrice = async (productId: string) => {
    const next = { ...customPrices };
    delete next[productId];
    await persistSettings({ customPrices: next });
  };

  const handleSaveCustomImage = async (productId: string, imageDataUrl: string) => {
    await saveCustomImageToFirestore(productId, imageDataUrl);
  };

  const handleResetCustomImage = async (productId: string) => {
    await deleteCustomImageFromFirestore(productId);
  };

  // Auth loading state
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập Google...
      </div>
    );
  }

  // Strictly block /admin for guests & non-owner accounts
  if (!isAuthorizedAdmin) {
    return (
      <AdminAuthGate
        currentUserEmail={currentUserEmail}
        isSignedInButUnauthorized={Boolean(currentUserEmail && !isAuthorizedAdmin)}
        needsEmailVerification={needsEmailVerification}
        diagnosticError={authDiagnosticError}
        onAuthRefreshed={() => void syncAuthState(auth.currentUser)}
      />
    );
  }

  const activeTabMeta = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 shrink-0">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-base tracking-tight text-slate-900">
            KDT-89 Admin
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2 text-xs">
          <div className="text-slate-500 truncate">{currentUserEmail}</div>
          <button
            type="button"
            onClick={() => logoutFirebaseAuth()}
            className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full flex flex-col z-10 border-r border-slate-200">
            <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900">KDT-89 Admin</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="text-slate-500 truncate">{currentUserEmail}</div>
              <button
                type="button"
                onClick={() => logoutFirebaseAuth()}
                className="w-full py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-medium inline-flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb on left, primary actions on right */}
        <header className="h-14 lg:h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Mở menu quản trị"
              className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900 truncate">
                {activeTabMeta.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Xem trang khách</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <AdminDashboard
              resolvedProducts={resolvedProducts}
              allCategories={allCategories}
              deletedCategoryIds={deletedCategoryIds}
              orders={orders}
              customersCount={customers.length}
              customImagesCount={Object.keys(customImages).length}
              lastUpdatedAt={rawSettings.updatedAt}
              onNavigateTab={setActiveTab}
              onOpenFlashSaleShowcase={() => setIsFlashSaleShowcaseOpen(true)}
              onOpenLegacyRecovery={() => setIsLegacyRecoveryOpen(true)}
            />
          )}

          {activeTab === 'products' && (
            <AdminProductTable
              products={resolvedProducts}
              categories={allCategories}
              deletedCategoryIds={deletedCategoryIds}
              onAddProduct={() => {
                setProductFormMode('add');
                setProductFormTarget(null);
                setIsProductFormOpen(true);
              }}
              onEditProduct={(prod) => {
                setProductFormMode('edit');
                setProductFormTarget(prod);
                setIsProductFormOpen(true);
              }}
              onEditPrice={(prod) => {
                setPriceModalTarget(prod);
                setIsPriceModalOpen(true);
              }}
              onEditImage={(prod) => {
                setImageModalTarget(prod);
                setIsImageModalOpen(true);
              }}
              onUpdateStock={handleUpdateStock}
              onToggleHide={handleToggleHideProduct}
              onSoftDelete={handleSoftDeleteProduct}
              onRestoreProduct={handleRestoreProduct}
              onGoImportExport={() => setActiveTab('import_export')}
              onOpenFlashSaleShowcase={() => setIsFlashSaleShowcaseOpen(true)}
            />
          )}

          {activeTab === 'categories' && (
            <AdminCategoriesPanel
              allCategories={allCategories}
              resolvedProducts={resolvedProducts}
              customCategories={customCategories}
              deletedCategoryIds={deletedCategoryIds}
              onAddCategory={(cat) =>
                persistSettings({ addedCategories: [...addedCategories, cat] })
              }
              onDeleteCategory={(catId) =>
                persistSettings({
                  addedCategories: addedCategories.filter((c) => c.id !== catId),
                  deletedCategoryIds: Array.from(new Set([...deletedCategoryIds, catId])),
                })
              }
              onRestoreCategory={(catId) =>
                persistSettings({
                  deletedCategoryIds: deletedCategoryIds.filter((id) => id !== catId),
                })
              }
              onSaveCategoryOverride={(catId, ov: CategoryOverride) =>
                persistSettings({ customCategories: { ...customCategories, [catId]: ov } })
              }
              onResetCategoryOverride={(catId) => {
                const next = { ...customCategories };
                delete next[catId];
                persistSettings({ customCategories: next });
              }}
            />
          )}

          {activeTab === 'import_export' && (
            <AdminImportExportPanel
              resolvedProducts={resolvedProducts}
              categories={allCategories.filter((c) => !deletedCategoryIds.includes(c.id))}
              rawSiteSettings={rawSettings}
              customImageKeys={Object.keys(customImages)}
              onCommitImportPatch={persistSettings}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersPanel
              orders={orders}
              loading={ordersLoading}
              loadError={ordersError}
              customers={customers}
              customersLoading={customersLoading}
              customersError={customersError}
              googleSheetUrl={decorSettings?.googleSheetUrl}
              isSheetsConnected={sheetsConnected}
              autoSyncEnabled={Boolean(decorSettings?.googleSheetAutoSyncOnAdmin)}
              onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSiteSettingsPanel
              customTexts={customTexts}
              customSeo={customSeo}
              hiddenSections={hiddenSections}
              decorSettings={decorSettings}
              onOpenSiteTextEditor={() => setIsSiteTextOpen(true)}
              onOpenDecorationModal={() => setIsDecorOpen(true)}
              onOpenSectionVisibility={() => setIsSectionVisOpen(true)}
              onOpenFlashSaleShowcase={() => setIsFlashSaleShowcaseOpen(true)}
              onOpenVoucherEditor={() => setIsVoucherEditorOpen(true)}
              onOpenHeroSlidesModal={() => setIsHeroSlidesOpen(true)}
              onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
              onOpenLegacyRecovery={() => setIsLegacyRecoveryOpen(true)}
              onToggleWelcomePopup={() => {
                const currentlyEnabled =
                  decorSettings?.showWelcomePopup !== false &&
                  !hiddenSections.includes('welcome_popup');
                const nextHidden = currentlyEnabled
                  ? Array.from(new Set([...hiddenSections, 'welcome_popup']))
                  : hiddenSections.filter((s) => s !== 'welcome_popup');
                void persistSettings({
                  hiddenSections: nextHidden,
                  decorSettings: {
                    ...decorSettings,
                    showWelcomePopup: !currentlyEnabled,
                  },
                });
              }}
              onOpenBrandingImages={(targetId) => {
                const special = SPECIAL_SITE_ITEMS.find((s) => s.id === targetId);
                setImageModalTarget(special || resolvedProducts[0]);
                setIsImageModalOpen(true);
              }}
            />
          )}
        </main>
      </div>

      {/* Reused Admin Modals */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        mode={productFormMode}
        initialProduct={productFormTarget}
        categories={allCategories.filter((c) => !deletedCategoryIds.includes(c.id))}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleSoftDeleteProduct}
      />

      <ProductPriceModal
        isOpen={isPriceModalOpen}
        onClose={() => setIsPriceModalOpen(false)}
        targetProduct={priceModalTarget}
        customPrices={customPrices}
        onSavePrice={handleSaveCustomPrice}
        onResetPrice={handleResetCustomPrice}
        productsList={resolvedProducts.filter((p) => !p.isDeleted)}
      />

      <ImageUpdateModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        targetProduct={imageModalTarget}
        customImages={customImages}
        onSaveImage={handleSaveCustomImage}
        onResetImage={handleResetCustomImage}
        productsList={resolvedProducts.filter((p) => !p.isDeleted)}
      />

      <SiteTextEditorModal
        isOpen={isSiteTextOpen}
        onClose={() => setIsSiteTextOpen(false)}
        customTexts={customTexts}
        customSeo={customSeo}
        onSaveTexts={(newTexts, newSeo) =>
          persistSettings({ customTexts: newTexts, customSeo: newSeo })
        }
        onResetTexts={() =>
          persistSettings({ customTexts: DEFAULT_SITE_TEXTS, customSeo: DEFAULT_SITE_SEO })
        }
      />

      <StoreDecorationModal
        isOpen={isDecorOpen}
        onClose={() => setIsDecorOpen(false)}
        decorSettings={decorSettings}
        isRecipientHidden={
          hiddenSections.includes('gift_recipient') ||
          customTexts.showGiftRecipient === 'false'
        }
        onSaveDecorSettings={(newSettings: SiteDecorSettings, hideRecipient?: boolean) => {
          let nextHidden = hiddenSections;
          if (typeof hideRecipient === 'boolean') {
            if (hideRecipient && !hiddenSections.includes('gift_recipient')) {
              nextHidden = [...hiddenSections, 'gift_recipient'];
            } else if (!hideRecipient && hiddenSections.includes('gift_recipient')) {
              nextHidden = hiddenSections.filter((s) => s !== 'gift_recipient');
            }
          }
          persistSettings({ decorSettings: newSettings, hiddenSections: nextHidden });
        }}
        onResetDecorSettings={() =>
          persistSettings({ decorSettings: DEFAULT_DECOR_SETTINGS })
        }
      />

      <SectionVisibilityModal
        isOpen={isSectionVisOpen}
        onClose={() => setIsSectionVisOpen(false)}
        hiddenSections={hiddenSections}
        onToggleSection={(sectionId) => {
          const exists = hiddenSections.includes(sectionId);
          const next = exists
            ? hiddenSections.filter((id) => id !== sectionId)
            : [...hiddenSections, sectionId];
          persistSettings({ hiddenSections: next });
        }}
        onShowAllSections={() => persistSettings({ hiddenSections: [] })}
      />

      <FlashSaleShowcaseModal
        isOpen={isFlashSaleShowcaseOpen}
        onClose={() => setIsFlashSaleShowcaseOpen(false)}
        products={resolvedProducts}
        categories={allCategories}
        deletedCategoryIds={deletedCategoryIds}
        customTexts={customTexts}
        decorSettings={decorSettings}
        onEditPrice={(prod) => {
          setPriceModalTarget(prod);
          setIsPriceModalOpen(true);
        }}
        onSaveShowcase={async ({
          flagshipBadge,
          flagshipTitle,
          flagshipHint,
          showFlagshipDeals,
          flagshipProductIds,
        }) => {
          await persistSettings({
            customTexts: {
              ...customTexts,
              flagshipBadge,
              flagshipTitle,
              flagshipHint,
            },
            decorSettings: {
              ...decorSettings,
              showFlagshipDeals,
              flagshipProductIds,
            },
          });
        }}
      />

      <VoucherEditorModal
        isOpen={isVoucherEditorOpen}
        onClose={() => setIsVoucherEditorOpen(false)}
        vouchers={resolveVouchers(decorSettings?.customVouchers)}
        onSaveVouchers={async (nextVouchers) => {
          await persistSettings({
            decorSettings: {
              ...decorSettings,
              customVouchers: nextVouchers,
            },
          });
        }}
      />

      <HeroSlidesModal
        isOpen={isHeroSlidesOpen}
        onClose={() => setIsHeroSlidesOpen(false)}
        layoutMode={decorSettings?.heroLayoutMode || 'slider'}
        showMemberSlide={decorSettings?.showMemberHeroSlide !== false}
        showMemberSlideMobile={
          decorSettings?.showMemberHeroSlideMobile ??
          decorSettings?.showMemberHeroSlide !== false
        }
        aspectRatio={decorSettings?.heroAspectRatio || '5/1'}
        mobileAspectRatio={decorSettings?.mobileHeroAspectRatio || '16/9'}
        memberVisualFit={decorSettings?.memberVisualFit || 'smart'}
        mobileMemberVisualFit={decorSettings?.mobileMemberVisualFit || 'smart'}
        slides={
          decorSettings?.heroSlides && decorSettings.heroSlides.length > 0
            ? decorSettings.heroSlides
            : DEFAULT_HERO_SLIDES
        }
        customImages={customImages}
        onUploadSlideImage={async (imageKey, dataUrl) => {
          await handleSaveCustomImage(imageKey, dataUrl);
        }}
        onDeleteSlideImage={async (imageKey) => {
          await deleteCustomImageFromFirestore(imageKey);
        }}
        onSaveConfig={async (
          nextMode,
          nextSlides,
          nextShowMemberSlide,
          nextAspectRatio,
          nextMemberVisualFit,
          nextMobileAspectRatio,
          nextMobileMemberVisualFit,
          nextShowMemberSlideMobile
        ) => {
          await persistSettings({
            decorSettings: {
              ...decorSettings,
              heroLayoutMode: nextMode,
              heroSlides: nextSlides,
              showMemberHeroSlide: nextShowMemberSlide !== false,
              showMemberHeroSlideMobile:
                nextShowMemberSlideMobile ?? (nextShowMemberSlide !== false),
              heroAspectRatio: nextAspectRatio || '5/1',
              mobileHeroAspectRatio: nextMobileAspectRatio || '16/9',
              memberVisualFit: nextMemberVisualFit || 'smart',
              mobileMemberVisualFit: nextMobileMemberVisualFit || 'smart',
            },
          });
        }}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        orders={orders}
        customers={customers}
        googleSheetId={decorSettings?.googleSheetId}
        googleSheetTitle={decorSettings?.googleSheetTitle}
        googleSheetUrl={decorSettings?.googleSheetUrl}
        googleSheetWebhookUrl={decorSettings?.googleSheetWebhookUrl}
        googleSheetAutoSyncOnAdmin={Boolean(decorSettings?.googleSheetAutoSyncOnAdmin)}
        isSheetsConnected={sheetsConnected}
        sheetsEmail={sheetsEmail}
        onSheetsAuthChanged={(connected, email) => {
          setSheetsConnected(connected);
          setSheetsEmail(email);
        }}
        onSaveSheetConfig={async (patch) => {
          await persistSettings({
            decorSettings: {
              ...decorSettings,
              ...patch,
            },
          });
        }}
      />

      <LegacyRecoveryModal
        isOpen={isLegacyRecoveryOpen}
        onClose={() => setIsLegacyRecoveryOpen(false)}
        currentSettings={rawSettings}
        existingOrders={orders}
        existingCustomers={customers}
        candidateProductIds={resolvedProducts.map((p) => p.id)}
      />
    </div>
  );
}
