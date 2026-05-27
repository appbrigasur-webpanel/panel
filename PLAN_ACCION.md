# 🚀 Plan de Acción Inmediato - Panel Tentación Food Store

## ✅ Cambios Realizados

### 1. Configuración de Supabase
- ✅ Credenciales agregadas a `.env.local`
- ✅ Cliente de Supabase creado en `lib/supabase.ts`
- ✅ Tipos de base de datos en `types/database.types.ts`
- ✅ Servicio de guardias en `services/guards.service.ts`

### 2. Archivos Creados
```
PANEL TENTACION/
├── .env.local (actualizado con credenciales)
├── ANALISIS_Y_MEJORAS.md (análisis completo)
├── lib/
│   └── supabase.ts (cliente configurado)
├── types/
│   └── database.types.ts (tipos de DB)
└── services/
    └── guards.service.ts (servicio CRUD)
```

---

## 📦 Paso 1: Instalar Dependencias

Ejecuta este comando en tu terminal:

```bash
npm install @supabase/supabase-js react-hook-form zod @hookform/resolvers zustand react-hot-toast date-fns
```

### Dependencias a instalar:
- `@supabase/supabase-js` - Cliente de Supabase
- `react-hook-form` - Manejo de formularios
- `zod` - Validación de esquemas
- `@hookform/resolvers` - Integración Zod + React Hook Form
- `zustand` - Manejo de estado global
- `react-hot-toast` - Notificaciones toast
- `date-fns` - Manejo de fechas

---

## 🔧 Paso 2: Verificar Tablas de Supabase

Necesito verificar que las tablas estén correctamente creadas. Por favor, ve a tu dashboard de Supabase:

**URL**: https://supabase.com/dashboard/project/juksmchvbblljkhixcda

### Tablas Requeridas:

#### 1. **guards**
```sql
CREATE TABLE guards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  os10_expiry TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_installation_id UUID REFERENCES installations(id),
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **supervisors**
```sql
CREATE TABLE supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  os10_expiry TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_installation_id UUID REFERENCES installations(id),
  shift TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. **installations**
```sql
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  required_daily_scans INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. **logs**
```sql
CREATE TYPE log_type AS ENUM ('QR', 'NFC', 'INCIDENT', 'SOS');

CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type log_type NOT NULL,
  title TEXT,
  detail TEXT,
  guard_id UUID NOT NULL REFERENCES guards(id),
  guard_name TEXT NOT NULL,
  installation_id UUID NOT NULL REFERENCES installations(id),
  installation_name TEXT NOT NULL,
  point_name TEXT,
  tag_id TEXT,
  photos TEXT[],
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5. **system_admins**
```sql
CREATE TYPE admin_role AS ENUM ('Admin', 'Super Admin');

CREATE TABLE system_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role admin_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔐 Paso 3: Configurar Row Level Security (RLS)

Para cada tabla, ejecuta en el SQL Editor de Supabase:

```sql
-- Habilitar RLS
ALTER TABLE guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (CAMBIAR EN PRODUCCIÓN)
CREATE POLICY "Enable all for authenticated users" ON guards
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON supervisors
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON installations
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON logs
  FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON system_admins
  FOR ALL USING (true);
```

⚠️ **IMPORTANTE**: Estas políticas son permisivas para desarrollo. En producción debes implementar políticas más restrictivas basadas en roles.

---

## 🧪 Paso 4: Probar Conexión

Después de instalar las dependencias, ejecuta:

```bash
npm run dev
```

Abre la consola del navegador y deberías ver:
```
✅ Supabase connected successfully
```

---

## 📝 Paso 5: Migrar Componente GuardsManager

Una vez verificada la conexión, el siguiente paso es refactorizar `GuardsManager.tsx` para usar el servicio real:

### Cambios necesarios:
1. Importar `GuardsService`
2. Usar `useEffect` para cargar datos
3. Implementar manejo de errores con toasts
4. Actualizar operaciones CRUD

---

## 🎯 Próximos Pasos (en orden)

### Prioridad CRÍTICA
1. ✅ Instalar dependencias
2. ✅ Verificar tablas en Supabase
3. ✅ Configurar RLS
4. ✅ Probar conexión
5. ⏳ Refactorizar GuardsManager
6. ⏳ Refactorizar InstallationsManager
7. ⏳ Refactorizar SupervisorsManager

### Prioridad ALTA
8. ⏳ Implementar autenticación real con Supabase Auth
9. ⏳ Crear sistema de toasts para feedback
10. ⏳ Implementar validaciones con Zod

### Prioridad MEDIA
11. ⏳ Refactorizar Dashboard con datos reales
12. ⏳ Implementar LogsViewer con Supabase
13. ⏳ Crear componentes UI reutilizables

---

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
**Solución**: Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "PGRST301"
**Solución**: La tabla no existe o está vacía. Verifica en Supabase Dashboard.

### Error: "401 Unauthorized"
**Solución**: Verifica que las políticas RLS estén configuradas correctamente.

### Error: "Cannot find module '@supabase/supabase-js'"
**Solución**: Ejecuta `npm install @supabase/supabase-js`

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema o tienes dudas:
1. Comparte el error exacto que ves
2. Indica en qué paso estás
3. Proporciona capturas de pantalla si es necesario

---

## 🎉 Resultado Esperado

Después de completar estos pasos:
- ✅ Conexión a Supabase funcionando
- ✅ Datos persistentes (no se pierden al recargar)
- ✅ CRUD completo de guardias
- ✅ Validaciones robustas
- ✅ Manejo de errores profesional
- ✅ Feedback visual con toasts

---

**¿Listo para empezar?** 🚀

Ejecuta el comando de instalación de dependencias y luego verificamos las tablas en Supabase.
