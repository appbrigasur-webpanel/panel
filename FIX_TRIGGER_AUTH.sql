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
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    true,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile();

-- 5. Verificar que el trigger se creó correctamente
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- Resultado esperado: 
-- ✅ Trigger "on_auth_user_created" creado correctamente
-- ✅ Los nuevos usuarios en Supabase Auth crearán su perfil en la tabla 'profiles'
-- ✅ El registro de guardias en la app móvil ya no fallará
-- ============================================
