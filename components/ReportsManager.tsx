import React, { useState, useEffect } from 'react';
import { FileText, Download, Send, Eye, Calendar, Building2, CheckCircle2, AlertTriangle, Siren, ChevronRight, Search, CheckSquare, X, Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyReport, Installation, Guard } from '../types';
import { ReportsService } from '../services/reports.service';

interface ReportsManagerProps {
    installations: Installation[];
}

const ReportsManager: React.FC<ReportsManagerProps> = ({ installations }) => {
    const [reports, setReports] = useState<MonthlyReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailToSend, setEmailToSend] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Modal states
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedInstIds, setSelectedInstIds] = useState<string[]>([]);
    const [genMonth, setGenMonth] = useState(new Date().getMonth()); // Default to previous month handled in logic
    const [genYear, setGenYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const { data } = await ReportsService.getAll();
        if (data) {
            setReports(data);
        }
        setLoading(false);
    };

    // Función para simular la generación automática del reporte
    const generateMonthlyReport = async (installation: Installation, month: number, year: number) => {
        const doc = new jsPDF();

        // Mock data for the report
        const totalScans = Math.floor(Math.random() * 500) + 100;
        const qrScans = Math.floor(totalScans * 0.7);
        const nfcScans = totalScans - qrScans;
        const compliance = Math.floor(Math.random() * 20) + 80; // 80-100%
        const incidents = Math.floor(Math.random() * 5);
        const sos = Math.floor(Math.random() * 2);

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

        // Header BG
        (doc as any).setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 45, 'F');

        // Logo in Top Left
        try {
            const logoBase64 = await getImageData('/logo_brigasur.png');
            doc.addImage(logoBase64, 'PNG', 14, 10, 32, 22);
        } catch (e) {
            console.error('Error loading logo', e);
        }

        // Brand Text
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('BRIGASUR SEGURIDAD', 14, 40);

        // Title (TOP RIGHT)
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Reporte Mensual de Operaciones', 105, 22);

        // Info (TOP RIGHT)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 105, 28);
        doc.text(`Instalación: ${installation.name}`, 105, 33);
        doc.text(`Período: ${month}/${year}`, 105, 38);

        // Divider Line
        doc.setDrawColor(249, 115, 22); // Orange
        doc.setLineWidth(1);
        doc.line(14, 46, 196, 46);

        // Summary Boxes (Graphics Simulation)
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(14, 60, 42, 30, 3, 3);
        doc.roundedRect(62, 60, 42, 30, 3, 3);
        doc.roundedRect(110, 60, 42, 30, 3, 3);
        doc.roundedRect(158, 60, 42, 30, 3, 3);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('TOTAL MARCAJES', 18, 67);
        doc.text('CUMPLIMIENTO', 66, 67);
        doc.text('INCIDENTES', 114, 67);
        doc.text('ALERTAS SOS', 162, 67);

        doc.setFontSize(14);
        doc.setTextColor(59, 130, 246); // Blue
        doc.text(totalScans.toString(), 18, 76);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`${qrScans} QR / ${nfcScans} NFC`, 18, 83);
        
        doc.setFontSize(14);
        doc.setTextColor(compliance > 90 ? 22 : 234, compliance > 90 ? 163 : 179, compliance > 90 ? 74 : 8); // Green or Yellow
        doc.text(`${compliance}%`, 66, 76);
        
        doc.setTextColor(incidents > 0 ? 220 : 100, incidents > 0 ? 38 : 100, incidents > 0 ? 38 : 100); // Red if > 0
        doc.text(incidents.toString(), 114, 76);
        
        doc.setTextColor(sos > 0 ? 220 : 100, sos > 0 ? 38 : 100, sos > 0 ? 38 : 100);
        doc.text(sos.toString(), 162, 76);


        // Simple Bar Chart (Compliance over weeks)
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);
        doc.text('Cumplimiento Semanal (%)', 14, 120);

        const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        const values = [85, 92, 88, 95];

        weeks.forEach((w, i) => {
            doc.setFontSize(8);
            doc.text(w, 20, 135 + (i * 10));
            (doc as any).setFillColor(59, 130, 246);
            doc.rect(45, 131 + (i * 10), values[i] * 1.2, 5, 'F');
            doc.text(`${values[i]}%`, 50 + (values[i] * 1.2), 135 + (i * 10));
        });

        // Table with details
        autoTable(doc, {
            startY: 180,
            head: [['Indicador', 'Meta', 'Real', 'Estado']],
            body: [
                ['Marcajes Diarios', installation.requiredDailyScans || 10, (totalScans / 30).toFixed(1), compliance > 90 ? 'Óptimo' : 'Revision'],
                ['Respuesta SOS', 'Inmediata', '100%', 'Cumplido'],
                ['Reporte Incidencias', '24h', '< 4h', 'Excelente']
            ],
            theme: 'striped',
            headStyles: { fillColor: [31, 41, 55] }
        });

        // Save PDF to "Supabase Storage" mock
        const fileName = `report_${installation.id}_${month}_${year}.pdf`;
        doc.save(fileName); // In real app, we would upload this as blob

        // Register in Database
        const newReport: Omit<MonthlyReport, 'id' | 'createdAt'> = {
            installationId: installation.id,
            installationName: installation.name,
            month,
            year,
            pdfUrl: `/reports/storage/${fileName}`, // Mock URL
            summaryData: {
                totalScans,
                compliancePercentage: compliance,
                incidentsCount: incidents,
                sosCount: sos
            }
        };

        const { data } = await ReportsService.create(newReport);
        if (data) {
            setReports(prev => [data, ...prev]);
        }
    };

    const handleGenerateSelected = async () => {
        if (selectedInstIds.length === 0) {
            alert('Por favor selecciona al menos una instalación.');
            return;
        }

        setIsGenerating(true);
        const month = genMonth + 1; // 1-indexed
        const year = genYear;

        let generatedCount = 0;
        for (const instId of selectedInstIds) {
            const inst = installations.find(i => i.id === instId);
            if (inst) {
                // Check if already exists in local state to avoid dupes (could also be checked in DB)
                const exists = reports.find(r => r.installationId === inst.id && r.month === month && r.year === year);
                if (!exists) {
                    await generateMonthlyReport(inst, month, year);
                    generatedCount++;
                }
            }
        }
        
        setIsGenerating(false);
        setShowGenerateModal(false);
        setSelectedInstIds([]);
        if (generatedCount > 0) {
            alert(`${generatedCount} reporte(s) generado(s) exitosamente.`);
        } else {
            alert('No se generaron reportes nuevos (ya existían reportes para el período seleccionado).');
        }
    };

    const toggleInstallation = (id: string) => {
        setSelectedInstIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleAll = () => {
        if (selectedInstIds.length === installations.length) {
            setSelectedInstIds([]);
        } else {
            setSelectedInstIds(installations.map(i => i.id));
        }
    };

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport || !emailToSend) return;

        setIsSending(true);
        const { success } = await ReportsService.sendByEmail(selectedReport.id, emailToSend);
        setIsSending(false);

        if (success) {
            alert(`Reporte enviado exitosamente a ${emailToSend}`);
            setShowEmailModal(false);
            setEmailToSend('');
        } else {
            alert('Error al enviar el reporte.');
        }
    };

    const getMonthName = (month: number) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month - 1];
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-500" /> Reportes Mensuales Automáticos
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Generación y envío de reportes de cumplimiento por instalación.</p>
                </div>

                <button
                    onClick={() => {
                        // Set to previous month by default
                        const d = new Date();
                        d.setMonth(d.getMonth() - 1);
                        setGenMonth(d.getMonth());
                        setGenYear(d.getFullYear());
                        setShowGenerateModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm"
                >
                    <Calendar size={18} />
                    Generar Reportes
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-500">Cargando reportes...</p>
                </div>
            ) : reports.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay reportes generados</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
                        Haz clic en el botón de arriba para generar los reportes del mes pasado para todas las instalaciones activas.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map(report => (
                        <div key={report.id} className="glass-panel rounded-2xl overflow-hidden group hover:border-blue-500/50 transition-all">
                            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Building2 className="text-blue-600 dark:text-blue-400" size={20} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                        {getMonthName(report.month)} {report.year}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white truncate">{report.installationName}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generado: {new Date(report.createdAt).toLocaleDateString()}</p>
                            </div>

                            <div className="p-5 bg-gray-50/50 dark:bg-gray-800/20 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Cumplimiento</p>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{report.summaryData?.compliancePercentage}%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Alarmas SOS</p>
                                    <div className="flex items-center gap-1.5">
                                        <Siren size={14} className={report.summaryData?.sosCount ? 'text-red-500' : 'text-gray-400'} />
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{report.summaryData?.sosCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                <button
                                    onClick={() => { setSelectedReport(report); setShowViewModal(true); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                                >
                                    <Eye size={14} /> Revisar
                                </button>
                                <button
                                    onClick={() => { setSelectedReport(report); setShowEmailModal(true); }}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                >
                                    <Send size={14} /> Enviar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Email Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                            <div className="flex justify-between items-start">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <Send size={24} />
                                </div>
                                <button onClick={() => setShowEmailModal(false)} className="text-white/60 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>
                            <h3 className="text-xl font-bold mt-4">Enviar Reporte Mensual</h3>
                            <p className="text-blue-100 text-sm opacity-90">{selectedReport?.installationName} - {getMonthName(selectedReport?.month || 1)} {selectedReport?.year}</p>
                        </div>

                        <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">Correo del Destinatario</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="ejemplo@cliente.com"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                    value={emailToSend}
                                    onChange={e => setEmailToSend(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-2 ml-1">Se enviará un correo con el archivo PDF adjunto.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEmailModal(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    {isSending ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                    ) : (
                                        <>
                                            <Send size={18} /> Enviar Reporte
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Report Modal */}
            {showViewModal && selectedReport && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-2xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in zoom-in duration-300 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold italic tracking-tight uppercase">{selectedReport.installationName}</h3>
                                    <p className="text-gray-400 text-xs font-bold tracking-widest">{getMonthName(selectedReport.month)} {selectedReport.year}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowViewModal(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                                <div className="glass-panel p-4 rounded-2xl text-center space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Cumplimiento</p>
                                    <p className={`text-2xl font-black ${selectedReport.summaryData?.compliancePercentage > 90 ? 'text-green-500' : 'text-orange-500'}`}>
                                        {selectedReport.summaryData?.compliancePercentage}%
                                    </p>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl text-center space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Marcajes</p>
                                    <p className="text-2xl font-black text-blue-500">{selectedReport.summaryData?.totalScans}</p>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl text-center space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Incidentes</p>
                                    <p className={`text-2xl font-black ${selectedReport.summaryData?.incidentsCount > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                                        {selectedReport.summaryData?.incidentsCount}
                                    </p>
                                </div>
                                <div className="glass-panel p-4 rounded-2xl text-center space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">SOS</p>
                                    <p className={`text-2xl font-black ${selectedReport.summaryData?.sosCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                        {selectedReport.summaryData?.sosCount}
                                    </p>
                                </div>
                            </div>

                            <div className="glass-panel rounded-3xl p-10 flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-700">
                                <FileText size={48} className="text-gray-300 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-bold mb-6 text-center">El archivo PDF completo está disponible para descarga y envío por email.</p>
                                <div className="flex gap-4">
                                    <button 
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20"
                                        onClick={() => {
                                            // Simulate PDF download
                                            const link = document.createElement('a');
                                            link.href = '#';
                                            link.download = `reporte_${selectedReport.installationName}.pdf`;
                                            alert('Iniciando descarga de reporte PDF...');
                                        }}
                                    >
                                        <Download size={18} /> Descargar PDF
                                    </button>
                                    <button 
                                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2"
                                        onClick={() => { setShowViewModal(false); setShowEmailModal(true); }}
                                    >
                                        <Send size={18} /> Enviar por Email
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate Reports Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                            <div className="flex justify-between items-start">
                                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                    <Calendar size={24} />
                                </div>
                                <button onClick={() => setShowGenerateModal(false)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>
                            <h3 className="text-xl font-black mt-4 uppercase tracking-tight italic">Generar Reporte de Operaciones</h3>
                            <p className="text-blue-100 text-xs font-bold opacity-90 mt-1 uppercase tracking-widest">Selecciona el período y las instalaciones</p>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Mes del Reporte</label>
                                    <select 
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                                        value={genMonth}
                                        onChange={e => setGenMonth(parseInt(e.target.value))}
                                    >
                                        {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                                            <option key={m} value={i}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1 tracking-widest">Año</label>
                                    <select 
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                                        value={genYear}
                                        onChange={e => setGenYear(parseInt(e.target.value))}
                                    >
                                        {[2024, 2025, 2026].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Instalaciones ({selectedInstIds.length}/{installations.length})</h4>
                                    <button 
                                        onClick={toggleAll}
                                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
                                    >
                                        {selectedInstIds.length === installations.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
                                    </button>
                                </div>
                                
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar instalación..."
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {installations
                                        .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(inst => (
                                            <div 
                                                key={inst.id}
                                                onClick={() => toggleInstallation(inst.id)}
                                                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                                                    selectedInstIds.includes(inst.id) 
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30' 
                                                        : 'bg-gray-50 dark:bg-gray-800/40 border-transparent hover:border-gray-200 dark:hover:border-white/10'
                                                }`}
                                            >
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                                                    selectedInstIds.includes(inst.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    {selectedInstIds.includes(inst.id) && <CheckSquare size={12} className="text-white" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${selectedInstIds.includes(inst.id) ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {inst.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate tracking-tight">{inst.address}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                            <button
                                onClick={() => setShowGenerateModal(false)}
                                className="flex-1 bg-white dark:bg-gray-800 text-gray-500 font-bold py-3 rounded-2xl border border-gray-200 dark:border-white/10 transition-all hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGenerateSelected}
                                disabled={isGenerating || selectedInstIds.length === 0}
                                className="flex-[1.5] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-black py-3 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={20} /> Generar {selectedInstIds.length} Reportes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsManager;
