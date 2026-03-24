const axios = require('axios');

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'nl-NL,nl;q=0.9',
};

function buildSearchUrl(params) {
  // URL formaat: /lst/{make}/{model} of /lst/{make}
  let base = 'https://www.autoscout24.nl/lst';
  const brand = params.brand || extractBrandFromQuery(params.query);
  const model = params.model || extractModelFromQuery(params.query, brand);

  if (brand) base += '/' + encodeURIComponent(brand.toLowerCase());
  if (model) base += '/' + encodeURIComponent(model.toLowerCase().replace(/\s+/g, '-'));

  const url = new URL(base);
  url.searchParams.set('atype', 'C');
  url.searchParams.set('cy', 'NL');
  url.searchParams.set('ustate', 'N,U');
  url.searchParams.set('size', '20');
  if (params.minYear) url.searchParams.set('fregfrom', params.minYear);
  if (params.maxYear) url.searchParams.set('fregto', params.maxYear);
  if (params.minPrice) url.searchParams.set('pricefrom', params.minPrice);
  if (params.maxPrice) url.searchParams.set('priceto', params.maxPrice);
  if (params.maxKm) url.searchParams.set('kmto', params.maxKm);
  return url.toString();
}

function extractBrandFromQuery(query) {
  if (!query) return '';
  return query.trim().split(/\s+/)[0] || '';
}

function extractModelFromQuery(query, brand) {
  if (!query || !brand) return '';
  return query.trim().slice(brand.length).trim();
}

function extractVersionFromUrl(url, make, model) {
  if (!url || !make || !model) return '';
  // URL formaat: /aanbod/hyundai-tucson-1-6-t-gdi-plug-in-hybrid-exellence-4wd-...-uuid
  const slug = url.split('/').pop() || '';
  const prefix = `${make}-${model}`.toLowerCase().replace(/\s+/g, '-');
  const idx = slug.toLowerCase().indexOf(prefix);
  if (idx === -1) return '';
  const rest = slug.slice(idx + prefix.length).replace(/^-/, '');
  // Verwijder UUID achteraan (32 hex chars met streepjes)
  return rest.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, '')
    .replace(/-/g, ' ').trim();
}

function parsePrice(priceFormatted) {
  if (!priceFormatted) return null;
  const digits = priceFormatted.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits) : null;
}

function parseMileage(mileageStr) {
  if (!mileageStr) return null;
  const digits = String(mileageStr).replace(/[^0-9]/g, '');
  return digits ? parseInt(digits) : null;
}

function parseYear(vehicleDetails) {
  const entry = (vehicleDetails || []).find(d => d.ariaLabel === 'Bouwjaar');
  if (!entry?.data) return null;
  // Formaat: "MM/YYYY"
  const parts = entry.data.split('/');
  const year = parseInt(parts[parts.length - 1]);
  return year > 1900 && year <= new Date().getFullYear() + 1 ? year : null;
}

function mapListing(item) {
  const price = parsePrice(item.price?.priceFormatted);
  const mileage = parseMileage(item.vehicle?.mileageInKm);
  const year = parseYear(item.vehicleDetails);

  const detail = (label) => (item.vehicleDetails || []).find(d => d.ariaLabel === label)?.data;
  const fuel = detail('Brandstof') || item.vehicle?.fuel || null;
  const transmission = detail('Transmissie') || null;

  const features = [];
  if (transmission) features.push(transmission);
  if (fuel) features.push(fuel);
  if (item.vehicle?.bodyType) features.push(item.vehicle.bodyType);

  // Highlights (bijv. ["Navigatie", "Cruise control", "Apple CarPlay"])
  if (Array.isArray(item.highlights)) {
    for (const h of item.highlights) {
      if (typeof h === 'string') features.push(h);
      else if (h?.label) features.push(h.label);
    }
  }
  // Equipment uit vehicle object
  if (Array.isArray(item.vehicle?.equipment)) {
    features.push(...item.vehicle.equipment.filter(e => typeof e === 'string'));
  }
  // Overige vehicleDetails die nog niet zijn opgenomen
  const skipLabels = new Set(['Bouwjaar', 'Brandstof', 'Transmissie']);
  for (const d of (item.vehicleDetails || [])) {
    if (!skipLabels.has(d.ariaLabel) && d.data) features.push(d.data);
  }

  // Versie uit URL-slug extraheren (bijv. "tucson-1-6-t-gdi-plug-in-hybrid-exellence")
  const version = extractVersionFromUrl(item.url, item.vehicle?.make, item.vehicle?.model);

  const imageUrl = typeof item.images?.[0] === 'string'
    ? item.images[0]
    : item.images?.[0]?.url || null;

  return {
    id: `autoscout24-${item.id}`,
    source: 'autoscout24',
    title: `${item.vehicle?.make || ''} ${item.vehicle?.model || ''}`.trim(),
    brand: item.vehicle?.make || '',
    model: item.vehicle?.model || '',
    version,
    year,
    mileage,
    price,
    fuel,
    transmission,
    features: [...new Set(features.filter(Boolean))],
    imageUrl,
    adUrl: item.url ? `https://www.autoscout24.nl${item.url}` : null,
  };
}

const PAGES_TO_FETCH = 5; // 5 × 20 = max 100 resultaten

async function fetchPage(baseUrl, page) {
  const url = new URL(baseUrl);
  url.searchParams.set('page', page);
  const response = await axios.get(url.toString(), { headers: HEADERS, timeout: 10000 });
  const html = response.data;
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return [];
  const json = JSON.parse(match[1]);
  return json.props?.pageProps?.listings || [];
}

async function searchCars(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const baseUrl = buildSearchUrl(params);

  try {
    // Haal eerste pagina op om te bepalen hoeveel pagina's er zijn
    const firstPageListings = await fetchPage(baseUrl, 1);

    // Haal overige pagina's tegelijk op
    const otherPages = await Promise.allSettled(
      Array.from({ length: PAGES_TO_FETCH - 1 }, (_, i) => fetchPage(baseUrl, i + 2))
    );

    const allListings = [
      ...firstPageListings,
      ...otherPages.flatMap(r => r.status === 'fulfilled' ? r.value : []),
    ];

    // Dedupliceer op id
    const seen = new Set();
    const unique = allListings.filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const cars = unique
      .map(mapListing)
      .filter(c => c.price);  // jaar is niet altijd verplicht

    cache.set(cacheKey, { data: cars, timestamp: Date.now() });
    return cars;
  } catch (err) {
    console.error('AutoScout24 error:', err.message);
    return [];
  }
}

module.exports = { searchCars };
