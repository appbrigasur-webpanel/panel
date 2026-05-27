import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { Guard, Installation } from '../types';
import { Shield, Map as MapIcon, AlertTriangle, Loader2, Volume2, Siren } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GOOGLE_MAPS_LIBRARIES } from '../constants';

interface InteractiveMapProps {
    className?: string;
    apiKey: string;
    guards: Guard[];
    installations: Installation[];
    theme: 'dark' | 'light';
}

// Alert Sound URL (Siren)
const SOS_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3";

const InteractiveMap: React.FC<InteractiveMapProps> = ({ className, apiKey, guards = [], installations = [], theme }) => {
    // 1. Loader hook - solo si hay API Key
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-v2',
        googleMapsApiKey: apiKey || 'dummy-key', // Evitar que rompa si es vacío
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    const [showGuards, setShowGuards] = useState(true);
    const [showInstallations, setShowInstallations] = useState(true);
    const [activeSOS, setActiveSOS] = useState<any[]>([]);
    const [selectedSOS, setSelectedSOS] = useState<any | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Cálculos de centros y posiciones seguras con validación estricta
    const center = useMemo(() => {
        try {
            if (Array.isArray(installations) && installations.length > 0) {
                const validInst = installations.filter(i =>
                    i && typeof i.lat === 'number' && Number.isFinite(i.lat) &&
                    typeof i.lng === 'number' && Number.isFinite(i.lng)
                );

                if (validInst.length > 0) {
                    const lat = validInst.reduce((sum, inst) => sum + (inst.lat || 0), 0) / validInst.length;
                    const lng = validInst.reduce((sum, inst) => sum + (inst.lng || 0), 0) / validInst.length;

                    if (Number.isFinite(lat) && Number.isFinite(lng)) {
                        return { lat, lng };
                    }
                }
            }
        } catch (e) {
            console.error("❌ Error grave calculando centro del mapa:", e);
        }
        return { lat: -33.4489, lng: -70.6693 }; // Santiago
    }, [installations]);

    const handleAttendSOS = (sosId: string) => {
        setActiveSOS(prev => prev.filter(sos => (sos.id || sos.sosId) !== sosId));
        setSelectedSOS(null);
        if (activeSOS.length <= 1) stopAlertSound();
    };

    // SOS Animation Constant (1 = BOUNCE)
    const ANIMATION_BOUNCE = 1;

    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('sos-alerts-map')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, (payload) => {
                const newSOS = payload.new;
                if (newSOS) {
                    setActiveSOS(prev => [newSOS, ...prev]);
                    playAlertSound();
                }
            })
            .subscribe();

        const loadInitialAlerts = async () => {
            try {
                const { data, error } = await supabase
                    .from('alerts')
                    .select('*')
                    .eq('status', 'active');
                if (data) setActiveSOS(data);
                if (error) console.error("Error loading alerts:", error);
            } catch (err) {
                console.error("Supabase alerts fetch error:", err);
            }
        };
        loadInitialAlerts();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const playAlertSound = () => {
        try {
            if (!audioRef.current) audioRef.current = new Audio(SOS_SOUND_URL);
            audioRef.current.play().catch(e => console.warn("Audio playback blocked/failed:", e));
        } catch (e) {
            console.warn("Audio init error:", e);
        }
    };

    const stopAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    // UI de Error
    if (loadError) {
        return (
            <div className="p-10 bg-red-50 dark:bg-red-900/20 border-4 border-red-500 rounded-3xl flex flex-col items-center justify-center text-center">
                <AlertTriangle className="text-red-500 w-16 h-16 mb-4" />
                <h3 className="text-2xl font-black text-red-600 uppercase mb-2">Error de Conexión</h3>
                <p className="text-gray-600 dark:text-gray-400">Error al cargar Google Maps. Verifique su API Key.</p>
            </div>
        );
    }

    // UI de Falta Config
    if (!apiKey) {
        return (
            <div className="p-10 bg-slate-100 dark:bg-slate-900/50 border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center h-[700px]">
                <Shield className="text-slate-400 w-16 h-16 mb-4 animate-pulse" />
                <h3 className="text-2xl font-black text-slate-500 uppercase mb-2">Radar Desactivado</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">Configure la API Key de Google Maps en la sección 'Config' para activar el monitoreo táctico.</p>
            </div>
        );
    }

    // Helper para evitar superposición
    const posPool: Record<string, number> = {};
    const getOffsetPos = (lat: number | undefined | null, lng: number | undefined | null) => {
        if (lat === undefined || lat === null || lng === undefined || lng === null) return null;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        const count = posPool[key] || 0;
        posPool[key] = count + 1;

        if (count === 0) return { lat, lng };
        const angle = count * 137.5;
        const radius = 0.00015 * Math.sqrt(count);
        return {
            lat: lat + (radius * Math.cos(angle * Math.PI / 180)),
            lng: lng + (radius * Math.sin(angle * Math.PI / 180))
        };
    };

    return (
        <div className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5 ${className || ''}`} style={{ height: '700px' }}>
            {/* SOS HUD ALERT */}
            {activeSOS.length > 0 && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] animate-bounce">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white pointer-events-auto">
                        <Siren size={20} className="animate-pulse" />
                        <span className="font-black text-sm uppercase tracking-widest">
                            {activeSOS.length} SOS ACTIVOS
                        </span>
                        <button
                            onClick={stopAlertSound}
                            className="bg-white/20 hover:bg-white/30 p-1.5 rounded-lg transition-colors"
                        >
                            <Volume2 size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Controles HUD */}
            <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-none">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex gap-4 pointer-events-auto border border-white/20">
                    <div className="flex items-center gap-2 pr-4 border-r dark:border-gray-700">
                        <div className="bg-blue-600 p-1.5 rounded-lg">
                            <MapIcon size={16} className="text-white" />
                        </div>
                        <span className="font-black text-xs uppercase tracking-tighter dark:text-white">Radar Táctico</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowGuards(!showGuards)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${showGuards ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Guardias
                        </button>
                        <button
                            onClick={() => setShowInstallations(!showInstallations)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm ${showInstallations ? 'bg-orange-600 text-white shadow-orange-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                            Instalaciones
                        </button>
                    </div>
                </div>
            </div>

            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={center}
                    zoom={12}
                    options={{
                        disableDefaultUI: false,
                        mapTypeControl: false,
                        streetViewControl: false,
                        styles: theme === 'dark' ? [
                            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                            { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                            { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                            { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                            { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }
                        ] : [{ featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }]
                    }}
                >
                    <MarkerClusterer
                        options={{
                            gridSize: 50,
                            maxZoom: 16,
                        }}
                    >
                        {(clusterer) => (
                            <>
                                {/* 1. SOS Markers */}
                                {activeSOS.map(sos => {
                                    const siteId = sos.installation_id || sos.installationId;
                                    const inst = installations.find(i => String(i.id) === String(siteId));
                                    if (!inst) return null;

                                    return (
                                        <Marker
                                            key={`sos-${sos.id}`}
                                            position={{ lat: (inst.lat || 0) + 0.0002, lng: inst.lng || 0 }}
                                            onClick={() => setSelectedSOS(sos)}
                                            zIndex={1000}
                                            animation={ANIMATION_BOUNCE}
                                            icon={{
                                                path: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
                                                fillColor: "#ef4444",
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: "#ffffff",
                                                scale: 1.5,
                                                anchor: isLoaded && window.google ? new window.google.maps.Point(12, 12) : { x: 12, y: 12 } as any
                                            }}
                                        />
                                    );
                                })}

                                {/* 2. Installations */}
                                {showInstallations && installations.map(inst => {
                                    const finalPos = getOffsetPos(inst.lat, inst.lng);
                                    if (!finalPos) return null;

                                    return (
                                        <Marker
                                            key={`inst-${inst.id}`}
                                            position={finalPos}
                                            clusterer={clusterer}
                                            title={`Instalación: ${inst.name}`}
                                            icon={{
                                                path: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm4 8H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2z",
                                                fillColor: "#f97316",
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: "#ffffff",
                                                scale: 1.5,
                                                anchor: isLoaded && window.google ? new window.google.maps.Point(12, 12) : { x: 12, y: 12 } as any
                                            }}
                                        />
                                    );
                                })}

                                {/* 3. Guards */}
                                {showGuards && (guards || []).map(guard => {
                                    if (!guard) return null;
                                    const basePos = guard.lastLocation || (guard.assignedInstallationId ? installations.find(i => String(i.id) === String(guard.assignedInstallationId)) : null);
                                    if (!basePos) return null;

                                    const finalPos = getOffsetPos(basePos.lat, basePos.lng);
                                    if (!finalPos) return null;

                                    return (
                                        <Marker
                                            key={`guard-${guard.id}`}
                                            position={finalPos}
                                            clusterer={clusterer}
                                            title={`Guardia: ${guard.fullName}`}
                                            icon={{
                                                path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
                                                fillColor: guard.isActive ? "#3b82f6" : "#94a3b8",
                                                fillOpacity: 1,
                                                strokeWeight: 2,
                                                strokeColor: "#ffffff",
                                                scale: 1.2,
                                                anchor: isLoaded && window.google ? new window.google.maps.Point(12, 12) : { x: 12, y: 12 } as any
                                            }}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </MarkerClusterer>

                    {selectedSOS && (
                        <InfoWindow
                            position={{
                                lat: installations.find(i => String(i.id) === String(selectedSOS.installation_id || selectedSOS.installationId))?.lat || center.lat,
                                lng: installations.find(i => String(i.id) === String(selectedSOS.installation_id || selectedSOS.installationId))?.lng || center.lng
                            }}
                            onCloseClick={() => setSelectedSOS(null)}
                        >
                            <div className="p-2 min-w-[200px]">
                                <div className="flex items-center gap-2 text-red-600 mb-2 border-b pb-1">
                                    <Siren size={18} />
                                    <h4 className="font-black text-sm uppercase">EMERGENCIA SOS</h4>
                                </div>
                                <p className="text-xs font-bold text-gray-900 mb-1">Guardia: <span className="text-blue-600 font-black">{selectedSOS.guard_name || selectedSOS.guardName || 'Desconocido'}</span></p>
                                <p className="text-[10px] text-gray-600 mb-3 italic">"{selectedSOS.detail || selectedSOS.message || 'Sin detalles'}"</p>
                                <button
                                    onClick={() => handleAttendSOS(selectedSOS.id || selectedSOS.sosId)}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-md"
                                >
                                    Marcar Atendido
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            ) : (
                <div className="h-full w-full bg-slate-900 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
                    <p className="font-black uppercase text-xs tracking-[0.3em] text-blue-500 animate-pulse">Iniciando Radar Táctico</p>
                </div>
            )}
        </div>
    );
};

export default InteractiveMap;
