
import React, { useState, useMemo } from 'react';
import {
    Bell, X, Check, AlertTriangle, Info, CheckCircle,
    ShieldAlert, Settings2, Trash2, Filter, BellRing
} from 'lucide-react';

// Import correctly from services or types
import { Notification, NotificationPriority } from '../services/notifications.service';

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearAll?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications, onMarkAsRead, onMarkAllAsRead, onClearAll
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<NotificationPriority | 'all'>('all');

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = useMemo(() => {
        if (filter === 'all') return notifications;
        return notifications.filter(n => n.priority === filter);
    }, [notifications, filter]);

    const getPriorityStyles = (priority: NotificationPriority, isRead: boolean) => {
        if (isRead) return 'border-gray-200 dark:border-gray-800 opacity-60';
        switch (priority) {
            case 'critical': return 'border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
            case 'high': return 'border-orange-500 bg-orange-500/10';
            case 'medium': return 'border-blue-500 bg-blue-500/10';
            default: return 'border-gray-200 dark:border-gray-700';
        }
    };

    const getIcon = (type: string, priority: NotificationPriority) => {
        const size = "w-5 h-5";
        if (priority === 'critical') return <ShieldAlert className={`text-red-500 ${size} animate-pulse`} />;

        switch (type) {
            case 'SOS': return <ShieldAlert className={`text-red-500 ${size}`} />;
            case 'INCIDENT': return <AlertTriangle className={`text-orange-500 ${size}`} />;
            case 'SYSTEM': return <Settings2 className={`text-purple-500 ${size}`} />;
            case 'QR':
            case 'NFC': return <CheckCircle className={`text-green-500 ${size}`} />;
            default: return <Info className={`text-blue-500 ${size}`} />;
        }
    };

    return (
        <div className="relative z-50">
            {/* Botón de Campana */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-300 border ${unreadCount > 0
                        ? 'bg-blue-600/10 border-blue-500/50 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'
                    } hover:scale-105 active:scale-95`}
            >
                {unreadCount > 0 ? <BellRing size={20} className="animate-bounce" /> : <Bell size={20} />}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg border-2 border-white dark:border-gray-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-4 w-[22rem] md:w-[26rem] rounded-2xl glass-panel shadow-2xl border border-white/20 dark:border-gray-700 z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 origin-top-right">

                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    Notificaciones
                                    {unreadCount > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount} nuevas</span>}
                                </h3>
                                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                                    <X size={18} className="text-gray-500" />
                                </button>
                            </div>

                            {/* Filters & Actions */}
                            <div className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-white/10">
                                <div className="flex gap-1">
                                    {(['all', 'critical', 'high'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setFilter(p)}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === p
                                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            {p === 'all' ? 'Ver Todo' : p === 'critical' ? 'SOS' : 'Altas'}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2 pr-1">
                                    <button
                                        onClick={onMarkAllAsRead}
                                        title="Marcar todas como leídas"
                                        className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"
                                    >
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={onClearAll}
                                        title="Borrar historial"
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell className="w-12 h-12 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">No hay notificaciones pendientes</p>
                                </div>
                            ) : (
                                filteredNotifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.read && onMarkAsRead(n.id)}
                                        className={`p-4 rounded-2xl border-l-4 transition-all duration-300 cursor-pointer relative group ${getPriorityStyles(n.priority, n.read)
                                            } ${n.read ? 'bg-transparent' : 'bg-white dark:bg-gray-800/80 shadow-md'}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`shrink-0 p-2.5 rounded-xl ${n.read ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-white dark:bg-gray-900 shadow-inner'
                                                }`}>
                                                {getIcon(n.type, n.priority)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-xs font-black uppercase tracking-tight truncate ${!n.read ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                                                        }`}>
                                                        {n.title}
                                                    </h4>
                                                    {!n.read && (
                                                        <span className="flex h-2 w-2">
                                                            <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75 ${n.priority === 'critical' ? 'bg-red-400' : 'bg-blue-400'
                                                                }`}></span>
                                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${n.priority === 'critical' ? 'bg-red-500' : 'bg-blue-500'
                                                                }`}></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-700 dark:text-gray-300 font-medium'
                                                    }`}>
                                                    {n.message}
                                                </p>

                                                <div className="flex justify-between items-center mt-3">
                                                    <div className="flex gap-2">
                                                        {n.guard_name && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">
                                                                {n.guard_name}
                                                            </span>
                                                        )}
                                                        {n.installation_name && (
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase truncate max-w-[100px]">
                                                                {n.installation_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-400">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Insight */}
                        <div className="p-3 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 text-center">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Panel de Seguridad Integral Brigasur</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationCenter;