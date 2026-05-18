'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import {
  RefreshCw,
  LayoutDashboard,
  CalendarCheck,
  Bell,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Users,
  TrendingUp,
} from 'lucide-react';
import apiClient from '../lib/axios';
import AppShell from '../components/layout/AppShell';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import SyncPanel from '../components/dashboard/SyncPanel';
import PlanningTable from '../components/planning/PlanningTable';
import PlanningFilters from '../components/planning/PlanningFilters';
import RemindersTable from '../components/reminders/RemindersTable';
import Loader from '../components/ui/Loader';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Assiduity';
const ORG_NAME = process.env.NEXT_PUBLIC_ORGANIZATION_NAME || 'Australe Formation';
const CURRENT_YEAR = new Date().getFullYear();

export default function HomePage() {
  // Dashboard
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Planning
  const [planningData, setPlanningData] = useState([]);
  const [planningLoading, setPlanningLoading] = useState(false);
  const [planningFilters, setPlanningFilters] = useState({
    year: CURRENT_YEAR,
    status: 'all',
    search: '',
  });

  // Reminders
  const [remindersData, setRemindersData] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersFilters, setRemindersFilters] = useState({
    year: CURRENT_YEAR,
    priority: 'all',
    search: '',
  });
  const [historySummary, setHistorySummary] = useState({});

  // GSAP hero ref
  const heroRef = useRef(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.gsap-hero-item'),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.55, ease: 'power2.out' }
      );
    }
  }, []);

  // Load dashboard
  const loadDashboard = useCallback(async () => {
    try {
      setDashboardLoading(true);
      setDashboardError(null);
      const { data } = await apiClient.get('/dashboard');
      if (data.success) {
        setDashboardStats({ planning: data.planning, reminders: data.reminders });
      }
    } catch (err) {
      setDashboardError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Load planning
  const loadPlanning = useCallback(async (filters) => {
    try {
      setPlanningLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.set('year', filters.year);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      const { data } = await apiClient.get(`/planning?${params.toString()}`);
      if (data.success) setPlanningData(data.data || []);
    } catch (err) {
      console.error('Planning load error:', err.message);
    } finally {
      setPlanningLoading(false);
    }
  }, []);

  // Load reminders
  const loadReminders = useCallback(async (filters) => {
    try {
      setRemindersLoading(true);
      const params = new URLSearchParams();
      if (filters.year) params.set('year', filters.year);
      if (filters.priority && filters.priority !== 'all') params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      const { data } = await apiClient.get(`/reminders?${params.toString()}`);
      if (data.success) setRemindersData(data.data || []);
    } catch (err) {
      console.error('Reminders load error:', err.message);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  // Load history summary
  const loadHistorySummary = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/reminder-history/summary');
      if (data.success) setHistorySummary(data.summary || {});
    } catch {
      // non-blocking
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboard();
    loadPlanning(planningFilters);
    loadReminders(remindersFilters);
    loadHistorySummary();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-filter planning on filter change
  useEffect(() => {
    loadPlanning(planningFilters);
  }, [planningFilters, loadPlanning]);

  // Re-filter reminders on filter change
  useEffect(() => {
    loadReminders(remindersFilters);
  }, [remindersFilters, loadReminders]);

  // After sync
  const handleSyncComplete = useCallback(() => {
    loadDashboard();
    loadPlanning(planningFilters);
    loadReminders(remindersFilters);
    loadHistorySummary();
  }, [loadDashboard, loadPlanning, loadReminders, loadHistorySummary, planningFilters, remindersFilters]);

  // After marking reminder
  const handleReminderMarked = useCallback(
    (reminderId) => {
      setHistorySummary((prev) => ({
        ...prev,
        [reminderId]: (prev[reminderId] || 0) + 1,
      }));
    },
    []
  );

  return (
    <AppShell>
      {/* Hero */}
      <div ref={heroRef} className="mb-8">
        <div className="gsap-hero-item flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0d6efd] flex items-center justify-center shadow-lg">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
            <p className="text-sm text-gray-500">{ORG_NAME} — Suivi des formations &amp; émargements</p>
          </div>
        </div>

        <div className="gsap-hero-item flex items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-[#0d6efd] border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d6efd] animate-pulse" />
            Connecté à Supabase
          </span>
          {dashboardStats?.lastSync && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
              <RefreshCw className="w-3 h-3" />
              Dernière sync :{' '}
              {new Date(dashboardStats.lastSync.started_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <section className="mb-8" id="dashboard">
        <div className="flex items-center gap-2 mb-4">
          <LayoutDashboard className="w-4 h-4 text-[#0d6efd]" />
          <h2 className="text-base font-bold text-gray-900">Vue d&apos;ensemble</h2>
          {dashboardLoading && <Loader size="sm" />}
          {dashboardError && (
            <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">{dashboardError}</span>
          )}
        </div>

        {dashboardStats ? (
          <DashboardSummary planning={dashboardStats.planning} reminders={dashboardStats.reminders} />
        ) : dashboardLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center text-sm text-gray-500">
            Aucune donnée. Lancez une synchronisation pour commencer.
          </div>
        )}
      </section>

      {/* Sync Panel */}
      <section className="mb-8">
        <SyncPanel onSyncComplete={handleSyncComplete} />
      </section>

      {/* Planning */}
      <section className="mb-8" id="planning">
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck className="w-4 h-4 text-[#0d6efd]" />
          <h2 className="text-base font-bold text-gray-900">Suivi du planning</h2>
          {planningLoading && <Loader size="sm" />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)] p-5">
          <PlanningFilters filters={planningFilters} onChange={setPlanningFilters} />
          <PlanningTable data={planningData} loading={planningLoading} />
        </div>
      </section>

      {/* Reminders */}
      <section id="reminders">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#dc3545]" />
          <h2 className="text-base font-bold text-gray-900">Relances émargements</h2>
          {remindersLoading && <Loader size="sm" />}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_0_rgba(13,110,253,0.07)] p-5">
          {/* Reminders filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <input
                type="text"
                placeholder="Rechercher apprenant, email, formation…"
                value={remindersFilters.search || ''}
                onChange={(e) => setRemindersFilters((f) => ({ ...f, search: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <select
              value={remindersFilters.priority || 'all'}
              onChange={(e) => setRemindersFilters((f) => ({ ...f, priority: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
            >
              <option value="all">Toutes les priorités</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="normal">Normale</option>
            </select>
            <select
              value={remindersFilters.year || CURRENT_YEAR}
              onChange={(e) => setRemindersFilters((f) => ({ ...f, year: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d6efd] bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <RemindersTable
            data={remindersData}
            loading={remindersLoading}
            historySummary={historySummary}
            onMarked={handleReminderMarked}
          />
        </div>
      </section>
    </AppShell>
  );
}
