const CURRENT_YEAR = new Date().getFullYear();
const MAX_KM = 300000;
const MAX_AGE = 20;

const WEIGHTS = {
  price: 0.40,
  mileage: 0.25,
  year: 0.20,
  features: 0.15,
};

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreMileage(mileage) {
  if (mileage === null || mileage === undefined) return 50;
  return clamp(100 - (mileage / MAX_KM) * 100, 0, 100);
}

function scoreYear(year) {
  if (!year) return 50;
  const age = CURRENT_YEAR - year;
  return clamp(100 - (age / MAX_AGE) * 100, 0, 100);
}

function scorePrice(price, comparablePrices) {
  if (!price || !comparablePrices.length) return 50;
  const med = median(comparablePrices);
  if (med === 0) return 50;
  // Onder mediaan = goed, boven mediaan = slecht
  // Prijs 50% onder mediaan → 100 pts
  // Prijs gelijk aan mediaan → 50 pts
  // Prijs 50% boven mediaan → 0 pts
  const ratio = price / med;
  return clamp(100 - (ratio - 0.5) * 100, 0, 100);
}

function scoreFeatures(featureCount, maxFeatures) {
  if (maxFeatures === 0) return 50;
  return clamp((featureCount / maxFeatures) * 100, 0, 100);
}

function getComparablePrices(car, allCars) {
  return allCars
    .filter(c =>
      c.id !== car.id &&
      c.price &&
      c.brand &&
      c.brand.toLowerCase() === (car.brand || '').toLowerCase() &&
      c.year && Math.abs(c.year - (car.year || 0)) <= 3 &&
      c.mileage !== null && Math.abs(c.mileage - (car.mileage || 0)) <= 50000
    )
    .map(c => c.price);
}

function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
}

function getScoreLabel(scoreClass) {
  const labels = {
    excellent: 'Uitstekend',
    good: 'Goed',
    average: 'Gemiddeld',
    poor: 'Matig',
  };
  return labels[scoreClass];
}

function scoreCars(cars) {
  if (!cars.length) return [];

  const maxFeatures = Math.max(...cars.map(c => (c.features || []).length), 1);

  return cars.map(car => {
    const comparablePrices = getComparablePrices(car, cars);

    const priceScore = scorePrice(car.price, comparablePrices);
    const mileageScore = scoreMileage(car.mileage);
    const yearScore = scoreYear(car.year);
    const featuresScore = scoreFeatures((car.features || []).length, maxFeatures);

    const total = Math.round(
      priceScore * WEIGHTS.price +
      mileageScore * WEIGHTS.mileage +
      yearScore * WEIGHTS.year +
      featuresScore * WEIGHTS.features
    );

    const scoreClass = getScoreClass(total);

    return {
      ...car,
      scores: {
        total,
        class: scoreClass,
        label: getScoreLabel(scoreClass),
        breakdown: {
          price: Math.round(priceScore),
          mileage: Math.round(mileageScore),
          year: Math.round(yearScore),
          features: Math.round(featuresScore),
        },
      },
    };
  });
}

module.exports = { scoreCars };
