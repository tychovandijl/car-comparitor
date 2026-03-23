import React from 'react';
import { ExternalLink, CheckSquare, Square } from 'lucide-react';
import ScoreBar from './ScoreBar';

const SOURCE_COLORS = {
  marktplaats: 'bg-orange-100 text-orange-800',
  autoscout24: 'bg-blue-100 text-blue-800',
};

const SOURCE_LABELS = {
  marktplaats: 'Marktplaats',
  autoscout24: 'AutoScout24',
};

const SCORE_BADGE = {
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

export default function CarCard({ car, isSelected, onToggleCompare }) {
  const { scores } = car;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-150 flex flex-col overflow-hidden
        ${isSelected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-gray-200'}`}
    >
      {/* Afbeelding */}
      <div className="relative">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {car.imageUrl ? (
            <img
              src={car.imageUrl}
              alt={car.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">
              🚗
            </div>
          )}
        </div>

        {/* Score badge */}
        {scores && (
          <div
            className={`absolute top-2 right-2 rounded-full w-12 h-12 flex flex-col items-center justify-center text-white shadow-lg ${SCORE_BADGE[scores.class]}`}
          >
            <span className="text-sm font-bold leading-none">{scores.total}</span>
            <span className="text-[9px] leading-none opacity-80">/{100}</span>
          </div>
        )}

        {/* Bron badge */}
        <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${SOURCE_COLORS[car.source] || 'bg-gray-100 text-gray-700'}`}>
          {SOURCE_LABELS[car.source] || car.source}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 leading-tight line-clamp-1 text-sm">{car.brand} {car.model}</h3>
          {car.version && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{car.version}</p>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{car.year || '—'}</span>
            <span>·</span>
            <span>{formatKm(car.mileage)}</span>
            {car.fuel && <><span>·</span><span>{car.fuel}</span></>}
          </div>
        </div>

        <div className="text-lg font-bold text-gray-900">{formatPrice(car.price)}</div>

        {/* Score breakdown */}
        {scores?.breakdown && (
          <div className="flex flex-col gap-1 py-1 border-t border-gray-50">
            <ScoreBar label="Prijs" value={scores.breakdown.price} scoreClass={scores.class} />
            <ScoreBar label="Kilometerstand" value={scores.breakdown.mileage} scoreClass={scores.class} />
            <ScoreBar label="Bouwjaar" value={scores.breakdown.year} scoreClass={scores.class} />
            <ScoreBar label="Brandstof" value={scores.breakdown.fuel} scoreClass={scores.class} />
            <ScoreBar label="Uitrusting" value={scores.breakdown.features} scoreClass={scores.class} />
          </div>
        )}

        {/* Uitrusting tags */}
        {car.features?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {car.features.slice(0, 4).map(f => (
              <span key={f} className="text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{f}</span>
            ))}
            {car.features.length > 4 && (
              <span className="text-[10px] text-gray-400">+{car.features.length - 4}</span>
            )}
          </div>
        )}

        {/* Acties */}
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-50">
          <button
            onClick={() => onToggleCompare(car)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors flex-1
              ${isSelected
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
            {isSelected ? 'Geselecteerd' : 'Vergelijk'}
          </button>
          <a
            href={car.adUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
          >
            <ExternalLink size={11} />
            Advertentie
          </a>
        </div>
      </div>
    </div>
  );
}
