import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Crear cliente de Supabase con tipado
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'panel-tentacion',
    },
  },
});

// Cliente secundario para operaciones que no deben afectar la sesión actual (como registro de otros usuarios)
export const supabaseNoSession = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error);
  
  if (error.code === 'PGRST301') {
    return 'No se encontraron registros';
  }
  
  if (error.code === '23505') {
    return 'Este registro ya existe';
  }
  
  if (error.code === '23503') {
    return 'No se puede eliminar este registro porque está siendo usado';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'Ocurrió un error inesperado';
};

// Helper para verificar conexión
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('guards').select('count').limit(1);
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
};
