'use client';

import { Search, Filter } from 'lucide-react';

export default function PlanningFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher apprenant, email, formation…"
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={filters.status || 'all'}
          onChange={(e) => update('status', e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
        >
          <option value="all">Tous les statuts</option>
          <option value="ok">OK</option>
          <option value="missing">Manquant</option>
          <option value="warning">Avertissement</option>
        </select>
      </div>

      <select
        value={filters.year || new Date().getFullYear()}
        onChange={(e) => update('year', e.target.value)}
        className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
      >
        {[2024, 2025, 2026, 2027].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
