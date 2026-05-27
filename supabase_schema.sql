-- ============================================
-- PANEL BRIGASUR - SCHEMA DE BASE DE DATOS
-- ============================================
-- Este script crea todas las tablas necesarias para el Panel Brigasur
-- Ejecutar en: Supabase SQL Editor
-- Proyecto: rdhylrhychcfqoirvzuz
-- ============================================

-- 1. CREAR TIPOS ENUM
-- ============================================

-- Tipo para logs
CREATE TYPE log_type AS ENUM ('QR', 'NFC', 'INCIDENT', 'SOS');

-- Tipo para roles de administrador
CREATE TYPE admin_role AS ENUM ('Admin', 'Super Admin');

-- 2. CREAR TABLAS
-- ============================================

-- Tabla: installations (debe crearse primero por las foreign keys)
CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  required_daily_scans INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: guards
CREATE TABLE IF NOT EXISTS guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  os10_expiry TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_installation_id UUID REFERENCES installations(id) ON DELETE SET NULL,
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: supervisors
CREATE TABLE IF NOT EXISTS supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  os10_expiry TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_installation_id UUID REFERENCES installations(id) ON DELETE SET NULL,
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: logs
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type log_type NOT NULL,
  title TEXT,
  detail TEXT,
  guard_id UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  installation_name TEXT NOT NULL,
  point_name TEXT,
  tag_id TEXT,
  photos TEXT[],
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: system_admins
CREATE TABLE IF NOT EXISTS system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role admin_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para guards
CREATE INDEX IF NOT EXISTS idx_guards_rut ON guards(rut);
CREATE INDEX IF NOT EXISTS idx_guards_email ON guards(email);
CREATE INDEX IF NOT EXISTS idx_guards_is_active ON guards(is_active);
CREATE INDEX IF NOT EXISTS idx_guards_installation ON guards(assigned_installation_id);

-- Índices para supervisors
CREATE INDEX IF NOT EXISTS idx_supervisors_rut ON supervisors(rut);
CREATE INDEX IF NOT EXISTS idx_supervisors_email ON supervisors(email);
CREATE INDEX IF NOT EXISTS idx_supervisors_is_active ON supervisors(is_active);
CREATE INDEX IF NOT EXISTS idx_supervisors_installation ON supervisors(assigned_installation_id);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
CREATE INDEX IF NOT EXISTS idx_logs_guard_id ON logs(guard_id);
CREATE INDEX IF NOT EXISTS idx_logs_installation_id ON logs(installation_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);

-- Índices para installations
CREATE INDEX IF NOT EXISTS idx_installations_name ON installations(name);

-- Índices para system_admins
CREATE INDEX IF NOT EXISTS idx_system_admins_email ON system_admins(email);

-- 4. CREAR FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
CREATE TRIGGER update_guards_updated_at
  BEFORE UPDATE ON guards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supervisors_updated_at
  BEFORE UPDATE ON supervisors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installations_updated_at
  BEFORE UPDATE ON installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_admins_updated_at
  BEFORE UPDATE ON system_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- 6. CREAR POLÍTICAS DE SEGURIDAD (DESARROLLO)
-- ============================================
-- ⚠️ IMPORTANTE: Estas políticas son permisivas para desarrollo
-- En producción, debes implementar políticas más restrictivas

-- Políticas para guards
CREATE POLICY "Enable all for authenticated users" ON guards
  FOR ALL USING (true);

-- Políticas para supervisors
CREATE POLICY "Enable all for authenticated users" ON supervisors
  FOR ALL USING (true);

-- Políticas para installations
CREATE POLICY "Enable all for authenticated users" ON installations
  FOR ALL USING (true);

-- Políticas para logs
CREATE POLICY "Enable all for authenticated users" ON logs
  FOR ALL USING (true);

-- Políticas para system_admins
CREATE POLICY "Enable all for authenticated users" ON system_admins
  FOR ALL USING (true);

-- 7. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- Instalaciones de ejemplo
INSERT INTO installations (name, address, lat, lng, required_daily_scans) VALUES
  ('Torre Costanera', 'Av. Andrés Bello 2425, Providencia', -33.4172, -70.6062, 12),
  ('Mall Plaza Vespucio', 'Av. Vicuña Mackenna 7110, La Florida', -33.5283, -70.5951, 15),
  ('Edificio Titanium', 'Av. Isidora Goyenechea 2939, Las Condes', -33.4147, -70.6063, 10)
ON CONFLICT DO NOTHING;

-- Guardias de ejemplo
INSERT INTO guards (full_name, rut, phone, email, os10_expiry, is_active, shift) VALUES
  ('Juan Pérez González', '12.345.678-9', '+56912345678', 'juan.perez@example.com', '2025-12-31', true, 'Día'),
  ('María Silva Rojas', '98.765.432-1', '+56987654321', 'maria.silva@example.com', '2025-11-30', true, 'Noche'),
  ('Carlos Muñoz López', '11.222.333-4', '+56911222333', 'carlos.munoz@example.com', '2025-10-15', true, 'Día')
ON CONFLICT (rut) DO NOTHING;

-- Supervisores de ejemplo
INSERT INTO supervisors (full_name, rut, phone, email, os10_expiry, is_active, shift) VALUES
  ('Roberto Sánchez Torres', '15.555.666-7', '+56915555666', 'roberto.sanchez@example.com', '2026-01-31', true, 'Día'),
  ('Ana Martínez Flores', '16.777.888-9', '+56916777888', 'ana.martinez@example.com', '2026-02-28', true, 'Noche')
ON CONFLICT (rut) DO NOTHING;

-- Administradores de sistema de ejemplo
INSERT INTO system_admins (email, role) VALUES
  ('admin@brigasur.com', 'Admin'),
  ('super@brigasur.com', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

-- 8. VERIFICACIÓN
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('guards', 'supervisors', 'installations', 'logs', 'system_admins')
ORDER BY table_name;

-- Verificar conteo de registros
SELECT 
  'guards' as table_name, COUNT(*) as records FROM guards
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'installations', COUNT(*) FROM installations
UNION ALL
SELECT 'logs', COUNT(*) FROM logs
UNION ALL
SELECT 'system_admins', COUNT(*) FROM system_admins;

-- ============================================
-- 9. TABLA DE INCIDENCIAS (DEDICADA)
-- ============================================

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  guard_id UUID NOT NULL REFERENCES guards(id) ON DELETE CASCADE,
  guard_name TEXT NOT NULL,
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  installation_name TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Abierto', -- Abierto, En Proceso, Cerrado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda de incidencias
CREATE INDEX IF NOT EXISTS idx_incidents_guard_id ON incidents(guard_id);
CREATE INDEX IF NOT EXISTS idx_incidents_installation_id ON incidents(installation_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- RLS para incidencias
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users" ON incidents
  FOR ALL USING (true);

-- Trigger para automatizar updated_at en incidencias
CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DEL SCRIPT (ACTUALIZADO CON INCIDENCIAS)
-- ============================================
