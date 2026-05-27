import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    MapPin, QrCode, Plus, Search, Trash2, Edit2, Download,
    Printer, X, Navigation, LocateFixed, Wifi, Filter
} from 'lucide-react';
import { GPSTrackingService } from '../services/gps-tracking.service';
import type { QRCheckpoint, Installation } from '../types';

interface CheckpointManagerProps {
    installations: Installation[];
}

type CheckpointTypeFiler = 'all' | 'QR' | 'NFC';

const CheckpointManager: React.FC<CheckpointManagerProps> = ({ installations }) => {
    const [checkpoints, setCheckpoints] = useState<QRCheckpoint[]>([]);
    const [selectedInstallation, setSelectedInstallation] = useState<string>(installations[0]?.id || '');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = useState<Partial<QRCheckpoint> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState<'register' | 'generate'>('generate');
    const [typeFilter, setTypeFilter] = useState<CheckpointTypeFiler>('all');
    const [saveError, setSaveError] = useState<string | null>(null);

    const activeInst = installations.find(i => i.id === selectedInstallation);
    const requiredType = activeInst?.checkpointType || 'QR';

    useEffect(() => {
        if (selectedInstallation) {
            loadCheckpoints();
        }
    }, [selectedInstallation]);

    const loadCheckpoints = async () => {
        setLoading(true);
        const { data, error } = await GPSTrackingService.getCheckpointsByInstallation(selectedInstallation);
        if (data) setCheckpoints(data);
        setLoading(false);
    };

    const openCreate = () => {
        setSaveError(null);
        setEditingCheckpoint({ validationRadiusMeters: 10, checkpointType: requiredType });
        setMode('generate');
        setIsModalOpen(true);
    };

    const openEdit = (cp: QRCheckpoint) => {
        setSaveError(null);
        setEditingCheckpoint({ ...cp });
        setIsModalOpen(true);
    };

    const handleNfcIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir caracteres hexadecimales (0-9, A-F), en mayúsculas, sin separadores
        let value = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
        
        // Limitar a 20 caracteres (10 bytes máximo)
        value = value.slice(0, 20);
        
        setEditingCheckpoint(prev => ({ ...prev, nfcId: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        if (!editingCheckpoint?.name) return;

        const isNFC = editingCheckpoint.checkpointType === 'NFC';

        // Validar según tipo
        if (isNFC && !editingCheckpoint.nfcId?.trim()) {
            setSaveError('Para un punto NFC, debes ingresar el ID del tag NFC.');
            return;
        }
        if (!isNFC && !editingCheckpoint.qrCode?.trim()) {
            setSaveError('Para un punto QR, debes ingresar el código QR.');
            return;
        }
        if (!isNFC && (editingCheckpoint.latitude === undefined || editingCheckpoint.latitude === null || isNaN(editingCheckpoint.latitude))) {
            setSaveError('Para un punto QR, debes ingresar la latitud.');
            return;
        }
        if (!isNFC && (editingCheckpoint.longitude === undefined || editingCheckpoint.longitude === null || isNaN(editingCheckpoint.longitude))) {
            setSaveError('Para un punto QR, debes ingresar la longitud.');
            return;
        }

        setLoading(true);
        const payload = {
            ...editingCheckpoint,
            qrCode: isNFC ? '' : (editingCheckpoint.qrCode || ''),
            nfcId: isNFC ? editingCheckpoint.nfcId : undefined,
            latitude: (isNFC && (editingCheckpoint.latitude === undefined || editingCheckpoint.latitude === null || isNaN(editingCheckpoint.latitude))) ? null : editingCheckpoint.latitude,
            longitude: (isNFC && (editingCheckpoint.longitude === undefined || editingCheckpoint.longitude === null || isNaN(editingCheckpoint.longitude))) ? null : editingCheckpoint.longitude,
        };

        let result: { data: any; error: string | null };

        if (editingCheckpoint.id) {
            result = await GPSTrackingService.updateCheckpoint(editingCheckpoint.id, payload);
        } else {
            result = await GPSTrackingService.createCheckpoint({
                ...payload as any,
                installationId: selectedInstallation,
                isActive: true,
                orderSequence: checkpoints.length + 1,
                validationRadiusMeters: editingCheckpoint.validationRadiusMeters || 10
            });
        }

        setLoading(false);

        if (result.error) {
            setSaveError(`Error al guardar: ${result.error}`);
            return;
        }

        await loadCheckpoints();
        setIsModalOpen(false);
        setEditingCheckpoint(null);
        setSaveError(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar este punto de control?')) {
            await GPSTrackingService.deleteCheckpoint(id);
            await loadCheckpoints();
        }
    };

    const captureLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setEditingCheckpoint(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
            });
        } else {
            alert('Geolocalización no soportada');
        }
    };

    const downloadQR = (id: string, name: string) => {
        const svg = document.getElementById(`qr-${id}`);
        if (!svg) return;
        const size = 1181;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            const logoImg = new Image();
            logoImg.src = '/logo_qr.png';
            logoImg.onload = () => {
                const logoSize = size * 0.2;
                const x = (size - logoSize) / 2;
                const y = (size - logoSize) / 2;
                ctx.fillStyle = 'white';
                ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
                ctx.drawImage(logoImg, x, y, logoSize, logoSize);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `QR-${name}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
                URL.revokeObjectURL(url);
            };
            logoImg.onerror = () => {
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `QR-${name}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
                URL.revokeObjectURL(url);
            };
        };
        img.src = url;
    };

    const filteredCheckpoints = checkpoints.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.nfcId || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'all' || c.checkpointType === typeFilter;
        return matchesSearch && matchesType;
    });

    const qrCount = checkpoints.filter(c => c.checkpointType === 'QR').length;
    const nfcCount = checkpoints.filter(c => c.checkpointType === 'NFC').length;

    return (
        <div className="p-6 pb-24 overflow-y-auto h-full">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                            <div className="flex gap-1.5">
                                <QrCode className="w-8 h-8 text-blue-500" />
                                <Wifi className="w-7 h-7 text-purple-500" />
                            </div>
                            Puntos QR / NFC
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-bold uppercase tracking-widest">
                            QR · NFC · Validación GPS
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-bold active:scale-95"
                    >
                        <Plus size={20} /> Nuevo Punto
                    </button>
                </div>

                {/* Filtros */}
                <div className="glass-panel p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Instalación</label>
                        <select
                            value={selectedInstallation}
                            onChange={(e) => setSelectedInstallation(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {installations.map(inst => (
                                <option key={inst.id} value={inst.id}>{inst.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Nombre, código QR o ID NFC..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Type filter tabs */}
                    <div className="w-full md:w-auto flex-shrink-0">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-widest">Tipo</label>
                        <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl gap-1">
                            {[
                                { key: 'all', label: `Todos (${checkpoints.length})` },
                                { key: 'QR', label: `QR (${qrCount})` },
                                { key: 'NFC', label: `NFC (${nfcCount})` }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setTypeFilter(tab.key as CheckpointTypeFiler)}
                                    className={`px-3 py-1.5 text-xs font-black rounded-lg uppercase tracking-widest transition-all ${typeFilter === tab.key
                                        ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Grid de checkpoints */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-bold animate-pulse">Cargando puntos de control...</div>
                ) : filteredCheckpoints.length === 0 ? (
                    <div className="text-center py-20 glass-panel rounded-3xl border-dashed border-2">
                        <div className="flex justify-center gap-3 mb-4 opacity-30">
                            <QrCode size={48} />
                            <Wifi size={48} />
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No hay puntos de control registrados</p>
                        <p className="text-gray-400 text-sm mt-1">Agrega tu primer punto QR o NFC</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredCheckpoints.map(cp => (
                            <div
                                key={cp.id}
                                className={`glass-panel p-6 rounded-2xl border hover:shadow-xl transition-all group relative overflow-hidden ${cp.checkpointType === 'NFC'
                                    ? 'border-purple-200 dark:border-purple-900/50'
                                    : 'border-gray-200 dark:border-gray-800'
                                    }`}
                            >
                                {/* Type badge */}
                                <div className={`absolute top-4 left-4 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${cp.checkpointType === 'NFC'
                                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {cp.checkpointType === 'NFC' ? <Wifi size={11} /> : <QrCode size={11} />}
                                    {cp.checkpointType}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={() => openEdit(cp)}
                                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cp.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="mt-8 mb-4 flex justify-center">
                                    {cp.checkpointType === 'QR' ? (
                                        <div className="p-3 bg-white rounded-2xl shadow-inner border border-gray-100">
                                            <QRCodeSVG
                                                id={`qr-${cp.id}`}
                                                value={cp.qrCode || cp.name}
                                                size={110}
                                                level="H"
                                                includeMargin={true}
                                                imageSettings={{
                                                    src: '/logo_qr.png',
                                                    x: undefined,
                                                    y: undefined,
                                                    height: 28,
                                                    width: 28,
                                                    excavate: true,
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-28 h-28 flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/40 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-700">
                                            <Wifi size={36} className="text-purple-500 mb-2" />
                                            <span className="text-[9px] font-black text-purple-500 uppercase tracking-widest">NFC Tag</span>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-gray-900 dark:text-white text-center mb-1 uppercase tracking-tight">{cp.name}</h3>

                                {/* ID badge */}
                                <div className="text-center mb-4">
                                    {cp.checkpointType === 'NFC' ? (
                                        <div className="inline-flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-black font-mono border border-purple-200 dark:border-purple-800">
                                            <Wifi size={12} />
                                            ID: {cp.nfcId}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-mono truncate">{cp.qrCode}</p>
                                    )}
                                </div>

                                {/* Location info */}
                                <div className="space-y-1.5 mb-4 px-2 py-3 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <MapPin size={13} className="text-green-500 flex-shrink-0" />
                                        <span className="font-mono">{cp.latitude?.toFixed(6)}, {cp.longitude?.toFixed(6)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Navigation size={13} className="text-blue-500 flex-shrink-0" />
                                        <span className="font-bold">Radio validación: {cp.validationRadiusMeters}m</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                    {cp.checkpointType === 'QR' ? (
                                        <>
                                            <button
                                                onClick={() => downloadQR(cp.id, cp.name)}
                                                className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Download size={13} /> Descargar
                                            </button>
                                            <button
                                                onClick={() => window.print()}
                                                className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Printer size={13} /> Imprimir
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => openEdit(cp)}
                                            className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-100 transition-all border border-purple-200 dark:border-purple-800"
                                        >
                                            <Edit2 size={13} /> Editar Punto NFC
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ===================== MODAL ===================== */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="glass-panel w-full max-w-lg rounded-2xl shadow-2xl border border-white/10 dark:border-gray-700 overflow-hidden animate-in zoom-in duration-300">

                        {/* Modal header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2">
                                {editingCheckpoint?.checkpointType === 'NFC' ? (
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                                        <Wifi size={20} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                                        <QrCode size={20} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                        {editingCheckpoint?.id ? 'Editar Punto' : 'Nuevo Punto de Control'}
                                    </h3>
                                    <p className="text-xs text-gray-500">QR · NFC · GPS</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

                            {/* TYPE SELECTOR — solo al crear */}
                            {!editingCheckpoint?.id && (
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-2 tracking-widest">
                                        Tipo de Marcado
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCheckpoint(prev => ({ ...prev, checkpointType: 'QR', nfcId: undefined }))}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${editingCheckpoint?.checkpointType === 'QR'
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-500/10'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-300'
                                                }`}
                                        >
                                            <QrCode size={28} />
                                            <span className="uppercase tracking-widest text-xs font-black">Código QR</span>
                                            <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">Imprimible, escaneable</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingCheckpoint(prev => ({ ...prev, checkpointType: 'NFC', qrCode: '' }))}
                                            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${editingCheckpoint?.checkpointType === 'NFC'
                                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/10'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-purple-300'
                                                }`}
                                        >
                                            <Wifi size={28} />
                                            <span className="uppercase tracking-widest text-xs font-black">Tag NFC</span>
                                            <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">Tag físico, sin contacto</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Modo registro/generación (solo QR) */}
                            {editingCheckpoint?.checkpointType === 'QR' && !editingCheckpoint?.id && (
                                <div className="flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setMode('generate')}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${mode === 'generate' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-400'}`}
                                    >
                                        Generar Nuevo QR
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMode('register')}
                                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${mode === 'register' ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-400'}`}
                                    >
                                        Registrar QR Existente
                                    </button>
                                </div>
                            )}

                            {/* Nombre del punto */}
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Nombre del Punto</label>
                                <input
                                    type="text"
                                    value={editingCheckpoint?.name || ''}
                                    onChange={e => setEditingCheckpoint(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ej: Acceso Vehicular Norte"
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    required
                                />
                            </div>

                            {/* Campo específico según tipo */}
                            {editingCheckpoint?.checkpointType === 'NFC' ? (
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">
                                        ID del Tag NFC
                                    </label>
                                    <div className="relative">
                                        <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" size={18} />
                                        <input
                                            type="text"
                                            value={editingCheckpoint?.nfcId || ''}
                                            onChange={handleNfcIdChange}
                                            placeholder="Ej: 04:AB:CD:EF"
                                            className="w-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl px-4 py-3 pl-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1">
                                        Ingresa el número de identificación único del tag NFC físico (se obtiene al acercar el tag a un lector).
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">
                                        Código QR (Identificador)
                                    </label>
                                    <input
                                        type="text"
                                        value={editingCheckpoint?.qrCode || ''}
                                        onChange={e => setEditingCheckpoint(prev => ({ ...prev, qrCode: e.target.value }))}
                                        placeholder={mode === 'generate' ? 'Ej: BRIG-POS-001' : 'Escanea tu QR actual aquí'}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        required
                                    />
                                </div>
                            )}

                            {/* Coordenadas GPS */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">
                                        Latitud {editingCheckpoint?.checkpointType !== 'NFC' && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editingCheckpoint?.latitude ?? ''}
                                        onChange={e => setEditingCheckpoint(prev => ({ ...prev, latitude: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={editingCheckpoint?.checkpointType !== 'NFC'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">
                                        Longitud {editingCheckpoint?.checkpointType !== 'NFC' && <span className="text-red-500">*</span>}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={editingCheckpoint?.longitude ?? ''}
                                        onChange={e => setEditingCheckpoint(prev => ({ ...prev, longitude: e.target.value === '' ? undefined : parseFloat(e.target.value) }))}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required={editingCheckpoint?.checkpointType !== 'NFC'}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5 ml-1 tracking-widest">Radio de Validación GPS (metros)</label>
                                <input
                                    type="number"
                                    value={editingCheckpoint?.validationRadiusMeters || 10}
                                    onChange={e => setEditingCheckpoint(prev => ({ ...prev, validationRadiusMeters: parseInt(e.target.value) }))}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min={5}
                                    max={200}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={captureLocation}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl border border-green-200 dark:border-green-800 hover:bg-green-100 transition-all font-bold text-sm"
                            >
                                <LocateFixed size={18} /> Usar Ubicación Actual en GPS
                            </button>

                            {/* Preview QR en tiempo real */}
                            {editingCheckpoint?.checkpointType === 'QR' && editingCheckpoint?.qrCode && (
                                <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <div className="text-center">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vista Previa QR</p>
                                        <QRCodeSVG
                                            value={editingCheckpoint.qrCode}
                                            size={100}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error message */}
                            {saveError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold">
                                    ⚠️ {saveError}
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setSaveError(null); }}
                                    className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold uppercase tracking-wider text-xs"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-3 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all disabled:opacity-60 ${editingCheckpoint?.checkpointType === 'NFC'
                                        ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'
                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                        }`}
                                >
                                    {loading ? 'Guardando...' : 'Guardar Punto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckpointManager;
