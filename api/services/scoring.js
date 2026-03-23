const CURRENT_YEAR = new Date().getFullYear();
const MAX_KM = 300000;
const MAX_AGE = 20;

const WEIGHTS = {
  price: 0.35,
  mileage: 0.25,
  year: 0.20,
  fuel: 0.10,
  features: 0.10,
};

// Hogere score = toekomstbestendiger / lagere brandstofkosten
const FUEL_SCORES = {
  'elektrisch': 100,
  'electric': 100,
  'waterstof': 100,
  'plug-in hybrid': 85,
  'plug-in hybride': 85,
  'elektro/benzine': 80,
  'elektro/diesel': 80,
  'hybride': 70,
  'hybrid': 70,
  'mild hybrid': 65,
  'lpg': 55,
  'cng': 55,
  'benzine': 45,
  'petrol': 45,
  'diesel': 40,
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

function scoreFuel(fuel) {
  if (!fuel) return 50;
  const key = fuel.toLowerCase().trim();
  for (const [pattern, score] of Object.entries(FUEL_SCORES)) {
    if (key.includes(pattern)) return score;
  }
  return 50;
}

// Vaste punten per feature-categorie (keyword-matching, case-insensitief)
// Totaal van ~80-100 pts = zeer goed uitgeruste auto; score wordt gecapt op 100
const FEATURE_SCORES = {
  // Veiligheid & rijhulp
  'adaptieve cruise':        18,
  'adaptive cruise':         18,
  'rijstrookassistent':      15,
  'lane assist':             15,
  'rijstrookwaarschuwing':   12,
  'dodehoekwaarschuwing':    15,
  'blindspot':               15,
  'noodremassistent':        15,
  'head-up display':         15,
  'head up display':         15,
  '360':                     15,
  'surround view':           15,
  // Camera & sensoren
  'parkeercamera':           10,
  'achteruitrijcamera':      10,
  'parkeersensor':            8,
  'parkeerassistent':        10,
  // Comfort & tech
  'navigatie':               10,
  'apple carplay':           10,
  'android auto':            10,
  'carplay':                 10,
  'panoramadak':             12,
  'schuifdak':               10,
  'lederen':                 10,
  'leder ':                  10,
  'stoelverwarming':          8,
  'stuurverwarming':          6,
  'elektrische stoelen':      8,
  'keyless':                  8,
  'draadloos opladen':        8,
  'wireless charging':        8,
  'climate control':         10,
  'dual zone':               10,
  'airco':                    6,
  'trekhaak':                 8,
  'cruise control':           8,
  'lichtmetalen':             4,
  'sportvelgen':              4,
  'bluetooth':                4,
};

function scoreFeatures(features) {
  if (!features || features.length === 0) return 0;
  let total = 0;
  for (const feature of features) {
    const f = feature.toLowerCase();
    for (const [keyword, pts] of Object.entries(FEATURE_SCORES)) {
      if (f.includes(keyword)) { total += pts; break; }
    }
  }
  return clamp(total, 0, 100);
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

  return cars.map(car => {
    const comparablePrices = getComparablePrices(car, cars);

    const priceScore = scorePrice(car.price, comparablePrices);
    const mileageScore = scoreMileage(car.mileage);
    const yearScore = scoreYear(car.year);
    const fuelScore = scoreFuel(car.fuel);
    const featuresScore = scoreFeatures(car.features);

    const total = Math.round(
      priceScore * WEIGHTS.price +
      mileageScore * WEIGHTS.mileage +
      yearScore * WEIGHTS.year +
      fuelScore * WEIGHTS.fuel +
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
          fuel: Math.round(fuelScore),
          features: Math.round(featuresScore),
        },
      },
    };
  });
}

module.exports = { scoreCars };
