-- ============================================
-- AUTENTICACIÓN Y ROLES - SUPABASE AUTH
-- ============================================
-- Este script configura el sistema de autenticación
-- con roles y permisos granulares
-- ============================================

-- 1. CREAR TABLA DE PERFILES DE USUARIO
-- ============================================
-- Esta tabla extiende auth.users con información adicional

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Supervisor', 'Guard')),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR TABLA DE PERMISOS
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREAR TABLA DE ROLES Y SUS PERMISOS
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_code)
);

-- 4. CREAR TABLA DE SESIONES 2FA
-- ============================================

CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 5. INSERTAR PERMISOS PREDEFINIDOS
-- ============================================

INSERT INTO permissions (code, name, description, category) VALUES
  -- Guardias
  ('guards:view', 'Ver Guardias', 'Puede ver la lista de guardias', 'Guardias'),
  ('guards:create', 'Crear Guardias', 'Puede crear nuevos guardias', 'Guardias'),
  ('guards:edit', 'Editar Guardias', 'Puede editar guardias existentes', 'Guardias'),
  ('guards:delete', 'Eliminar Guardias', 'Puede eliminar guardias', 'Guardias'),
  
  -- Supervisores
  ('supervisors:view', 'Ver Supervisores', 'Puede ver la lista de supervisores', 'Supervisores'),
  ('supervisors:create', 'Crear Supervisores', 'Puede crear nuevos supervisores', 'Supervisores'),
  ('supervisors:edit', 'Editar Supervisores', 'Puede editar supervisores existentes', 'Supervisores'),
  ('supervisors:delete', 'Eliminar Supervisores', 'Puede eliminar supervisores', 'Supervisores'),
  
  -- Instalaciones
  ('installations:view', 'Ver Instalaciones', 'Puede ver la lista de instalaciones', 'Instalaciones'),
  ('installations:create', 'Crear Instalaciones', 'Puede crear nuevas instalaciones', 'Instalaciones'),
  ('installations:edit', 'Editar Instalaciones', 'Puede editar instalaciones existentes', 'Instalaciones'),
  ('installations:delete', 'Eliminar Instalaciones', 'Puede eliminar instalaciones', 'Instalaciones'),
  
  -- Logs
  ('logs:view', 'Ver Registros', 'Puede ver registros de actividad', 'Registros'),
  ('logs:export', 'Exportar Registros', 'Puede exportar registros', 'Registros'),
  
  -- SOS
  ('sos:view', 'Ver Alertas SOS', 'Puede ver alertas SOS', 'Emergencias'),
  ('sos:respond', 'Responder SOS', 'Puede responder a alertas SOS', 'Emergencias'),
  
  -- Reportes
  ('reports:view', 'Ver Reportes', 'Puede ver reportes', 'Reportes'),
  ('reports:create', 'Crear Reportes', 'Puede crear reportes personalizados', 'Reportes'),
  ('reports:export', 'Exportar Reportes', 'Puede exportar reportes', 'Reportes'),
  
  -- Configuración
  ('settings:view', 'Ver Configuración', 'Puede ver configuración del sistema', 'Configuración'),
  ('settings:edit', 'Editar Configuración', 'Puede editar configuración del sistema', 'Configuración'),
  
  -- Usuarios
  ('users:view', 'Ver Usuarios', 'Puede ver la lista de usuarios', 'Usuarios'),
  ('users:create', 'Crear Usuarios', 'Puede crear nuevos usuarios', 'Usuarios'),
  ('users:edit', 'Editar Usuarios', 'Puede editar usuarios existentes', 'Usuarios'),
  ('users:delete', 'Eliminar Usuarios', 'Puede eliminar usuarios', 'Usuarios')
ON CONFLICT (code) DO NOTHING;

-- 6. ASIGNAR PERMISOS A ROLES
-- ============================================

-- Super Admin: Todos los permisos
INSERT INTO role_permissions (role, permission_code)
SELECT 'Super Admin', code FROM permissions
ON CONFLICT DO NOTHING;

-- Admin: Todos excepto gestión de usuarios y configuración avanzada
INSERT INTO role_permissions (role, permission_code) VALUES
  ('Admin', 'guards:view'),
  ('Admin', 'guards:create'),
  ('Admin', 'guards:edit'),
  ('Admin', 'guards:delete'),
  ('Admin', 'supervisors:view'),
  ('Admin', 'supervisors:create'),
  ('Admin', 'supervisors:edit'),
  ('Admin', 'supervisors:delete'),
  ('Admin', 'installations:view'),
  ('Admin', 'installations:create'),
  ('Admin', 'installations:edit'),
  ('Admin', 'installations:delete'),
  ('Admin', 'logs:view'),
  ('Admin', 'logs:export'),
  ('Admin', 'sos:view'),
  ('Admin', 'sos:respond'),
  ('Admin', 'reports:view'),
  ('Admin', 'reports:create'),
  ('Admin', 'reports:export'),
  ('Admin', 'settings:view')
ON CONFLICT DO NOTHING;

-- Supervisor: Solo visualización y reportes
INSERT INTO role_permissions (role, permission_code) VALUES
  ('Supervisor', 'guards:view'),
  ('Supervisor', 'supervisors:view'),
  ('Supervisor', 'installations:view'),
  ('Supervisor', 'logs:view'),
  ('Supervisor', 'sos:view'),
  ('Supervisor', 'sos:respond'),
  ('Supervisor', 'reports:view')
ON CONFLICT DO NOTHING;

-- Guard: Solo visualización básica
INSERT INTO role_permissions (role, permission_code) VALUES
  ('Guard', 'installations:view'),
  ('Guard', 'logs:view')
ON CONFLICT DO NOTHING;

-- 7. CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- 8. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_auth_updated_at
  BEFORE UPDATE ON two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

-- 10. CREAR POLÍTICAS RLS
-- ============================================

-- user_profiles: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- user_profiles: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_profiles: Solo admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('Admin', 'Super Admin')
    )
  );

-- user_profiles: Solo super admins pueden crear usuarios
CREATE POLICY "Super admins can create users" ON user_profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'Super Admin'
    )
  );

-- permissions: Todos pueden ver permisos
CREATE POLICY "Everyone can view permissions" ON permissions
  FOR SELECT USING (true);

-- role_permissions: Todos pueden ver role_permissions
CREATE POLICY "Everyone can view role permissions" ON role_permissions
  FOR SELECT USING (true);

-- two_factor_auth: Solo el usuario puede ver su 2FA
CREATE POLICY "Users can view own 2FA" ON two_factor_auth
  FOR ALL USING (auth.uid() = user_id);

-- 11. CREAR FUNCIÓN PARA OBTENER PERMISOS DE USUARIO
-- ============================================

CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE (permission_code TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT rp.permission_code
  FROM user_profiles up
  JOIN role_permissions rp ON up.role = rp.role
  WHERE up.id = user_id AND up.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. CREAR FUNCIÓN PARA VERIFICAR PERMISO
-- ============================================

CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM get_user_permissions(user_id)
    WHERE permission_code = permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. CREAR TRIGGER PARA CREAR PERFIL AL REGISTRARSE
-- ============================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Guard'),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 14. INSERTAR USUARIOS DE EJEMPLO
-- ============================================

-- NOTA: Los usuarios se crearán desde la aplicación usando Supabase Auth
-- Aquí solo documentamos los usuarios que deberías crear:

/*
USUARIOS DE EJEMPLO (Crear desde la app):

1. Super Admin:
   Email: super@tentacion.com
   Password: (segura)
   Role: Super Admin
   
2. Admin:
   Email: admin@tentacion.com
   Password: (segura)
   Role: Admin
   
3. Supervisor:
   Email: supervisor@tentacion.com
   Password: (segura)
   Role: Supervisor
*/

-- 15. VERIFICACIÓN
-- ============================================

-- Ver permisos por rol
SELECT 
  rp.role,
  COUNT(*) as total_permissions,
  STRING_AGG(p.name, ', ' ORDER BY p.name) as permissions
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.code
GROUP BY rp.role
ORDER BY rp.role;

-- Ver estructura de tablas
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')
ORDER BY table_name;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================

-- ✅ Tablas de autenticación creadas
-- ✅ Permisos definidos
-- ✅ Roles configurados
-- ✅ RLS habilitado
-- ✅ Funciones de ayuda creadas
-- ✅ Triggers configurados
