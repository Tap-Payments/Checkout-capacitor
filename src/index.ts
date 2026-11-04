import type { PluginListenerHandle } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

import type { CheckoutCallbacks, CheckoutCapacitorPlugin, CheckoutConfiguration } from './definitions';

const CheckoutCapacitor = registerPlugin<CheckoutCapacitorPlugin>('CheckoutCapacitor', {
  web: () => import('./web').then((m) => new m.CheckoutCapacitorWeb()),
});

/** The listeners of the latest checkout. */
let subscriptions: PluginListenerHandle[] = [];

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}

/**
 * Opens the Tap checkout, the same call as `startCheckout` in checkout-react-native.
 *
 * Every outcome arrives in `callbacks`, including a checkout that cannot start (`onError`), so the
 * returned promise only tells you the call went through; it never rejects.
 */
export async function startCheckout(
  configurations: CheckoutConfiguration,
  callbacks: CheckoutCallbacks,
): Promise<void> {
  // Only one checkout is shown at a time, so a new one replaces the previous listeners. They are
  // kept after onClose: on Android, going back from KNET reports onClose and then shows the sheet
  // again, where the customer can pay and create another charge.
  const previous = subscriptions;
  subscriptions = [];
  await Promise.all(previous.map((subscription) => subscription.remove()));

  const added = await Promise.all([
    CheckoutCapacitor.addListener('onSuccess', ({ data }) => callbacks.onSuccess(data)),
    CheckoutCapacitor.addListener('onError', ({ data }) => callbacks.onError(data)),
    CheckoutCapacitor.addListener('onClose', () => callbacks.onClose()),
    CheckoutCapacitor.addListener('onReady', () => callbacks.onReady()),
    ...(callbacks.onChargeCreated
      ? [CheckoutCapacitor.addListener('onChargeCreated', ({ data }) => callbacks.onChargeCreated?.(data))]
      : []),
  ]);
  subscriptions = added;

  try {
    await CheckoutCapacitor.startCheckout({ configurations });
  } catch (error) {
    callbacks.onError(errorMessage(error));
  }
}

export * from './definitions';
export { CheckoutCapacitor };
