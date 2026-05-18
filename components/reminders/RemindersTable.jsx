'use client';

import { useState, useCallback } from 'react';
import { Download, Send, Loader2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import ReminderActions from './ReminderActions';
import { getPriorityBadgeConfig, formatPipelineState } from '../../lib/utils/formatters';
import { formatDateFR, formatTime } from '../../lib/utils/dates';
import { objectsToCSV, downloadCSV, REMINDERS_CSV_COLUMNS } from '../../lib/utils/csv';
import apiClient from '../../lib/axios';

const PAGE_SIZE = 20;

export default function RemindersTable({ data = [], loading, historySummary = {}, onMarked }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paged = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Selection helpers
  const allPageSelected = paged.length > 0 && paged.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0;

  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    if (allPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const selectAll = () => setSelected(new Set(data.map((r) => r.id)));
  const clearSelection = () => setSelected(new Set());

  const handleExportCSV = () => {
    const toExport = someSelected ? data.filter((r) => selected.has(r.id)) : data;
    const csv = objectsToCSV(toExport, REMINDERS_CSV_COLUMNS);
    downloadCSV(csv, `relances-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleBulkSend = useCallback(async () => {
    if (!someSelected || bulkSending) return;
    setBulkSending(true);
    setBulkResult(null);
    try {
      const ids = [...selected];
      const { data: result } = await apiClient.post('/reminders/send-bulk', {
        reminderIds: ids,
        createdBy: 'Australe Formation',
      });
      setBulkResult(result);
      // Update history counts locally
      ids.forEach((id) => { if (onMarked) onMarked(id); });
      clearSelection();
    } catch (err) {
      setBulkResult({ success: false, error: err.message });
    } finally {
      setBulkSending(false);
    }
  }, [selected, bulkSending, onMarked]);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center gap-2 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement des relances…
      </div>
    );
  }

  if (!data.length) {
    return (
      <EmptyState
        title="Aucune relance"
        description="Aucun émargement manquant détecté. Lancez une synchronisation pour mettre à jour les données."
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{data.length} relance(s)</p>
          {someSelected && (
            <span className="text-xs bg-blue-50 text-[#0d6efd] border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              {selected.size} sélectionnée(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {someSelected && (
            <button
              onClick={handleBulkSend}
              disabled={bulkSending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d6efd] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer les emails ({selected.size})
            </button>
          )}
          {data.length > 0 && (
            <button
              onClick={selectAll}
              className="text-xs text-gray-500 hover:text-gray-800 underline"
            >
              Tout sélectionner ({data.length})
            </button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            {someSelected ? `Export (${selected.size})` : 'Export CSV'}
          </Button>
        </div>
      </div>

      {/* Bulk send result */}
      <AnimatePresence>
        {bulkResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-3 p-3 rounded-xl border text-sm flex items-center gap-2 ${
              bulkResult.success
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {bulkResult.success ? (
              <>
                <CheckSquare className="w-4 h-4 flex-shrink-0" />
                <span>
                  <strong>{bulkResult.sent}</strong> email(s) envoyé(s)
                  {bulkResult.skipped > 0 && `, ${bulkResult.skipped} ignoré(s) (pas d'email)`}
                  {bulkResult.errors?.length > 0 && `, ${bulkResult.errors.length} erreur(s)`}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bulkResult.error}</span>
              </>
            )}
            <button
              onClick={() => setBulkResult(null)}
              className="ml-auto text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-10">
                <button onClick={togglePage} className="text-gray-400 hover:text-gray-700">
                  {allPageSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#0d6efd]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Apprenant</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Formation</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Créneau</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Retard</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Priorité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => {
              const priority = getPriorityBadgeConfig(row.priority);
              const isSelected = selected.has(row.id);
              return (
                <tr
                  key={row.id}
                  className={`border-b border-gray-50 transition-colors ${
                    isSelected ? 'bg-blue-50/40' : 'hover:bg-red-50/20'
                  }`}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRow(row.id)} className="text-gray-400 hover:text-[#0d6efd]">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#0d6efd]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{row.full_name || '—'}</p>
                    {row.email ? (
                      <p className="text-xs text-gray-400">{row.email}</p>
                    ) : (
                      <p className="text-xs text-red-400 font-medium">Pas d'email</p>
                    )}
                    {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 leading-snug">{row.session_name || '—'}</p>
                    {row.session_code && <p className="text-xs text-gray-400">{row.session_code}</p>}
                    <Badge color={row.session_status === 'ongoing' ? 'primary' : 'default'} className="mt-0.5">
                      {formatPipelineState(row.session_status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <p className="font-medium">{formatDateFR(row.slot_date)}</p>
                    <p className="text-gray-400">{formatTime(row.start_time)} – {formatTime(row.end_time)}</p>
                    {row.subsession_name && (
                      <p className="text-gray-400 italic truncate max-w-32">{row.subsession_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold text-sm tabular-nums ${
                        row.days_late >= 7
                          ? 'text-red-600'
                          : row.days_late >= 3
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {row.days_late}j
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={priority.color}>{priority.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ReminderActions
                      reminder={row}
                      historySummary={historySummary}
                      onMarked={onMarked}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Floating selection bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#071525] text-white px-5 py-3 rounded-2xl shadow-xl"
          >
            <span className="text-sm font-medium">{selected.size} relance(s) sélectionnée(s)</span>
            <button
              onClick={handleBulkSend}
              disabled={bulkSending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0d6efd] rounded-xl text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-60"
            >
              {bulkSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Envoyer les emails
            </button>
            <button
              onClick={clearSelection}
              className="text-white/50 hover:text-white text-sm transition-colors"
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
