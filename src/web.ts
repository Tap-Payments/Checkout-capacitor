import { WebPlugin } from '@capacitor/core';

import type { CheckoutCapacitorPlugin } from './definitions';

/** The checkout is native only: on the web, use the Tap web SDK directly. */
export class CheckoutCapacitorWeb extends WebPlugin implements CheckoutCapacitorPlugin {
  async startCheckout(): Promise<void> {
    throw this.unavailable(
      'CheckoutCapacitor is only available on iOS and Android. On the web, use the Tap web SDK: https://developers.tap.company',
    );
  }
}
