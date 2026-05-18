'use client';

import { Users, CheckCircle, AlertTriangle, XCircle, Bell, AlertOctagon, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';

export default function DashboardSummary({ planning, reminders }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Planning</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Apprenants" value={planning?.totalLearners ?? 0} icon={Users} color="primary" />
          <StatCard title="Planning OK" value={planning?.totalOk ?? 0} icon={CheckCircle} color="success" />
          <StatCard title="Manquants" value={planning?.totalMissing ?? 0} icon={XCircle} color="danger" />
          <StatCard title="Avertissements" value={planning?.totalWarning ?? 0} icon={AlertTriangle} color="warning" />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Émargements</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Relances totales" value={reminders?.totalReminders ?? 0} icon={Bell} color="primary" />
          <StatCard title="Critiques" value={reminders?.totalCritical ?? 0} icon={AlertOctagon} color="danger" />
          <StatCard title="Priorité haute" value={reminders?.totalHigh ?? 0} icon={TrendingUp} color="warning" />
          <StatCard title="Normales" value={reminders?.totalNormal ?? 0} icon={Bell} color="primary" subtitle="< 3 jours" />
        </div>
      </div>
    </div>
  );
}
