import React, { useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    Plus,
    Clock,
    User,
    Building2,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    X,
    CalendarDays,
    Clock3,
    CalendarOff
} from 'lucide-react';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval,
    parseISO,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ShiftAssignment, Absence, Guard, Installation } from '../types';
import { ShiftsService } from '../services/shifts.service';

interface ShiftsManagerProps {
    guards: Guard[];
    installations: Installation[];
}

const ShiftsManager: React.FC<ShiftsManagerProps> = ({ guards, installations }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'calendar' | 'absences'>('calendar');

    // Modales
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);

    // Form States
    const [newShift, setNewShift] = useState<Partial<ShiftAssignment>>({
        shiftType: 'Día',
        startTime: '08:00',
        endTime: '20:00'
    });
    const [newAbsence, setNewAbsence] = useState<Partial<Absence>>({
        reason: 'Médica',
        status: 'Pendiente'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: shiftsData } = await ShiftsService.getShifts();
        const { data: absencesData } = await ShiftsService.getAbsences();
        if (shiftsData) setShifts(shiftsData);
        if (absencesData) setAbsences(absencesData);
        setLoading(false);
    };

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const handleCreateShift = async (e: React.FormEvent) => {
        e.preventDefault();
        const guard = guards.find(g => g.id === newShift.guardId);
        const inst = installations.find(i => i.id === newShift.installationId);

        if (!guard || !inst || !newShift.date) return;

        const { data, error } = await ShiftsService.createShift({
            guardId: guard.id,
            guardName: guard.fullName,
            installationId: inst.id,
            installationName: inst.name,
            date: newShift.date,
            shiftType: newShift.shiftType as any,
            startTime: newShift.startTime!,
            endTime: newShift.endTime!
        });

        if (data) {
            setShifts([...shifts, data]);
            setShowShiftModal(false);
            setNewShift({ shiftType: 'Día', startTime: '08:00', endTime: '20:00' });
        } else {
            alert(error);
        }
    };

    const handleCreateAbsence = async (e: React.FormEvent) => {
        e.preventDefault();
        const guard = guards.find(g => g.id === newAbsence.guardId);
        if (!guard || !newAbsence.startDate || !newAbsence.endDate) return;

        const { data, error } = await ShiftsService.createAbsence({
            guardId: guard.id,
            guardName: guard.fullName,
            startDate: newAbsence.startDate,
            endDate: newAbsence.endDate,
            reason: newAbsence.reason as any,
            status: newAbsence.status as any,
            comment: newAbsence.comment
        });

        if (data) {
            setAbsences([...absences, data]);
            setShowAbsenceModal(false);
            setNewAbsence({ reason: 'Médica', status: 'Pendiente' });
        } else {
            alert(error);
        }
    };

    // Calendar logic
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const getShiftColor = (type: string) => {
        switch (type) {
            case 'Día': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
            case 'Noche': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
            case '24h': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getAbsenceStatusColor = (status: string) => {
        switch (status) {
            case 'Aprobada': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Rechazada': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CalendarDays className="text-indigo-500" /> Gestión de Turnos y Horarios
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Organice los turnos de sus guardias y gestione ausencias.</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAbsenceModal(true)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold"
                    >
                        <CalendarOff size={18} className="text-red-500" />
                        Registrar Ausencia
                    </button>
                    <button
                        onClick={() => setShowShiftModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-semibold"
                    >
                        <Plus size={18} />
                        Asignar Turno
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setActiveTab('calendar')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'calendar' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Calendario Visual
                </button>
                <button
                    onClick={() => setActiveTab('absences')}
                    className={`pb-3 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'absences' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Control de Ausencias
                    {absences.filter(a => a.status === 'Pendiente').length > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                            {absences.filter(a => a.status === 'Pendiente').length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'calendar' ? (
                <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-800">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
                            {format(currentMonth, 'MMMM yyyy', { locale: es })}
                        </h3>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 text-center border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="py-3 text-[10px] font-black uppercase text-gray-400 tracking-tighter">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, idx) => {
                            const dayShifts = shifts.filter(s => s.date === format(day, 'yyyy-MM-dd'));
                            const dayAbsences = absences.filter(a =>
                                day >= parseISO(a.startDate) && day <= parseISO(a.endDate) && a.status === 'Aprobada'
                            );

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[140px] p-2 border-r border-b border-gray-100 dark:border-gray-800 transition-colors
                                        ${!isSameMonth(day, monthStart) ? 'bg-gray-100/30 dark:bg-gray-900/30 opacity-40' : 'bg-white dark:bg-gray-900'}
                                        ${isToday(day) ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
                                    `}
                                >
                                    <div className={`flex justify-between items-center mb-2 px-1`}>
                                        <span className={`text-sm font-bold ${isToday(day) ? 'bg-indigo-500 text-white w-7 h-7 flex items-center justify-center rounded-full' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayAbsences.length > 0 && (
                                            <div className="flex gap-1">
                                                {dayAbsences.map(a => (
                                                    <div key={a.id} title={`Ausencia: ${a.guardName} (${a.reason})`} className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        {dayShifts.map(shift => (
                                            <div
                                                key={shift.id}
                                                className={`text-[10px] p-1.5 rounded-lg border flex flex-col gap-0.5 group relative cursor-pointer hover:shadow-md transition-all ${getShiftColor(shift.shiftType)}`}
                                                onClick={() => {
                                                    if (window.confirm('¿Eliminar esta asignación?')) {
                                                        ShiftsService.deleteShift(shift.id).then(() => loadData());
                                                    }
                                                }}
                                            >
                                                <div className="font-bold flex items-center justify-between">
                                                    <span className="truncate">{shift.guardName.split(' ')[0]}</span>
                                                    <Clock3 size={8} />
                                                </div>
                                                <div className="flex flex-col text-[8px] leading-tight">
                                                    <span className="font-black uppercase truncate text-indigo-600/70 dark:text-indigo-300/70">{shift.installationName}</span>
                                                    <span className="opacity-70">{shift.startTime} - {shift.endTime}</span>
                                                </div>
                                            </div>
                                        ))}

                                        {isSameMonth(day, monthStart) && (
                                            <button
                                                onClick={() => {
                                                    setNewShift({ ...newShift, date: format(day, 'yyyy-MM-dd') });
                                                    setShowShiftModal(true);
                                                }}
                                                className="w-full opacity-0 group-hover:opacity-100 flex items-center justify-center p-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-400 hover:text-indigo-500 transition-all border border-dashed border-gray-300 dark:border-gray-700 mt-1"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Pending Absences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {absences.map(absence => (
                            <div key={absence.id} className="glass-panel p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">
                                            <CalendarOff className="text-red-500" size={20} />
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${getAbsenceStatusColor(absence.status)}`}>
                                            {absence.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{absence.guardName}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{absence.reason}</p>

                                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <CalendarIcon size={14} />
                                        <span>{format(parseISO(absence.startDate), 'dd MMM')} - {format(parseISO(absence.endDate), 'dd MMM')}</span>
                                    </div>

                                    {absence.comment && (
                                        <p className="mt-2 text-[10px] italic text-gray-400 border-l-2 border-gray-200 pl-2">"{absence.comment}"</p>
                                    )}
                                </div>

                                {absence.status === 'Pendiente' && (
                                    <div className="flex gap-2 mt-6">
                                        <button
                                            className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                            onClick={() => loadData()} // Implement approval logic
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                            onClick={() => loadData()} // Implement approval logic
                                        >
                                            Aprobar
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal: Asignar Turno */}
            {showShiftModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Clock className="text-indigo-500" /> Asignar Nuevo Turno
                            </h3>
                            <button onClick={() => setShowShiftModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateShift} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Seleccionar Guardia</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                                    value={newShift.guardId || ''}
                                    onChange={e => setNewShift({ ...newShift, guardId: e.target.value })}
                                >
                                    <option value="">Seleccione un guardia...</option>
                                    {guards.map(g => (
                                        <option key={g.id} value={g.id}>{g.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Instalación Destino</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                                    value={newShift.installationId || ''}
                                    onChange={e => setNewShift({ ...newShift, installationId: e.target.value })}
                                >
                                    <option value="">Seleccione una instalación...</option>
                                    {installations.map(inst => (
                                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                                        value={newShift.date || ''}
                                        onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Tipo de Turno</label>
                                    <select
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                                        value={newShift.shiftType}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setNewShift({
                                                ...newShift,
                                                shiftType: val as any,
                                                startTime: val === 'Noche' ? '20:00' : '08:00',
                                                endTime: val === 'Noche' ? '08:00' : '20:00'
                                            });
                                        }}
                                    >
                                        <option value="Día">Día (12h)</option>
                                        <option value="Noche">Noche (12h)</option>
                                        <option value="24h">24 Horas</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Hora Entrada</label>
                                    <input
                                        type="time"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                        value={newShift.startTime}
                                        onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Hora Salida</label>
                                    <input
                                        type="time"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                        value={newShift.endTime}
                                        onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowShiftModal(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/30"
                                >
                                    Guardar Asignación
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Registrar Ausencia */}
            {showAbsenceModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <CalendarOff className="text-red-500" /> Registrar Ausencia
                            </h3>
                            <button onClick={() => setShowAbsenceModal(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAbsence} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Guardia</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                    value={newAbsence.guardId || ''}
                                    onChange={e => setNewAbsence({ ...newAbsence, guardId: e.target.value })}
                                >
                                    <option value="">Seleccione un guardia...</option>
                                    {guards.map(g => <option key={g.id} value={g.id}>{g.fullName}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Fecha Inicio</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                        value={newAbsence.startDate || ''}
                                        onChange={e => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Fecha Fin</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                        value={newAbsence.endDate || ''}
                                        onChange={e => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Motivo</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white"
                                    value={newAbsence.reason}
                                    onChange={e => setNewAbsence({ ...newAbsence, reason: e.target.value as any })}
                                >
                                    <option value="Médica">Licencia Médica</option>
                                    <option value="Vacaciones">Vacaciones / Feriado</option>
                                    <option value="Permiso">Permiso Especial</option>
                                    <option value="Falta Injustificada">Falta Injustificada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Comentario Adicional</label>
                                <textarea
                                    rows={2}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white resize-none"
                                    value={newAbsence.comment || ''}
                                    onChange={e => setNewAbsence({ ...newAbsence, comment: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAbsenceModal(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/30"
                                >
                                    Solicitar Ausencia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftsManager;
