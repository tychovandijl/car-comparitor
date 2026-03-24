const axios = require('axios');

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minuten
const cache = new Map();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.marktplaats.nl/',
  'Origin': 'https://www.marktplaats.nl',
};

// Marktplaats categorie-ID voor personenauto's: 91
const CATEGORY_ID = 91;

// Merknamen zoals Marktplaats ze kent (inclusief veelgebruikte aliassen)
const BRAND_ALIASES = {
  'mercedes': 'Mercedes-Benz',
  'mercedes benz': 'Mercedes-Benz',
  'mercedes-benz': 'Mercedes-Benz',
  'vw': 'Volkswagen',
  'bmw': 'BMW',
  'land rover': 'Land Rover',
  'alfa': 'Alfa Romeo',
  'alfa romeo': 'Alfa Romeo',
  'ds': 'DS',
  'aston': 'Aston Martin',
  'aston martin': 'Aston Martin',
};

function normalizeBrand(brand) {
  if (!brand) return brand;
  return BRAND_ALIASES[brand.toLowerCase()] || brand;
}

function extractBrandFromQuery(query) {
  if (!query) return '';
  // Probeer eerst twee-woords merknamen, dan één woord
  const q = query.trim().toLowerCase();
  const twoWord = q.split(/\s+/).slice(0, 2).join(' ');
  if (BRAND_ALIASES[twoWord]) return BRAND_ALIASES[twoWord];
  const oneWord = q.split(/\s+/)[0];
  if (BRAND_ALIASES[oneWord]) return BRAND_ALIASES[oneWord];
  // Geef het eerste woord terug met hoofdletter (bijv. "Hyundai")
  return query.trim().split(/\s+/)[0] || '';
}

function extractModelFromQuery(query, brand) {
  if (!query || !brand) return '';
  const idx = query.toLowerCase().indexOf(brand.toLowerCase());
  if (idx === -1) return query.trim().split(/\s+/).slice(1).join(' ');
  return query.slice(idx + brand.length).trim();
}

function buildSearchUrl(params) {
  const url = new URL('https://www.marktplaats.nl/lrp/api/search');

  const brand = normalizeBrand(params.brand || extractBrandFromQuery(params.query));
  const model = params.model || (brand ? extractModelFromQuery(params.query, brand) : '');

  // Gebruik attribuutfilters als merk bekend is, anders vrije tekst
  if (brand) {
    url.searchParams.set('attributesByKey[0]', `make:${brand}`);
    if (model) url.searchParams.set('attributesByKey[1]', `model:${model}`);
  } else if (params.query) {
    url.searchParams.set('query', params.query);
  }
  if (params.minYear && params.maxYear) url.searchParams.set('attributeRanges[0]', `constructionYear:${params.minYear}:${params.maxYear}`);
  else if (params.minYear) url.searchParams.set('attributeRanges[0]', `constructionYear:${params.minYear}:`);
  else if (params.maxYear) url.searchParams.set('attributeRanges[0]', `constructionYear::${params.maxYear}`);
  if (params.maxKm) url.searchParams.set('attributeRanges[1]', `mileage::${params.maxKm}`);
  if (params.minPrice) url.searchParams.set('priceFrom', params.minPrice);
  if (params.maxPrice) url.searchParams.set('priceTo', params.maxPrice);
  url.searchParams.set('l1CategoryId', CATEGORY_ID);
  url.searchParams.set('limit', '100');
  url.searchParams.set('offset', '0');
  url.searchParams.set('sortBy', 'SORT_INDEX');
  url.searchParams.set('sortOrder', 'DECREASING');
  return url.toString();
}

function mapListing(item) {
  const attrs = {};
  (item.attributes || []).forEach(a => { attrs[a.key] = a.value; });

  const price = item.priceInfo?.priceCents ? item.priceInfo.priceCents / 100 : null;
  const year = attrs.constructionYear ? parseInt(attrs.constructionYear) : null;
  const mileage = attrs.mileage ? parseInt(String(attrs.mileage).replace(/\./g, '').match(/\d+/)?.[0]) ?? null : null;
  const brand = attrs.make || attrs.merk || extractBrand(item.title);
  const model = attrs.model || '';
  const version = extractVersion(item.title || '', brand, model);

  return {
    id: `marktplaats-${item.itemId}`,
    source: 'marktplaats',
    title: item.title || '',
    brand,
    model,
    version,
    year,
    mileage,
    price,
    fuel: attrs.fuel || null,
    transmission: attrs.transmission || null,
    features: extractFeatures(item),
    imageUrl: item.pictures?.[0]?.mediumUrl || item.pictures?.[0]?.extraExtraLargeUrl || null,
    adUrl: `https://www.marktplaats.nl${item.vipUrl || ''}`,
  };
}

function extractVersion(title, brand, model) {
  if (!title) return '';
  const prefix = [brand, model].filter(Boolean).join(' ');
  const idx = prefix ? title.toLowerCase().indexOf(prefix.toLowerCase()) : -1;
  if (idx === -1) return '';
  return title.slice(idx + prefix.length).trim().replace(/^[-:,\s]+/, '').replace(/\.$/, '').trim();
}

function extractBrand(title) {
  if (!title) return '';
  const brands = ['Volkswagen', 'BMW', 'Mercedes', 'Audi', 'Toyota', 'Ford', 'Opel', 'Renault',
    'Peugeot', 'Citroën', 'Seat', 'Skoda', 'Honda', 'Hyundai', 'Kia', 'Volvo', 'Nissan', 'Mazda'];
  return brands.find(b => title.toLowerCase().includes(b.toLowerCase())) || '';
}

function extractFeatures(item) {
  const features = [];
  const attrs = {};
  (item.attributes || []).forEach(a => { attrs[a.key] = a.value; });

  if (attrs.transmission) features.push(attrs.transmission);
  if (attrs.fuel) features.push(attrs.fuel);
  if (attrs.body) features.push(attrs.body);
  if (attrs.options) features.push(...attrs.options.split(',').map(s => s.trim()).filter(Boolean));
  if (attrs.airConditioning) features.push('Airco');
  if (attrs.towBar) features.push('Trekhaak');
  if (item.description) {
    const desc = item.description.toLowerCase();
    if (desc.includes('navigatie') || desc.includes('navi')) features.push('Navigatie');
    if (desc.includes('parkeersensor') || desc.includes('parkeer sensor')) features.push('Parkeersensoren');
    if (desc.includes('cruise control')) features.push('Cruise control');
    if (desc.includes('stoelverwarming')) features.push('Stoelverwarming');
    if (desc.includes('panoramadak') || desc.includes('schuifdak')) features.push('Panoramadak');
  }
  return [...new Set(features)];
}

async function searchCars(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const url = buildSearchUrl(params);

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const listings = response.data?.listings || [];
    const cars = listings
      .map(mapListing)
      .filter(c => c.price && c.year && c.mileage !== null);

    cache.set(cacheKey, { data: cars, timestamp: Date.now() });
    return cars;
  } catch (err) {
    console.error('Marktplaats API error:', err.message);
    return [];
  }
}

module.exports = { searchCars };
