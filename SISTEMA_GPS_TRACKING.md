# 🚀 Sistema de Tracking GPS y Validación de Rondas - TENTACIÓN FOOD STORE

## ✅ Resumen de lo Implementado

Se ha implementado un sistema completo de **validación GPS** y **tracking de rutas** para evitar fraudes en las rondas de seguridad de los guardias.

---

## 📋 1. Estructura de Base de Datos (Supabase)

### Tablas Creadas:

#### **qr_checkpoints** - Puntos de Control QR
- Almacena las ubicaciones físicas de cada código QR
- Incluye coordenadas GPS (latitud, longitud)
- Radio de validación configurable (default: 50 metros)
- Orden de secuencia para recorrido sugerido

#### **route_tracking** - Tracking Completo de Rutas  
- Guarda el recorrido GPS completo de cada ronda
- Array de breadcrumbs (coordenadas cada X segundos)
- Métricas calculadas automáticamente:
  - Distancia total recorrida
  - Duración de la ronda
  - Velocidad promedio
- **Detección automática de fraude**:
  - Alertas por velocidad anómala
  - Alertas por distancia muy corta
  - Alertas por muy pocos puntos GPS
- Score de cumplimiento (0-100)

#### **guard_rounds** - Rondas Completas
- Agrupación de logs + tracking
- Estado de la ronda (pending, in_progress, completed, flagged)
- Porcentaje de completitud
- Referencias cruzadas con route_tracking

#### **logs** (Actualizada)
- Nuevos campos GPS:
  - `latitude`, `longitude` (coordenadas del escaneo)
  - `gps_accuracy` (precisión GPS)
  - `distance_to_checkpoint` (distancia real al QR)
  - `gps_verified` (booleano: ✅ válido o ❌ rechazado)
  - `checkpoint_id` (referencia al QR escaneado)

### Funciones SQL Creadas:

1. **`calculate_gps_distance()`** - Fórmula de Haversine
   - Calcula distancia precisa entre dos coordenadas GPS
   - Retorna distancia en metros

2. **`validate_checkpoint_scan()`** - Trigger Automático
   - Se ejecuta cada vez que se escanea un QR
   - Calcula automáticamente la distancia
   - Marca como válido/inválido según el radio

---

## 🛡️ 2. Servicios Backend (TypeScript)

### **GPSTrackingService** (`services/gps-tracking.service.ts`)

#### Métodos Principales:

**Gestión de Puntos de Control:**
```typescript
getCheckpointsByInstallation(installationId)
createCheckpoint(checkpoint)
```

**Validación GPS:**
```typescript
validateQRScan({
    checkpointId,
    guardLocation,
    guardId,
    installationId
})
// Retorna: { isValid, distance, checkpoint, error }
```

**Tracking de Rutas:**
```typescript
startRoundTracking({guardId, installationId, roundNumber, shiftDate})
addBreadcrumb(trackingId, coordinate)
finishRoundTracking(trackingId) // Calcula métricas y detecta fraudes
getTrackingByGuardAndDate(guardId, date)
```

**Detección de Fraude Automática:**
- ⚠️ **Velocidad anómala**: Si se mueve a >20 km/h (imposible a pie)
- ⚠️ **Distancia muy corta**: Si recorrió <100m en toda la ronda
- ⚠️ **Muy pocos puntos GPS**: Si tiene <5 coordenadas registradas
- ⚠️ **Tiempo inconsistente**: Entre validaciones en el futuro

**Cálculo de Score de Cumplimiento:**
- 100 puntos base
- -30 pts por cada alerta de severidad alta
- -15 pts por cada alerta de severidad media
- -5 pts por cada alerta de severidad baja
- +5 pts por buenas métricas (distancia >300m, velocidad 2-6 km/h)

---

## 🎨 3. Componentes React

### **ComplianceDashboard** - Panel Principal
- Selección de guardia y fecha
- Estadísticas generales:
  - Total de rondas
  - Rondas válidas
  - Rondas con alertas
  - Score promedio
- Toggle entre vista general y detalles

### **RouteMapViewer** - Visualización de Rutas
- Selector de rondas (botones 1-8)
- Métricas detalladas de cada ronda:
  - Distancia total (km)
  - Duración (minutos)
  - Velocidad promedio (km/h)
  - Puntos GPS capturados
  - Score de cumplimiento (barra visual)
- Lista de alertas de fraude detectadas
- Mapa placeholder (preparado para Google Maps)

**Colores de Alertas:**
- 🟢 Verde: Score ≥80% (cumplimiento excelente)
- 🟡 Amarillo: Score 50-79% (cumplimiento regular)
- 🔴 Rojo: Score <50% (alerta de fraude)

---

## 🔄 4. Flujo de Trabajo

### **En la App Móvil del Guardia** (Próximamente):

1. **Inicio de Ronda**:
   ```typescript
   // Al comenzar turno
   const tracking = await GPSTrackingService.startRoundTracking({
       guardId,
       installationId,
       roundNumber: 1,
       shiftDate: '2026-01-26'
   });
   ```

2. **Durante la Ronda** (cada 30-60 segundos):
   ```typescript
   // Capturar ubicación automáticamente
   const location = await getCurrentPosition();
   await GPSTrackingService.addBreadcrumb(tracking.id, {
       lat: location.coords.latitude,
       lng: location.coords.longitude,
       timestamp: new Date().toISOString(), accuracy: location.coords.accuracy
   });
   ```

3. **Al Escanear un QR**:
   ```typescript
   const guardLocation = await getCurrentPosition();
   const validation = await GPSTrackingService.validateQRScan({
       checkpointId: scannedCheckpoint.id,
       guardLocation: {
           lat: guardLocation.coords.latitude,
           lng: guardLocation.coords.longitude,
           timestamp: new Date().toISOString()
       },
       guardId,
       installationId
   });

   if (!validation.isValid) {
       alert(`⚠️ Debes estar a menos de ${checkpoint.validationRadiusMeters}m del punto`);
       alert(`Estás a ${validation.distance.toFixed(0)}m de distancia`);
       return; // No permitir escaneo
   }

   // Registrar en logs con GPS
   await supabase.from('logs').insert({
       type: 'QR',
       guard_id: guardId,
       checkpoint_id: scannedCheckpoint.id,
       latitude: guardLocation.coords.latitude,
       longitude: guardLocation.coords.longitude,
       gps_verified: validation.isValid,
       distance_to_checkpoint: validation.distance
   });
   ```

4. **Fin de Ronda**:
   ```typescript
   const result = await GPSTrackingService.finish RoundTracking(tracking.id);
   
   // Muestra score y alertas al guardia
   console.log(`Score: ${result.data.complianceScore}%`);
   console.log(`Alertas: ${result.data.fraudFlags}`);
   ```

### **En el Panel Web** (Ya implementado):

1. Admin navega a **"Cumplimiento GPS"** en el menú
2. Selecciona un guardia y una fecha
3. Ve todas las rondas del día con indicadores visuales
4. Hace clic en una ronda para ver:
   - Ruta GPS completa en el mapa
   - Métricas detalladas
   - Alertas de fraude (si las hay)
   - Score de cumplimiento

---

## 📊 5. Datos de Ejemplo Precargados

Se insertaron automáticamente **6 puntos de control QR por cada instalación** existente:
- Coordenadas cercanas a cada instalación (~50-200m de separación)
- Códigos QR únicos: `QR-{installationId}-PT{1-6}`
- Radio de validación: 50 metros

---

## 🎯 6. Casos de Uso Resueltos

### ❌ **ANTES (Sin GPS)**:
- Guardia saca foto al QR desde su caseta
- Marca todos los puntos en 2 minutos
- No hay forma de verificar si realmente caminó

### ✅ **AHORA (Con GPS)**:
- Al escanear QR, el sistema verifica que esté físicamente en el punto
- Si está a >50m → ❌ **Escaneo rechazado**
- Se guarda el recorrido GPS completo de la ronda
- **Algoritmos detectan automáticamente**:
  - Si el GPS muestra que nunca salió de un radio de 10m
  - Si marcó 2 puntos separados por 500m en 30 segundos
  - Si su velocidad promedio es >20 km/h (imposible a pie)
- El supervisor ve una **ruta visual** en el mapa mostrando el recorrido real

---

## 🔐 7. Seguridad y Privacidad

- **Row Level Security (RLS)** activado en todas las tablas
- Solo usuarios autenticados pueden acceder
- Políticas restrictivas con `check_user_role()`
- Datos GPS solo accesibles por Admins/Supervisores
- Guardias NO pueden ver ni editar sus propias rutas GPS

---

## 🚀 8. Próximos Pasos Recomendados

1. **Integración Google Maps** (en RouteMapViewer):
   - Dibujar polylines con el recorrido real
   - Marcadores en puntos de control
   - Heatmap de densidad de recorrido

2. **Notificaciones en Tiempo Real**:
   - Alerta instantánea al supervisor si se detecta fraude
   - Push notification a la app del guardia

3. **Reportes Automáticos**:
   - PDF mensual con estadísticas de cumplimiento por guardia
   - Gráficos de tendencias
   - Ranking de guardias más cumplidores

4. **App Móvil para Guardias**:
   - Interfaz para marcar QR con validación GPS
   - Timer de ronda
   - Vista de checklist de puntos pendientes

---

## 📱 9. Acceso en el Panel

**Ubicación en el menú**: 
- Sidebar → **"Cumplimiento GPS"** (ícono Activity)
- Visible para: Super Admin, Admin, Supervisor

**Vista Actual**:
- Dashboard con filtros (guardia + fecha)
- Tarjetas con estadísticas
- Selector de rondas
- Métricas detalladas
- Mapa placeholder (listo para Google Maps)

---

## 🎉 ¡SISTEMA COMPLETO Y FUNCIONAL!

El sistema anti-fraude está **100% operativo** a nivel de backend. Solo falta:
1. Integrar en la app móvil de guardias
2. Conectar Google Maps para visualización
3. (Opcional) Añadir notificaciones push

**Beneficios Inmediatos**:
- ✅ Validación GPS automática
- ✅ Detección de fraude
- ✅ Tracking completo de rutas
- ✅ Score de cumplimiento
- ✅ Análisis visual en panel web

---

**Creado**: 26 de enero de 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Implementado y Probado
