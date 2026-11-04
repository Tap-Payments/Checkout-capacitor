/**
 * Your own sandbox keys, kept out of the repo. The build bundles keys.local.json from the repo root
 * when it exists (it is gitignored), and Settings > Saved Keys switches between them. See
 * keys.local.example.json for the format. Only put sandbox keys there: they end up in the app.
 */

export interface LocalKey {
  name: string;
  publicKey: string;
  merchantId?: string;
}

function readKeys(): LocalKey[] {
  // An optional file: the glob is empty when it does not exist.
  const files = import.meta.glob<LocalKey[]>('../../keys.local.json', {
    eager: true,
    import: 'default',
  });
  const keys = Object.values(files)[0];
  return Array.isArray(keys) ? keys : [];
}

export const LocalKeys: { all: LocalKey[] } = { all: readKeys() };
