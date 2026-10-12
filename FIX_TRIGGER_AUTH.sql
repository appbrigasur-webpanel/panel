-- ============================================
-- FIX TRIGGER AUTH - PANEL BRIGASUR
-- ============================================
-- PROBLEMA: El trigger on_auth_user_created intentaba insertar en 'user_profiles'
-- pero esa tabla no existe. La tabla real se llama 'profiles'.
-- Esto causaba error 500 al crear cualquier usuario en Supabase Auth.
--
-- SOLUCIÓN: Recrear el trigger apuntando a 'profiles' con los campos correctos.
-- ============================================
--
-- INSTRUCCIONES:
-- 1. Abre tu proyecto en https://supabase.com/dashboard
-- 2. Ve a SQL Editor
-- 3. Pega y ejecuta este script completo
-- ============================================

-- 1. Eliminar trigger antiguo (que apuntaba a user_profiles inexistente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar función antigua
DROP FUNCTION IF EXISTS public.create_user_profile();

-- 3. Crear la función correcta que inserta en la tabla 'profiles'
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Determinar rol: metadata explícita, o si existe en tabla 'supervisors', o por defecto 'guard'
  assigned_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));
  
  IF assigned_role = '' OR assigned_role = 'user' THEN
    IF EXISTS (SELECT 1 FROM public.supervisors WHERE LOWER(email) = LOWER(NEW.email)) THEN
      assigned_role := 'supervisor';
    ELSE
      assigned_role := 'guard';
    END IF;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    phone,
    email,
    is_active,
    status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    true,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = CASE 
      WHEN EXCLUDED.role IN ('supervisor', 'admin', 'super_admin') THEN EXCLUDED.role
      WHEN EXISTS (SELECT 1 FROM public.supervisors WHERE LOWER(supervisors.email) = LOWER(NEW.email)) THEN 'supervisor'
      ELSE profiles.role
    END,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- 5. Sincronizar perfiles existentes que estén en la tabla de supervisores
UPDATE public.profiles 
SET role = 'supervisor' 
WHERE LOWER(email) IN (SELECT LOWER(email) FROM public.supervisors)
  AND role NOT IN ('admin', 'super_admin');

-- 6. Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- Resultado esperado: 
-- ✅ Trigger "on_auth_user_created" creado correctamente
-- ✅ Si un usuario está en la tabla de supervisores, su perfil se crea/actualiza con rol 'supervisor'
-- ✅ La App móvil mostrará el panel completo de Supervisor automáticamente
-- ============================================
