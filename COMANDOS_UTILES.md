# 🛠️ COMANDOS ÚTILES - Panel Brigasur

## 📦 NPM / Gestión de Dependencias

### Instalación
```bash
# Instalar todas las dependencias
npm install

# Instalar dependencia específica
npm install <paquete>

# Instalar dependencia de desarrollo
npm install -D <paquete>

# Actualizar todas las dependencias
npm update

# Ver dependencias instaladas
npm list

# Ver dependencias desactualizadas
npm outdated
```

### Limpieza
```bash
# Limpiar caché de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Desarrollo

### Servidor de Desarrollo
```bash
# Iniciar servidor de desarrollo
npm run dev

# Iniciar en puerto específico
npm run dev -- --port 3000

# Iniciar y abrir navegador
npm run dev -- --open
```

### Build
```bash
# Compilar para producción
npm run build

# Preview del build
npm run preview

# Build con análisis de bundle
npm run build -- --mode production
```

---

## 🗄️ Supabase

### Conexión
```bash
# Verificar conexión (en consola del navegador después de npm run dev)
# Debería aparecer: "✅ Supabase connected successfully"
```

### SQL Editor (Ejecutar en Supabase Dashboard)
```sql
-- Ver todas las tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Contar registros en cada tabla
SELECT 'guards' as table, COUNT(*) FROM guards
UNION ALL
SELECT 'supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'installations', COUNT(*) FROM installations
UNION ALL
SELECT 'logs', COUNT(*) FROM logs
UNION ALL
SELECT 'system_admins', COUNT(*) FROM system_admins;

-- Ver estructura de una tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'guards';

-- Limpiar todas las tablas (¡CUIDADO!)
TRUNCATE guards, supervisors, installations, logs, system_admins CASCADE;

-- Eliminar todas las tablas (¡CUIDADO!)
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS guards CASCADE;
DROP TABLE IF EXISTS supervisors CASCADE;
DROP TABLE IF EXISTS installations CASCADE;
DROP TABLE IF EXISTS system_admins CASCADE;
DROP TYPE IF EXISTS log_type;
DROP TYPE IF EXISTS admin_role;
```

---

## 🔍 Debugging

### Consola del Navegador
```javascript
// Ver estado de Supabase
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Probar conexión
const { data, error } = await supabase.from('guards').select('count');
console.log('Connection test:', { data, error });

// Ver todas las variables de entorno
console.log('Env vars:', import.meta.env);
```

### Logs de Supabase
```bash
# Ver logs en tiempo real
# Ir a: https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz/logs/explorer
```

---

## 🧪 Testing (Futuro)

### Vitest
```bash
# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar tests con coverage
npm test -- --coverage

# Ejecutar test específico
npm test -- <nombre-archivo>
```

---

## 🔧 Git

### Comandos Básicos
```bash
# Ver estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Pull
git pull origin main

# Ver historial
git log --oneline

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Cambiar de rama
git checkout main

# Merge
git merge feature/nueva-funcionalidad
```

### Conventional Commits
```bash
# Nueva característica
git commit -m "feat: agregar validación de RUT"

# Corrección de bug
git commit -m "fix: corregir error en login"

# Documentación
git commit -m "docs: actualizar README"

# Refactorización
git commit -m "refactor: reorganizar servicios"

# Estilo
git commit -m "style: formatear código"

# Tests
git commit -m "test: agregar tests para guards service"

# Chore
git commit -m "chore: actualizar dependencias"
```

---

## 📊 Análisis de Código

### TypeScript
```bash
# Verificar tipos
npx tsc --noEmit

# Ver errores de TypeScript
npx tsc --noEmit --pretty
```

### Bundle Size
```bash
# Analizar tamaño del bundle
npm run build
npx vite-bundle-visualizer
```

---

## 🔐 Seguridad

### Verificar Vulnerabilidades
```bash
# Auditoría de seguridad
npm audit

# Arreglar vulnerabilidades automáticamente
npm audit fix

# Arreglar incluyendo breaking changes
npm audit fix --force
```

---

## 📁 Archivos y Directorios

### Navegación
```bash
# Listar archivos
ls -la

# Ver estructura de árbol
tree /F

# Buscar archivo
find . -name "*.tsx"

# Buscar en contenido
grep -r "GuardsService" .
```

### Limpieza
```bash
# Eliminar archivos de build
rm -rf dist

# Eliminar node_modules
rm -rf node_modules

# Limpiar todo y reinstalar
rm -rf node_modules dist package-lock.json
npm install
```

---

## 🌐 URLs Importantes

### Desarrollo
```bash
# Aplicación local
http://localhost:5173

# Vite dev server
http://localhost:5173/__vite_ping
```

### Supabase
```bash
# Dashboard principal
https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz

# Table Editor
https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz/editor

# SQL Editor
https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz/sql

# API Docs
https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz/api

# Logs
https://supabase.com/dashboard/project/rdhylrhychcfqoirvzuz/logs
```

---

## 🚨 Solución Rápida de Problemas

### Error: "Cannot find module"
```bash
npm install
```

### Error: "Port already in use"
```bash
# Cambiar puerto
npm run dev -- --port 3001
```

### Error: "Supabase connection failed"
```bash
# Verificar .env.local
cat .env.local

# Reiniciar servidor
# Ctrl+C y luego npm run dev
```

### Error: "PGRST301"
```bash
# Ejecutar supabase_schema.sql en Supabase
# Verificar que las tablas existen
```

### Aplicación no carga
```bash
# Limpiar y reinstalar
rm -rf node_modules dist .vite
npm install
npm run dev
```

---

## 📝 Snippets Útiles

### Crear Servicio Nuevo
```typescript
// services/ejemplo.service.ts
import { supabase, handleSupabaseError } from '../lib/supabase';

export class EjemploService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('tabla')
        .select('*');
      
      if (error) {
        return { data: null, error: handleSupabaseError(error) };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: 'Error al obtener datos' };
    }
  }
}
```

### Usar Servicio en Componente
```typescript
import { useEffect, useState } from 'react';
import { EjemploService } from '../services/ejemplo.service';

const MiComponente = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    const { data, error } = await EjemploService.getAll();
    
    if (error) {
      setError(error);
    } else {
      setData(data);
    }
    
    setLoading(false);
  };
  
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return <div>{/* Renderizar data */}</div>;
};
```

---

## 🎯 Comandos de Verificación

### Checklist Rápido
```bash
# 1. Verificar que node_modules existe
ls node_modules

# 2. Verificar que .env.local existe
cat .env.local

# 3. Verificar que las dependencias están instaladas
npm list @supabase/supabase-js

# 4. Iniciar servidor
npm run dev

# 5. Abrir navegador y verificar consola
# Debería ver: "✅ Supabase connected successfully"
```

---

**Última Actualización**: 2026-01-23  
**Versión**: 1.0.0

---

**💡 Tip**: Guarda este archivo como referencia rápida durante el desarrollo.
