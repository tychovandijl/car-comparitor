import React from 'react';

export default function ScoreBar({ label, value, scoreClass }) {
  const fillClass = {
    excellent: 'bg-green-500',
    good: 'bg-lime-500',
    average: 'bg-yellow-400',
    poor: 'bg-red-500',
  }[scoreClass] || 'bg-blue-400';

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-500 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-600 font-medium">{value}</span>
    </div>
  );
}
