const axios = require('axios');

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minuten
const cache = new Map();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
  'Referer': 'https://www.autoscout24.nl/',
};

// AutoScout24 interne JSON API
async function fetchAS24Json(params) {
  // AutoScout24 heeft een publieke search API
  const apiUrl = new URL('https://www.autoscout24.nl/api/v1/search');
  if (params.brand) apiUrl.searchParams.set('make', params.brand);
  if (params.model) apiUrl.searchParams.set('model', params.model);
  if (params.minYear) apiUrl.searchParams.set('fregfrom', params.minYear);
  if (params.maxYear) apiUrl.searchParams.set('fregto', params.maxYear);
  if (params.minPrice) apiUrl.searchParams.set('pricefrom', params.minPrice);
  if (params.maxPrice) apiUrl.searchParams.set('priceto', params.maxPrice);
  if (params.maxKm) apiUrl.searchParams.set('kmto', params.maxKm);
  if (params.query) apiUrl.searchParams.set('search', params.query);
  apiUrl.searchParams.set('atype', 'C');
  apiUrl.searchParams.set('cy', 'NL');
  apiUrl.searchParams.set('size', '50');

  const response = await axios.get(apiUrl.toString(), {
    headers: {
      ...HEADERS,
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 5000,
  });
  return response.data;
}

function mapListing(item) {
  const price = item.price?.value || item.firstRegistrationPrice?.value || null;
  const year = item.firstRegistration
    ? parseInt(item.firstRegistration.split('/').pop() || item.firstRegistration)
    : item.firstRegistrationYear || null;
  const mileage = item.mileage?.value || null;

  const features = [];
  if (item.transmissionType) features.push(item.transmissionType === 'A' ? 'Automaat' : 'Handgeschakeld');
  if (item.fuelType) features.push(mapFuelType(item.fuelType));
  if (item.vehicleDetails?.bodyType) features.push(item.vehicleDetails.bodyType);
  (item.equipment || []).slice(0, 5).forEach(e => features.push(e));

  return {
    id: `autoscout24-${item.id}`,
    source: 'autoscout24',
    title: `${item.make || ''} ${item.model || ''}`.trim() || item.title || '',
    brand: item.make || '',
    model: item.model || '',
    year,
    mileage,
    price,
    features: [...new Set(features.filter(Boolean))],
    imageUrl: item.images?.[0]?.url || item.previewImage?.url || null,
    adUrl: item.url
      ? `https://www.autoscout24.nl${item.url}`
      : `https://www.autoscout24.nl/auto/${item.id}`,
  };
}

function mapFuelType(code) {
  const map = { B: 'Benzine', D: 'Diesel', E: 'Elektrisch', H: 'Hybride', L: 'LPG', C: 'CNG' };
  return map[code] || code;
}

async function searchCars(params) {
  const cacheKey = JSON.stringify(params);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchAS24Json(params);
    const listings = data?.listings || data?.results || data?.data?.listings || [];
    const cars = listings
      .map(mapListing)
      .filter(c => c.price && c.year && c.mileage !== null);

    cache.set(cacheKey, { data: cars, timestamp: Date.now() });
    return cars;
  } catch (err) {
    console.error('AutoScout24 API error:', err.message);
    return [];
  }
}

module.exports = { searchCars };
