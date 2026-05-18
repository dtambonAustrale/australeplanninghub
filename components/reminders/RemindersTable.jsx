'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import ReminderActions from './ReminderActions';
import { getPriorityBadgeConfig, formatPipelineState } from '../../lib/utils/formatters';
import { formatDateFR, formatTime } from '../../lib/utils/dates';
import { objectsToCSV, downloadCSV, REMINDERS_CSV_COLUMNS } from '../../lib/utils/csv';

export default function RemindersTable({ data = [], loading, historySummary = {}, onMarked }) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.ceil(data.length / pageSize);
  const paged = data.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    const csv = objectsToCSV(data, REMINDERS_CSV_COLUMNS);
    downloadCSV(csv, `relances-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Chargement…</div>;
  if (!data.length) return <EmptyState title="Aucune relance" description="Aucun émargement manquant détecté. Lancez une synchronisation pour mettre à jour les données." />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">{data.length} relance(s)</p>
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
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Créneau</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Retard</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Priorité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => {
              const priority = getPriorityBadgeConfig(row.priority);
              return (
                <tr key={`${row.id}_${i}`} className="border-b border-gray-50 hover:bg-red-50/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{row.email || '—'}</p>
                    {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{row.session_name || '—'}</p>
                    {row.session_code && <p className="text-xs text-gray-400">{row.session_code}</p>}
                    <Badge color={row.session_status === 'ongoing' ? 'primary' : 'default'} className="mt-0.5">
                      {formatPipelineState(row.session_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p className="font-medium">{formatDateFR(row.slot_date)}</p>
                    <p className="text-gray-400">{formatTime(row.start_time)} – {formatTime(row.end_time)}</p>
                    {row.subsession_name && <p className="text-gray-400 italic">{row.subsession_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold text-sm ${row.days_late >= 7 ? 'text-red-600' : row.days_late >= 3 ? 'text-yellow-600' : 'text-gray-600'}`}>
                      {row.days_late}j
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={priority.color}>{priority.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ReminderActions reminder={row} historySummary={historySummary} onMarked={onMarked} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Précédent</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Suivant</button>
        </div>
      )}
    </div>
  );
}
