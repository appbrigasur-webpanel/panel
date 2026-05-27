-- Migración para Reportes Mensuales
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  installation_name TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  pdf_url TEXT,
  summary_data JSONB, -- { totalScans: number, compliancePercentage: number, incidentsCount: number, sosCount: number }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by TEXT DEFAULT 'System'
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_monthly_reports_installation ON monthly_reports(installation_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_date ON monthly_reports(year, month);

-- RLS
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON monthly_reports FOR ALL USING (true);
