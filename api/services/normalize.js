// Bekende aandrijflijnen (volgorde = prioriteit)
const POWERTRAINS = [
  { key: 'plug-in hybrid', label: 'PHEV' },
  { key: 'plug-in hybride', label: 'PHEV' },
  { key: 'phev', label: 'PHEV' },
  { key: 'fhev', label: 'HEV' },
  { key: ' hev', label: 'HEV' },
  { key: '-hev', label: 'HEV' },
  { key: 'full hybrid', label: 'HEV' },
  { key: 'hybride benzine', label: 'HEV' },
  { key: 'mhev', label: 'MHEV' },
  { key: 'mild hybrid', label: 'MHEV' },
  { key: '48v', label: 'MHEV' },
  { key: 'elektrisch', label: 'Elektrisch' },
  { key: 'electric', label: 'Elektrisch' },
  { key: 'waterstof', label: 'Waterstof' },
];

// Bekende uitvoeringen/trims (volgorde = prioriteit bij meerdere matches)
const TRIMS = [
  'Excellence', 'Premium', 'Comfort', 'Luxury', 'Executive', 'Prestige',
  'Style', 'Sport', 'Sportline', 'Business', 'Edition', 'Urban', 'Active',
  'Titanium', 'Titanium+', 'Vignale', 'ST-Line', 'ST Line',
  'N Line', 'N-Line', 'N', 'GTI', 'GTS', 'GTD', 'GTE',
  'R-Line', 'R Line', 'R',
  'AMG', 'AMG Line',
  'M Sport', 'MSport', 'M-Sport',
  'xLine', 'X-Line', 'xDrive',
  'Momentum', 'Inscription', 'Kinetic', 'Elegance', 'Allure', 'GT',
  'SE', 'SEL', 'SL', 'SR', 'XC', 'Signature', 'Dynamic',
  'Trend', 'Techno', 'Puretech', 'Automaat',
];

/**
 * Normaliseert een versiestring naar een korte leesbare label.
 * Bijv. "1.6 T-GDi PHEV Excellence Sunroof Pack 265pk 4WD Auto" → "1.6 PHEV Excellence"
 */
function normalizeVersion(version) {
  if (!version) return '';
  const v = version.toLowerCase();

  // Motorinhoud (bijv. 1.6, 2.0, 1.4, 2.5)
  const engineMatch = v.match(/\b(\d[.,]\d)\b/);
  const engine = engineMatch ? engineMatch[1].replace(',', '.') : '';

  // Aandrijflijn
  let powertrain = '';
  for (const { key, label } of POWERTRAINS) {
    if (v.includes(key)) { powertrain = label; break; }
  }

  // Uitvoering (case-insensitive match, maar bewaar originele casing uit TRIMS lijst)
  let trim = '';
  for (const t of TRIMS) {
    if (v.includes(t.toLowerCase())) { trim = t; break; }
  }

  const parts = [engine, powertrain, trim].filter(Boolean);
  return parts.length ? parts.join(' ') : '';
}

module.exports = { normalizeVersion };
