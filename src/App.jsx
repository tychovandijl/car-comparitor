import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SearchPage from './pages/SearchPage';
import ComparePage from './pages/ComparePage';
import CompareBar from './components/CompareBar';

export default function App() {
  const [compareList, setCompareList] = useState([]);
  const navigate = useNavigate();

  function toggleCompare(car) {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === car.id);
      if (exists) return prev.filter(c => c.id !== car.id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, car];
    });
  }

  function clearCompare() {
    setCompareList([]);
  }

  function goCompare() {
    navigate('/vergelijk', { state: { cars: compareList } });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl">
            <span className="text-2xl">🚗</span>
            AutoVergelijker
            <span className="text-[10px] font-normal text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 ml-1">{__GIT_HASH__}</span>
          </a>
          <span className="text-sm text-gray-500 hidden sm:block">
            Vergelijk auto's van Marktplaats &amp; AutoScout24
          </span>
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <SearchPage
                compareList={compareList}
                onToggleCompare={toggleCompare}
              />
            }
          />
          <Route
            path="/vergelijk"
            element={<ComparePage onRemove={toggleCompare} />}
          />
        </Routes>
      </main>

      <CompareBar
        cars={compareList}
        onRemove={toggleCompare}
        onClear={clearCompare}
        onCompare={goCompare}
      />
    </div>
  );
}
