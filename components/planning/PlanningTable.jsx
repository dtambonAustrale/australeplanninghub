'use client';

import { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import { getStatusBadgeConfig, formatPipelineState } from '../../lib/utils/formatters';
import { formatDateFR } from '../../lib/utils/dates';
import { objectsToCSV, downloadCSV, PLANNING_CSV_COLUMNS } from '../../lib/utils/csv';

export default function PlanningTable({ data = [], loading }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    const csv = objectsToCSV(data, PLANNING_CSV_COLUMNS);
    downloadCSV(csv, `planning-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>;
  if (!data.length) return <EmptyState title="Aucun résultat de planning" description="Lancez une synchronisation pour importer les données." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">{data.length} résultat(s)</p>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Apprenant</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Formation</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Période</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Créneaux</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const badge = getStatusBadgeConfig(row.status_code);
              return (
                <tr key={`${row.session_id}_${row.trainee_id}_${i}`} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{row.email || 'Pas d\'email'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.session_name || '—'}</p>
                    <Badge color={row.session_status === 'ongoing' ? 'primary' : 'default'} className="mt-0.5">
                      {formatPipelineState(row.session_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {formatDateFR(row.session_start_date)} → {formatDateFR(row.session_end_date)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-800 font-medium">{row.slots_count}</span>
                    <span className="text-gray-400"> / {row.total_session_slots}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={badge.color}>{badge.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-48">
                    {row.recommended_action || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
