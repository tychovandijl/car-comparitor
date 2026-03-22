import React from 'react';
import { X, GitCompare, Trash2 } from 'lucide-react';

export default function CompareBar({ cars, onRemove, onClear, onCompare }) {
  if (cars.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 animate-in slide-in-from-bottom duration-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          <span className="text-sm font-medium text-gray-600 shrink-0">Vergelijken:</span>
          {cars.map(car => (
            <div key={car.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5 shrink-0">
              <span className="text-xs font-medium text-blue-800 max-w-32 truncate">{car.title}</span>
              <button
                onClick={() => onRemove(car)}
                className="text-blue-400 hover:text-blue-700 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Trash2 size={14} />
            Wis alles
          </button>
          <button
            onClick={onCompare}
            disabled={cars.length < 2}
            className="flex items-center gap-1.5 text-sm font-medium bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <GitCompare size={14} />
            Vergelijk {cars.length} auto's
          </button>
        </div>
      </div>
    </div>
  );
}
