import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Activity, AlertTriangle, CheckCircle, XCircle, Navigation, TrendingUp, Clock, FileDown, Shield } from 'lucide-react';
import type { RouteTracking, QRCheckpoint, GPSCoordinate } from '../types';
import { GPSTrackingService } from '../services/gps-tracking.service';
import { GOOGLE_MAPS_LIBRARIES } from '../constants';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface RouteMapViewerProps {
    guardId: string;
    guardName: string;
    installationId: string;
    date: string;
    googleMapsKey: string;
    theme: 'dark' | 'light';
}

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const RouteMapViewer: React.FC<RouteMapViewerProps> = ({ guardId, guardName, installationId, date, googleMapsKey, theme }) => {
    const [tracking, setTracking] = useState<RouteTracking[]>([]);
    const [checkpoints, setCheckpoints] = useState<QRCheckpoint[]>([]);
    const [selectedRound, setSelectedRound] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<any>(null);
    const reportRef = useRef<HTMLDivElement>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-v2',
        googleMapsApiKey: googleMapsKey || 'dummy-key',
        libraries: GOOGLE_MAPS_LIBRARIES
    });

    useEffect(() => {
        loadData();
    }, [guardId, date]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: trackingData } = await GPSTrackingService.getTrackingByGuardAndDate(guardId, date);
            if (trackingData) {
                setTracking(trackingData);
                if (trackingData.length > 0) {
                    setSelectedRound(trackingData[0].roundNumber);
                }
            }

            const { data: checkpointsData } = await GPSTrackingService.getCheckpointsByInstallation(installationId);
            if (checkpointsData) setCheckpoints(checkpointsData);
        } catch (error) {
            console.error('Error loading route data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedTracking = useMemo(() =>
        tracking.find(t => t.roundNumber === selectedRound),
        [tracking, selectedRound]);

    const routePath = useMemo(() => {
        if (!selectedTracking) return [];
        return selectedTracking.breadcrumbs.map(point => ({
            lat: point.lat,
            lng: point.lng
        }));
    }, [selectedTracking]);

    const generatePDF = async () => {
        if (!reportRef.current || !selectedTracking) return;
        setIsGeneratingPDF(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                useCORS: true,
                scale: 2,
                logging: false,
                allowTaint: true
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Reporte_Ronda_${guardName}_${date}_R${selectedRound}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("No se pudo generar el PDF. Intente nuevamente.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const mapCenter = useMemo(() => {
        if (routePath.length > 0) return routePath[0];
        if (checkpoints.length > 0) return { lat: checkpoints[0].latitude, lng: checkpoints[0].longitude };
        return { lat: -33.4489, lng: -70.6693 };
    }, [routePath, checkpoints]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con estadísticas rápidas */}
            <div className="flex justify-between items-end mb-2">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                    <div className="glass-panel p-4 rounded-xl border border-blue-200 dark:border-blue-900/50">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-xs text-gray-500">Rondas</p>
                                <p className="text-xl font-bold">{tracking.length}</p>
                            </div>
                        </div>
                    </div>
                    {/* ... other quick stats ... */}
                </div>

                {selectedTracking && (
                    <button
                        onClick={generatePDF}
                        disabled={isGeneratingPDF}
                        className="ml-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50"
                    >
                        {isGeneratingPDF ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <FileDown size={20} />
                        )}
                        {isGeneratingPDF ? 'GENERANDO...' : 'DESCARGAR REPORTE'}
                    </button>
                )}
            </div>

            {/* Selector de rondas */}
            <div className="glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Seleccionar Ronda</h3>
                <div className="flex flex-wrap gap-2">
                    {tracking.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedRound(t.roundNumber)}
                            className={`px-6 py-3 rounded-xl border-2 transition-all ${selectedRound === t.roundNumber
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105'
                                : 'border-gray-200 dark:border-gray-800 hover:border-blue-400'
                                }`}
                        >
                            <span className="text-xl font-black">{t.roundNumber}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cuerpo Principal (Capturable por PDF) */}
            {selectedTracking ? (
                <div ref={reportRef} className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800">
                    {/* Cabecera del Reporte (Solo para PDF) */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-gray-100 dark:border-gray-800 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-2xl text-white">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">BrigaSur Seguridad</h2>
                                <p className="text-gray-500 font-bold text-sm uppercase">Reporte Oficial de Patrullaje GPS</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-black text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500 uppercase font-bold">Folio: rond-{selectedTracking.id.substring(0, 8)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[700px]">
                        {/* Panel de Métricas */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="space-y-6">
                                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                    <h4 className="text-xs font-black text-blue-600 uppercase mb-4 tracking-widest">Información General</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Guardia:</span>
                                            <span className="text-sm font-bold">{guardName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Fecha:</span>
                                            <span className="text-sm font-bold">{date}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Ronda No:</span>
                                            <span className="text-sm font-bold">#{selectedTracking.roundNumber}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Distancia</p>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">
                                            {((selectedTracking.totalDistanceMeters || 0) / 1000).toFixed(2)} km
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Tiempo</p>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">
                                            {Math.floor((selectedTracking.durationSeconds || 0) / 60)} min
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                                    <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Puntaje de Cumplimiento</p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${selectedTracking.complianceScore >= 80 ? 'bg-green-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${selectedTracking.complianceScore}%` }}
                                            />
                                        </div>
                                        <span className="text-2xl font-black">{selectedTracking.complianceScore}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mapa de Google */}
                        <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 dark:border-gray-800">
                            {isLoaded ? (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={mapCenter}
                                    zoom={17}
                                    options={{
                                        disableDefaultUI: true,
                                        styles: theme === 'dark' ? [
                                            { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
                                            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
                                            { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
                                            { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
                                            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
                                            { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
                                            { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
                                            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
                                        ] : [
                                            { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }
                                        ]
                                    }}
                                >
                                    <Polyline
                                        path={routePath}
                                        options={{
                                            strokeColor: "#ef4444", // Rojo brillante sólido
                                            strokeOpacity: 1.0,
                                            strokeWeight: 4,
                                        }}
                                    />

                                    {/* Círculos blancos en cada punto del recorrido (breadcrumbs) */}
                                    {routePath.map((point, idx) => (
                                        <Marker
                                            key={`breadcrumb-${idx}`}
                                            position={point}
                                            icon={{
                                                path: google.maps.SymbolPath.CIRCLE,
                                                fillColor: "#ffffff",
                                                fillOpacity: 1,
                                                strokeColor: "#ef4444",
                                                strokeWeight: 2,
                                                scale: 4,
                                            }}
                                        />
                                    ))}

                                    {checkpoints.map(cp => (
                                        <Marker
                                            key={cp.id}
                                            position={{ lat: cp.latitude, lng: cp.longitude }}
                                            icon={{
                                                path: "M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm4 8H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2z",
                                                fillColor: "#f97316",
                                                fillOpacity: 1,
                                                strokeWeight: 1,
                                                strokeColor: "#ffffff",
                                                scale: 1,
                                                anchor: isLoaded ? new window.google.maps.Point(12, 12) : undefined
                                            }}
                                            title={cp.name}
                                        />
                                    ))}

                                    {/* Marcadores de Inicio y Fin con estilo premium */}
                                    {routePath.length > 0 && (
                                        <>
                                            <Marker
                                                position={routePath[0]}
                                                label={{ text: "INICIO", color: "#ffffff", fontSize: "10px", fontWeight: "bold" }}
                                                icon={{
                                                    path: google.maps.SymbolPath.CIRCLE,
                                                    fillColor: "#3b82f6",
                                                    fillOpacity: 1,
                                                    strokeColor: "#ffffff",
                                                    strokeWeight: 2,
                                                    scale: 12,
                                                }}
                                            />
                                            <Marker
                                                position={routePath[routePath.length - 1]}
                                                label={{ text: "FIN", color: "#ffffff", fontSize: "10px", fontWeight: "bold" }}
                                                icon={{
                                                    path: google.maps.SymbolPath.CIRCLE,
                                                    fillColor: "#ef4444",
                                                    fillOpacity: 1,
                                                    strokeColor: "#ffffff",
                                                    strokeWeight: 2,
                                                    scale: 12,
                                                }}
                                            />
                                        </>
                                    )}
                                </GoogleMap>
                            ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                    <p className="text-gray-500 font-bold">Cargando Mapa...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-20 rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">Sin Datos de Seguimiento</h3>
                </div>
            )}
        </div>
    );
};

// Simple Loader component
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default RouteMapViewer;
