/** The values each choice in Settings offers. Same lists as the React Native example. */

import { COUNTRY_CODES } from './countries';

/** `value` goes into the configuration, `title` is shown to the user. */
export interface Option {
  value: string;
  title: string;
}

const option = (value: string, title?: string): Option => ({ value, title: title ?? value });
const options = (values: string[]) => values.map((value) => option(value));

const CURRENCIES = ['KWD', 'BHD', 'SAR', 'AED', 'OMR', 'EGP', 'GBP', 'USD', 'EUR'];

const countryName = (() => {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    return (code: string) => names.of(code);
  } catch {
    return () => undefined;
  }
})();

export const Options = {
  currencies: options(CURRENCIES),
  supportedCurrencies: options(['ALL', 'AUTO', ...CURRENCIES]),
  paymentTypes: options(['ALL', 'WEB', 'CARD', 'DEVICE']),
  paymentMethods: options([
    'ALL',
    'AMERICAN_EXPRESS',
    'APPLE_PAY',
    'BENEFIT',
    'BENEFITPAY',
    'CAREEMPAY',
    'FAWRY',
    'GOOGLE_PAY',
    'KNET',
    'MADA',
    'MASTERCARD',
    'MEEZA',
    'OMANNET',
    'PAYPAL',
    'POST_PAY',
    'NAPS',
    'STC_PAY',
    'TABBY',
    'VISA',
  ]),
  languages: options(['auto', 'en', 'ar']),
  regions: options(['LOCAL', 'REGIONAL', 'GLOBAL']),
  supportedPaymentTypes: options([
    'CARD',
    'DEVICE_WALLET',
    'EXPRESS_CHECKOUT_WALLET',
    'PASS_THRU_WALLET',
    'STORED_VALUE_WALLET',
    'CASH_WALLET',
    'BNPL',
  ]),
  schemes: options(['BENEFIT', 'VISA', 'AMEX', 'MASTERCARD', 'MADA', 'MEEZA', 'OMANNET']),
  /** ISO 3166-1 alpha-2 codes, titled with the country name. */
  countries: [...COUNTRY_CODES].sort().map((code) => {
    const name = countryName(code);
    return option(code, name ? `${code} - ${name}` : code);
  }),
  fundingSources: options(['all', 'credit', 'debit']),
  saveCardOptions: options(['all', 'merchant', 'tap', 'none']),
  discountTypes: [option('F', 'Fixed amount'), option('P', 'Percentage')],
  modes: [option('charge', 'Charge'), option('authorize', 'Authorize')],
  themes: options(['light', 'dark', 'light_mono', 'dark_colored', 'auto']),
  checkoutModes: options(['popup', 'page']),
  authorizeTypes: options(['CAPTURE', 'VOID']),
  agreementTypes: options(['SCHEDULED', 'UNSCHEDULED']),
  amountVariabilities: options(['FIXED', 'VARIABLE']),
  numbersOfPayments: options(['Defined', 'Undefined']),
  airline: [option('', 'Not set (sent empty)'), option('yes', 'Yes'), option('no', 'No')],
};
