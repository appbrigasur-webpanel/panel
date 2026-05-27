# 🍔 Panel Tentación Food Store

> Sistema de gestión profesional para empresas de seguridad privada

Panel de administración moderno y completo para gestionar guardias, supervisores, instalaciones y registros de seguridad en tiempo real.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ecf8e)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Arquitectura](#-arquitectura)
- [Documentación](#-documentación)

---

## ✨ Características

### Gestión de Personal
- ✅ **Guardias**: CRUD completo con asignación a instalaciones
- ✅ **Supervisores**: Gestión de supervisores con turnos
- ✅ **Validación RUT**: Validación automática de RUT chileno
- ✅ **OS10**: Control de vigencia de certificados

### Monitoreo en Tiempo Real
- ✅ **Dashboard Interactivo**: KPIs y métricas en tiempo real
- ✅ **Registros QR/NFC**: Seguimiento de rondas de seguridad
- ✅ **Alertas SOS**: Sistema de emergencias
- ✅ **Incidentes**: Registro con fotos y detalles

### Gestión de Instalaciones
- ✅ **Ubicaciones**: Gestión con coordenadas GPS
- ✅ **Puntos de Control**: Definición de puntos de ronda
- ✅ **Cumplimiento**: Análisis de cumplimiento operacional

### Características Técnicas
- ✅ **Tema Oscuro/Claro**: Toggle de temas
- ✅ **Responsive**: Diseño adaptable a móviles
- ✅ **Notificaciones**: Sistema de notificaciones en tiempo real
- ✅ **Exportación**: Reportes en PDF
- ✅ **Análisis IA**: Integración con Google Gemini

---

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React 19.2.0
- **Lenguaje**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Estilos**: CSS Vanilla
- **Iconos**: Lucide React
- **Gráficos**: Recharts

### Backend & Servicios
- **BaaS**: Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth (próximamente)
- **Storage**: Supabase Storage

### Librerías Principales
- **Formularios**: React Hook Form + Zod
- **Estado Global**: Zustand
- **Notificaciones**: React Hot Toast
- **Fechas**: date-fns
- **PDF**: jsPDF + jspdf-autotable
- **IA**: Google Generative AI

---

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### Pasos

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
# Editar .env.local con tus credenciales de Supabase
```

3. **Configurar Supabase**
```bash
# Ir a: https://supabase.com/dashboard
# Ejecutar el script: supabase_schema.sql
```

4. **Iniciar el servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## ⚙️ Configuración

### Variables de Entorno

El archivo `.env.local` debe contener:

```env
# Google Gemini API
GEMINI_API_KEY=tu_api_key_aqui

# Supabase Configuration
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=tu_project_id
```

### Configuración de Supabase

1. **Crear Proyecto en Supabase**
   - Ir a https://supabase.com/dashboard
   - Crear nuevo proyecto
   - Copiar URL y Anon Key

2. **Ejecutar Schema SQL**
   - Abrir SQL Editor en Supabase
   - Ejecutar el contenido de `supabase_schema.sql`
   - Verificar que las tablas se crearon correctamente

---

## 🎯 Uso

### Acceso al Sistema

**Desarrollo (Acceso Rápido)**:
- **Admin**: Usuario: `admin` / Contraseña: `123`
- **Super Admin**: Usuario: `super` / Contraseña: `123`

### Navegación

- **Dashboard**: Vista general de métricas y gráficos
- **Guardias**: Gestión completa de guardias
- **Supervisores**: Gestión de supervisores
- **Instalaciones**: Gestión de ubicaciones
- **Registros**: QR, NFC, Incidentes y SOS
- **Configuración**: Personalización (Solo Super Admin)

---

## 🏗️ Arquitectura

### Estructura de Carpetas

```
PANEL TENTACION/
├── components/          # Componentes React
├── lib/                 # Configuraciones (Supabase)
├── services/           # Servicios de API
├── types/              # Tipos TypeScript
├── App.tsx            # Componente principal
└── index.tsx          # Entry point
```

---

## 📚 Documentación

### Documentos Disponibles

- **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)**: Visión general del proyecto
- **[ANALISIS_Y_MEJORAS.md](./ANALISIS_Y_MEJORAS.md)**: Análisis detallado y plan de mejoras
- **[PLAN_ACCION.md](./PLAN_ACCION.md)**: Plan de implementación paso a paso
- **[supabase_schema.sql](./supabase_schema.sql)**: Schema completo de base de datos

### Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Previsualizar build de producción
```

---

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
**Solución**: Verificar que `.env.local` existe y tiene las variables correctas. Reiniciar el servidor.

### Error: "PGRST301"
**Solución**: La tabla no existe o está vacía. Ejecutar `supabase_schema.sql`.

### Error: "401 Unauthorized"
**Solución**: Verificar políticas RLS en Supabase.

---

## 🗺️ Roadmap

### Versión 1.0 (Actual)
- ✅ CRUD de Guardias, Supervisores e Instalaciones
- ✅ Dashboard con métricas básicas
- ✅ Sistema de notificaciones
- ✅ Tema oscuro/claro

### Versión 1.1 (Próxima)
- ⏳ Autenticación real con Supabase Auth
- ⏳ Búsqueda y filtros avanzados
- ⏳ Exportación de reportes mejorada

### Versión 2.0 (Futuro)
- 📋 App móvil para guardias
- 📋 Geolocalización en tiempo real
- 📋 Sistema de turnos automático

---

**Desarrollado por Tentación Food Store Ltda.**
