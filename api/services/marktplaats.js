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

function buildSearchUrl(params) {
  const url = new URL('https://www.marktplaats.nl/lrp/api/search');
  if (params.query) url.searchParams.set('query', params.query);
  if (params.brand) url.searchParams.set('attributesByKey[0]', `merk:${params.brand}`);
  if (params.model) url.searchParams.set('attributesByKey[1]', `model:${params.model}`);
  if (params.minYear) url.searchParams.set('attributeRanges[0]', `bouwjaar:${params.minYear}:`);
  if (params.maxYear) url.searchParams.set('attributeRanges[0]', `bouwjaar::${params.maxYear}`);
  if (params.minYear && params.maxYear) url.searchParams.set('attributeRanges[0]', `bouwjaar:${params.minYear}:${params.maxYear}`);
  if (params.maxKm) url.searchParams.set('attributeRanges[1]', `kilometrageRange::${params.maxKm}`);
  if (params.minPrice) url.searchParams.set('priceFrom', params.minPrice);
  if (params.maxPrice) url.searchParams.set('priceTo', params.maxPrice);
  url.searchParams.set('l1CategoryId', CATEGORY_ID);
  url.searchParams.set('limit', '50');
  url.searchParams.set('offset', '0');
  return url.toString();
}

function mapListing(item) {
  const attrs = {};
  (item.attributes || []).forEach(a => { attrs[a.key] = a.value; });

  const price = item.priceInfo?.priceCents ? item.priceInfo.priceCents / 100 : null;
  const year = attrs.constructionYear ? parseInt(attrs.constructionYear) : null;
  const mileage = attrs.mileage ? parseInt(String(attrs.mileage).replace(/\./g, '').match(/\d+/)?.[0]) ?? null : null;

  return {
    id: `marktplaats-${item.itemId}`,
    source: 'marktplaats',
    title: item.title || '',
    brand: attrs.make || attrs.merk || extractBrand(item.title),
    model: attrs.model || '',
    year,
    mileage,
    price,
    features: extractFeatures(item),
    imageUrl: item.pictures?.[0]?.mediumUrl || item.pictures?.[0]?.extraExtraLargeUrl || null,
    adUrl: `https://www.marktplaats.nl${item.vipUrl || ''}`,
  };
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
