const marktplaats = require('./marktplaats');
const autoscout24 = require('./autoscout24');
const { normalizeVersion } = require('./normalize');

async function aggregateCars(params) {
  const sources = params.source || 'all';

  const promises = [];
  if (sources === 'all' || sources === 'marktplaats') {
    promises.push(marktplaats.searchCars(params).then(cars => cars));
  }
  if (sources === 'all' || sources === 'autoscout24') {
    promises.push(autoscout24.searchCars(params).then(cars => cars));
  }

  const results = await Promise.allSettled(promises);
  const cars = [];
  results.forEach(r => {
    if (r.status === 'fulfilled') cars.push(...r.value);
  });

  // Client-side filters als fallback
  return cars.filter(car => {
    if (params.minPrice && car.price !== null && car.price < params.minPrice) return false;
    if (params.maxPrice && car.price !== null && car.price > params.maxPrice) return false;
    if (params.fuel && car.fuel && !car.fuel.toLowerCase().includes(params.fuel.toLowerCase())) return false;
    if (params.version && car.version && !normalizeVersion(car.version).toLowerCase().includes(params.version.toLowerCase())) return false;
    return true;
  });
}

module.exports = { aggregateCars };
