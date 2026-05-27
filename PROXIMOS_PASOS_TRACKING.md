# 🗺️ Hoja de Ruta: Sistema de Tracking GPS BrigaSur

Este documento detalla las tareas pendientes para completar el sistema de seguimiento anti-fraude y rastreo tipo "Uber" para los guardias.

## 🟢 Fase 1: Visualización Avanzada (Panel Web) - PRÓXIMAMENTE
- [ ] **Integración Google Maps SDK**: Reemplazar el placeholder actual por mapas reales.
- [ ] **Dibujo de Polilíneas**: Trazar la línea de recorrido real del guardia basada en los "breadcrumbs" (migas de pan).
- [ ] **Marcadores de Checkpoints**: Mostrar íconos verdes para puntos validados y rojos para puntos saltados o con fraude.
- [ ] **Heatmaps**: Mapa de calor para ver las zonas más recorridas por los guardias en el mes.

## 📱 Fase 2: Aplicación Móvil (El Corazón del Sistema)
- [ ] **Módulo de Captura en Background**: Implementar un servicio que capture el GPS cada 30-60 segundos incluso con la pantalla apagada.
- [ ] **Validación Offline**: Permitir escaneos si no hay internet (guardar en caché) pero validando el GPS localmente.
- [ ] **Alarma de Inactividad**: Notificar al guardia (vibración) si lleva más de 15 minutos sin moverse fuera de su caseta durante una ronda programada.

## 🤖 Fase 3: Inteligencia y Anti-Fraude
- [ ] **Algoritmo de Velocidad**: Perfeccionar la detección de si el guardia va en vehículo en lugar de a pie.
- [ ] **Detección de Mock Locations**: Bloquear el sistema si el guardia usa aplicaciones para "simular" una ubicación GPS falsa.
- [ ] **Score de Calidad**: Ranking mensual de guardias con mejores recorridos físicos.

## 📊 Fase 4: Reportes y Auditoría
- [ ] **PDF de Ronda**: Generar un reporte PDF que incluya la miniatura del mapa con el recorrido junto a la firma del guardia.
- [ ] **Dashboard Gerencial**: Estadísticas de "Metros Caminados" totales por instalación.

## 🔔 Fase 5: Alertas en Tiempo Real
- [ ] **Push Notifications**: Enviar alerta inmediata al Supervisor si una patrulla se desvía de su radio permitido o detecta fraude.
- [ ] **Telegram/WhatsApp Bot**: Notificaciones automáticas de rondas críticas no iniciadas.
