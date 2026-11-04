import type { PluginListenerHandle } from '@capacitor/core';

/**
 * The checkout configuration: the same object the Tap web SDK and the React Native wrapper take
 * (`gateway`, `customer`, `transaction`, `order`, `cardOptions`, ...).
 * See https://developers.tap.company for every key.
 */
export type CheckoutConfiguration = Record<string, any>;

export interface CheckoutCallbacks {
  /** The payment finished. `data` is the charge (or authorization) as a JSON string. */
  onSuccess: (data: string) => void;
  /** The checkout failed, or could not start (e.g. no public key). `data` describes the error. */
  onError: (error: string) => void;
  /** The customer closed the checkout. */
  onClose: () => void;
  /** The checkout finished loading and is shown. */
  onReady: () => void;
  /** Fires every time the checkout creates a charge, e.g. again after the customer comes back
   * from KNET or another redirect and pays again. */
  onChargeCreated?: (data: string) => void;
}

/** Payload of the `onSuccess`, `onError` and `onChargeCreated` events. */
export interface CheckoutDataEvent {
  data: string;
}

export interface StartCheckoutOptions {
  configurations: CheckoutConfiguration;
}

/**
 * The native plugin. Most apps call {@link startCheckout} instead, which wires the callbacks to
 * these events for you.
 */
export interface CheckoutCapacitorPlugin {
  /**
   * Opens the checkout. Resolves once it is being presented; the outcome arrives as events.
   * Rejects when it cannot start (no activity / view controller, missing public key).
   */
  startCheckout(options: StartCheckoutOptions): Promise<void>;

  addListener(eventName: 'onSuccess', listenerFunc: (event: CheckoutDataEvent) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'onError', listenerFunc: (event: CheckoutDataEvent) => void): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'onChargeCreated',
    listenerFunc: (event: CheckoutDataEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(eventName: 'onClose', listenerFunc: () => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'onReady', listenerFunc: () => void): Promise<PluginListenerHandle>;

  /** Removes every listener of this plugin. */
  removeAllListeners(): Promise<void>;
}
