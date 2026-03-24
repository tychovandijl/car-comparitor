import React, { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import FilterPanel from '../components/FilterPanel';
import CarList from '../components/CarList';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function SearchPage({ compareList, onToggleCompare }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    brand: '',
    model: '',
    fuel: '',
    minYear: '',
    maxYear: '',
    minPrice: '',
    maxPrice: '',
    maxKm: '',
    sort: 'score',
    source: 'all',
  });
  const [cars, setCars] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [availableFuels, setAvailableFuels] = useState([]);
  const [availableVersions, setAvailableVersions] = useState([]);
  const abortRef = useRef(null);

  const fetchCars = useCallback(async (activeFilters) => {
    if (!activeFilters.query && !activeFilters.brand && !activeFilters.model) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    const params = {};
    if (activeFilters.query) params.query = activeFilters.query;
    if (activeFilters.brand) params.brand = activeFilters.brand;
    if (activeFilters.model) params.model = activeFilters.model;
    if (activeFilters.minYear) params.minYear = activeFilters.minYear;
    if (activeFilters.maxYear) params.maxYear = activeFilters.maxYear;
    if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice;
    if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice;
    if (activeFilters.maxKm) params.maxKm = activeFilters.maxKm;
    if (activeFilters.sort) params.sort = activeFilters.sort;
    if (activeFilters.fuel) params.fuel = activeFilters.fuel;
    if (activeFilters.version) params.version = activeFilters.version;
    if (activeFilters.source) params.source = activeFilters.source;

    try {
      const res = await axios.get(`${API_BASE}/cars-search`, {
        params,
        signal: abortRef.current.signal,
      });
      setCars(res.data.cars);
      setAvailableBrands(res.data.filters?.brands || []);
      setAvailableModels(res.data.filters?.models || []);
      setAvailableFuels(res.data.filters?.fuels || []);
      setAvailableVersions(res.data.filters?.versions || []);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        setError(err.response?.data?.error || 'Er ging iets mis. Probeer het opnieuw.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    fetchCars(newFilters);
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    fetchCars(newFilters);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Zoekbalk */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Zoek op merk, model of trefwoord... bijv. 'Volkswagen Golf' of 'BMW 3 serie'"
            className="w-full pl-11 pr-32 py-3.5 text-sm rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Zoeken
          </button>
        </div>
      </form>

      {/* Scoreleg */}
      {!cars && !loading && (
        <div className="max-w-2xl mx-auto mb-8 grid grid-cols-4 gap-3 text-center">
          {[
            { color: 'bg-green-600', label: 'Uitstekend', range: '80–100' },
            { color: 'bg-lime-600', label: 'Goed', range: '60–79' },
            { color: 'bg-yellow-500', label: 'Gemiddeld', range: '40–59' },
            { color: 'bg-red-600', label: 'Matig', range: '0–39' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
              <div className={`w-8 h-8 rounded-full ${s.color} mx-auto mb-1.5 flex items-center justify-center text-white text-xs font-bold`}>
                {s.range.split('–')[0]}
              </div>
              <div className="text-xs font-medium text-gray-700">{s.label}</div>
              <div className="text-[10px] text-gray-400">{s.range} pts</div>
            </div>
          ))}
        </div>
      )}

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          brands={availableBrands}
          models={availableModels}
          fuels={availableFuels}
          versions={availableVersions}
        />
        <div className="flex-1 min-w-0">
          <CarList
            cars={cars}
            loading={loading}
            error={error}
            compareList={compareList}
            onToggleCompare={onToggleCompare}
          />
        </div>
      </div>
    </div>
  );
}
