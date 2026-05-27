import React, { useState } from 'react';
import { Guard, Installation } from '../types';
import { formatRut, validateRut, isValidUUID } from '../services/utils';
import { Edit, Trash2, UserPlus, ShieldAlert, Lock, Eye, EyeOff, Search, Building2, Filter, CheckSquare, Square } from 'lucide-react';
import { GuardsService } from '../services/guards.service';
import { supabase } from '../lib/supabase';

// ─── Custom Confirm Modal ──────────────────────────────────────────────────────
interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
          <ShieldAlert className="text-red-600 dark:text-red-400" size={22} />
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
          Confirmar Acción
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-6 leading-relaxed">
        {message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-white dark:bg-gray-800 py-2.5 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            'Confirmar'
          )}
        </button>
      </div>
    </div>
  </div>
);

interface GuardsManagerProps {
  guards: Guard[];
  setGuards: React.Dispatch<React.SetStateAction<Guard[]>>;
  installations: Installation[];
}

const GuardsManager: React.FC<GuardsManagerProps> = ({ guards, setGuards, installations }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Guard>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showKey, setShowKey] = useState(false);
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstallation, setFilterInstallation] = useState('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const filteredGuards = React.useMemo(() => {
    return guards.filter(guard => {
      const matchesSearch = guard.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guard.rut.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterInstallation === '' || guard.assignedInstallationId === filterInstallation;
      return matchesSearch && matchesFilter;
    });
  }, [guards, searchTerm, filterInstallation]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredGuards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGuards.map(g => g.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    const confirmMsg = selectedIds.length === 1 
      ? '¿Estás seguro que deseas eliminar este guardia?' 
      : `¿Estás seguro que deseas eliminar ${selectedIds.length} guardias? Esta acción también podría afectar su acceso a la app móvil.`;

    showConfirm(confirmMsg, async () => {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('guards')
          .delete()
          .in('id', selectedIds);

        if (error) {
          alert('Error al eliminar guardias: ' + error.message);
        } else {
          setGuards(prev => prev.filter(g => !selectedIds.includes(g.id)));
          setSelectedIds([]);
          closeConfirm();
        }
      } catch (err) {
        console.error('Error in bulk delete:', err);
      } finally {
        setIsDeleting(false);
      }
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    showConfirm('¿Estás seguro que deseas eliminar este guardia? Esta acción no se puede deshacer.', async () => {
      setIsDeleting(true);
      if (isValidUUID(id)) {
        const { success, error } = await GuardsService.delete(id);
        if (error) {
          alert('Error al eliminar guardia: ' + error);
          setIsDeleting(false);
          return;
        }
      }
      setGuards(prevGuards => prevGuards.filter(g => g.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      setIsDeleting(false);
      closeConfirm();
    });
  };

  const handleEdit = (guard: Guard) => {
    setFormData(guard);
    setConfirmPassword('');
    setShowKey(false);
    setShowKeyConfirm(false);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setFormData({ isActive: true });
    setConfirmPassword('');
    setShowKey(false);
    setShowKeyConfirm(false);
    setIsModalOpen(true);
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isValidUUID(id)) {
      setGuards(prev => prev.map(g => g.id === id ? { ...g, isActive: !currentStatus } : g));
      return;
    }
    const { data, error } = await GuardsService.update(id, { isActive: !currentStatus });
    if (error) {
      alert('Error al actualizar estado: ' + error);
      return;
    }
    if (data) {
      setGuards(prev => prev.map(g => g.id === id ? { ...g, isActive: data.isActive } : g));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName) newErrors.fullName = 'Nombre requerido';
    if (!formData.rut || !validateRut(formData.rut)) newErrors.rut = 'RUT inválido';
    if (!formData.phone) newErrors.phone = 'Teléfono requerido';
    if (!formData.email) newErrors.email = 'Email requerido';
    if (!formData.os10Expiry) newErrors.os10Expiry = 'Fecha OS10 requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (formData.id && isValidUUID(formData.id)) {
        const { data, error } = await GuardsService.update(formData.id, formData);
        if (error) throw new Error(error);
        if (data) {
          setGuards(prev => prev.map(g => g.id === formData.id ? { ...g, ...data } : g));
        }

        // Si se ingresó una nueva contraseña y coincide, actualizarla en Supabase Auth
        if (formData.password && formData.password.trim() !== '' && formData.email) {
          if (formData.password !== confirmPassword) {
            alert('⚠️ Las contraseñas no coinciden. No se actualizó el acceso.');
            return;
          }
          const { success, error: pwError } = await GuardsService.updatePassword(
            formData.id,
            formData.email,
            formData.password,
            formData.fullName
          );
          if (!success) {
            alert(`⚠️ Los datos del guardia se guardaron, pero hubo un error al actualizar la contraseña en el sistema de acceso:\n${pwError}`);
          } else {
            alert('✅ Contraseña actualizada correctamente. El guardia puede ingresar con la nueva clave.');
          }
        }
      } else {
        const { data, error } = await GuardsService.create(formData as Omit<Guard, 'id'>);
        if (error) throw new Error(error);
        if (data) {
          // Al crear un guardia nuevo, también crear su usuario en Supabase Auth
          if (formData.password && formData.email) {
            await GuardsService.updatePassword(
              data.id,
              formData.email,
              formData.password,
              formData.fullName
            );
          }
          setGuards(prev => {
            const exists = prev.some(g => g.id === formData.id);
            if (exists && formData.id) {
              return prev.map(g => g.id === formData.id ? data : g);
            }
            return [...prev, data];
          });
        }
      }
      setConfirmPassword('');
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error al guardar guardia: ' + err.message);
    }
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Gestión de Guardias
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Control de personal táctico</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-3xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-64">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-10 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none appearance-none"
              value={filterInstallation}
              onChange={e => setFilterInstallation(e.target.value)}
            >
              <option value="">Todas las Instalaciones</option>
              {installations.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <Filter size={14} />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex-1 md:flex-none bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border border-red-200 dark:border-red-800 font-bold active:scale-95"
              >
                <Trash2 size={20} />
                <span className="hidden sm:inline">{isDeleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}</span>
              </button>
            )}

            <button
              onClick={handleCreate}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95 font-bold whitespace-nowrap"
            >
              <UserPlus size={20} /> Nuevo Guardia
            </button>
          </div>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredGuards.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-2 no-print">
          <button 
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-600 transition-colors"
          >
            {selectedIds.length === filteredGuards.length ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
            {selectedIds.length === filteredGuards.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
          <span className="text-xs text-gray-400 font-medium">
            ({filteredGuards.length} guardias encontrados)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuards.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No se encontraron guardias</p>
          </div>
        ) : (
          filteredGuards.map(guard => (
            <div 
              key={guard.id} 
              className={`glass-panel p-4 rounded-xl relative group transition-all border-l-4 cursor-pointer ${
                selectedIds.includes(guard.id) ? 'border-l-blue-600 bg-blue-50/30 dark:bg-blue-900/10 ring-2 ring-blue-500/20' : 
                guard.isActive ? 'border-l-green-500' : 'border-l-red-500 opacity-90'
              }`}
              onClick={() => setSelectedIds(prev => prev.includes(guard.id) ? prev.filter(id => id !== guard.id) : [...prev, guard.id])}
            >
              {/* Checkbox Overlay */}
              <div 
                className="absolute top-4 right-14 z-20"
                onClick={(e) => handleToggleSelect(guard.id, e)}
              >
                {selectedIds.includes(guard.id) ? 
                  <CheckSquare size={20} className="text-blue-600" /> : 
                  <Square size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400" />
                }
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {guard.fullName}
                    {!guard.isActive && <Lock size={14} className="text-red-500" />}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{guard.rut}</p>
                </div>
                {/* Status Switch on Card */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleStatus(guard.id, guard.isActive); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-20 ${guard.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  title={guard.isActive ? "Bloquear Guardia" : "Desbloquear Guardia"}
                >
                  <span
                    className={`${guard.isActive ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mt-4">
                <p>📞 {guard.phone}</p>
                <p>📧 {guard.email}</p>
                <p>👮 OS10 Vence: <span className={new Date(guard.os10Expiry) < new Date() ? 'text-red-500 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400'}>{guard.os10Expiry}</span></p>
                <p>🏢 Instalación: {installations.find(i => i.id === guard.assignedInstallationId)?.name || 'Sin asignar'}</p>
                <p>🕒 Turno: {guard.shift || 'N/A'}</p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 relative z-10">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); handleEdit(guard); }} 
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(guard.id, e)}
                  className="flex-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 py-1.5 rounded text-xs flex items-center justify-center gap-1 text-red-600 dark:text-red-200 transition-colors cursor-pointer relative z-50"
                >
                  <Trash2 size={14} /> Borrar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="glass-panel w-full max-w-5xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl my-auto animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ShieldAlert className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {formData.id ? 'Editar Perfil de Guardia' : 'Registrar Nuevo Guardia'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Complete los datos del guardia para gestionar su acceso y asignación.</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <Trash2 size={20} className="rotate-45 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Información Personal</h4>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Nombre Completo</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ej: Pedro González"
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={formData.fullName || ''}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    {errors.fullName && <span className="text-red-500 text-[10px] font-medium mt-1 ml-1">{errors.fullName}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">RUT (XX.XXX.XXX-X)</label>
                    <input
                      type="text"
                      placeholder="12.345.678-9"
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                      value={formData.rut || ''}
                      onChange={handleRutChange}
                      maxLength={12}
                    />
                    {errors.rut && <span className="text-red-500 text-[10px] font-medium mt-1 ml-1">{errors.rut}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Clave de Acceso</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        placeholder={formData.id ? "Dejar en blanco para no cambiar" : "••••••••"}
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      >
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formData.id && (
                      <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-1 ml-1 font-semibold">
                        🔐 Al guardar con nueva clave, se actualizará el acceso en la app del guardia.
                      </p>
                    )}
                  </div>

                  {/* Confirmar contraseña — solo si se ingresó algo */}
                  {(formData.password || '').length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">
                        Confirmar Clave de Acceso
                      </label>
                      <div className="relative">
                        <input
                          type={showKeyConfirm ? "text" : "password"}
                          placeholder="Repite la contraseña..."
                          className={`w-full bg-gray-50 dark:bg-gray-900/50 border rounded-xl p-3 text-gray-900 dark:text-white focus:outline-none transition-all ${
                            confirmPassword === ''
                              ? 'border-gray-200 dark:border-gray-700/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                              : confirmPassword === formData.password
                              ? 'border-green-400 dark:border-green-600 focus:ring-2 focus:ring-green-500/20 bg-green-50/30 dark:bg-green-900/10'
                              : 'border-red-400 dark:border-red-600 focus:ring-2 focus:ring-red-500/20 bg-red-50/30 dark:bg-red-900/10'
                          }`}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyConfirm(!showKeyConfirm)}
                          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          {showKeyConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        {/* Indicador visual */}
                        {confirmPassword.length > 0 && (
                          <span className={`absolute right-10 top-3.5 text-xs font-bold ${confirmPassword === formData.password ? 'text-green-500' : 'text-red-500'}`}>
                            {confirmPassword === formData.password ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                      {confirmPassword.length > 0 && confirmPassword !== formData.password && (
                        <p className="text-[10px] text-red-500 mt-1 ml-1 font-semibold">
                          ❌ Las contraseñas no coinciden
                        </p>
                      )}
                      {confirmPassword.length > 0 && confirmPassword === formData.password && (
                        <p className="text-[10px] text-green-500 mt-1 ml-1 font-semibold">
                          ✅ Las contraseñas coinciden
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-1 bg-indigo-500 rounded-full"></div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400">Contacto y Asignación</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Correo Electrónico</label>
                      <input
                        type="email"
                        placeholder="usuario@correo.com"
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                      {errors.email && <span className="text-red-500 text-[10px] font-medium mt-1 ml-1">{errors.email}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Teléfono</label>
                      <input
                        type="text"
                        placeholder="+56 9 1234 5678"
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Vencimiento OS10</label>
                      <input
                        type="date"
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                        value={formData.os10Expiry || ''}
                        onChange={e => setFormData({ ...formData, os10Expiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Turno</label>
                      <select
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all appearance-none"
                        value={formData.shift || ''}
                        onChange={e => setFormData({ ...formData, shift: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="5x2">5x2</option>
                        <option value="4x4">4x4</option>
                        <option value="Part-time">Part-time</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Instalación Asignada</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all appearance-none"
                      value={formData.assignedInstallationId || ''}
                      onChange={e => setFormData({ ...formData, assignedInstallationId: e.target.value })}
                    >
                      <option value="">Sin asignar</option>
                      {installations.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <Lock size={18} className={formData.isActive ? 'hidden' : 'block'} />
                    <div className={formData.isActive ? 'block w-2 h-2 bg-green-500 rounded-full animate-pulse' : 'hidden'}></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Estado del Guardia</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.isActive ? 'El guardia está habilitado para realizar turnos.' : 'El guardia está bloqueado y no puede ser asignado.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 focus:outline-none ${formData.isActive ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`${formData.isActive ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-sm`}
                  />
                </button>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3.5 rounded-xl transition-all font-bold shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!!(formData.password && formData.password.length > 0 && confirmPassword !== formData.password)}
                  className={`flex-1 py-3.5 rounded-xl transition-all font-bold shadow-lg active:scale-95 ${
                    formData.password && formData.password.length > 0 && confirmPassword !== formData.password
                      ? 'bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                  }`}
                >
                  {formData.id ? 'Guardar Cambios' : 'Crear Guardia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmState.isOpen && (
        <ConfirmModal
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={closeConfirm}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default GuardsManager;