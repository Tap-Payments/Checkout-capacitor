import { registerPlugin } from '@capacitor/core';

import type { CheckoutCapacitorPlugin } from './definitions';

const CheckoutCapacitor = registerPlugin<CheckoutCapacitorPlugin>('CheckoutCapacitor', {
  web: () => import('./web').then((m) => new m.CheckoutCapacitorWeb()),
});

export * from './definitions';
export { CheckoutCapacitor };
