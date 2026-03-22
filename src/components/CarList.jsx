import React from 'react';
import CarCard from './CarCard';
import { Loader2 } from 'lucide-react';

export default function CarList({ cars, loading, error, compareList, onToggleCompare }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <span>Auto's worden opgehaald...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
        <span className="text-4xl">⚠️</span>
        <span className="font-medium">Er ging iets mis</span>
        <span className="text-sm text-gray-500">{error}</span>
      </div>
    );
  }

  if (!cars) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <span className="text-5xl">🔍</span>
        <span className="font-medium text-gray-500">Zoek naar auto's om te beginnen</span>
        <span className="text-sm">Voer een merk, model of zoekterm in</span>
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <span className="text-5xl">😔</span>
        <span className="font-medium text-gray-500">Geen auto's gevonden</span>
        <span className="text-sm">Pas de filters aan om meer resultaten te zien</span>
      </div>
    );
  }

  const compareIds = new Set(compareList.map(c => c.id));

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{cars.length} auto's gevonden</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cars.map(car => (
          <CarCard
            key={car.id}
            car={car}
            isSelected={compareIds.has(car.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>
    </div>
  );
}
