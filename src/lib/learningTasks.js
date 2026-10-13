// Deterministic models for the demos. No files or cloud resources are changed.
export const sampleAssetNames = 'Homepage Hero.JPG\nBrand Logo.svg\nTeam Portrait.png\nMenu Summer.pdf\nhomepage hero.jpg';

export function prepareAssets(input, { cleanNames = true, groupByType = true } = {}) {
  const names = input.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
  if (!names.length) throw new Error('Add at least one filename, one per line.');
  if (names.length > 50) throw new Error('Try up to 50 filenames at a time.');
  const used = new Set();
  return names.map(original => {
    const name = original.split(/[\\/]/).pop();
    if (!name || /^\.+$/.test(name)) throw new Error('Use filenames, rather than a folder path or dots.');
    const dot = name.lastIndexOf('.');
    const rawStem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot).toLowerCase() : '';
    const stem = cleanNames
      ? rawStem.normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset'
      : rawStem;
    const type = /\.(jpe?g|png|webp|avif|gif|svg)$/.test(extension) ? 'images'
      : /\.(pdf|txt|md|csv)$/.test(extension) ? 'documents'
      : /\.(woff2?|ttf|otf)$/.test(extension) ? 'fonts' : 'other';
    const folder = groupByType ? `${type}/` : '';
    let filename = `${stem}${extension}`, suffix = 2;
    while (used.has(`${folder}${filename}`.toLowerCase())) filename = `${stem}-${suffix++}${extension}`;
    const path = `${folder}${filename}`;
    used.add(path.toLowerCase());
    return { original, path };
  });
}

export function toCsv(columns, rows) {
  const cell = value => {
    const text = String(value ?? '');
    // Keep user-entered cells from becoming spreadsheet formulas.
    const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [columns, ...rows].map(row => row.map(cell).join(',')).join('\r\n');
}

export const initialDelivery = {
  origin: 1, cached: null, visitor: null, online: true, requests: 0, hits: 0, fetches: 0,
  outcome: 'idle', message: 'Visit the page to follow its first trip from storage to your browser.',
};

// One file, one edge cache. Time/TTL and error caching are outside this model.
export function deliveryReducer(state, action) {
  if (action === 'reset') return { ...initialDelivery };
  if (action === 'publish') return state.online ? { ...state, origin: state.origin + 1, outcome: 'publish', message: `Version ${state.origin + 1} is in S3. An existing cached copy stays unchanged until invalidated.` } : state;
  if (action === 'invalidate') return { ...state, cached: null, outcome: 'invalidate', message: 'Cached copy cleared. The next visit must fetch the file from S3.' };
  if (action === 'toggle-origin') return { ...state, online: !state.online, outcome: 'origin', message: state.online ? 'Origin unavailable. A fresh cached copy can still serve a visitor. Try a visit.' : 'Origin restored. Cache misses can reach S3 again.' };
  if (action !== 'visit') return state;
  const next = { ...state, requests: state.requests + 1 };
  if (state.cached !== null) return { ...next, visitor: state.cached, hits: state.hits + 1, outcome: 'hit', message: `Cache hit: the visitor sees version ${state.cached}.${state.cached !== state.origin ? ` S3 has version ${state.origin}; clear the cache to pick it up.` : ' No trip to the origin needed.'}` };
  if (!state.online) return { ...next, visitor: null, fetches: state.fetches + 1, outcome: 'error', message: 'Request failed: no cached copy, and the origin is unavailable. Restore the origin and retry.' };
  return { ...next, cached: state.origin, visitor: state.origin, fetches: state.fetches + 1, outcome: 'miss', message: `Cache miss: fetched version ${state.origin} from S3, stored it at the edge, and sent it to the visitor.` };
}
