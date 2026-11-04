/**
 * Every input of the Tap web demo (https://demo.tap.company/v2/sdk/checkout), plus the mapping that
 * turns them into the configuration passed to `startCheckout(configuration, callbacks)`.
 * The mapping mirrors what the web demo sends to the web SDK, so both behave the same.
 * Same model as the React Native example (and CheckoutSettings.swift / CheckoutSettings.kt in the native example apps).
 */

import { Keys } from './Keys';

export interface OrderItem {
  name: string;
  description: string;
  quantity: number;
  amount: number;
}

export interface CheckoutSettings {
  // SDK configuration
  publicKey: string;
  merchantId: string;
  /** Any of ALL, AUTO, KWD, BHD, SAR, AED, OMR, EGP, GBP, USD, EUR. */
  supportedCurrencies: string[];
  /** ALL, WEB, CARD or DEVICE. */
  paymentType: string;
  supportedPaymentMethods: string[];
  selectedCurrency: string;
  /** auto, en or ar. "auto" lets the checkout decide, so the key is not sent. */
  language: string;
  supportedRegions: string[];
  supportedCountries: string[];
  supportedPaymentTypes: string[];
  supportedSchemes: string[];
  isApplePayAvailableOnClient: boolean;

  // User configuration
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;

  // Card configuration
  showBrands: boolean;
  showLoadingState: boolean;
  collectHolderName: boolean;
  preLoadCardName: string;
  cardNameEditable: boolean;
  /** all, credit or debit. */
  cardFundingSource: string;
  /** all, merchant, tap or none. */
  saveCardOption: string;
  forceLtr: boolean;
  /** Not in the web demo: shows the native card scanner button (needs camera permission). */
  cardScanner: boolean;
  /** Android only, not in the web demo: shows the NFC card reader button. */
  cardNFC: boolean;

  // Order configuration
  orderId: string;
  /** "F" = fixed amount, "P" = percentage of the items total. */
  discountType: string;
  discountValue: number;
  items: OrderItem[];

  // Transaction configuration
  /** "charge" or "authorize". */
  mode: string;
  /** light, dark, light_mono, dark_colored or auto ("auto" = key not sent). */
  theme: string;
  /** popup or page. */
  checkoutMode: string;
  threeDSecure: boolean;
  saveCard: boolean;
  /** `transaction.<mode>.redirect.url`; the web demo returns to its own page. */
  redirectUrl: string;
  hashString: string;
  /** CAPTURE or VOID: what happens automatically to an authorization. Only editable in authorize mode. */
  authorizeType: string;
  /** Hours before `authorizeType` is applied. */
  authorizeTime: number;
  agreedPayment: boolean;
  /** SCHEDULED or UNSCHEDULED. */
  agreementType: string;
  /** FIXED or VARIABLE. */
  amountVariability: string;
  /** "Defined" (use `paymentCount`) or "Undefined" (txn_count 0). */
  numberOfPayments: string;
  paymentCount: number;
  subscriptionName: string;
  subscriptionDescription: string;
  billingAgreement: string;
  /** "", "yes" or "no". The web demo starts with the airline choice unset and then still sends
   * `airline` with an empty booking reference; only an explicit "no" removes it. */
  airline: string;
  bookingReference: string;
}

export type Configuration = Record<string, any>;

export const PLACEHOLDER_PUBLIC_KEY = 'YOUR_TAP_PUBLIC_KEY';

/** The page the web demo returns to after a redirect. The native SDKs ignore it, but the
 * checkout config still expects `transaction.<mode>.redirect.url`. */
export const REDIRECT_URL = 'https://demo.tap.company/v2/sdk/checkout';

export function defaultItem(): OrderItem {
  return {
    name: 'Item Title 1',
    description: 'item description 1',
    quantity: 1,
    amount: 0.1,
  };
}

/** Same values the web demo gives a new item. */
export function newItem(): OrderItem {
  return {
    name: 'order item name',
    description: 'order item description',
    quantity: 1,
    amount: 10,
  };
}

/** The web demo defaults (the ones documented in README.md). */
export function defaultSettings(): CheckoutSettings {
  return {
    publicKey: Keys.publicKey,
    merchantId: Keys.merchantId,
    supportedCurrencies: ['ALL'],
    paymentType: 'ALL',
    supportedPaymentMethods: ['ALL'],
    selectedCurrency: 'SAR',
    language: 'en',
    supportedRegions: [],
    supportedCountries: [],
    supportedPaymentTypes: [],
    supportedSchemes: [],
    isApplePayAvailableOnClient: true,

    customerId: '',
    firstName: 'Ahmed',
    lastName: 'Sharkawy',
    email: 'example@gmail.com',
    countryCode: '20',
    phoneNumber: '1099137773',

    showBrands: true,
    showLoadingState: false,
    collectHolderName: true,
    preLoadCardName: '',
    cardNameEditable: true,
    cardFundingSource: 'all',
    saveCardOption: 'all',
    forceLtr: false,
    cardScanner: false,
    cardNFC: false,

    orderId: '',
    discountType: 'F',
    discountValue: 0,
    items: [defaultItem()],

    mode: 'charge',
    theme: 'light',
    checkoutMode: 'popup',
    threeDSecure: true,
    saveCard: true,
    redirectUrl: REDIRECT_URL,
    hashString: '',
    authorizeType: 'VOID',
    authorizeTime: 100,
    agreedPayment: false,
    agreementType: 'SCHEDULED',
    amountVariability: 'FIXED',
    numberOfPayments: 'Undefined',
    paymentCount: 1,
    subscriptionName: 'Recurring',
    subscriptionDescription: 'A description of the recurring payment to display to the user in the payment sheet.',
    billingAgreement:
      'A localized billing agreement displayed to the user in the payment sheet prior to the payment authorization.',
    airline: '',
    bookingReference: '',
  };
}

// Persistence

/** Where the settings are kept: localStorage, so they survive app restarts (the WebView keeps it). */
export interface SettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): SettingsStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function defaultStorage(): SettingsStorage {
  try {
    const storage = window.localStorage;
    storage.getItem('probe');
    return storage;
  } catch {
    return memoryStorage();
  }
}

const STORAGE_KEY = 'CheckoutSettings.v1';
const appStorage = defaultStorage();

/** Loads the saved settings, or the web demo defaults when nothing valid is saved. */
export function loadSettings(storage: SettingsStorage = appStorage): CheckoutSettings {
  const saved = storage.getItem(STORAGE_KEY);
  if (!saved) return defaultSettings();
  try {
    const settings: CheckoutSettings = {
      ...defaultSettings(),
      ...JSON.parse(saved),
    };
    // A key saved while Keys.ts still held the placeholder follows Keys.ts once it is filled in.
    if (settings.publicKey === PLACEHOLDER_PUBLIC_KEY) {
      settings.publicKey = Keys.publicKey;
    }
    return settings;
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: CheckoutSettings, storage: SettingsStorage = appStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function resetSettings(storage: SettingsStorage = appStorage): void {
  storage.removeItem(STORAGE_KEY);
}

// Derived values

export function hasPublicKey(settings: CheckoutSettings): boolean {
  const key = settings.publicKey.trim();
  return key.length > 0 && key !== PLACEHOLDER_PUBLIC_KEY;
}

/** Sum of `amount * quantity` over all items. */
export function itemsTotal(settings: CheckoutSettings): number {
  return settings.items.reduce((total, item) => total + item.amount * item.quantity, 0);
}

/** Amount charged: items total minus the discount, or 1 when that is zero or negative (as the web demo does). */
export function totalAmount(settings: CheckoutSettings): number {
  const items = itemsTotal(settings);
  const discount = settings.discountType === 'P' ? items * (settings.discountValue / 100) : settings.discountValue;
  const total = items - discount;
  return total <= 0 ? 1 : total;
}

/** 0.1 + 0.2 is 0.30000000000000004 in JavaScript. Rounding to 3 decimals (the most any currency
 * uses) sends 0.3, like the web demo. */
export function jsonNumber(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/** 0.1 -> "0.1", 10 -> "10". */
export function formatAmount(value: number): string {
  return String(jsonNumber(value));
}

// Configuration

/** Builds the configuration for `startCheckout`, following the web demo's mapping. */
export function makeConfiguration(settings: CheckoutSettings, now: Date = new Date()): Configuration {
  const total = jsonNumber(totalAmount(settings));
  const config: Configuration = {
    open: true,
    hashString: settings.hashString,
    checkoutMode: settings.checkoutMode,
    paymentType: settings.paymentType,
    supportedPaymentMethods: settings.supportedPaymentMethods.includes('ALL')
      ? 'ALL'
      : settings.supportedPaymentMethods,
    selectedCurrency: settings.selectedCurrency,
    supportedCurrencies: collapsedCurrencies(settings.supportedCurrencies),
    gateway: gateway(settings),
    customer: customer(settings),
    transaction: {
      mode: settings.mode,
      [settings.mode]: transaction(settings, now),
    },
    amount: total,
    order: order(settings, total),
    cardOptions: cardOptions(settings),
    isApplePayAvailableOnClient: settings.isApplePayAvailableOnClient,
  };

  // "auto" means "let the checkout decide": the key is not sent at all.
  if (settings.language !== 'auto') config.language = settings.language;
  if (settings.theme !== 'auto') config.themeMode = settings.theme;

  // Empty filters are not sent.
  if (settings.supportedRegions.length > 0) {
    config.supportedRegions = settings.supportedRegions;
  }
  if (settings.supportedCountries.length > 0) {
    config.supportedCountries = settings.supportedCountries;
  }
  if (settings.supportedPaymentTypes.length > 0) {
    config.supportedPaymentTypes = settings.supportedPaymentTypes;
  }
  if (settings.supportedSchemes.length > 0) {
    config.supportedSchemes = settings.supportedSchemes;
  }
  return config;
}

/** ALL wins over AUTO, which wins over an explicit list. */
function collapsedCurrencies(currencies: string[]): string | string[] {
  if (currencies.includes('ALL')) return 'ALL';
  if (currencies.includes('AUTO')) return 'AUTO';
  return currencies;
}

function gateway(settings: CheckoutSettings): Configuration {
  const result: Configuration = { publicKey: settings.publicKey };
  if (settings.merchantId) result.merchantId = settings.merchantId;
  return result;
}

function customer(settings: CheckoutSettings): Configuration {
  const result: Configuration = {
    firstName: settings.firstName,
    lastName: settings.lastName,
    email: settings.email,
    phone: { countryCode: settings.countryCode, number: settings.phoneNumber },
  };
  if (settings.customerId) result.id = settings.customerId;
  return result;
}

function cardOptions(settings: CheckoutSettings): Configuration {
  const result: Configuration = {
    showBrands: settings.showBrands,
    showLoadingState: settings.showLoadingState,
    collectHolderName: settings.collectHolderName,
    preLoadCardName: settings.preLoadCardName,
    cardNameEditable: settings.cardNameEditable,
    cardFundingSource: settings.cardFundingSource,
    saveCardOption: settings.saveCardOption,
    forceLtr: settings.forceLtr,
  };
  // Sent only when switched on, like the native example apps.
  const inputs: Configuration = {};
  if (settings.cardScanner) inputs.cardScanner = true;
  if (settings.cardNFC) inputs.cardNFC = true;
  if (Object.keys(inputs).length > 0) result.alternativeCardInputs = inputs;
  return result;
}

function order(settings: CheckoutSettings, total: number): Configuration {
  const result: Configuration = {
    id: settings.orderId,
    currency: settings.selectedCurrency,
    amount: total,
    items: settings.items.map((item) => ({
      amount: jsonNumber(item.amount),
      currency: settings.selectedCurrency,
      name: item.name,
      quantity: item.quantity,
      description: item.description,
    })),
  };
  if (settings.discountValue > 0) {
    result.discount = {
      type: settings.discountType,
      value: jsonNumber(settings.discountValue),
    };
  }
  return result;
}

/** The `transaction.<mode>` object. Charge and authorize send the very same keys; only the
 * name of this object (and `transaction.mode`) differs. */
function transaction(settings: CheckoutSettings, now: Date): Configuration {
  const result: Configuration = {
    saveCard: settings.saveCard,
    // Sent in both modes. `type` and `time` only matter (and are only editable) for authorizations.
    auto: { type: settings.authorizeType, time: settings.authorizeTime },
    redirect: { url: settings.redirectUrl },
    threeDSecure: settings.threeDSecure,
  };

  if (settings.agreedPayment) {
    result.agreement =
      settings.agreementType === 'UNSCHEDULED'
        ? { type: 'UNSCHEDULED' }
        : {
            type: settings.agreementType,
            amount_variability: settings.amountVariability,
          };
    result.applePayRecurringPaymentRequest = applePayRecurringPaymentRequest(settings, now);
  }

  // Like the web demo, `subscription` does not depend on "Agreed payment": it is sent
  // whenever the agreement type is not UNSCHEDULED (which is the default).
  if (settings.agreementType !== 'UNSCHEDULED') {
    result.subscription = {
      type: settings.agreementType,
      amount_variability: settings.amountVariability,
      txn_count: settings.numberOfPayments === 'Defined' ? settings.paymentCount : 0,
    };
  }

  // Also like the web demo: sent unless the airline choice is explicitly "no".
  if (settings.airline !== 'no') {
    result.airline = { reference: { booking: settings.bookingReference } };
  }
  return result;
}

function applePayRecurringPaymentRequest(settings: CheckoutSettings, now: Date): Configuration {
  return {
    paymentDescription: settings.subscriptionDescription,
    regularBilling: {
      label: settings.subscriptionName,
      paymentTiming: 'recurring',
      recurringPaymentStartDate: now.toISOString(),
    },
    billingAgreement: settings.billingAgreement,
    // The web demo uses the page origin for both URLs.
    managementURL: 'https://demo.tap.company',
    tokenNotificationURL: 'https://demo.tap.company',
  };
}
