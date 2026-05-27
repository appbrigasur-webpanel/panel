import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type NotificationType = 'SOS' | 'INCIDENT' | 'QR' | 'NFC' | 'SYSTEM';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
    id: string;
    type: NotificationType;
    priority: NotificationPriority;
    title: string;
    message: string;
    guard_id?: string;
    guard_name?: string;
    installation_id?: string;
    installation_name?: string;
    latitude?: number;
    longitude?: number;
    read: boolean;
    created_at: string;
}

/**
 * Servicio para gestionar notificaciones en tiempo real con Supabase Realtime
 */
export class NotificationsService {
    private static channel: RealtimeChannel | null = null;

    /**
     * Suscribirse a notificaciones en tiempo real
     */
    static subscribeToNotifications(
        callback: (notification: Notification) => void
    ): RealtimeChannel {
        // Si ya hay un canal abierto, cerrarlo primero
        if (this.channel) {
            this.channel.unsubscribe();
        }

        // Crear nuevo canal para logs (que incluyen SOS e incidentes)
        this.channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'logs',
                    filter: 'type=in.(SOS,INCIDENT)'
                },
                (payload) => {
                    const log = payload.new;

                    // Transformar log a notificación
                    const notification: Notification = {
                        id: log.id,
                        type: log.type as NotificationType,
                        priority: log.type === 'SOS' ? 'critical' : 'high',
                        title: log.type === 'SOS' ? '🚨 ALERTA SOS' : '⚠️ Nueva Incidencia',
                        message: log.notes || `${log.type} registrado`,
                        guard_id: log.guard_id,
                        guard_name: log.guard_name,
                        installation_id: log.installation_id,
                        installation_name: log.installation_name,
                        latitude: log.latitude,
                        longitude: log.longitude,
                        read: false,
                        created_at: log.created_at
                    };

                    callback(notification);
                }
            )
            .subscribe();

        return this.channel;
    }

    /**
     * Suscribirse a cambios en una tabla específica
     */
    static subscribeToTable<T = any>(
        table: string,
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
        callback: (payload: { old: T; new: T; eventType: string }) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel(`${table}_changes`)
            .on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table
                },
                (payload) => {
                    callback({
                        old: payload.old as T,
                        new: payload.new as T,
                        eventType: payload.eventType
                    });
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Suscribirse a alertas SOS en tiempo real
     */
    static subscribeToSOS(
        callback: (sos: Notification) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('sos_alerts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'logs',
                    filter: 'type=eq.SOS'
                },
                (payload) => {
                    const log = payload.new;

                    const notification: Notification = {
                        id: log.id,
                        type: 'SOS',
                        priority: 'critical',
                        title: '🚨 ALERTA SOS',
                        message: `SOS activado por ${log.guard_name || 'Guardia'} en ${log.installation_name || 'ubicación desconocida'}`,
                        guard_id: log.guard_id,
                        guard_name: log.guard_name,
                        installation_id: log.installation_id,
                        installation_name: log.installation_name,
                        latitude: log.latitude,
                        longitude: log.longitude,
                        read: false,
                        created_at: log.created_at
                    };

                    callback(notification);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Suscribirse a incidencias en tiempo real
     */
    static subscribeToIncidents(
        callback: (incident: Notification) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('incidents')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'logs',
                    filter: 'type=eq.INCIDENT'
                },
                (payload) => {
                    const log = payload.new;

                    const notification: Notification = {
                        id: log.id,
                        type: 'INCIDENT',
                        priority: 'high',
                        title: '⚠️ Nueva Incidencia',
                        message: log.notes || `Incidencia reportada por ${log.guard_name || 'Guardia'}`,
                        guard_id: log.guard_id,
                        guard_name: log.guard_name,
                        installation_id: log.installation_id,
                        installation_name: log.installation_name,
                        latitude: log.latitude,
                        longitude: log.longitude,
                        read: false,
                        created_at: log.created_at
                    };

                    callback(notification);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Suscribirse a marcados (QR/NFC) en tiempo real
     */
    static subscribeToCheckIns(
        callback: (checkIn: Notification) => void
    ): RealtimeChannel {
        const channel = supabase
            .channel('check_ins')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'logs',
                    filter: 'type=in.(QR,NFC)'
                },
                (payload) => {
                    const log = payload.new;

                    const notification: Notification = {
                        id: log.id,
                        type: log.type as NotificationType,
                        priority: 'low',
                        title: `✅ Marcado ${log.type}`,
                        message: `${log.guard_name || 'Guardia'} marcó en ${log.installation_name || 'instalación'}`,
                        guard_id: log.guard_id,
                        guard_name: log.guard_name,
                        installation_id: log.installation_id,
                        installation_name: log.installation_name,
                        latitude: log.latitude,
                        longitude: log.longitude,
                        read: false,
                        created_at: log.created_at
                    };

                    callback(notification);
                }
            )
            .subscribe();

        return channel;
    }

    /**
     * Desuscribirse de todas las notificaciones
     */
    static unsubscribe() {
        if (this.channel) {
            this.channel.unsubscribe();
            this.channel = null;
        }
    }

    /**
     * Desuscribirse de un canal específico
     */
    static unsubscribeChannel(channel: RealtimeChannel) {
        channel.unsubscribe();
    }

    /**
     * Reproducir sonido de notificación
     */
    static playNotificationSound(priority: NotificationPriority = 'medium') {
        // Crear un AudioContext
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configurar frecuencia según prioridad
        const frequencies = {
            low: 440,      // A4
            medium: 523,   // C5
            high: 659,     // E5
            critical: 880  // A5
        };

        oscillator.frequency.value = frequencies[priority];
        oscillator.type = priority === 'critical' ? 'square' : 'sine';

        // Configurar volumen
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        // Reproducir
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    /**
     * Mostrar notificación del navegador
     */
    static async showBrowserNotification(notification: Notification) {
        // Verificar si las notificaciones están soportadas
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return;
        }

        // Solicitar permiso si es necesario
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        // Mostrar notificación si se tiene permiso
        if (Notification.permission === 'granted') {
            const options: NotificationOptions = {
                body: notification.message,
                icon: '/logo.png', // Asegúrate de tener un logo
                badge: '/badge.png',
                tag: notification.id,
                requireInteraction: notification.priority === 'critical',
                vibrate: notification.priority === 'critical' ? [200, 100, 200] : [100],
            };

            new Notification(notification.title, options);
        }
    }

    /**
     * Solicitar permiso para notificaciones del navegador
     */
    static async requestNotificationPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return 'denied';
        }

        if (Notification.permission === 'default') {
            return await Notification.requestPermission();
        }

        return Notification.permission;
    }
}
