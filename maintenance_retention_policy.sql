-- ==============================================================================
-- SCRIPT DE MANTENIMIENTO: POLÍTICA DE RETENCIÓN DE DATOS (LOGS)
-- ==============================================================================
-- Objetivo: Mantener solo los últimos 3 meses de registros en la tabla 'logs'.
-- Ejecución: Automática el día 1 de cada mes.
-- ==============================================================================

-- 1. Crear la función de limpieza
-- Esta función encapsula la lógica de borrado para ser reutilizable.
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  -- Borra registros cuya fecha (timestamp) sea anterior a 3 meses desde AHORA.
  -- Ejemplo: Si hoy es 1 de Mayo, borra todo lo anterior al 1 de Febrero.
  DELETE FROM logs 
  WHERE timestamp < (NOW() - INTERVAL '3 months');
END;
$$ LANGUAGE plpgsql;

-- 2. Programar la ejecución automática (Requiere extensión pg_cron)
-- Intenta habilitar la extensión pg_cron si no está activa (requiere permisos de superusuario o soporte de plataforma)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar el trabajo para que corra el día 1 de cada mes a las 00:00 (Medianoche)
-- Formato Cron: min hour day month day_of_week
-- '0 0 1 * *' = Minuto 0, Hora 0, Día 1, Todos los meses, Todos los días de semana.
SELECT cron.schedule(
  'cleanup-logs-quarterly', -- Nombre único del job
  '0 0 1 * *',              -- Cron expression: 1ro de cada mes a las 00:00
  $$DELETE FROM logs WHERE timestamp < (NOW() - INTERVAL '3 months')$$
);

-- NOTA IMPORTANTE:
-- Si estás usando Supabase y este comando falla porque no puedes crear la extensión pg_cron,
-- puedes configurar esto como una "Scheduled Edge Function" o usar la interfaz gráfica
-- de Supabase en 'Database' -> 'Extensions' para habilitar pg_cron primero.

-- 3. Verificación Opcional (Para probar manualmente ahora mismo)
-- Descomenta la siguiente línea para ejecutar una limpieza inmediata de prueba:
-- SELECT delete_old_logs();
