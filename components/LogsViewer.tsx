import React, { useState, useEffect } from 'react';
import { Printer, MapPin, Tag, FileDown, Camera, Siren, X, Trash2, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Guard, Installation, LogEntry } from '../types';

import ImageUploader from './ImageUploader';
import { supabase } from '../lib/supabase';

interface LogsViewerProps {
    type: 'QR' | 'NFC' | 'INCIDENT' | 'SOS' | 'ALL';
    guards: Guard[];
    installations: Installation[];
}

const LogsViewer: React.FC<LogsViewerProps> = ({ type, guards, installations }) => {
    // State for real data from Supabase
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isCreatingIncident, setIsCreatingIncident] = useState(false);
    const [newIncident, setNewIncident] = useState({
        title: '',
        detail: '',
        guardId: '',
        installationId: '',
        photos: [] as string[]
    });
    const [isSaving, setIsSaving] = useState(false);

    const [filterInstallation, setFilterInstallation] = useState('');
    const [filterGuard, setFilterGuard] = useState('');
    const [filterSubType, setFilterSubType] = useState<'ALL' | 'QR' | 'NFC'>(type === 'ALL' ? 'ALL' : (type as any));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Fetch logs from Supabase
    const fetchLogs = async () => {
        setIsLoading(true);
        console.log(`[LogsViewer] Fetching logs. type=${type}, guards=${guards.length}, installations=${installations.length}`);

        try {
            const startOfDay = startDate ? new Date(startDate + 'T00:00:00.000Z') : null;
            const endOfDay = endDate ? new Date(endDate + 'T23:59:59.999Z') : null;

            // ── 1. Fetch from 'logs' table (INCIDENT / SOS / old QR/NFC entries) ──
            let logsQuery = supabase
                .from('logs')
                .select('*')
                .order('timestamp', { ascending: false });

            if (type !== 'ALL') {
                logsQuery = logsQuery.eq('type', type);
            } else if (filterSubType !== 'ALL') {
                logsQuery = logsQuery.eq('type', filterSubType);
            } else {
                logsQuery = logsQuery.in('type', ['QR', 'NFC', 'INCIDENT', 'SOS']);
            }

            if (filterInstallation) logsQuery = logsQuery.eq('installation_id', filterInstallation);
            if (filterGuard)        logsQuery = logsQuery.eq('guard_id', filterGuard);
            if (startOfDay)         logsQuery = logsQuery.gte('timestamp', startOfDay.toISOString());
            if (endOfDay)           logsQuery = logsQuery.lte('timestamp', endOfDay.toISOString());

            const { data: logsData, error: logsError } = await logsQuery;
            if (logsError) console.error('[LogsViewer] Error fetching logs table:', logsError);

            const guardMap = new Map<string, string>();
            guards.forEach(g => guardMap.set(g.id, g.fullName));

            const instMap = new Map<string, string>();
            installations.forEach(i => instMap.set(i.id, i.name));

            const mappedLogs: LogEntry[] = (logsData || []).map(log => ({
                id: log.id,
                type: log.type,
                guardId: log.guard_id,
                guardName: log.guard_name || guardMap.get(log.guard_id) || 'Guardia',
                installationId: log.installation_id,
                installationName: log.installation_name || instMap.get(log.installation_id) || 'Instalación',
                pointName: log.point_name || '',
                tagId: log.tag_id || '',
                title: log.title || log.type,
                detail: log.detail || '',
                photos: log.photos || [],
                timestamp: log.timestamp || log.created_at
            }));

            // ── 2. Fetch from 'reports' table (QR / NFC / INCIDENTE from mobile app) ──
            //    IMPORTANT: reports table has NO guard_name column — only guard_id.
            //    We resolve guard names by matching guard_id against the guards array.
            let combinedLogs = [...mappedLogs];

            const shouldFetchReports = type === 'QR' || type === 'NFC' || type === 'ALL' || type === 'INCIDENT' || type === 'SOS';

            if (shouldFetchReports) {
                let reportsQuery = (supabase as any)
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false });

                // Type filter
                if (type !== 'ALL') {
                    if (type === 'INCIDENT') {
                        reportsQuery = reportsQuery.eq('type', 'INCIDENTE');
                    } else {
                        reportsQuery = reportsQuery.eq('type', type);
                    }
                } else if (filterSubType !== 'ALL') {
                    reportsQuery = reportsQuery.eq('type', filterSubType);
                } else {
                    reportsQuery = reportsQuery.in('type', ['QR', 'NFC', 'INCIDENTE']);
                }

                // Guard filter (directly on guard_id — works perfectly)
                if (filterGuard) reportsQuery = reportsQuery.eq('guard_id', filterGuard);

                // Date filters
                if (startOfDay) reportsQuery = reportsQuery.gte('created_at', startOfDay.toISOString());
                if (endOfDay)   reportsQuery = reportsQuery.lte('created_at', endOfDay.toISOString());

                const { data: reportsData, error: reportsError } = await reportsQuery;

                if (reportsError) {
                    console.error('[LogsViewer] Error fetching reports table:', reportsError);
                } else if (reportsData && reportsData.length > 0) {
                    console.log(`[LogsViewer] Found ${reportsData.length} reports from DB.`);

                    // Build a local guard lookup map (id → fullName) from the guards prop if needed, though we already have guardMap

                    // If guards prop is empty, fetch guard names from Supabase directly
                    let fallbackGuardMap = new Map<string, string>();
                    const typedReportsData: any[] = reportsData;
                    // Always try to resolve guard names from both 'guards' and 'profiles' tables
                    // Mobile app reports use auth profile IDs, not guard table IDs
                    const uniqueGuardIds = [...new Set(typedReportsData.map((r: any) => r.guard_id).filter(Boolean))];
                    if (uniqueGuardIds.length > 0) {
                        // 1. Try guards table first (panel guards)
                        const { data: guardsData } = await supabase
                            .from('guards')
                            .select('id, full_name')
                            .in('id', uniqueGuardIds);
                        (guardsData || []).forEach((g: any) => fallbackGuardMap.set(g.id, g.full_name));

                        // 2. Try profiles table (mobile app users) for IDs not found yet
                        const missingIds = uniqueGuardIds.filter(id => !guardMap.has(id) && !fallbackGuardMap.has(id));
                        if (missingIds.length > 0) {
                            const { data: profilesData } = await (supabase as any)
                                .from('profiles')
                                .select('id, full_name')
                                .in('id', missingIds);
                            (profilesData || []).forEach((p: any) => fallbackGuardMap.set(p.id, p.full_name));
                        }
                    }

                    const mappedReports: LogEntry[] = typedReportsData.map((report: any) => {
                        // Resolve guard name: prop map first, then fallback DB lookup
                        const resolvedGuardName =
                            guardMap.get(report.guard_id) ||
                            fallbackGuardMap.get(report.guard_id) ||
                            'Guardia';

                        // Resolve installation
                        const instName = (report.installation || '').trim();
                        const inst = installations.find(i =>
                            i.name.trim().toLowerCase() === instName.toLowerCase()
                        );

                        // Parse pointName and tagId from description
                        // Expected format: "Marcación de punto de control NFC: NOMBRE_PUNTO (TAG_ID)"
                        //                 "Marcación de punto de control QR: NOMBRE_PUNTO (TAG_ID)"
                        let pointName = instName;
                        let tagId = '';
                        const desc = report.description || '';
                        const match = desc.match(/(?:NFC|QR):\s*(.+?)\s*\(([^)]+)\)\s*$/);
                        if (match) {
                            pointName = match[1].trim();
                            tagId = match[2].trim();
                        }

                        return {
                            id: report.id,
                            type: report.type as any,
                            guardId: report.guard_id,
                            guardName: resolvedGuardName,
                            installationId: inst?.id || '',
                            installationName: inst?.name || instName || 'Instalación Desconocida',
                            pointName,
                            tagId,
                            title: report.type,
                            detail: desc,
                            photos: report.images || [],
                            timestamp: report.created_at
                        };
                    });

                    // Frontend installation filter (installation stored as name string in reports)
                    let filteredReports = mappedReports;
                    if (filterInstallation) {
                        const targetInst = installations.find(i => i.id === filterInstallation);
                        const targetName = (targetInst?.name || '').trim().toLowerCase();
                        filteredReports = filteredReports.filter(r =>
                            r.installationId === filterInstallation ||
                            (targetName && r.installationName.trim().toLowerCase() === targetName)
                        );
                    }

                    console.log(`[LogsViewer] ${filteredReports.length} reports after frontend filtering.`);
                    combinedLogs = [...combinedLogs, ...filteredReports];
                } else {
                    console.log('[LogsViewer] No reports found in DB for given filters.');
                }
            }

            // ── 3. Fetch from 'alerts' table (SOS from mobile app) ──
            const shouldFetchAlerts = type === 'SOS';
            if (shouldFetchAlerts) {
                let alertsQuery = (supabase as any)
                    .from('alerts')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (filterGuard) alertsQuery = alertsQuery.eq('guard_id', filterGuard);
                if (startOfDay) alertsQuery = alertsQuery.gte('created_at', startOfDay.toISOString());
                if (endOfDay)   alertsQuery = alertsQuery.lte('created_at', endOfDay.toISOString());

                const { data: alertsData, error: alertsError } = await alertsQuery;

                if (alertsError) console.error('[LogsViewer] Error fetching alerts:', alertsError);
                else {
                    const typedAlertsData: any[] = alertsData || [];
                    
                    // Look up missing guard references if needed
                    const uniqueGuardIds = [...new Set(typedAlertsData.map((a: any) => a.guard_id).filter(Boolean))];
                    const localFallbackMap = new Map<string, string>();
                    
                    const missingIds = uniqueGuardIds.filter(id => !guardMap.has(id));
                    if (missingIds.length > 0) {
                        const { data: guardsData } = await supabase.from('guards').select('id, full_name').in('id', missingIds);
                        (guardsData || []).forEach((g: any) => localFallbackMap.set(g.id, g.full_name));
                        // Profiles table
                        const missingPIds = missingIds.filter(id => !localFallbackMap.has(id));
                        if(missingPIds.length > 0) {
                            const { data: pData } = await (supabase as any).from('profiles').select('id, full_name').in('id', missingPIds);
                            (pData || []).forEach((p: any) => localFallbackMap.set(p.id, p.full_name));
                        }
                    }

                    const mappedAlerts: LogEntry[] = typedAlertsData.map(a => {
                        const gName = a.guard_name || guardMap.get(a.guard_id) || localFallbackMap.get(a.guard_id) || 'Guardia';
                        return {
                            id: a.id,
                            type: 'SOS',
                            guardId: a.guard_id,
                            guardName: gName,
                            installationId: '', // SOS from mobile app often lacks installation ID until processed
                            installationName: a.installation_name || 'Ubicación SOS',
                            pointName: a.location || 'SOS',
                            tagId: '',
                            title: 'ALERTA SOS',
                            detail: a.details || 'Botón de pánico activado',
                            photos: [],
                            timestamp: a.alert_time || a.created_at
                        };
                    });
                    combinedLogs = [...combinedLogs, ...mappedAlerts];
                }
            }

            // ── 4. Fetch from new 'incidents' table ──
            const shouldFetchIncidents = type === 'INCIDENT' || type === 'ALL';
            if (shouldFetchIncidents) {
                let incidentQuery = (supabase as any)
                    .from('incidents')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (filterInstallation) incidentQuery = incidentQuery.eq('installation_id', filterInstallation);
                if (filterGuard)        incidentQuery = incidentQuery.eq('guard_id', filterGuard);
                if (startOfDay)         incidentQuery = incidentQuery.gte('created_at', startOfDay.toISOString());
                if (endOfDay)           incidentQuery = incidentQuery.lte('created_at', endOfDay.toISOString());

                const { data: incidentsDataRes, error: incidentsErrorRes } = await incidentQuery;
                if (!incidentsErrorRes && incidentsDataRes) {
                    const mappedIncidents: LogEntry[] = incidentsDataRes.map((i: any) => ({
                        id: i.id,
                        type: 'INCIDENT',
                        guardId: i.guard_id,
                        guardName: i.guard_name || guardMap.get(i.guard_id) || 'Guardia',
                        installationId: i.installation_id,
                        installationName: i.installation_name || instMap.get(i.installation_id) || 'Instalación',
                        pointName: '',
                        tagId: '',
                        title: i.title,
                        detail: i.description,
                        photos: i.photos || [],
                        status: i.status || 'Abierto',
                        timestamp: i.created_at
                    }));
                    combinedLogs = [...combinedLogs, ...mappedIncidents];
                }
            }
            // Sort by timestamp descending
            combinedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            setLogs(combinedLogs);
        } catch (error) {
            console.error('[LogsViewer] Unexpected error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch immediately — no longer gated on guards.length > 0
        // Guard names will be resolved from the guards prop or fetched from DB as fallback
        fetchLogs();
        setSelectedIds([]);
    }, [type, filterInstallation, filterGuard, filterSubType, startDate, endDate, guards, installations]);

    const handleUpdateStatus = async (incidentId: string, newStatus: 'Abierto' | 'En Proceso' | 'Cerrado') => {
        try {
            const { error } = await (supabase as any)
                .from('incidents')
                .update({ status: newStatus })
                .eq('id', incidentId);

            if (error) throw error;
            
            // UI Update
            setLogs(prev => prev.map(log => 
                log.id === incidentId ? { ...log, status: newStatus } : log
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('No se pudo actualizar el estado.');
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(logs.map(log => log.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(i => i !== id) 
                : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        
        const confirmMsg = selectedIds.length === 1 
            ? '¿Estás seguro de que deseas eliminar este registro?' 
            : `¿Estás seguro de que deseas eliminar ${selectedIds.length} registros?`;

        if (window.confirm(confirmMsg)) {
            setIsDeleting(true);
            try {
                const [
                    { error: logsError },
                    { error: reportsError },
                    { error: incidentsError },
                    { error: alertsError }
                ] = await Promise.all([
                    supabase.from('logs').delete().in('id', selectedIds),
                    (supabase as any).from('reports').delete().in('id', selectedIds),
                    (supabase as any).from('incidents').delete().in('id', selectedIds),
                    (supabase as any).from('alerts').delete().in('id', selectedIds)
                ]);

                const errors = [logsError, reportsError, incidentsError, alertsError].filter(Boolean);

                if (errors.length > 0) {
                    const errorMsgs = errors.map(e => e?.message).filter(Boolean).join(' | ');
                    alert('Error al intentar eliminar registros: ' + errorMsgs);
                    console.error('Del errors:', errors);
                }

                // Refresh logs regardless, as some might have succeeded
                fetchLogs();
                setSelectedIds([]);
            } catch (error) {
                console.error('Error deleting logs:', error);
                alert('Ocurrió un error inesperado al intentar eliminar los registros.');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getTitle = () => {
        if (type === 'QR') return 'Reporte Marcaje QR';
        if (type === 'NFC') return 'Reporte Marcaje NFC';
        if (type === 'ALL') return 'Reporte de Marcaciones';
        if (type === 'SOS') return 'Alertas SOS';
        return 'Reporte de Incidencias';
    };

    const handleDownloadPDF = async () => {
        const doc = new jsPDF();

        // Function to load image
        const getImageData = (url: string): Promise<string> => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = url;
            });
        };

        try {
            // Header BG
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, 210, 45, 'F');

            // 1. Logo in Top Left
            const logoPath = '/logo_brigasur.png';
            try {
                const logoBase64 = await getImageData(logoPath);
                doc.addImage(logoBase64, 'PNG', 14, 8, 32, 22);
            } catch {
                // Logo not available, continue without it
            }

            // Brand Text below logo or side
            doc.setTextColor(17, 24, 39);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('BRIGASUR SEGURIDAD', 14, 40);

            // 2. Title and Meta Info (TOP RIGHT)
            doc.setTextColor(31, 41, 55);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(getTitle(), 120, 22);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            const dateStr = new Date().toLocaleString();
            doc.text(`Generado: ${dateStr}`, 120, 28);

            // Metadata info
            const instName = filterInstallation ? installations.find(i => i.id === filterInstallation)?.name : 'Todas';
            const guardName = filterGuard ? guards.find(g => g.id === filterGuard)?.fullName : 'Todos';

            doc.text(`Instalación: ${instName}`, 120, 33);
            doc.text(`Guardia: ${guardName}`, 120, 38);

            if (startDate || endDate) {
                const startStr = startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString() : 'Inicio';
                const endStr = endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString() : 'Hoy';
                const dateRangeStr = (startDate === endDate && startDate) ? startStr : `${startStr} - ${endStr}`;
                doc.text(`Fecha: ${dateRangeStr}`, 120, 43);
            } else {
                doc.text('Fecha: Todo el periodo', 120, 43);
            }

            // Divider Line
            doc.setDrawColor(249, 115, 22); // Orange
            doc.setLineWidth(1);
            doc.line(14, 46, 196, 46);

            // Table Columns
            const tableColumn = type === 'INCIDENT' 
                ? ["Instalación", "Guardia", "Reporte Incidencia", "Registro Visual", "Estado", "Fecha y Hora"]
                : ["Instalación", "Guardia", "Punto de Marcado", "Fecha y Hora"];
            const tableRows = logs.map(log => {
                const dateStr = new Date(log.timestamp).toLocaleString();
                
                if (type === 'INCIDENT') {
                    return [
                        log.installationName,
                        log.guardName,
                        `${log.title || ''} - ${log.detail || ''}`,
                        log.photos && log.photos.length > 0 ? `${log.photos.length} fotos` : 'Sin fotos',
                        log.status || 'Abierto',
                        dateStr
                    ];
                }

                let detail = '';
                if (log.type === 'QR') detail = `QR: ${log.pointName}`;
                else if (log.type === 'NFC') detail = `NFC: ${log.pointName || log.title || log.tagId}`;
                else if (log.type === 'SOS') detail = `${log.title || ''} - ${log.detail || ''}`;

                return [
                    log.installationName,
                    log.guardName,
                    detail,
                    dateStr
                ];
            });

            autoTable(doc, {
                startY: 55,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                headStyles: {
                    fillColor: type === 'SOS' ? [220, 38, 38] : [17, 24, 39],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                styles: { fontSize: 8, font: 'helvetica' },
                columnStyles: {
                    0: { cellWidth: 40 },
                    1: { cellWidth: 40 },
                    2: { cellWidth: 'auto' },
                    3: { cellWidth: 35 }
                }
            });

            doc.save(`${type.toLowerCase()}_reporte_${Date.now()}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar el PDF con imagen. Se intentará sin logo.');
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-24">
            <div className="hidden print:flex flex-col w-full mb-8">
                <div className="flex justify-between items-start border-b-2 border-orange-500 pb-4">
                    <div className="flex items-center gap-4">
                        <img src="/logo_brigasur.png" alt="Logo" className="w-24 h-14 object-contain" />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 leading-none">BRIGASUR</h1>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Seguridad</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black text-gray-800 uppercase">{getTitle()}</h2>
                        <p className="text-xs text-gray-500 font-bold">Generado: {new Date().toLocaleString()}</p>
                        <div className="mt-2 text-xs font-medium space-y-0.5">
                            <p>Instalación: {filterInstallation ? installations.find(i => i.id === filterInstallation)?.name : 'Todas'}</p>
                            <p>Guardia: {filterGuard ? guards.find(g => g.id === filterGuard)?.fullName : 'Todos'}</p>
                            <p>Fecha: {startDate || endDate ? 
                                (startDate === endDate ? 
                                    new Date(startDate + 'T00:00:00').toLocaleDateString() : 
                                    `${startDate ? new Date(startDate + 'T00:00:00').toLocaleDateString() : 'Inicio'} - ${endDate ? new Date(endDate + 'T00:00:00').toLocaleDateString() : 'Fin'}`
                                ) : 'Todo el periodo'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 no-print">
                <h2 className={`text-2xl font-bold flex items-center gap-2 shrink-0 ${type === 'SOS' ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
                    {(type === 'QR' || type === 'ALL') && <MapPin className="text-emerald-500" />}
                    {type === 'NFC' && <Tag className="text-purple-500" />}
                    {type === 'INCIDENT' && <Camera className="text-red-500" />}
                    {type === 'SOS' && <Siren className="text-red-600 animate-pulse" />}
                    {getTitle()}
                </h2>

                <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto flex-wrap justify-end">
                    {/* Delete Selected Button */}
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            disabled={isDeleting}
                            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-red-200 dark:border-red-800 text-sm font-bold hover:bg-red-600 hover:text-white"
                        >
                            <Trash2 size={18} /> 
                            {isDeleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}
                        </button>
                    )}

                    {/* New Incident Button - Only for Incident View */}
                    {type === 'INCIDENT' && (
                        <button
                            onClick={() => setIsCreatingIncident(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-red-500/20 text-sm font-bold animate-pulse"
                        >
                            <Camera size={18} /> Nuevo Incidente
                        </button>
                    )}

                    {/* Date Range Filters */}
                    <div className="flex gap-2 items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-1">
                        <div className="relative">
                            <input
                                type="date"
                                className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none px-2 py-1.5 w-32"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                title="Fecha Desde"
                            />
                            <span className="absolute -top-2 left-2 text-[10px] bg-white dark:bg-gray-800 px-1 text-gray-500">Desde</span>
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="relative">
                            <input
                                type="date"
                                className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none px-2 py-1.5 w-32"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                title="Fecha Hasta"
                            />
                        </div>
                    </div>

                    {/* Sub-type Filter for ALL markings */}
                    {type === 'ALL' && (
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            value={filterSubType}
                            onChange={(e) => setFilterSubType(e.target.value as any)}
                        >
                            <option value="ALL">QR y NFC</option>
                            <option value="QR">Solo QR</option>
                            <option value="NFC">Solo NFC</option>
                        </select>
                    )}

                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        value={filterInstallation}
                        onChange={(e) => setFilterInstallation(e.target.value)}
                    >
                        <option value="">Todas las Instalaciones</option>
                        {installations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>

                    <select
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm rounded-lg p-2.5 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                        value={filterGuard}
                        onChange={(e) => setFilterGuard(e.target.value)}
                    >
                        <option value="">Todos los Guardias</option>
                        {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                    </select>

                    <div className="flex gap-2">
                        <button
                            onClick={handleDownloadPDF}
                            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white p-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                            title="Descargar PDF"
                        >
                            <FileDown size={18} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>

                        <button
                            onClick={handlePrint}
                            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white p-2 rounded-lg transition-colors"
                            title="Imprimir Reporte"
                        >
                            <Printer size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={`glass-panel rounded-xl overflow-hidden border ${type === 'SOS' ? 'border-red-500/30' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className={`text-xs uppercase ${type === 'SOS' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200'}`}>
                            <tr>
                                <th className="px-6 py-3 no-print">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={logs.length > 0 && selectedIds.length === logs.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-3">Instalación</th>
                                <th className="px-6 py-3">Guardia</th>
                                <th className="px-6 py-3">
                                    {type === 'INCIDENT' ? 'Reporte Incidencia' : (type === 'SOS' ? 'Alerta SOS' : 'Punto de Marcado')}
                                </th>
                                {type === 'INCIDENT' && <th className="px-6 py-3">Registro Visual</th>}
                                {type === 'INCIDENT' && <th className="px-6 py-3 text-center">Estado</th>}
                                <th className="px-6 py-3">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr key="loading">
                                    <td colSpan={type === 'INCIDENT' ? 7 : 5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-500 animate-pulse">Cargando registros reales...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : logs.length > 0 ? (
                                logs.map(log => (
                                    <tr 
                                        key={log.id} 
                                        className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${selectedIds.includes(log.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => handleSelectRow(log.id)}
                                    >
                                        <td className="px-6 py-4 no-print" onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(log.id)}
                                                onChange={() => handleSelectRow(log.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{log.installationName}</td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{log.guardName}</td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                                            {log.type === 'QR' && `QR: ${log.pointName}`}

                                            {log.type === 'NFC' && `NFC: ${log.pointName || log.title || log.tagId}`}

                                            {(log.type === 'INCIDENT' || log.type === 'SOS') && (
                                                <div className="flex flex-col gap-1">
                                                    <span className={`${type === 'SOS' ? 'text-red-600 dark:text-red-400 font-black tracking-wide' : 'text-red-600 dark:text-red-400 font-bold'}`}>
                                                        {type === 'SOS' && "🚨 "}{log.title || 'EMERGENCIA'}
                                                    </span>
                                                    <span className="text-xs mb-1">{log.detail}</span>
                                                    {(log.type === 'SOS' && log.photos && log.photos.length > 0) && (
                                                        <div className="flex gap-1 no-print">
                                                            {log.photos.map((p, idx) => (
                                                                <img key={idx} src={p} alt="evidencia" className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 object-cover hover:scale-125 transition-transform cursor-pointer" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        {type === 'INCIDENT' && (
                                            <td className="px-6 py-4">
                                                {log.photos && log.photos.length > 0 ? (
                                                    <div className="flex gap-1 no-print">
                                                        {log.photos.map((p, idx) => (
                                                            <img key={idx} src={p} alt="evidencia" className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 object-cover hover:scale-150 transition-all cursor-zoom-in" />
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Sin fotos</span>
                                                )}
                                            </td>
                                        )}
                                        {type === 'INCIDENT' && (
                                            <td className="px-6 py-4 text-center">
                                                <select
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all cursor-pointer outline-none
                                                        ${log.status === 'Abierto' ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' : 
                                                          log.status === 'En Proceso' ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 
                                                          'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'}`}
                                                    value={log.status || 'Abierto'}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onChange={(e) => handleUpdateStatus(log.id, e.target.value as any)}
                                                >
                                                    <option value="Abierto">Abierto</option>
                                                    <option value="En Proceso">En Proceso</option>
                                                    <option value="Cerrado">Cerrado</option>
                                                </select>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-gray-900 dark:text-white font-medium whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr key="empty">
                                    <td colSpan={type === 'INCIDENT' ? 7 : 5} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CheckCircle2 size={40} className="text-gray-300 mb-2" />
                                            <p>No se encontraron registros para los filtros seleccionados.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal: Nuevo Incidente */}
            {isCreatingIncident && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Camera className="text-red-500" /> Reportar Nuevo Incidente
                            </h3>
                            <button onClick={() => !isSaving && setIsCreatingIncident(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Guardia</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white"
                                        value={newIncident.guardId}
                                        onChange={e => setNewIncident({ ...newIncident, guardId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instalación</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white"
                                        value={newIncident.installationId}
                                        onChange={e => setNewIncident({ ...newIncident, installationId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {installations.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título / Gravedad</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Intento de intrusión, Hallazgo de material..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white"
                                    value={newIncident.title}
                                    onChange={e => setNewIncident({ ...newIncident, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Detalle del Evento</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe lo ocurrido en detalle..."
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-sm text-gray-900 dark:text-white"
                                    value={newIncident.detail}
                                    onChange={e => setNewIncident({ ...newIncident, detail: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Evidencia Fotográfica (Optimizada)</label>
                                <ImageUploader
                                    folder="incidents"
                                    maxImages={3}
                                    onUploadComplete={(urls) => setNewIncident({ ...newIncident, photos: urls })}
                                />
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    disabled={isSaving}
                                    onClick={() => setIsCreatingIncident(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white py-2.5 rounded-xl font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={isSaving || !newIncident.title || !newIncident.guardId}
                                    onClick={async () => {
                                        setIsSaving(true);
                                        const guard = guards.find(g => g.id === newIncident.guardId);
                                        const inst = installations.find(i => i.id === newIncident.installationId);

                                        const { error } = await (supabase as any).from('incidents').insert({
                                            title: newIncident.title,
                                            description: newIncident.detail,
                                            guard_id: newIncident.guardId,
                                            guard_name: guard?.fullName || 'Desconocido',
                                            installation_id: newIncident.installationId,
                                            installation_name: inst?.name || 'Desconocido',
                                            photos: newIncident.photos,
                                            status: 'Abierto'
                                        });

                                        if (!error) {
                                            alert('Incidente reportado exitosamente');
                                            setIsCreatingIncident(false);
                                            // Reset form
                                            setNewIncident({ title: '', detail: '', guardId: '', installationId: '', photos: [] });
                                            // Refresh logs
                                            fetchLogs();
                                        } else {
                                            alert('Error al guardar el incidente');
                                        }
                                        setIsSaving(false);
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Reportar Incidente'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogsViewer;