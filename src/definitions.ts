export interface CheckoutCapacitorPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
