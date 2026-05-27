import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
    QRCheckpoint,
    RouteTracking,
    GPSCoordinate,
    FraudAlert,
    Route
} from '../types';

/**
 * Servicio para gestión de tracking GPS y validación de rondas
 */
export class GPSTrackingService {

    /**
     * ====================================
     * GESTIÓN DE PUNTOS DE CONTROL (QR)
     * ====================================
     */

    /**
     * Obtener todos los checkpoints de una instalación
     */
    static async getCheckpointsByInstallation(installationId: string): Promise<{ data: QRCheckpoint[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('qr_checkpoints')
                .select('*')
                .eq('installation_id', installationId)
                .order('order_sequence', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapCheckpoints(data), error: null };
        } catch (error) {
            console.error('Error fetching checkpoints:', error);
            return { data: null, error: 'Error al obtener puntos de control' };
        }
    }

    /**
     * Crear un nuevo checkpoint
     */
    static async createCheckpoint(checkpoint: Omit<QRCheckpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: QRCheckpoint | null; error: string | null }> {
        try {
            const isNFC = checkpoint.checkpointType === 'NFC';
            const { data, error } = await supabase
                .from('qr_checkpoints')
                .insert({
                    installation_id: checkpoint.installationId,
                    name: checkpoint.name,
                    description: checkpoint.description,
                    checkpoint_type: checkpoint.checkpointType || 'QR',
                    qr_code: isNFC ? null : (checkpoint.qrCode || null),
                    nfc_id: isNFC ? (checkpoint.nfcId || null) : null,
                    latitude: checkpoint.latitude,
                    longitude: checkpoint.longitude,
                    validation_radius_meters: checkpoint.validationRadiusMeters,
                    is_active: checkpoint.isActive,
                    order_sequence: checkpoint.orderSequence
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapCheckpoint(data), error: null };
        } catch (error) {
            console.error('Error creating checkpoint:', error);
            return { data: null, error: 'Error al crear punto de control' };
        }
    }

    /**
     * Actualizar un checkpoint
     */
    static async updateCheckpoint(id: string, updates: Partial<QRCheckpoint>): Promise<{ data: QRCheckpoint | null; error: string | null }> {
        try {
            const isNFCUpdate = updates.checkpointType === 'NFC';
            const { data, error } = await supabase
                .from('qr_checkpoints')
                .update({
                    name: updates.name,
                    description: updates.description,
                    checkpoint_type: updates.checkpointType,
                    qr_code: isNFCUpdate ? null : (updates.qrCode || null),
                    nfc_id: isNFCUpdate ? (updates.nfcId || null) : null,
                    latitude: updates.latitude,
                    longitude: updates.longitude,
                    validation_radius_meters: updates.validationRadiusMeters,
                    is_active: updates.isActive,
                    order_sequence: updates.orderSequence
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapCheckpoint(data), error: null };
        } catch (error) {
            console.error('Error updating checkpoint:', error);
            return { data: null, error: 'Error al actualizar punto de control' };
        }
    }

    /**
     * Eliminar un checkpoint
     */
    static async deleteCheckpoint(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('qr_checkpoints')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: handleSupabaseError(error) };
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting checkpoint:', error);
            return { success: false, error: 'Error al eliminar punto de control' };
        }
    }

    /**
     * ====================================
     * GESTIÓN DE RUTAS
     * ====================================
     */

    /**
     * Obtener todas las rutas de una instalación
     */
    static async getRoutesByInstallation(installationId: string): Promise<{ data: Route[] | null; error: string | null }> {
        try {
            // Obtener rutas y contar checkpoints por cada una
            const { data, error } = await supabase
                .from('routes')
                .select('*, qr_checkpoints(count)')
                .eq('installation_id', installationId)
                .order('created_at', { ascending: false });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapRoutes(data), error: null };
        } catch (error) {
            console.error('Error fetching routes:', error);
            return { data: null, error: 'Error al obtener rutas' };
        }
    }

    /**
     * Crear una nueva ruta
     */
    static async createRoute(route: Omit<Route, 'id' | 'createdAt' | 'checkpointsCount'>): Promise<{ data: Route | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('routes')
                .insert({
                    name: route.name,
                    installation_id: route.installationId,
                    is_active: route.isActive,
                    rounds_per_shift: route.roundsPerShift
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapRoute(data), error: null };
        } catch (error) {
            console.error('Error creating route:', error);
            return { data: null, error: 'Error al crear ruta' };
        }
    }

    /**
     * Actualizar una ruta
     */
    static async updateRoute(id: string, updates: Partial<Route>): Promise<{ data: Route | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('routes')
                .update({
                    name: updates.name,
                    is_active: updates.isActive,
                    rounds_per_shift: updates.roundsPerShift
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapRoute(data), error: null };
        } catch (error) {
            console.error('Error updating route:', error);
            return { data: null, error: 'Error al actualizar ruta' };
        }
    }

    /**
     * Eliminar una ruta
     */
    static async deleteRoute(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('routes')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: handleSupabaseError(error) };
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting route:', error);
            return { success: false, error: 'Error al eliminar ruta' };
        }
    }

    /**
     * Asignar y ordenar checkpoints en una ruta
     */
    static async assignCheckpointsToRoute(routeId: string, checkpointIds: string[]): Promise<{ success: boolean; error: string | null }> {
        try {
            // 1. Limpiar checkpoints actuales de la ruta (opcional, dependiendo de si queremos reemplazo total)
            await supabase
                .from('qr_checkpoints')
                .update({ route_id: null, order_sequence: 0 })
                .eq('route_id', routeId);

            // 2. Asignar los nuevos checkpoints en orden
            for (let i = 0; i < checkpointIds.length; i++) {
                const { error } = await supabase
                    .from('qr_checkpoints')
                    .update({
                        route_id: routeId,
                        order_sequence: i + 1
                    })
                    .eq('id', checkpointIds[i]);

                if (error) throw error;
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error assigning checkpoints to route:', error);
            return { success: false, error: 'Error al asignar puntos a la ruta' };
        }
    }

    /**
     * ====================================
     * VALIDACIÓN GPS
     * ====================================
     */

    /**
     * Validar escaneo QR con GPS
     */
    static async validateQRScan(params: {
        checkpointId: string;
        guardLocation: GPSCoordinate;
        guardId: string;
        installationId: string;
    }): Promise<{
        isValid: boolean;
        distance: number;
        checkpoint: QRCheckpoint | null;
        error: string | null
    }> {
        try {
            const { data: checkpoint, error: checkpointError } = await supabase
                .from('qr_checkpoints')
                .select('*')
                .eq('id', params.checkpointId)
                .single();

            if (checkpointError || !checkpoint) {
                return {
                    isValid: false,
                    distance: 0,
                    checkpoint: null,
                    error: 'Punto de control no encontrado'
                };
            }

            // Usar rpc para calcular distancia en BD si está disponible, sino calcular localmente
            const { data: distanceData, error: distanceError } = await supabase
                .rpc('calculate_gps_distance', {
                    lat1: params.guardLocation.lat,
                    lng1: params.guardLocation.lng,
                    lat2: checkpoint.latitude,
                    lng2: checkpoint.longitude
                });

            // Si el punto es NFC, omitimos la validación de ubicación GPS ya que la lectura física del tag garantiza la presencia
            const isNFC = checkpoint.checkpoint_type === 'NFC';
            
            let distance = 0;
            if (!isNFC) {
                if (distanceError) {
                    distance = this.haversineDistance(
                        params.guardLocation.lat, params.guardLocation.lng,
                        checkpoint.latitude, checkpoint.longitude
                    );
                } else {
                    distance = distanceData as number;
                }
            }

            const isValid = isNFC ? true : (distance <= (checkpoint.validation_radius_meters || 50));

            return {
                isValid,
                distance,
                checkpoint: this.mapCheckpoint(checkpoint),
                error: null
            };
        } catch (error) {
            console.error('Error validating QR scan:', error);
            return {
                isValid: false,
                distance: 0,
                checkpoint: null,
                error: 'Error al validar escaneo'
            };
        }
    }

    /**
     * ====================================
     * TRACKING DE RUTAS
     * ====================================
     */

    static async startRoundTracking(params: {
        guardId: string;
        installationId: string;
        roundNumber: number;
        shiftDate: string;
    }): Promise<{ data: RouteTracking | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('route_tracking')
                .insert({
                    guard_id: params.guardId,
                    installation_id: params.installationId,
                    round_number: params.roundNumber,
                    shift_date: params.shiftDate,
                    start_time: new Date().toISOString(),
                    breadcrumbs: []
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: this.mapRouteTracking(data), error: null };
        } catch (error) {
            console.error('Error starting round tracking:', error);
            return { data: null, error: 'Error al iniciar tracking' };
        }
    }

    static async addBreadcrumb(trackingId: string, coordinate: GPSCoordinate): Promise<{ success: boolean; error: string | null }> {
        try {
            const { data: current, error: fetchError } = await supabase
                .from('route_tracking')
                .select('breadcrumbs')
                .eq('id', trackingId)
                .single();

            if (fetchError) return { success: false, error: handleSupabaseError(fetchError) };

            const breadcrumbs = Array.isArray(current.breadcrumbs) ? (current.breadcrumbs as any[]) : [];
            breadcrumbs.push(coordinate as any);

            const { error: updateError } = await supabase
                .from('route_tracking')
                .update({ breadcrumbs: (breadcrumbs as any) })
                .eq('id', trackingId);

            if (updateError) return { success: false, error: handleSupabaseError(updateError) };

            return { success: true, error: null };
        } catch (error) {
            console.error('Error adding breadcrumb:', error);
            return { success: false, error: 'Error al agregar coordenada' };
        }
    }

    static async finishRoundTracking(trackingId: string): Promise<{ data: RouteTracking | null; error: string | null }> {
        try {
            const { data: tracking, error: fetchError } = await supabase
                .from('route_tracking')
                .select('*')
                .eq('id', trackingId)
                .single();

            if (fetchError || !tracking) return { data: null, error: 'Tracking no encontrado' };

            const breadcrumbs = (tracking.breadcrumbs as any) as GPSCoordinate[];
            const metrics = this.calculateRouteMetrics(breadcrumbs, new Date(tracking.start_time));
            const fraudFlags = this.detectFraudPatterns(breadcrumbs, metrics);

            const { data: updated, error: updateError } = await supabase
                .from('route_tracking')
                .update({
                    end_time: new Date().toISOString(),
                    total_distance_meters: metrics.totalDistance,
                    duration_seconds: metrics.durationSeconds,
                    average_speed_kmh: metrics.averageSpeed,
                    fraud_flags: (fraudFlags.map(f => f.message) as any),
                    compliance_score: this.calculateComplianceScore(metrics, fraudFlags),
                    is_valid: fraudFlags.length === 0
                })
                .eq('id', trackingId)
                .select()
                .single();

            if (updateError) return { data: null, error: handleSupabaseError(updateError) };

            return { data: this.mapRouteTracking(updated), error: null };
        } catch (error) {
            console.error('Error finishing round tracking:', error);
            return { data: null, error: 'Error al finalizar tracking' };
        }
    }

    static async getTrackingByGuardAndDate(guardId: string, date: string): Promise<{ data: RouteTracking[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('route_tracking')
                .select('*')
                .eq('guard_id', guardId)
                .eq('shift_date', date)
                .order('round_number', { ascending: true });

            if (error) return { data: null, error: handleSupabaseError(error) };

            return { data: data.map(d => this.mapRouteTracking(d)), error: null };
        } catch (error) {
            console.error('Error fetching tracking:', error);
            return { data: null, error: 'Error al obtener tracking' };
        }
    }

    /**
     * ====================================
     * ANÁLISIS Y DETECCIÓN DE FRAUDE
     * ====================================
     */

    private static calculateRouteMetrics(breadcrumbs: GPSCoordinate[], startTime: Date): { totalDistance: number; durationSeconds: number; averageSpeed: number; } {
        if (!breadcrumbs || breadcrumbs.length < 2) return { totalDistance: 0, durationSeconds: 0, averageSpeed: 0 };

        let totalDistance = 0;
        for (let i = 1; i < breadcrumbs.length; i++) {
            totalDistance += this.haversineDistance(breadcrumbs[i - 1].lat, breadcrumbs[i - 1].lng, breadcrumbs[i].lat, breadcrumbs[i].lng);
        }

        const endTime = new Date(breadcrumbs[breadcrumbs.length - 1].timestamp);
        const durationSeconds = Math.max(1, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
        const hours = durationSeconds / 3600;
        const averageSpeed = (totalDistance / 1000) / hours;

        return { totalDistance, durationSeconds, averageSpeed };
    }

    private static detectFraudPatterns(breadcrumbs: GPSCoordinate[], metrics: any): FraudAlert[] {
        const alerts: FraudAlert[] = [];
        if (!breadcrumbs || breadcrumbs.length < 2) return alerts;

        // 1. Distancia total muy corta
        if (metrics.totalDistance < 100) {
            alerts.push({
                type: 'distance_too_short',
                severity: 'high',
                message: `Distancia sospechosamente corta: ${metrics.totalDistance.toFixed(0)}m`
            });
        }

        // 2. Velocidad promedio anómala
        if (metrics.averageSpeed > 20) {
            alerts.push({
                type: 'speed_anomaly',
                severity: 'high',
                message: `Velocidad promedio imposible a pie: ${metrics.averageSpeed.toFixed(1)} km/h`
            });
        }

        // 3. Detección de Mock Locations (Ubicación simulada)
        const mockedPoints = breadcrumbs.filter(p => p.isMocked);
        if (mockedPoints.length > 0) {
            alerts.push({
                type: 'gps_invalid',
                severity: 'high',
                message: `¡ALERTA!: Se detectaron ${mockedPoints.length} puntos de ubicación simulada (Mock GPS)`
            });
        }

        // 4. Inconsistencia de Saltos GPS (Teletransportación)
        for (let i = 1; i < breadcrumbs.length; i++) {
            const dist = this.haversineDistance(
                breadcrumbs[i - 1].lat, breadcrumbs[i - 1].lng,
                breadcrumbs[i].lat, breadcrumbs[i].lng
            );
            const timeDiff = (new Date(breadcrumbs[i].timestamp).getTime() - new Date(breadcrumbs[i - 1].timestamp).getTime()) / 1000;

            if (timeDiff > 0) {
                const speed = (dist / timeDiff) * 3.6; // km/h
                if (speed > 80 && dist > 100) { // Salto de más de 100m a más de 80km/h
                    alerts.push({
                        type: 'time_inconsistent',
                        severity: 'high',
                        message: `Salto GPS anómalo detectado: ${dist.toFixed(0)}m en ${timeDiff.toFixed(0)}s`
                    });
                    break;
                }
            }
        }

        // 5. Muy pocos puntos GPS
        if (breadcrumbs.length < 5) {
            alerts.push({
                type: 'gps_invalid',
                severity: 'medium',
                message: `Datos insuficientes: Solo ${breadcrumbs.length} puntos GPS registrados`
            });
        }

        return alerts;
    }

    private static calculateComplianceScore(metrics: any, fraudFlags: FraudAlert[]): number {
        let score = 100;
        score -= fraudFlags.filter(f => f.severity === 'high').length * 30;
        score -= fraudFlags.filter(f => f.severity === 'medium').length * 15;
        if (metrics.totalDistance > 300) score += 5;
        return Math.max(0, Math.min(100, score));
    }

    private static haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * ====================================
     * MAPPERS
     * ====================================
     */

    private static mapCheckpoint(data: any): QRCheckpoint {
        return {
            id: data.id,
            installationId: data.installation_id,
            name: data.name,
            description: data.description,
            checkpointType: data.checkpoint_type || 'QR',
            qrCode: data.qr_code || '',
            nfcId: data.nfc_id || undefined,
            latitude: data.latitude,
            longitude: data.longitude,
            validationRadiusMeters: data.validation_radius_meters,
            isActive: data.is_active,
            orderSequence: data.order_sequence,
            routeId: data.route_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    private static mapRoute(data: any): Route {
        return {
            id: data.id,
            name: data.name,
            installationId: data.installation_id,
            isActive: data.is_active,
            roundsPerShift: data.rounds_per_shift,
            createdAt: data.created_at,
            checkpointsCount: data.qr_checkpoints?.[0]?.count || 0
        };
    }

    private static mapRoutes(data: any[]): Route[] {
        return data.map(d => this.mapRoute(d));
    }

    private static mapCheckpoints(data: any[]): QRCheckpoint[] {
        return data.map(d => this.mapCheckpoint(d));
    }

    private static mapRouteTracking(data: any): RouteTracking {
        if (!data) return {} as RouteTracking;
        return {
            id: data.id,
            guardId: data.guard_id,
            installationId: data.installation_id,
            roundNumber: data.round_number,
            shiftDate: data.shift_date,
            breadcrumbs: Array.isArray(data.breadcrumbs) ? data.breadcrumbs : [],
            totalDistanceMeters: data.total_distance_meters,
            durationSeconds: data.duration_seconds,
            averageSpeedKmh: data.average_speed_kmh,
            startTime: data.start_time,
            endTime: data.end_time,
            isValid: data.is_valid,
            fraudFlags: Array.isArray(data.fraud_flags) ? data.fraud_flags : [],
            complianceScore: data.compliance_score || 100,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}
