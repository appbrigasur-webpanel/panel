import React, { useState } from 'react';
import { SystemAdmin, Installation, UserRole } from '../types';
import { UserPlus, Search, Edit, Trash2, Shield, Mail, CheckSquare, Square, Eye, EyeOff, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isValidUUID } from '../services/utils';
import { AuthService } from '../services/auth.service';

interface UsersManagerProps {
  users: SystemAdmin[];
  setUsers: React.Dispatch<React.SetStateAction<SystemAdmin[]>>;
  installations: Installation[];
}

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
          <AlertTriangle className="text-red-600 dark:text-red-400" size={22} />
        </div>
        <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
          Confirmar Eliminación
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
              Eliminando...
            </>
          ) : (
            <>
              <Trash2 size={16} />
              Eliminar
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const UsersManager: React.FC<UsersManagerProps> = ({ users, setUsers, installations }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemAdmin>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ open: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, message: '', onConfirm: () => {} });
  };

  const filteredUsers = (users || []).filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map(user => user.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    showConfirm(
      `¿Estás seguro que deseas eliminar ${selectedIds.length} usuario${selectedIds.length > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      async () => {
        setIsDeleting(true);
        closeConfirm();
        try {
          const { error } = await supabase
            .from('system_admins')
            .delete()
            .in('id', selectedIds);

          if (error) {
            alert('Error al eliminar usuarios: ' + error.message);
            console.error('Bulk delete error:', error);
          } else {
            setUsers(prev => prev.filter(user => !selectedIds.includes(user.id)));
            setSelectedIds([]);
            closeConfirm();
          }
        } catch (err) {
          console.error('Error in bulk delete:', err);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    showConfirm(
      '¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.',
      async () => {
        setIsDeleting(true);
        closeConfirm();
        try {
          if (isValidUUID(id)) {
            const { error } = await supabase.from('system_admins').delete().eq('id', id);
            if (error) {
              alert('Error al eliminar: ' + error.message);
              console.error('Delete error:', error);
              setIsDeleting(false);
              return;
            }
          }
          setUsers(prev => prev.filter(user => user.id !== id));
          setSelectedIds(prev => prev.filter(item => item !== id));
          closeConfirm();
        } catch (err) {
          console.error('Error deleting user:', err);
        } finally {
          setIsDeleting(false);
        }
      }
    );
  };

  const openModal = (user?: SystemAdmin) => {
    if (user) {
      setFormData(user);
      setConfirmPassword(user.password || '');
    } else {
      setFormData({});
      setConfirmPassword('');
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleEdit = (user: SystemAdmin, e: React.MouseEvent) => {
    e.stopPropagation();
    openModal(user);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation
    if (formData.password && formData.password !== confirmPassword) {
      alert('Las contraseñas no coinciden. Por favor verifique.');
      return;
    }

    try {
      if (formData.id && isValidUUID(formData.id)) {
        // ACTUALIZACIÓN DE USUARIO EXISTENTE
        const { data, error } = await supabase
          .from('system_admins')
          .update({
            email: formData.email,
            role: formData.role,
            password: formData.password
          })
          .eq('id', formData.id)
          .select()
          .single();
        if (error) throw error;
        setUsers((prev: SystemAdmin[]) => prev.map(user => user.id === formData.id ? data : user));
        
        // Try to update password in Auth if we are updating an existing user? 
        // We can't update a different user's password directly from the frontend without service_role
        // The user will have to use reset default password mechanism. 

      } else {
        // CREACIÓN DE NUEVO USUARIO
        // 1. Sincronizar en Supabase Auth primero (OBLIGATORIO PARA APP MÓVIL)
        const fullName = formData.email.split('@')[0];
        
        const authResponse = await AuthService.register({
          email: formData.email,
          password: formData.password || '',
          full_name: fullName,
          role: (formData.role as any) || 'Admin',
        });

        if (authResponse.error) {
          throw new Error('Error al registrar usuario en App Móvil (Auth): ' + authResponse.error);
        }

        // 2. Crear en panel local
        const { data, error } = await supabase
          .from('system_admins')
          .insert([{
            email: formData.email,
            role: formData.role || 'Admin',
            password: formData.password
          }])
          .select()
          .single();
        if (error) throw error;
        setUsers((prev: SystemAdmin[]) => [...prev, data]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const roles = [
    { value: 'Super Admin', label: 'Super Admin' },
    { value: 'Admin', label: 'Administrador' }
  ];

  return (
    <div className="p-6 h-full overflow-y-auto pb-24">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
            <Shield className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Usuarios y Roles
            </h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gestión de Accesos al Panel</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-2xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Nombre de usuario o correo..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="flex-1 md:flex-none bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border border-red-200 dark:border-red-800 font-bold active:scale-95 hover:bg-red-200 dark:hover:bg-red-900/50"
              >
                <Trash2 size={20} />
                <span>{isDeleting ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}</span>
              </button>
            )}

            <button
              onClick={() => openModal()}
              className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg font-bold active:scale-95 whitespace-nowrap"
            >
              <UserPlus size={20} /> Nuevo Usuario
            </button>
          </div>
        </div>
      </div>

      {/* ── Select All ── */}
      {filteredUsers.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-2 no-print">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-purple-600 transition-colors cursor-pointer"
          >
            {selectedIds.length === filteredUsers.length ? <CheckSquare size={18} className="text-purple-600" /> : <Square size={18} />}
            {selectedIds.length === filteredUsers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
        </div>
      )}

      {/* ── User Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel rounded-3xl border-dashed border-2">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No se encontraron usuarios</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              className={`glass-panel p-5 rounded-2xl relative group transition-all cursor-pointer ${
                selectedIds.includes(user.id) ? 'ring-2 ring-purple-500 bg-purple-50/20 dark:bg-purple-900/10' : 'hover:shadow-xl'
              }`}
              onClick={() => setSelectedIds(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
            >
              {/* Checkbox */}
              <div
                className="absolute top-4 right-4 z-20"
                onClick={(e) => handleToggleSelect(user.id, e)}
              >
                {selectedIds.includes(user.id) ?
                  <CheckSquare size={20} className="text-purple-600" /> :
                  <Square size={20} className="text-gray-200 dark:text-gray-700 group-hover:text-gray-400" />
                }
              </div>

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Shield className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white lowercase tracking-tight">{user.email.split('@')[0]}</h3>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-black uppercase">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              <div className="flex gap-2 relative z-10">
                <button
                  onClick={(e) => handleEdit(user, e)}
                  className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 py-2 rounded-xl text-xs font-bold transition-all border border-gray-100 dark:border-white/5 flex items-center justify-center gap-2"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  onClick={(e) => handleDelete(user.id, e)}
                  disabled={isDeleting}
                  className="flex-1 bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-600 dark:text-red-200 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Borrar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmModal.open && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
          isLoading={isDeleting}
        />
      )}

      {/* ── Edit / Create Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {formData.id ? 'Modificar Usuario' : 'Crear Usuario de Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={formData.id ? 'Dejar en blanco para no cambiar' : 'Requerido'}
                      className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl p-3 pr-12 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none"
                      value={formData.password || ''}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Confirmar Contraseña</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={formData.id ? 'Confirme nueva contraseña' : 'Requerido'}
                    className={`w-full bg-gray-50 dark:bg-slate-900 border ${confirmPassword && formData.password !== confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-white/5'} rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none`}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required={!!formData.password}
                  />
                  {confirmPassword && formData.password !== confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1 font-bold italic">Las contraseñas no coinciden</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Rol del Sistema</label>
                  <select
                    className="w-full bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-xl p-3 text-sm font-bold focus:ring-4 focus:ring-purple-500/10 outline-none appearance-none"
                    value={formData.role || 'Admin'}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white dark:bg-gray-800 py-3 rounded-xl text-sm font-bold text-gray-500 border border-gray-200 dark:border-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;
