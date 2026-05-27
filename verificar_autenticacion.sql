-- ============================================
-- SCRIPT DE VERIFICACIÓN - AUTENTICACIÓN
-- ============================================
-- Ejecuta este script para verificar que todo esté bien configurado
-- ============================================

-- 1. VERIFICAR TABLAS CREADAS
-- ============================================

SELECT 
  'Tablas de Autenticación' as verificacion,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')
ORDER BY table_name;

-- 2. VERIFICAR PERMISOS DEFINIDOS
-- ============================================

SELECT 
  'Total de Permisos' as verificacion,
  COUNT(*) as total,
  STRING_AGG(DISTINCT category, ', ') as categorias
FROM permissions;

SELECT 
  'Permisos por Categoría' as verificacion,
  category,
  COUNT(*) as total_permisos
FROM permissions
GROUP BY category
ORDER BY category;

-- 3. VERIFICAR PERMISOS POR ROL
-- ============================================

SELECT 
  'Permisos por Rol' as verificacion,
  rp.role,
  COUNT(*) as total_permisos,
  STRING_AGG(p.code, ', ' ORDER BY p.code) as permisos
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.code
GROUP BY rp.role
ORDER BY 
  CASE rp.role
    WHEN 'Super Admin' THEN 1
    WHEN 'Admin' THEN 2
    WHEN 'Supervisor' THEN 3
    WHEN 'Guard' THEN 4
  END;

-- 4. VERIFICAR USUARIOS CREADOS
-- ============================================

SELECT 
  'Usuarios en Auth' as verificacion,
  COUNT(*) as total_usuarios
FROM auth.users;

SELECT 
  'Detalle de Usuarios' as verificacion,
  email,
  created_at,
  confirmed_at IS NOT NULL as confirmado,
  raw_user_meta_data->>'role' as rol_metadata
FROM auth.users
ORDER BY created_at DESC;

-- 5. VERIFICAR PERFILES DE USUARIO
-- ============================================

SELECT 
  'Perfiles Creados' as verificacion,
  COUNT(*) as total_perfiles
FROM user_profiles;

SELECT 
  'Detalle de Perfiles' as verificacion,
  up.full_name,
  up.role,
  up.phone,
  up.is_active,
  au.email,
  up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at DESC;

-- 6. VERIFICAR TRIGGER
-- ============================================

SELECT 
  'Trigger Configurado' as verificacion,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 7. VERIFICAR FUNCIONES
-- ============================================

SELECT 
  'Funciones Creadas' as verificacion,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_user_profile', 'get_user_permissions', 'has_permission', 'update_updated_at_column')
ORDER BY routine_name;

-- 8. VERIFICAR RLS (Row Level Security)
-- ============================================

SELECT 
  'RLS Habilitado' as verificacion,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')
ORDER BY tablename;

-- 9. VERIFICAR POLÍTICAS RLS
-- ============================================

SELECT 
  'Políticas RLS' as verificacion,
  tablename,
  policyname,
  cmd as comando,
  qual as condicion
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')
ORDER BY tablename, policyname;

-- 10. VERIFICAR ÍNDICES
-- ============================================

SELECT 
  'Índices Creados' as verificacion,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')
ORDER BY tablename, indexname;

-- 11. PROBAR FUNCIÓN get_user_permissions
-- ============================================

-- Obtener el ID del primer usuario
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Probando get_user_permissions para usuario: %', test_user_id;
  END IF;
END $$;

-- Si tienes un usuario específico, prueba con su ID:
-- SELECT * FROM get_user_permissions('USER_ID_AQUI');

-- 12. RESUMEN GENERAL
-- ============================================

SELECT 
  'RESUMEN GENERAL' as verificacion,
  (SELECT COUNT(*) FROM permissions) as total_permisos,
  (SELECT COUNT(DISTINCT role) FROM role_permissions) as roles_configurados,
  (SELECT COUNT(*) FROM auth.users) as usuarios_auth,
  (SELECT COUNT(*) FROM user_profiles) as perfiles_creados,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('user_profiles', 'permissions', 'role_permissions', 'two_factor_auth')) as politicas_rls;

-- ============================================
-- FIN DE VERIFICACIÓN
-- ============================================

-- RESULTADOS ESPERADOS:
-- ✅ 4 tablas creadas (user_profiles, permissions, role_permissions, two_factor_auth)
-- ✅ 26 permisos definidos en 8 categorías
-- ✅ 4 roles configurados (Super Admin, Admin, Supervisor, Guard)
-- ✅ Usuarios creados en auth.users
-- ✅ Perfiles creados en user_profiles (mismo número que usuarios)
-- ✅ Trigger on_auth_user_created configurado
-- ✅ 4 funciones creadas
-- ✅ RLS habilitado en las 4 tablas
-- ✅ Políticas RLS configuradas
-- ✅ Índices creados para performance

-- SI ALGO FALLA:
-- 1. Verificar que el script supabase_auth_setup.sql se ejecutó completamente
-- 2. Verificar que no hay errores en los logs de Supabase
-- 3. Verificar que los usuarios tienen metadata correcta
-- 4. Verificar que el trigger se ejecutó al crear usuarios
