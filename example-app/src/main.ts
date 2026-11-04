/**
 * The checkout-capacitor example app: the main screen, Settings, the option picker and the
 * configuration JSON viewer. Same screens as the React Native and native example apps, in plain
 * TypeScript (no framework), so the integration is easy to read: see `start()`.
 */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { startCheckout } from 'checkout-capacitor';

import {
  defaultSettings,
  formatAmount,
  hasPublicKey,
  loadSettings,
  makeConfiguration,
  newItem,
  saveSettings,
  totalAmount,
  type CheckoutSettings,
  type Configuration,
} from './CheckoutSettings';
import { LocalKeys } from './LocalKeys';
import { Options, type Option } from './Options';

// MARK: State

interface Callback {
  id: number;
  name: string;
  time: string;
  payload?: string;
}

interface PickerRequest {
  title: string;
  options: Option[];
  selection: string[];
  allowsMultiple: boolean;
  onChange: (selection: string[]) => void;
}

type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'picker'; request: PickerRequest }
  | { name: 'json'; configuration: Configuration };

const state = {
  settings: loadSettings(),
  callbacks: [] as Callback[],
  loading: false,
  stack: [{ name: 'home' }] as Route[],
  nextId: 0,
};

const app = document.getElementById('app')!;
const route = () => state.stack[state.stack.length - 1];

function update(change: Partial<CheckoutSettings>, rerender = true) {
  state.settings = { ...state.settings, ...change };
  saveSettings(state.settings);
  if (rerender) render();
}

function push(next: Route) {
  state.stack.push(next);
  render(true);
}

function pop() {
  if (state.stack.length > 1) state.stack.pop();
  render(true);
}

// MARK: Checkout

/** The whole integration: build the configuration, start the checkout and log every callback. */
function start() {
  if (!hasPublicKey(state.settings)) {
    alert(
      'Public key missing\n\nSet your Tap sandbox public key in example-app/src/Keys.ts (Keys.publicKey), or enter it in Settings > SDK Configuration > Public Key.',
    );
    return;
  }
  if (!Capacitor.isNativePlatform()) {
    alert('The checkout runs on iOS and Android only. Run the app with `npm run ios` or `npm run android`.');
    return;
  }
  // The button shows a spinner until the checkout sheet is ready (or fails).
  setLoading(true);
  startCheckout(makeConfiguration(state.settings), {
    onReady: () => {
      setLoading(false);
      addCallback('onReady');
    },
    onChargeCreated: (data) => addCallback('onChargeCreated', data),
    onSuccess: (data) => {
      setLoading(false);
      addCallback('onSuccess', data);
    },
    onError: (error) => {
      setLoading(false);
      addCallback('onError', error);
    },
    onClose: () => {
      setLoading(false);
      addCallback('onClose');
    },
  });
}

function setLoading(loading: boolean) {
  state.loading = loading;
  if (route().name === 'home') render();
}

function addCallback(name: string, payload?: string) {
  state.callbacks.unshift({
    id: state.nextId++,
    name,
    time: new Date().toTimeString().slice(0, 8),
    payload,
  });
  if (route().name === 'home') render();
}

// MARK: Rendering helpers

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Handlers of the rendered screen, looked up by `data-action`. */
let actions: Record<string, (element: HTMLElement, event: Event) => void> = {};
let nextAction = 0;
function action(handler: (element: HTMLElement, event: Event) => void): string {
  const id = `a${nextAction++}`;
  actions[id] = handler;
  return id;
}

function navBar(title: string, options: { back?: boolean; trailing?: string } = {}) {
  return `
    <header class="nav">
      ${options.back ? `<button class="nav-back" data-click="${action(pop)}">‹ Back</button>` : '<span></span>'}
      <h1>${esc(title)}</h1>
      ${options.trailing ?? '<span></span>'}
    </header>`;
}

// MARK: Home

function homeScreen(): string {
  const settings = state.settings;
  const key = settings.publicKey.trim();
  const chip = !hasPublicKey(settings)
    ? { text: 'No public key', className: 'chip-missing' }
    : key.startsWith('pk_live_')
      ? { text: 'Live key', className: 'chip-live' }
      : { text: 'Sandbox key', className: 'chip-sandbox' };
  const count = settings.items.length;
  const customer = `${settings.firstName} ${settings.lastName}`.trim();
  const openSettings = action(() => push({ name: 'settings' }));

  const callbacks =
    state.callbacks.length === 0
      ? `<div class="card empty">Callbacks will appear here.<br />Tap a callback to see its full payload.</div>`
      : state.callbacks
          .map(
            (callback) => `
        <details class="card callback" style="--event: var(--event-${callback.name})">
          <summary>
            <span class="dot"></span>
            <span class="callback-name">${esc(callback.name)}</span>
            <span class="callback-time">${esc(callback.time)}</span>
            <span class="callback-summary">${esc(summary(callback))}</span>
          </summary>
          ${callback.payload === undefined ? '' : `<pre class="code">${esc(prettyJSON(callback.payload))}</pre>`}
        </details>`,
          )
          .join('');

  return `
    ${navBar('Tap Checkout', { trailing: `<button class="nav-action" data-click="${openSettings}">SETTINGS</button>` })}
    <main class="content">
      <section class="hero">
        <div class="hero-top">
          <span class="hero-mode">${settings.mode === 'authorize' ? `AUTHORIZE · ${esc(settings.authorizeType)}` : 'CHARGE'}</span>
          <span class="chip ${chip.className}">${chip.text}</span>
        </div>
        <div class="hero-amount">${esc(formatAmount(totalAmount(settings)))} ${esc(settings.selectedCurrency)}</div>
        <div class="hero-detail">${count} item${count === 1 ? '' : 's'} · ${esc(customer)}</div>
      </section>

      <h2 class="section-header">Configuration</h2>
      <div class="card rows">
        ${configurationRows(settings)
          .map(
            ([label, value]) =>
              `<div class="row"><span>${esc(label)}</span><span class="value">${esc(value)}</span></div>`,
          )
          .join('')}
        <div class="row links">
          <button class="link" data-click="${openSettings}">Edit settings</button>
          <button class="link" data-click="${action(() => push({ name: 'json', configuration: makeConfiguration(state.settings) }))}">View JSON</button>
        </div>
      </div>

      <h2 class="section-header with-trailing">
        <span>${state.callbacks.length === 0 ? 'Callbacks' : `Callbacks (${state.callbacks.length})`}</span>
        ${
          state.callbacks.length > 0
            ? `<button class="link" data-click="${action(() => {
                state.callbacks = [];
                render();
              })}">Clear</button>`
            : ''
        }
      </h2>
      <div class="callbacks">${callbacks}</div>
    </main>
    <footer class="button-bar">
      <button class="primary" ${state.loading ? 'disabled' : ''} data-click="${action(start)}">
        ${state.loading ? '<span class="spinner"></span> Opening checkout…' : 'Start Checkout'}
      </button>
    </footer>`;
}

function configurationRows(settings: CheckoutSettings): [string, string][] {
  const list = (values: string[]) => (values.length === 0 ? 'All' : values.join(', '));
  return [
    ['Payment type', settings.paymentType],
    ['Payment methods', list(settings.supportedPaymentMethods)],
    ['Currencies', list(settings.supportedCurrencies)],
    ['Language', settings.language],
    ['Theme', settings.theme],
    ['Checkout mode', settings.checkoutMode],
    ['3D Secure', settings.threeDSecure ? 'On' : 'Off'],
    ['Save card', settings.saveCardOption],
    ['Card funding', settings.cardFundingSource],
    ['Customer', `${settings.email} · +${settings.countryCode} ${settings.phoneNumber}`],
  ];
}

/** One line that says what happened, read from the payload where there is one. */
function summary(callback: Callback): string {
  let json: Record<string, unknown> | undefined;
  try {
    const parsed = callback.payload ? JSON.parse(callback.payload) : undefined;
    if (parsed && typeof parsed === 'object') json = parsed;
  } catch {
    json = undefined;
  }
  const text = (key: string) => {
    const value = json?.[key];
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
  };
  const present = (values: (string | undefined)[]) => values.filter((value): value is string => value !== undefined);

  let line: string | undefined;
  switch (callback.name) {
    case 'onReady':
      line = 'Checkout is ready';
      break;
    case 'onClose':
      line = 'Checkout was closed';
      break;
    case 'onChargeCreated': {
      const amount = present([text('amount'), text('currency')]).join(' ');
      line = present([text('id'), text('status'), amount || undefined]).join(' · ');
      break;
    }
    case 'onSuccess': {
      const chargeId = text('chargeId');
      line = chargeId ? `Completed · ${chargeId}` : undefined;
      break;
    }
    case 'onError': {
      const message = text('message');
      const code = text('code');
      line = message ? (code ? `${message} (${code})` : message) : undefined;
      break;
    }
  }
  return line || (callback.payload ?? '').slice(0, 120);
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function prettyJSON(payload: string): string {
  try {
    return JSON.stringify(sortKeys(JSON.parse(payload)), null, 2);
  } catch {
    return payload;
  }
}

// MARK: Settings

type KeysOf<T> = {
  [K in keyof CheckoutSettings]: CheckoutSettings[K] extends T ? K : never;
}[keyof CheckoutSettings];

interface Section {
  title: string;
  footer?: string;
  rows: string[];
}

function settingsScreen(): string {
  const settings = state.settings;

  const text = (title: string, key: KeysOf<string>, type = 'text') =>
    `<label class="row field"><span>${esc(title)}</span><input type="${type}" value="${esc(settings[key])}" autocapitalize="off" autocorrect="off" spellcheck="false" data-input="${action(
      (element) => update({ [key]: (element as HTMLInputElement).value }, false),
    )}" /></label>`;

  const number = (title: string, get: () => number, set: (value: number) => void, integer = false) =>
    `<label class="row field"><span>${esc(title)}</span><input type="number" inputmode="${integer ? 'numeric' : 'decimal'}" step="${integer ? '1' : 'any'}" value="${esc(get())}" data-input="${action(
      (element) => {
        const value = Number((element as HTMLInputElement).value);
        if (Number.isFinite(value)) set(integer ? Math.trunc(value) : value);
        refreshTotal();
      },
    )}" /></label>`;

  const toggle = (title: string, key: KeysOf<boolean>) =>
    `<label class="row field"><span>${esc(title)}</span><input type="checkbox" class="switch" ${settings[key] ? 'checked' : ''} data-change="${action(
      (element) => update({ [key]: (element as HTMLInputElement).checked }),
    )}" /></label>`;

  // The value is shown as text; an invisible native <select> over the row opens the system picker.
  const choice = (title: string, key: KeysOf<string>, options: Option[]) =>
    `<label class="row field choice"><span>${esc(title)}</span><span class="value">${esc(
      options.find((o) => o.value === settings[key])?.title ?? settings[key],
    )} ›</span><select data-change="${action((element) =>
      update({ [key]: (element as HTMLSelectElement).value }),
    )}">${options
      .map(
        (o) =>
          `<option value="${esc(o.value)}" ${o.value === settings[key] ? 'selected' : ''}>${esc(o.title)}</option>`,
      )
      .join('')}</select></label>`;

  const disclosure = (title: string, detail: string, onPress: () => void) =>
    `<button class="row disclosure" data-click="${action(onPress)}"><span>${esc(title)}</span><span class="value">${esc(detail)} ›</span></button>`;

  const multiChoice = (title: string, key: KeysOf<string[]>, options: Option[]) =>
    disclosure(title, settings[key].length === 0 ? 'None' : settings[key].join(', '), () =>
      push({
        name: 'picker',
        request: {
          title,
          options,
          selection: settings[key],
          allowsMultiple: true,
          onChange: (selection) => update({ [key]: selection }, false),
        },
      }),
    );

  const button = (title: string, onPress: () => void, destructive = false) =>
    `<button class="row button ${destructive ? 'destructive' : ''}" data-click="${action(onPress)}">${esc(title)}</button>`;

  // Saved Keys appears only when keys.local.json has keys.
  const currentKey = LocalKeys.all.find(
    (key) => key.publicKey === settings.publicKey && (key.merchantId ?? '') === settings.merchantId,
  );
  const savedKeys =
    LocalKeys.all.length === 0
      ? []
      : [
          disclosure('Saved Keys', currentKey?.name ?? 'Custom', () => {
            const current = currentKey ? LocalKeys.all.indexOf(currentKey) : -1;
            push({
              name: 'picker',
              request: {
                title: 'Saved Keys',
                options: LocalKeys.all.map((key, index) => ({ value: String(index), title: key.name })),
                selection: current >= 0 ? [String(current)] : [],
                allowsMultiple: false,
                onChange: ([index]) => {
                  const key = LocalKeys.all[Number(index)];
                  if (key) update({ publicKey: key.publicKey, merchantId: key.merchantId ?? '' }, false);
                },
              },
            });
          }),
        ];

  const sdkSection: Section = {
    title: 'SDK Configuration',
    footer:
      'Defaults to the key in Keys.ts. Under each public key there can be several merchant ids; use the one that belongs to it.',
    rows: [
      ...savedKeys,
      text('Public Key', 'publicKey'),
      text('Merchant Id', 'merchantId'),
      multiChoice('Supported Currencies', 'supportedCurrencies', Options.supportedCurrencies),
      choice('Payment Type', 'paymentType', Options.paymentTypes),
      multiChoice('Supported Payment Methods', 'supportedPaymentMethods', Options.paymentMethods),
      choice('Selected Currency', 'selectedCurrency', Options.currencies),
      choice('Language', 'language', Options.languages),
      multiChoice('Supported Regions', 'supportedRegions', Options.regions),
      multiChoice('Supported Countries', 'supportedCountries', Options.countries),
      multiChoice('Supported Payment Types', 'supportedPaymentTypes', Options.supportedPaymentTypes),
      multiChoice('Supported Schemes', 'supportedSchemes', Options.schemes),
      toggle('Apple Pay Available On Client', 'isApplePayAvailableOnClient'),
    ],
  };

  const userSection: Section = {
    title: 'User Configuration',
    rows: [
      text('Customer ID', 'customerId'),
      text('First Name', 'firstName'),
      text('Last Name', 'lastName'),
      text('Customer E-mail', 'email', 'email'),
      text('Customer Country Code', 'countryCode', 'tel'),
      text('Customer phone number', 'phoneNumber', 'tel'),
    ],
  };

  const cardSection: Section = {
    title: 'Card Configuration',
    rows: [
      toggle('Show Brands', 'showBrands'),
      toggle('Show Loading State', 'showLoadingState'),
      toggle('Collect Card Holder Name', 'collectHolderName'),
      text('PreLoad CardName', 'preLoadCardName'),
      toggle('CardName Editable', 'cardNameEditable'),
      choice('Card Funding Source', 'cardFundingSource', Options.fundingSources),
      choice('Save Card Options', 'saveCardOption', Options.saveCardOptions),
      toggle('Force LTR', 'forceLtr'),
      toggle('Card Scanner', 'cardScanner'),
      ...(Capacitor.getPlatform() === 'ios' ? [] : [toggle('Card NFC (Android only)', 'cardNFC')]),
    ],
  };

  const updateItem = (index: number, change: Partial<CheckoutSettings['items'][number]>, rerender = false) =>
    update({ items: state.settings.items.map((item, i) => (i === index ? { ...item, ...change } : item)) }, rerender);
  const orderRows = [
    text('Order ID', 'orderId'),
    choice('Order discount type', 'discountType', Options.discountTypes),
    number(
      'Order discount value',
      () => settings.discountValue,
      (value) => update({ discountValue: value }, false),
    ),
  ];
  settings.items.forEach((item, index) => {
    const n = index + 1;
    orderRows.push(
      `<label class="row field"><span>Order ${n} Name</span><input value="${esc(item.name)}" data-input="${action(
        (el) => updateItem(index, { name: (el as HTMLInputElement).value }),
      )}" /></label>`,
      `<label class="row field"><span>Order ${n} Description</span><input value="${esc(item.description)}" data-input="${action(
        (el) => updateItem(index, { description: (el as HTMLInputElement).value }),
      )}" /></label>`,
      number(
        `Order ${n} Quantity`,
        () => item.quantity,
        (value) => updateItem(index, { quantity: value }),
        true,
      ),
      number(
        `Order ${n} Amount`,
        () => item.amount,
        (value) => updateItem(index, { amount: value }),
      ),
    );
    // The web demo needs at least one item.
    if (settings.items.length > 1) {
      orderRows.push(
        button(`Remove item ${n}`, () => update({ items: state.settings.items.filter((_, i) => i !== index) }), true),
      );
    }
  });
  orderRows.push(
    button('Add New Item', () => update({ items: [...state.settings.items, newItem()] })),
    `<div class="row"><span>Total to pay</span><span class="value" id="total">${esc(totalText())}</span></div>`,
  );
  const orderSection: Section = {
    title: 'Order Configuration',
    footer: 'Total = items minus the discount (1 if the result is 0 or less).',
    rows: orderRows,
  };

  const transactionRows = [choice('Transaction Mode', 'mode', Options.modes)];
  if (settings.mode === 'authorize') {
    transactionRows.push(
      choice('Authorize Type', 'authorizeType', Options.authorizeTypes),
      number(
        'Authorize Time (hours)',
        () => settings.authorizeTime,
        (value) => update({ authorizeTime: value }, false),
        true,
      ),
    );
  }
  transactionRows.push(
    choice('Theme', 'theme', Options.themes),
    choice('Checkout Mode', 'checkoutMode', Options.checkoutModes),
    toggle('3D Secure', 'threeDSecure'),
    toggle('Save Card', 'saveCard'),
    text('Redirect URL', 'redirectUrl', 'url'),
    text('Hashstring', 'hashString'),
    toggle('Agreed payment', 'agreedPayment'),
  );
  if (settings.agreedPayment) {
    transactionRows.push(choice('Agreement Type', 'agreementType', Options.agreementTypes));
    if (settings.agreementType === 'SCHEDULED') {
      transactionRows.push(
        choice('Amount Variability', 'amountVariability', Options.amountVariabilities),
        choice('Number of payments', 'numberOfPayments', Options.numbersOfPayments),
      );
      if (settings.numberOfPayments === 'Defined') {
        transactionRows.push(
          number(
            'Count',
            () => settings.paymentCount,
            (value) => update({ paymentCount: value }, false),
            true,
          ),
        );
      }
    }
    transactionRows.push(
      text('Subscription Name', 'subscriptionName'),
      text('Subscription Description', 'subscriptionDescription'),
      text('Billing Agreement', 'billingAgreement'),
    );
  }
  transactionRows.push(choice('Airline', 'airline', Options.airline));
  if (settings.airline === 'yes') transactionRows.push(text('Booking Reference Number', 'bookingReference'));

  const sections: Section[] = [
    sdkSection,
    userSection,
    cardSection,
    orderSection,
    { title: 'Transaction Configuration', rows: transactionRows },
    {
      title: 'Tools',
      rows: [
        disclosure('Show configuration JSON', '', () =>
          push({ name: 'json', configuration: makeConfiguration(state.settings) }),
        ),
        button(
          'Reset to defaults',
          () => {
            if (confirm('Reset to defaults?\n\nAll settings go back to the web demo defaults.')) {
              update(defaultSettings());
            }
          },
          true,
        ),
      ],
    },
  ];

  return `
    ${navBar('Settings', { back: true })}
    <main class="content">
      ${sections
        .map(
          (section) => `
        <h2 class="section-header">${esc(section.title)}</h2>
        <div class="card rows">${section.rows.join('')}</div>
        ${section.footer ? `<p class="section-footer">${esc(section.footer)}</p>` : ''}`,
        )
        .join('')}
    </main>`;
}

function totalText() {
  return `${formatAmount(totalAmount(state.settings))} ${state.settings.selectedCurrency}`;
}

function refreshTotal() {
  const total = document.getElementById('total');
  if (total) total.textContent = totalText();
}

// MARK: Option picker

function pickerScreen(request: PickerRequest): string {
  return `
    ${navBar(request.title, { back: true })}
    <main class="content">
      <div class="card rows">
        ${request.options
          .map((o) => {
            const selected = request.selection.includes(o.value);
            return `<button class="row disclosure" data-click="${action(() => {
              if (request.allowsMultiple) {
                request.selection = selected
                  ? request.selection.filter((value) => value !== o.value)
                  : [...request.selection, o.value];
                request.onChange(request.selection);
                render();
              } else {
                request.onChange([o.value]);
                pop();
              }
            })}"><span>${esc(o.title)}</span><span class="check">${selected ? '✓' : ''}</span></button>`;
          })
          .join('')}
      </div>
    </main>`;
}

// MARK: JSON viewer

function jsonScreen(configuration: Configuration): string {
  const json = JSON.stringify(configuration, null, 2);
  return `
    ${navBar('Configuration JSON', {
      back: true,
      trailing: `<button class="nav-action" data-click="${action(() => navigator.clipboard?.writeText(json))}">COPY</button>`,
    })}
    <main class="content"><pre class="code card">${esc(json)}</pre></main>`;
}

// MARK: Render loop

const scrollPositions = new Map<number, number>();

function render(navigated = false) {
  // Close the keyboard of a field that is about to be replaced.
  if (navigated) (document.activeElement as HTMLElement | null)?.blur();
  const depth = state.stack.length;
  const scroller = document.scrollingElement ?? document.documentElement;
  const scrollTop = scroller.scrollTop;
  // Keep which callback cards are expanded across re-renders.
  const open = new Set(Array.from(app.querySelectorAll<HTMLDetailsElement>('details[open]')).map((d) => d.dataset.id));

  actions = {};
  nextAction = 0;
  const current = route();
  switch (current.name) {
    case 'settings':
      app.innerHTML = settingsScreen();
      break;
    case 'picker':
      app.innerHTML = pickerScreen(current.request);
      break;
    case 'json':
      app.innerHTML = jsonScreen(current.configuration);
      break;
    default:
      app.innerHTML = homeScreen();
      app.querySelectorAll<HTMLDetailsElement>('details.callback').forEach((details, index) => {
        const id = String(state.callbacks[index]?.id);
        details.dataset.id = id;
        if (open.has(id)) details.open = true;
      });
  }

  if (navigated) {
    scroller.scrollTop = scrollPositions.get(depth) ?? 0;
  } else {
    scroller.scrollTop = scrollTop;
  }
  scrollPositions.set(depth, scroller.scrollTop);
}

window.addEventListener('scroll', () => {
  scrollPositions.set(state.stack.length, (document.scrollingElement ?? document.documentElement).scrollTop);
});

for (const [type, attribute] of [
  ['click', 'click'],
  ['input', 'input'],
  ['change', 'change'],
] as const) {
  app.addEventListener(type, (event) => {
    const element = (event.target as HTMLElement).closest<HTMLElement>(`[data-${attribute}]`);
    const handler = element && actions[element.dataset[attribute]!];
    if (handler) handler(element, event);
  });
}

// The Android back button goes back a screen, like the other example apps.
App.addListener('backButton', () => {
  if (state.stack.length > 1) pop();
  else App.minimizeApp();
});

render();
