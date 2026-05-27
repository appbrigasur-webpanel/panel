import React, { useState, useEffect } from 'react';
import { 
    Route as RouteIcon, Plus, Trash2, Edit2, MapPin, 
    ChevronRight, Save, X, ListOrdered, CheckCircle2, 
    Circle, AlertCircle, Info, Search, MoveVertical
} from 'lucide-react';
import { GPSTrackingService } from '../services/gps-tracking.service';
import type { Route, QRCheckpoint, Installation } from '../types';

interface RouteManagerProps {
    installations: Installation[];
}

const RouteManager: React.FC<RouteManagerProps> = ({ installations }) => {
    const [selectedInstallation, setSelectedInstallation] = useState<string>(installations[0]?.id || '');
    const [routes, setRoutes] = useState<Route[]>([]);
    const [checkpoints, setCheckpoints] = useState<QRCheckpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    const [editingRoute, setEditingRoute] = useState<Partial<Route> | null>(null);
    const [selectedRouteForAssignment, setSelectedRouteForAssignment] = useState<Route | null>(null);
    const [assignedPoints, setAssignedPoints] = useState<string[]>([]); // Array of checkpoint IDs
    
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        if (selectedInstallation) {
            loadData();
        }
    }, [selectedInstallation]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [routesRes, checkpointsRes] = await Promise.all([
                GPSTrackingService.getRoutesByInstallation(selectedInstallation),
                GPSTrackingService.getCheckpointsByInstallation(selectedInstallation)
            ]);

            if (routesRes.data) setRoutes(routesRes.data);
            if (checkpointsRes.data) setCheckpoints(checkpointsRes.data);
        } catch (error) {
            console.error('Error loading route data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoute = () => {
        setEditingRoute({
            name: '',
            installationId: selectedInstallation,
            isActive: true,
            roundsPerShift: 1
        });
        setSaveError(null);
        setIsRouteModalOpen(true);
    };

    const handleEditRoute = (route: Route) => {
        setEditingRoute({ ...route });
        setSaveError(null);
        setIsRouteModalOpen(true);
    };

    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRoute?.name) return;

        setLoading(true);
        try {
            let result;
            if (editingRoute.id) {
                result = await GPSTrackingService.updateRoute(editingRoute.id, editingRoute);
            } else {
                result = await GPSTrackingService.createRoute(editingRoute as any);
            }

            if (result.error) {
                setSaveError(result.error);
            } else {
                setIsRouteModalOpen(false);
                loadData();
            }
        } catch (error) {
            setSaveError('Error al guardar la ruta');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRoute = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta ruta? Los puntos asignados dejarán de estar vinculados.')) return;

        setLoading(true);
        try {
            await GPSTrackingService.deleteRoute(id);
            loadData();
        } catch (error) {
            console.error('Error deleting route:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAssignment = (route: Route) => {
        setSelectedRouteForAssignment(route);
        // Find points already assigned to this route
        const currentAssignments = checkpoints
            .filter(cp => cp.routeId === route.id)
            .sort((a, b) => (a.orderSequence || 0) - (b.orderSequence || 0))
            .map(cp => cp.id);
        
        setAssignedPoints(currentAssignments);
        setIsAssignModalOpen(true);
    };

    const togglePointAssignment = (checkpointId: string) => {
        setAssignedPoints(prev => {
            if (prev.includes(checkpointId)) {
                return prev.filter(id => id !== checkpointId);
            } else {
                return [...prev, checkpointId];
            }
        });
    };

    const handleSaveAssignment = async () => {
        if (!selectedRouteForAssignment) return;

        setLoading(true);
        try {
            const result = await GPSTrackingService.assignCheckpointsToRoute(
                selectedRouteForAssignment.id,
                assignedPoints
            );

            if (result.error) {
                alert(result.error);
            } else {
                setIsAssignModalOpen(false);
                loadData();
            }
        } catch (error) {
            console.error('Error saving assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const movePoint = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...assignedPoints];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;
        
        [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
        setAssignedPoints(newOrder);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Installation Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <RouteIcon className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        Gestión de Rutas
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Configura las rutas de ronda y asigna puntos de control</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedInstallation}
                            onChange={(e) => setSelectedInstallation(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none min-w-[250px]"
                        >
                            {installations.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button
                        onClick={handleCreateRoute}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus size={20} />
                        Nueva Ruta
                    </button>
                </div>
            </div>

            {/* Routes List */}
            {loading && routes.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : routes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full mb-4">
                        <RouteIcon size={48} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay rutas configuradas</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mt-2">
                        Comienza creando una ruta para organizar los puntos de control de esta instalación.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {routes.map(route => (
                        <div 
                            key={route.id}
                            className="group bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {route.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            route.isActive 
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                        }`}>
                                            {route.isActive ? 'Activa' : 'Inactiva'}
                                        </span>
                                        <span className="text-xs text-gray-400">•</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {route.roundsPerShift} {route.roundsPerShift === 1 ? 'ronda' : 'rondas'} / turno
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEditRoute(route)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        title="Editar detalles"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteRoute(route.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Eliminar ruta"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[...Array(Math.min(3, route.checkpointsCount || 0))].map((_, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                                                <MapPin size={12} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        ))}
                                        {(route.checkpointsCount || 0) > 3 && (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-400">
                                                +{(route.checkpointsCount || 0) - 3}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 ml-1">
                                        {route.checkpointsCount || 0} puntos
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleOpenAssignment(route)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-all border border-gray-100 dark:border-gray-600"
                                >
                                    <ListOrdered size={16} />
                                    Configurar Puntos
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Crear/Editar Ruta */}
            {isRouteModalOpen && editingRoute && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-600">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {editingRoute.id ? <Edit2 size={20} /> : <Plus size={20} />}
                                {editingRoute.id ? 'Editar Ruta' : 'Nueva Ruta'}
                            </h3>
                            <button onClick={() => setIsRouteModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRoute} className="p-6 space-y-4">
                            {saveError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm border border-red-100 dark:border-red-900/30">
                                    <AlertCircle size={18} />
                                    {saveError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la Ruta</label>
                                <input
                                    type="text"
                                    required
                                    value={editingRoute.name}
                                    onChange={e => setEditingRoute({ ...editingRoute, name: e.target.value })}
                                    placeholder="Ej: Ronda Exterior, Piso 1-5..."
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Rondas por Turno</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editingRoute.roundsPerShift}
                                        onChange={e => setEditingRoute({ ...editingRoute, roundsPerShift: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Estado</label>
                                    <div className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                        <input
                                            type="checkbox"
                                            id="route-active"
                                            checked={editingRoute.isActive}
                                            onChange={e => setEditingRoute({ ...editingRoute, isActive: e.target.checked })}
                                            className="w-5 h-5 accent-indigo-600 rounded"
                                        />
                                        <label htmlFor="route-active" className="text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                                            Ruta Activa
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsRouteModalOpen(false)}
                                    className="flex-1 px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Guardar Ruta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Asignar y Ordenar Puntos */}
            {isAssignModalOpen && selectedRouteForAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-600">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <ListOrdered size={20} />
                                    Configurar Puntos: {selectedRouteForAssignment.name}
                                </h3>
                                <p className="text-indigo-100 text-sm mt-0.5">Selecciona y ordena los puntos en el recorrido de la ronda</p>
                            </div>
                            <button onClick={() => setIsAssignModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 gap-6">
                            {/* Available Points (Checkboxes) */}
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                        <Search size={14} /> Puntos Disponibles
                                    </h4>
                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-500 font-bold">
                                        {checkpoints.length} TOTAL
                                    </span>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {checkpoints.map(cp => {
                                        const isAssigned = assignedPoints.includes(cp.id);
                                        const isOtherRoute = cp.routeId && cp.routeId !== selectedRouteForAssignment.id;
                                        
                                        return (
                                            <div 
                                                key={cp.id}
                                                onClick={() => !isOtherRoute && togglePointAssignment(cp.id)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                                    isAssigned 
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' 
                                                        : isOtherRoute
                                                            ? 'bg-gray-50 dark:bg-gray-800 opacity-60 grayscale border-gray-100 dark:border-gray-700 cursor-not-allowed'
                                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                                                }`}
                                            >
                                                {isAssigned ? (
                                                    <CheckCircle2 className="text-indigo-600 dark:text-indigo-400" size={20} />
                                                ) : (
                                                    <Circle className="text-gray-300 dark:text-gray-600" size={20} />
                                                )}
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-none">{cp.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">{cp.checkpointType}</span>
                                                        {isOtherRoute && (
                                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">En otra ruta</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sorted Assignment List */}
                            <div className="flex-1 bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 flex flex-col min-h-0 border border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ListOrdered size={14} /> Orden de Ronda
                                    </div>
                                    <span className="bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-xs font-black">
                                        {assignedPoints.length}
                                    </span>
                                </h4>

                                {assignedPoints.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
                                        <Info className="text-gray-300 dark:text-gray-600 mb-2" size={32} />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Selecciona puntos de la izquierda para incluirlos en el recorrido de esta ruta.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {assignedPoints.map((id, index) => {
                                            const cp = checkpoints.find(c => c.id === id);
                                            if (!cp) return null;
                                            return (
                                                <div 
                                                    key={id}
                                                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{cp.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button 
                                                            disabled={index === 0}
                                                            onClick={() => movePoint(index, 'up')}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-30 transition-all"
                                                        >
                                                            <Plus size={14} className="rotate-45" /> {/* Use Plus rotated for simplicity or another icon */}
                                                        </button>
                                                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                                        <button 
                                                            disabled={index === assignedPoints.length - 1}
                                                            onClick={() => movePoint(index, 'down')}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg disabled:opacity-30 transition-all"
                                                        >
                                                            <ChevronRight size={14} className="rotate-90" />
                                                        </button>
                                                        <button 
                                                            onClick={() => togglePointAssignment(id)}
                                                            className="ml-1 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/80">
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveAssignment}
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
                            >
                                <Save size={20} />
                                {loading ? 'Guardando...' : 'Guardar Configuración'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteManager;
