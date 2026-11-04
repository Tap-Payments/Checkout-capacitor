import { WebPlugin } from '@capacitor/core';

import type { CheckoutCapacitorPlugin } from './definitions';

export class CheckoutCapacitorWeb extends WebPlugin implements CheckoutCapacitorPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
