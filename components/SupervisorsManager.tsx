import React, { useState } from 'react';
import { Supervisor, Installation } from '../types';
import { formatRut, validateRut, isValidUUID } from '../services/utils';
import { Edit, Trash2, UserPlus, ShieldAlert, Lock, Eye, EyeOff, Search, Building2, Filter, CheckSquare, Square } from 'lucide-react';
import { SupervisorsService } from '../services/supervisors.service';
import { supabase } from '../lib/supabase';
import { AuthService } from '../services/auth.service';

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

interface SupervisorsManagerProps {
  supervisors: Supervisor[];
  setSupervisors: React.Dispatch<React.SetStateAction<Supervisor[]>>;
  installations: Installation[];
}

const SupervisorsManager: React.FC<SupervisorsManagerProps> = ({ supervisors, setSupervisors, installations }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Supervisor>>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showKey, setShowKey] = useState(false);
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

  const filteredSupervisors = React.useMemo(() => {
    return supervisors.filter(sv => {
      const matchesSearch = sv.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sv.rut.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterInstallation === '' || sv.assignedInstallationId === filterInstallation;
      return matchesSearch && matchesFilter;
    });
  }, [supervisors, searchTerm, filterInstallation]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSupervisors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSupervisors.map(sv => sv.id));
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
      ? '¿Estás seguro que deseas eliminar este supervisor?' 
      : `¿Estás seguro que deseas eliminar ${selectedIds.length} supervisores? Esta acción también podría afectar su acceso a la app móvil.`;

    showConfirm(confirmMsg, async () => {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('supervisors')
          .delete()
          .in('id', selectedIds);

        if (error) {
          alert('Error al eliminar supervisores: ' + error.message);
        } else {
          setSupervisors(prev => prev.filter(sv => !selectedIds.includes(sv.id)));
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
    showConfirm('¿Estás seguro que deseas eliminar este supervisor? Esta acción no se puede deshacer.', async () => {
      setIsDeleting(true);
      if (isValidUUID(id)) {
        const { error } = await SupervisorsService.delete(id);
        if (error) {
          alert('Error al eliminar supervisor: ' + error);
          setIsDeleting(false);
          return;
        }
      }
      setSupervisors(prev => prev.filter(sv => sv.id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
      setIsDeleting(false);
      closeConfirm();
    });
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isValidUUID(id)) {
      setSupervisors(prev => prev.map(sv => sv.id === id ? { ...sv, isActive: !currentStatus } : sv));
      return;
    }
    const { data, error } = await SupervisorsService.update(id, { isActive: !currentStatus });
    if (error) {
      alert('Error al actualizar estado: ' + error);
      return;
    }
    if (data) {
      setSupervisors(prev => prev.map(sv => sv.id === id ? { ...sv, isActive: data.isActive } : sv));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName) newErrors.fullName = 'Nombre requerido';
    if (!formData.rut || !validateRut(formData.rut)) newErrors.rut = 'RUT inválido';
    if (!formData.phone) newErrors.phone = 'Teléfono requerido';
    if (!formData.email) newErrors.email = 'Email requerido';
    if (!formData.id && !(formData as any).password) {
        newErrors.password = 'Clave requerida';
    } else if ((formData as any).password && (formData as any).password.length < 6) {
        newErrors.password = 'La clave debe tener al menos 6 caracteres';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      if (formData.id && isValidUUID(formData.id)) {
        const { data, error } = await SupervisorsService.update(formData.id, formData);
        if (error) throw new Error(error);
        if (data) {
          setSupervisors(prev => prev.map(sv => sv.id === formData.id ? { ...sv, ...data } : sv));
        }
      } else {
        // CREACIÓN DE NUEVO SUPERVISOR
        // 1. Registrar en Supabase Auth primero (para acceso a la App)
        const authResponse = await AuthService.register({
          email: formData.email || '',
          password: (formData as any).password || '',
          full_name: formData.fullName || '',
          role: 'Supervisor',
          phone: formData.phone
        });

        if (authResponse.error) {
          throw new Error('Error registrando acceso a la App (Auth): ' + authResponse.error);
        }

        // 2. Crear registro en tabla supervisores
        const { data, error } = await SupervisorsService.create({
          ...(formData as Omit<Supervisor, 'id'>),
          id: authResponse.data.id
        });

        if (error) {
          // Si falla la tabla de supervisores, mostramos el error específico
          const errorMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
          throw new Error(`Error en base de datos: ${errorMsg}`);
        }

        if (data) {
          setSupervisors(prev => {
            const exists = prev.some(sv => sv.id === data.id);
            if (exists) {
              return prev.map(sv => sv.id === data.id ? data : sv);
            }
            return [data, ...prev];
          });
        }
      }
      setIsModalOpen(false);
      setFormData({});
    } catch (err: any) {
      console.error('Error in handleSave:', err);
      const message = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert('Error: ' + message);
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
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Gestión de Supervisores
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Control Operativo de Terreno</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-3xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o RUT..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
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
              onClick={() => { setFormData({ isActive: true }); setShowKey(false); setIsModalOpen(true); }}
              className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 font-bold whitespace-nowrap"
            >
              <UserPlus size={20} /> Nuevo Supervisor
            </button>
          </div>
        </div>
      </div>

      {/* Select All Toggle */}
      {filteredSupervisors.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-2 no-print">
          <button 
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-indigo-600 transition-colors"
          >
            {selectedIds.length === filteredSupervisors.length ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
            {selectedIds.length === filteredSupervisors.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
          <span className="text-xs text-gray-400 font-medium">
            ({filteredSupervisors.length} supervisores encontrados)
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSupervisors.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No se encontraron supervisores</p>
          </div>
        ) : (
          filteredSupervisors.map(sv => (
            <div 
              key={sv.id} 
              className={`glass-panel p-4 rounded-xl relative group transition-all border-l-4 cursor-pointer ${
                selectedIds.includes(sv.id) ? 'border-l-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10 ring-2 ring-indigo-500/20' : 
                sv.isActive ? 'border-l-indigo-500' : 'border-l-red-500 opacity-90'
              }`}
              onClick={() => setSelectedIds(prev => prev.includes(sv.id) ? prev.filter(id => id !== sv.id) : [...prev, sv.id])}
            >
              {/* Checkbox Overlay */}
              <div 
                className="absolute top-4 right-14 z-20"
                onClick={(e) => handleToggleSelect(sv.id, e)}
              >
                {selectedIds.includes(sv.id) ? 
                  <CheckSquare size={20} className="text-indigo-600" /> : 
                  <Square size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400" />
                }
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {sv.fullName}
                    {!sv.isActive && <Lock size={14} className="text-red-500" />}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sv.rut}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleStatus(sv.id, sv.isActive); }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-20 ${sv.isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                >
                  <span
                    className={`${sv.isActive ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </button>
              </div>

              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300 mt-4">
                <p>📞 {sv.phone}</p>
                <p>📧 {sv.email}</p>
                <p>🏢 Instalación: {installations.find(i => i.id === sv.assignedInstallationId)?.name || 'Multi-Instalación'}</p>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 relative z-10">
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); setFormData(sv); setShowKey(false); setIsModalOpen(true); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(sv.id, e)}
                  className="flex-1 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 py-1.5 rounded text-xs flex items-center justify-center gap-1 text-red-600 dark:text-red-200 transition-colors"
                >
                  <Trash2 size={14} /> Borrar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-5xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <ShieldAlert className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {formData.id ? 'Editar Supervisor' : 'Nuevo Supervisor'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Datos operativos del supervisor de campo.</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <Trash2 size={20} className="rotate-45 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Nombre Completo</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                      value={formData.fullName || ''}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    {errors.fullName && <span className="text-red-500 text-[10px] ml-1">{errors.fullName}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">RUT</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                      value={formData.rut || ''}
                      onChange={handleRutChange}
                      maxLength={12}
                    />
                    {errors.rut && <span className="text-red-500 text-[10px] ml-1">{errors.rut}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Clave de Acceso</label>
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                        value={formData.password || ''}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-3 text-gray-400">
                        {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <span className="text-red-500 text-[10px] ml-1">{errors.password}</span>}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Correo Electrónico</label>
                    <input
                      type="email"
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <span className="text-red-500 text-[10px] ml-1">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Teléfono</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                      value={formData.phone || ''}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 ml-1">Instalación Asignada (Opcional)</label>
                    <select
                      className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 rounded-xl p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
                      value={formData.assignedInstallationId || ''}
                      onChange={e => setFormData({ ...formData, assignedInstallationId: e.target.value })}
                    >
                      <option value="">Multi-Instalación</option>
                      {installations.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-3.5 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25">
                  {formData.id ? 'Guardar Cambios' : 'Crear Supervisor'}
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

export default SupervisorsManager;