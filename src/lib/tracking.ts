export type TrackingEventName =
  | 'page_view'
  | 'select_deal'
  | 'click_hold_price'
  | 'toggle_cart'
  | 'open_checkout'
  | 'click_zalo'
  | 'submit_hold_success';

export interface TrackingPayload {
  productId?: string;
  productName?: string;
  category?: string;
  price?: string;
  source?: string;
  orderId?: string;
  voucherCode?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

const FBQ_STANDARD_MAP: Record<TrackingEventName, string> = {
  page_view: 'PageView',
  select_deal: 'ViewContent',
  click_hold_price: 'AddToCart',
  toggle_cart: 'AddToCart',
  open_checkout: 'InitiateCheckout',
  click_zalo: 'Contact',
  submit_hold_success: 'Lead',
};

export function trackEvent(eventName: TrackingEventName, payload: TrackingPayload = {}): void {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(eventData);
    }
  } catch {
    // non-blocking
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  } catch {
    // non-blocking
  }

  try {
    if (typeof window.fbq === 'function') {
      const fbStandard = FBQ_STANDARD_MAP[eventName];
      if (fbStandard) {
        window.fbq('track', fbStandard, payload);
      }
      window.fbq('trackCustom', eventName, payload);
    }
  } catch {
    // non-blocking
  }
}
