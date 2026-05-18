-- Assiduity — Schéma PostgreSQL Supabase
-- À exécuter dans le SQL Editor de Supabase

-- ============================================================
-- TABLE : sync_runs
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_runs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  target_year INTEGER,
  pipeline_state TEXT,
  total_sessions_fetched INTEGER DEFAULT 0,
  total_sessions_synced INTEGER DEFAULT 0,
  total_errors INTEGER DEFAULT 0,
  error_message TEXT
);

-- ============================================================
-- TABLE : training_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id TEXT PRIMARY KEY,
  name TEXT,
  code TEXT,
  start_date DATE,
  end_date DATE,
  pipeline_state TEXT,
  training_type TEXT,
  type TEXT,
  timezone TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : trainees
-- ============================================================
CREATE TABLE IF NOT EXISTS trainees (
  id TEXT PRIMARY KEY,
  firstname TEXT,
  lastname TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  phone_secondary TEXT,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : session_trainees
-- ============================================================
CREATE TABLE IF NOT EXISTS session_trainees (
  session_id TEXT REFERENCES training_sessions(id) ON DELETE CASCADE,
  trainee_id TEXT REFERENCES trainees(id) ON DELETE CASCADE,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (session_id, trainee_id)
);

-- ============================================================
-- TABLE : training_session_slots
-- ============================================================
CREATE TABLE IF NOT EXISTS training_session_slots (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES training_sessions(id) ON DELETE CASCADE,
  slot_date DATE,
  start_time TEXT,
  end_time TEXT,
  slot_label TEXT,
  subsession_id TEXT,
  subsession_name TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE : slot_trainees
-- ============================================================
CREATE TABLE IF NOT EXISTS slot_trainees (
  slot_id TEXT REFERENCES training_session_slots(id) ON DELETE CASCADE,
  trainee_id TEXT REFERENCES trainees(id) ON DELETE CASCADE,
  customer_trainee_id TEXT,
  extranet_url TEXT,
  attendance_proof_url TEXT,
  has_signature BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (slot_id, trainee_id)
);

-- ============================================================
-- TABLE : planning_results
-- ============================================================
CREATE TABLE IF NOT EXISTS planning_results (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT,
  trainee_id TEXT,
  full_name TEXT,
  email TEXT,
  session_name TEXT,
  session_status TEXT,
  session_start_date DATE,
  session_end_date DATE,
  slots_count INTEGER DEFAULT 0,
  total_session_slots INTEGER DEFAULT 0,
  status_code TEXT,
  status_label TEXT,
  recommended_action TEXT,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, trainee_id)
);

-- ============================================================
-- TABLE : signature_reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS signature_reminders (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  trainee_id TEXT,
  slot_id TEXT,
  customer_trainee_id TEXT,
  full_name TEXT,
  firstname TEXT,
  lastname TEXT,
  email TEXT,
  phone TEXT,
  session_name TEXT,
  session_code TEXT,
  session_status TEXT,
  slot_date DATE,
  start_time TEXT,
  end_time TEXT,
  subsession_name TEXT,
  days_late INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'normal',
  extranet_url TEXT,
  attendance_proof_url TEXT,
  email_message TEXT,
  whatsapp_message TEXT,
  status_code TEXT DEFAULT 'missing_signature',
  status_label TEXT DEFAULT 'Émargement non signé',
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, trainee_id, slot_id)
);

-- ============================================================
-- TABLE : reminder_history
-- ============================================================
CREATE TABLE IF NOT EXISTS reminder_history (
  id BIGSERIAL PRIMARY KEY,
  reminder_id TEXT NOT NULL,
  session_id TEXT,
  trainee_id TEXT,
  slot_id TEXT,
  action_type TEXT DEFAULT 'manual_reminder',
  channel TEXT,
  message TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_training_sessions_dates
  ON training_sessions (start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_pipeline
  ON training_sessions (pipeline_state);

CREATE INDEX IF NOT EXISTS idx_planning_results_status_code
  ON planning_results (status_code);

CREATE INDEX IF NOT EXISTS idx_planning_results_session_status
  ON planning_results (session_status);

CREATE INDEX IF NOT EXISTS idx_signature_reminders_priority
  ON signature_reminders (priority);

CREATE INDEX IF NOT EXISTS idx_signature_reminders_slot_date
  ON signature_reminders (slot_date);

CREATE INDEX IF NOT EXISTS idx_signature_reminders_session_status
  ON signature_reminders (session_status);

CREATE INDEX IF NOT EXISTS idx_reminder_history_reminder_id
  ON reminder_history (reminder_id);

CREATE INDEX IF NOT EXISTS idx_reminder_history_created_at
  ON reminder_history (created_at);

-- ============================================================
-- RLS — désactivé pour usage interne V1
-- ============================================================
ALTER TABLE sync_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE session_trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_session_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE slot_trainees DISABLE ROW LEVEL SECURITY;
ALTER TABLE planning_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE signature_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history DISABLE ROW LEVEL SECURITY;
