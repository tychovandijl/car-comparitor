const { aggregateCars } = require('../services/aggregator');
const { scoreCars } = require('../services/scoring');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

module.exports = async function (context, req) {
  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: CORS_HEADERS };
    return;
  }

  const q = req.query;

  if (!q.query && !q.brand && !q.model) {
    context.res = {
      status: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Geef minimaal een zoekterm, merk of model op.' }),
    };
    return;
  }

  const params = {
    query: q.query || '',
    brand: q.brand || '',
    model: q.model || '',
    fuel: q.fuel || '',
    version: q.version || '',
    minYear: q.minYear ? parseInt(q.minYear) : null,
    maxYear: q.maxYear ? parseInt(q.maxYear) : null,
    minPrice: q.minPrice ? parseInt(q.minPrice) : null,
    maxPrice: q.maxPrice ? parseInt(q.maxPrice) : null,
    maxKm: q.maxKm ? parseInt(q.maxKm) : null,
    source: q.source || 'all',
  };

  const sortBy = q.sort || 'score';

  try {
    const cars = await aggregateCars(params);
    const scored = scoreCars(cars);

    // Sorteren
    const sorted = scored.sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      if (sortBy === 'km_asc') return (a.mileage || 0) - (b.mileage || 0);
      if (sortBy === 'km_desc') return (b.mileage || 0) - (a.mileage || 0);
      if (sortBy === 'year_desc') return (b.year || 0) - (a.year || 0);
      if (sortBy === 'year_asc') return (a.year || 0) - (b.year || 0);
      // Standaard: score hoog naar laag
      return (b.scores?.total || 0) - (a.scores?.total || 0);
    });

    // Unieke merken, modellen en brandstoftypes verzamelen voor filter-dropdowns
    const brands = [...new Set(sorted.map(c => c.brand).filter(Boolean))].sort();
    const models = [...new Set(sorted.map(c => c.model).filter(Boolean))].sort();
    const fuels = [...new Set(sorted.map(c => c.fuel).filter(Boolean))].sort();
    const versions = [...new Set(sorted.map(c => c.version).filter(Boolean))].sort();

    context.res = {
      status: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        total: sorted.length,
        cars: sorted,
        filters: { brands, models, fuels, versions },
      }),
    };
  } catch (err) {
    context.log.error('cars-search error:', err);
    context.res = {
      status: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Er ging iets mis bij het ophalen van de auto\'s.' }),
    };
  }
};
