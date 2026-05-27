import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, AlertTriangle, CheckCircle, MapPin, Calendar } from 'lucide-react';
import RouteMapViewer from './RouteMapViewer';
import type { Guard, Installation } from '../types';

interface ComplianceDashboardProps {
    guards: Guard[];
    installations: Installation[];
    googleMapsKey: string;
    theme: 'dark' | 'light';
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ guards, installations, googleMapsKey, theme }) => {
    const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [view, setView] = useState<'overview' | 'details'>('overview');

    useEffect(() => {
        if (guards.length > 0 && !selectedGuard) {
            setSelectedGuard(guards[0]);
        }
    }, [guards]);

    if (!selectedGuard) {
        return (
            <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">
                    No hay guardias disponibles para mostrar
                </p>
            </div>
        );
    }

    const guardInstallation = installations.find(i => i.id === selectedGuard.assignedInstallationId);

    return (
        <div className="p-6 pb-24 overflow-y-auto h-full">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500" />
                            Panel de Cumplimiento GPS
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Validación de rondas y tracking en tiempo real
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('overview')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'overview'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Vista General
                        </button>
                        <button
                            onClick={() => setView('details')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'details'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            Detalles de Ruta
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="glass-panel p-6 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Seleccionar Guardia
                            </label>
                            <select
                                value={selectedGuard.id}
                                onChange={(e) => {
                                    const guard = guards.find(g => g.id === e.target.value);
                                    if (guard) setSelectedGuard(guard);
                                }}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {guards.map(guard => (
                                    <option key={guard.id} value={guard.id}>
                                        {guard.fullName} {guard.assignedInstallationId ? `(${installations.find(i => i.id === guard.assignedInstallationId)?.name || 'Sin instalación'})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Información del Guardia */}
                <div className="glass-panel p-6 rounded-xl border border-blue-200 dark:border-blue-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {selectedGuard.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {selectedGuard.fullName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedGuard.rut} • {selectedGuard.email}
                            </p>
                            {guardInstallation && (
                                <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4" />
                                    {guardInstallation.name}
                                </p>
                            )}
                        </div>
                        <div className={`px-4 py-2 rounded-lg ${selectedGuard.isActive
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                            {selectedGuard.isActive ? 'Activo' : 'Inactivo'}
                        </div>
                    </div>
                </div>

                {/* Vista según selección */}
                {view === 'details' && guardInstallation ? (
                    <RouteMapViewer
                        guardId={selectedGuard.id}
                        guardName={selectedGuard.fullName}
                        installationId={guardInstallation.id}
                        date={selectedDate}
                        googleMapsKey={googleMapsKey}
                        theme={theme}
                    />
                ) : (
                    <div className="glass-panel p-12 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                        <TrendingUp className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Vista General de Cumplimiento
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Próximamente: Dashboard con estadísticas mensuales, ranking de guardias y tendencias
                        </p>
                        <button
                            onClick={() => setView('details')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Ver Detalles de Rondas
                        </button>
                    </div>
                )}

                {/* Guía de inicio rápido */}
                <div className="glass-panel p-6 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10">
                    <h3 className="text-lg font-bold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Sistema GPS Activado
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Validación GPS Activa</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Cada escaneo QR verifica que el guardia esté en el punto físico
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Tracking Completo</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Se registra la ruta GPS completa de cada ronda
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                3
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">Detección Anti-Fraude</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Alertas automáticas ante patrones sospechosos
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDashboard;
