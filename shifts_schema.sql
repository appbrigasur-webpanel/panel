-- Migración para Turnos y Ausencias
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  installation_name TEXT NOT NULL,
  date DATE NOT NULL,
  shift_type TEXT NOT NULL, -- 'Día', 'Noche', '24h'
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guard_id UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL, -- 'Médica', 'Vacaciones', 'Permiso', 'Falta Injustificada'
  status TEXT NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobada', 'Rechazada'
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shift_assignments(date);
CREATE INDEX IF NOT EXISTS idx_shifts_guard ON shift_assignments(guard_id);
CREATE INDEX IF NOT EXISTS idx_absences_guard ON absences(guard_id);

-- RLS
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users" ON shift_assignments FOR ALL USING (true);
CREATE POLICY "Enable all for authenticated users" ON absences FOR ALL USING (true);
