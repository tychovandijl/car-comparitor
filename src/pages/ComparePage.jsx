import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, X } from 'lucide-react';

const SOURCE_LABELS = { marktplaats: 'Marktplaats', autoscout24: 'AutoScout24' };
const SOURCE_COLORS = { marktplaats: 'text-orange-600', autoscout24: 'text-blue-600' };

const SCORE_COLORS = {
  excellent: 'bg-green-600',
  good: 'bg-lime-600',
  average: 'bg-yellow-500',
  poor: 'bg-red-600',
};

function formatPrice(price) {
  if (!price) return '—';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}

function formatKm(km) {
  if (km === null || km === undefined) return '—';
  return new Intl.NumberFormat('nl-NL').format(km) + ' km';
}

function BestMark({ isBest }) {
  if (!isBest) return null;
  return (
    <span className="ml-1 inline-flex items-center text-[10px] bg-green-100 text-green-700 rounded px-1 py-0.5 font-medium">
      Beste
    </span>
  );
}

export default function ComparePage({ onRemove }) {
  const location = useLocation();
  const navigate = useNavigate();
  const cars = location.state?.cars || [];

  if (cars.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Geen auto's geselecteerd om te vergelijken.</p>
        <button onClick={() => navigate('/')} className="text-blue-600 hover:underline">
          Terug naar zoeken
        </button>
      </div>
    );
  }

  // Bepaal beste waarden per rij
  const bestPrice = Math.min(...cars.map(c => c.price || Infinity));
  const bestMileage = Math.min(...cars.map(c => c.mileage !== null ? c.mileage : Infinity));
  const bestYear = Math.max(...cars.map(c => c.year || 0));
  const bestScore = Math.max(...cars.map(c => c.scores?.total || 0));
  const bestFeatures = Math.max(...cars.map(c => (c.features || []).length));

  const rows = [
    {
      label: 'Bron',
      render: car => (
        <span className={`font-medium ${SOURCE_COLORS[car.source] || ''}`}>
          {SOURCE_LABELS[car.source] || car.source}
        </span>
      ),
    },
    {
      label: 'Versie',
      render: car => <span className="text-gray-700">{car.version || '—'}</span>,
    },
    {
      label: 'Prijs',
      render: car => (
        <span>
          <span className="font-bold">{formatPrice(car.price)}</span>
          <BestMark isBest={car.price === bestPrice} />
        </span>
      ),
    },
    {
      label: 'Kilometerstand',
      render: car => (
        <span>
          {formatKm(car.mileage)}
          <BestMark isBest={car.mileage !== null && car.mileage === bestMileage} />
        </span>
      ),
    },
    {
      label: 'Bouwjaar',
      render: car => (
        <span>
          {car.year || '—'}
          <BestMark isBest={car.year === bestYear} />
        </span>
      ),
    },
    {
      label: 'Brandstof',
      render: car => <span>{car.fuel || '—'}</span>,
    },
    {
      label: 'Transmissie',
      render: car => <span>{car.transmission || '—'}</span>,
    },
    {
      label: 'Uitrusting',
      render: car => {
        const scored = car.scores?.featuresDetail?.scored || [];
        const unscored = car.scores?.featuresDetail?.unscored || [];
        return (
          <div className="space-y-2">
            {scored.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Gescoord</div>
                <div className="flex flex-col gap-0.5">
                  {scored.map(f => (
                    <div key={f.name} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-700">{f.name}</span>
                      <span className="text-[10px] font-semibold text-green-700 bg-green-50 rounded px-1.5 py-0.5 shrink-0">+{f.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unscored.length > 0 && (
              <div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Overig</div>
                <div className="flex flex-wrap gap-1">
                  {unscored.map(f => (
                    <span key={f} className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {scored.length === 0 && unscored.length === 0 && <span className="text-xs text-gray-400">—</span>}
            <BestMark isBest={(car.features || []).length === bestFeatures} />
          </div>
        );
      },
    },
    {
      label: 'Score',
      render: car => car.scores ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${SCORE_COLORS[car.scores.class]}`}>
              {car.scores.total}
            </div>
            <div>
              <div className="text-xs font-medium">{car.scores.label}</div>
              <BestMark isBest={car.scores.total === bestScore} />
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            <div>Prijs: {car.scores.breakdown.price}</div>
            <div>Km: {car.scores.breakdown.mileage}</div>
            <div>Jaar: {car.scores.breakdown.year}</div>
            <div>Brandstof: {car.scores.breakdown.fuel}</div>
            <div>Uitrusting: {car.scores.breakdown.features}</div>
          </div>
        </div>
      ) : '—',
    },
    {
      label: 'Advertentie',
      render: car => (
        <a
          href={car.adUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          <ExternalLink size={11} />
          Bekijk op {SOURCE_LABELS[car.source] || 'platform'}
        </a>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Terug
        </button>
        <h1 className="text-xl font-bold text-gray-900">Vergelijking</h1>
        <span className="text-sm text-gray-400">({cars.length} auto's)</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 w-32">Eigenschap</th>
              {cars.map(car => (
                <th key={car.id} className="px-4 py-3 text-left min-w-48">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {car.imageUrl && (
                        <img
                          src={car.imageUrl}
                          alt={car.title}
                          className="w-full h-24 object-cover rounded-lg mb-2"
                        />
                      )}
                      <div className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{car.title}</div>
                    </div>
                    <button
                      onClick={() => { onRemove(car); navigate(-1); }}
                      className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-4 py-3 text-xs font-medium text-gray-500 align-top">{row.label}</td>
                {cars.map(car => (
                  <td key={car.id} className="px-4 py-3 text-sm text-gray-800 align-top">
                    {row.render(car)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
