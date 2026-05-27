import { useEffect, useState, useCallback } from 'react';
import { NotificationsService, Notification, NotificationType, NotificationPriority } from '../services/notifications.service';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook para gestionar notificaciones en tiempo real
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    // Agregar nueva notificación
    const addNotification = useCallback((notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Reproducir sonido
        NotificationsService.playNotificationSound(notification.priority);

        // Mostrar notificación del navegador
        NotificationsService.showBrowserNotification(notification);
    }, []);

    // Marcar notificación como leída
    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    // Eliminar notificación
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification && !notification.read) {
                setUnreadCount(count => Math.max(0, count - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    // Limpiar todas las notificaciones
    const clearAll = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Suscribirse a notificaciones en tiempo real
    useEffect(() => {
        const newChannel = NotificationsService.subscribeToNotifications(addNotification);
        setChannel(newChannel);

        // Solicitar permiso para notificaciones del navegador
        NotificationsService.requestNotificationPermission();

        // Cleanup
        return () => {
            NotificationsService.unsubscribe();
        };
    }, [addNotification]);

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        channel
    };
}

/**
 * Hook para suscribirse a alertas SOS en tiempo real
 */
export function useSOSAlerts(onSOS?: (notification: Notification) => void) {
    const [sosAlerts, setSOSAlerts] = useState<Notification[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const newChannel = NotificationsService.subscribeToSOS((notification) => {
            setSOSAlerts(prev => [notification, ...prev]);

            // Callback personalizado
            if (onSOS) {
                onSOS(notification);
            }

            // Reproducir sonido crítico
            NotificationsService.playNotificationSound('critical');

            // Mostrar notificación del navegador
            NotificationsService.showBrowserNotification(notification);
        });

        setChannel(newChannel);

        return () => {
            NotificationsService.unsubscribeChannel(newChannel);
        };
    }, [onSOS]);

    return {
        sosAlerts,
        channel
    };
}

/**
 * Hook para suscribirse a incidencias en tiempo real
 */
export function useIncidents(onIncident?: (notification: Notification) => void) {
    const [incidents, setIncidents] = useState<Notification[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const newChannel = NotificationsService.subscribeToIncidents((notification) => {
            setIncidents(prev => [notification, ...prev]);

            if (onIncident) {
                onIncident(notification);
            }

            NotificationsService.playNotificationSound('high');
            NotificationsService.showBrowserNotification(notification);
        });

        setChannel(newChannel);

        return () => {
            NotificationsService.unsubscribeChannel(newChannel);
        };
    }, [onIncident]);

    return {
        incidents,
        channel
    };
}

/**
 * Hook para suscribirse a marcados (QR/NFC) en tiempo real
 */
export function useCheckIns(onCheckIn?: (notification: Notification) => void) {
    const [checkIns, setCheckIns] = useState<Notification[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const newChannel = NotificationsService.subscribeToCheckIns((notification) => {
            setCheckIns(prev => [notification, ...prev]);

            if (onCheckIn) {
                onCheckIn(notification);
            }

            // No reproducir sonido para marcados normales (opcional)
            // NotificationsService.playNotificationSound('low');
        });

        setChannel(newChannel);

        return () => {
            NotificationsService.unsubscribeChannel(newChannel);
        };
    }, [onCheckIn]);

    return {
        checkIns,
        channel
    };
}

/**
 * Hook para suscribirse a cambios en una tabla específica
 */
export function useRealtimeTable<T = any>(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    onUpdate?: (payload: { old: T; new: T; eventType: string }) => void
) {
    const [data, setData] = useState<T[]>([]);
    const [channel, setChannel] = useState<RealtimeChannel | null>(null);

    useEffect(() => {
        const newChannel = NotificationsService.subscribeToTable<T>(
            table,
            event,
            (payload) => {
                // Actualizar estado según el tipo de evento
                if (payload.eventType === 'INSERT') {
                    setData(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setData(prev => prev.map(item =>
                        (item as any).id === (payload.new as any).id ? payload.new : item
                    ));
                } else if (payload.eventType === 'DELETE') {
                    setData(prev => prev.filter(item =>
                        (item as any).id !== (payload.old as any).id
                    ));
                }

                // Callback personalizado
                if (onUpdate) {
                    onUpdate(payload);
                }
            }
        );

        setChannel(newChannel);

        return () => {
            NotificationsService.unsubscribeChannel(newChannel);
        };
    }, [table, event, onUpdate]);

    return {
        data,
        channel
    };
}
