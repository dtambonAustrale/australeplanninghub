'use client';

import { useState } from 'react';
import { RefreshCw, Play, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { syncApiClient } from '../../lib/axios';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';

const BATCH_SIZE = 3;

export default function SyncPanel({ onSyncComplete }) {
  const [config, setConfig] = useState({
    targetYear: new Date().getFullYear(),
    pipelineState: 'ongoing',
    onlyActive: true,
    maxSessions: 50,
    batchSize: BATCH_SIZE,
  });

  const [syncState, setSyncState] = useState({
    status: 'idle',
    syncRunId: null,
    sessions: [],
    totalSessions: 0,
    syncedSessions: 0,
    errors: [],
    message: '',
  });

  const updateState = (patch) => setSyncState((s) => ({ ...s, ...patch }));

  const handleStartSync = async () => {
    updateState({ status: 'starting', message: 'Démarrage de la synchronisation…', errors: [], syncedSessions: 0 });

    try {
      const { data: startData } = await syncApiClient.post('/sync/digiforma/start', {
        targetYear: config.targetYear,
        pipelineState: config.pipelineState,
        onlyActive: config.onlyActive,
        maxSessions: config.maxSessions,
      });

      if (!startData.success) throw new Error(startData.error || 'Erreur au démarrage');

      const { syncRunId, sessions, totalSessions } = startData;
      updateState({ status: 'running', syncRunId, sessions, totalSessions, message: `${totalSessions} session(s) à synchroniser…` });

      // Process batches
      const batchSize = config.batchSize || BATCH_SIZE;
      const allErrors = [];
      let synced = 0;

      for (let i = 0; i < sessions.length; i += batchSize) {
        const batch = sessions.slice(i, i + batchSize);
        const sessionIds = batch.map((s) => s.id);

        updateState({ message: `Batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(sessions.length / batchSize)}…` });

        const { data: batchData } = await syncApiClient.post('/sync/digiforma/batch', {
          syncRunId,
          sessionIds,
          targetYear: config.targetYear,
          pipelineState: config.pipelineState,
        });

        synced += batchData.syncedSessions || 0;
        allErrors.push(...(batchData.errors || []));
        updateState({ syncedSessions: synced, errors: allErrors });
      }

      // Finish
      await syncApiClient.post('/sync/digiforma/finish', { syncRunId });
      updateState({ status: 'done', message: `Synchronisation terminée — ${synced} session(s) synchronisée(s).`, errors: allErrors });

      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      updateState({ status: 'error', message: err.message || 'Une erreur est survenue.' });
    }
  };

  const statusColors = {
    idle: 'text-gray-500',
    starting: 'text-blue-600',
    running: 'text-blue-600',
    done: 'text-green-600',
    error: 'text-red-600',
  };

  const StatusIcon = {
    idle: RefreshCw,
    starting: RefreshCw,
    running: RefreshCw,
    done: CheckCircle,
    error: XCircle,
  }[syncState.status] || RefreshCw;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)] p-6" id="sync">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-[#0d6efd]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Synchronisation Digiforma</h2>
          <p className="text-xs text-gray-500">Importer les données depuis Digiforma vers Supabase</p>
        </div>
      </div>

      {/* Config */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Année cible</label>
          <input
            type="number"
            value={config.targetYear}
            onChange={(e) => setConfig((c) => ({ ...c, targetYear: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">État session</label>
          <select
            value={config.pipelineState}
            onChange={(e) => setConfig((c) => ({ ...c, pipelineState: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
          >
            <option value="ongoing">En cours</option>
            <option value="finished">Terminées</option>
            <option value="planned">Planifiées</option>
            <option value="">Tous</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Max sessions</label>
          <input
            type="number"
            value={config.maxSessions}
            onChange={(e) => setConfig((c) => ({ ...c, maxSessions: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Taille batch</label>
          <input
            type="number"
            value={config.batchSize}
            onChange={(e) => setConfig((c) => ({ ...c, batchSize: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center gap-4 mb-5">
        <Button
          onClick={handleStartSync}
          disabled={syncState.status === 'starting' || syncState.status === 'running'}
          loading={syncState.status === 'starting' || syncState.status === 'running'}
          size="md"
        >
          <Play className="w-4 h-4" />
          Démarrer la synchronisation
        </Button>

        {syncState.status !== 'idle' && (
          <div className={`flex items-center gap-1.5 text-sm font-medium ${statusColors[syncState.status]}`}>
            <StatusIcon className={`w-4 h-4 ${syncState.status === 'running' || syncState.status === 'starting' ? 'animate-spin' : ''}`} />
            {syncState.message}
          </div>
        )}
      </div>

      {/* Progress */}
      <AnimatePresence>
        {(syncState.status === 'running' || syncState.status === 'done') && syncState.totalSessions > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <ProgressBar
              value={syncState.syncedSessions}
              max={syncState.totalSessions}
              label="Sessions synchronisées"
              color={syncState.status === 'done' ? 'success' : 'primary'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Errors */}
      {syncState.errors.length > 0 && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-xs font-medium text-red-700 mb-1">{syncState.errors.length} erreur(s)</p>
          <ul className="text-xs text-red-600 space-y-0.5">
            {syncState.errors.slice(0, 5).map((e, i) => (
              <li key={i}>Session {e.sessionId}: {e.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
