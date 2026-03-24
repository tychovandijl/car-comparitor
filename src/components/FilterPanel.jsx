import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const SORT_OPTIONS = [
  { value: 'score', label: 'Beste score' },
  { value: 'price_asc', label: 'Prijs laag → hoog' },
  { value: 'price_desc', label: 'Prijs hoog → laag' },
  { value: 'km_asc', label: 'Kilometerstand laag → hoog' },
  { value: 'km_desc', label: 'Kilometerstand hoog → laag' },
  { value: 'year_desc', label: 'Bouwjaar nieuw → oud' },
  { value: 'year_asc', label: 'Bouwjaar oud → nieuw' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'Alle bronnen' },
  { value: 'marktplaats', label: 'Marktplaats' },
  { value: 'autoscout24', label: 'AutoScout24' },
];

export default function FilterPanel({ filters, onChange, brands = [], models = [], fuels = [], versions = [] }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({
      query: filters.query,
      brand: '',
      model: '',
      fuel: '',
      version: '',
      minYear: '',
      maxYear: '',
      minPrice: '',
      maxPrice: '',
      maxKm: '',
      sort: 'score',
      source: 'all',
    });
  }

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal size={16} />
            Filters
          </h2>
          <button
            onClick={reset}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        </div>

        <div className="space-y-4">
          {/* Sortering */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sorteren op</label>
            <select
              value={filters.sort || 'score'}
              onChange={e => update('sort', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Bron */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bron</label>
            <div className="flex gap-1">
              {SOURCE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  onClick={() => update('source', o.value)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors
                    ${filters.source === o.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Merk */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Merk</label>
            <select
              value={filters.brand || ''}
              onChange={e => update('brand', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Alle merken</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select
              value={filters.model || ''}
              onChange={e => update('model', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Alle modellen</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Versie/uitvoering */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Versie / uitvoering</label>
            <input
              list="versions-list"
              type="text"
              placeholder="bv. PHEV, 1.6 T-GDi, Excellence"
              value={filters.version || ''}
              onChange={e => update('version', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            {versions.length > 0 && (
              <datalist id="versions-list">
                {versions.map(v => <option key={v} value={v} />)}
              </datalist>
            )}
          </div>

          {/* Brandstof */}
          {fuels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Brandstof</label>
              <select
                value={filters.fuel || ''}
                onChange={e => update('fuel', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Alle brandstoftypes</option>
                {fuels.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          )}

          {/* Bouwjaar */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Bouwjaar</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Van"
                min="1990"
                max={CURRENT_YEAR}
                value={filters.minYear || ''}
                onChange={e => update('minYear', e.target.value)}
                className="w-1/2 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="number"
                placeholder="Tot"
                min="1990"
                max={CURRENT_YEAR}
                value={filters.maxYear || ''}
                onChange={e => update('maxYear', e.target.value)}
                className="w-1/2 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Prijs */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prijs (€)</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={filters.minPrice || ''}
                onChange={e => update('minPrice', e.target.value)}
                className="w-1/2 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={filters.maxPrice || ''}
                onChange={e => update('maxPrice', e.target.value)}
                className="w-1/2 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Max kilometerstand */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max kilometerstand</label>
            <input
              type="number"
              placeholder="bv. 150000"
              min="0"
              step="10000"
              value={filters.maxKm || ''}
              onChange={e => update('maxKm', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
