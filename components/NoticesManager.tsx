import React, { useState, useEffect } from 'react';
import { Notice } from '../types';
import { Edit, Trash2, Plus, Megaphone, Image as ImageIcon, Search, ShieldAlert, X, Save, Upload, Loader2, Info } from 'lucide-react';
import { NoticesService } from '../services/notices.service';

// ─── Custom Confirm Modal ──────────────────────────────────────────────────────
interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
    <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10">
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
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
        </button>
      </div>
    </div>
  </div>
);

const NoticesManager: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Notice>>({ is_active: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    setIsLoading(true);
    const { data, error } = await NoticesService.getAll();
    if (error) {
      alert('Error al cargar avisos: ' + error.message);
    } else {
      setNotices(data || []);
    }
    setIsLoading(false);
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const filteredNotices = notices.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({ is_active: true });
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notice: Notice) => {
    setFormData(notice);
    setImageFile(null);
    setImagePreview(notice.image_url || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    showConfirm('¿Estás seguro que deseas eliminar este aviso? Esta acción no se puede deshacer.', async () => {
      const { error } = await NoticesService.delete(id);
      if (error) {
        alert('Error al eliminar aviso: ' + error.message);
      } else {
        setNotices(prev => prev.filter(n => n.id !== id));
        closeConfirm();
      }
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { data, error } = await NoticesService.update(id, { is_active: !currentStatus });
    if (error) {
      alert('Error al actualizar estado: ' + error.message);
    } else if (data) {
      setNotices(prev => prev.map(n => n.id === id ? { ...n, is_active: data.is_active } : n));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return alert('El título es requerido');

    setIsSaving(true);
    try {
      let finalImageUrl = formData.image_url;

      if (imageFile) {
        const { data: url, error: uploadError } = await NoticesService.uploadImage(imageFile);
        if (uploadError) throw uploadError;
        finalImageUrl = url || undefined;
      }

      const noticeData = {
        title: formData.title,
        description: formData.description,
        image_url: finalImageUrl,
        is_active: formData.is_active
      };

      if (formData.id) {
        const { data, error } = await NoticesService.update(formData.id, noticeData);
        if (error) throw error;
        if (data) {
          setNotices(prev => prev.map(n => n.id === formData.id ? data : n));
        }
      } else {
        const { data, error } = await NoticesService.create(noticeData as any);
        if (error) throw error;
        if (data) {
          setNotices(prev => [data, ...prev]);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Error al guardar aviso: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto pb-24">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Megaphone size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
              Avisos y Comunicados
            </h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Publicaciones para la App de Guardia</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-3 flex-1 lg:max-w-3xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar avisos..."
              className="w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreate}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 font-bold whitespace-nowrap"
          >
            <Plus size={20} /> Crear Aviso
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Cargando avisos...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="py-20 text-center glass-panel rounded-3xl border-dashed border-2 border-gray-200 dark:border-gray-800">
          <Megaphone className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
          <p className="text-gray-400 font-bold uppercase tracking-widest">No hay avisos publicados</p>
          <button onClick={handleCreate} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">
            Comienza creando el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotices.map(notice => (
            <div 
              key={notice.id} 
              className={`glass-panel overflow-hidden rounded-2xl group transition-all border border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-indigo-500/5 ${!notice.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}
            >
              {notice.image_url ? (
                <div className="h-48 overflow-hidden relative">
                  <img src={notice.image_url} alt={notice.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {!notice.is_active && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg">Inactivo</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-300 dark:text-indigo-800">
                  <ImageIcon size={48} />
                </div>
              )}

              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-1">{notice.title}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(notice.id, notice.is_active || false)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${notice.is_active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span className={`${notice.is_active ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-6 font-medium leading-relaxed">
                  {notice.description}
                </p>

                <div className="flex gap-2 border-t border-gray-100 dark:border-white/5 pt-4">
                  <button 
                    onClick={() => handleEdit(notice)}
                    className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(notice.id)}
                    className="flex-1 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-xl rounded-[2rem] border border-white/20 dark:border-gray-700/50 shadow-2xl my-auto animate-in zoom-in duration-300 overflow-hidden">
            {/* Header refined */}
            <div className="flex justify-between items-center p-6 bg-gradient-to-r from-indigo-600/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    {formData.id ? 'Editar Aviso' : 'Nuevo Comunicado'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Publicación Táctica</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Título del Aviso</label>
                  <input
                    type="text"
                    placeholder="Ej: Cambio de turno..."
                    className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-white/5 rounded-xl p-3.5 text-gray-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-700"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">Contenido Detallado</label>
                  <textarea
                    placeholder="Escribe el detalle aquí..."
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-white/5 rounded-xl p-3.5 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-gray-300 dark:placeholder:text-gray-700 text-sm leading-relaxed"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Imagen de Referencia</label>
                    <div 
                      className="h-32 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/5 flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-900/40 group cursor-pointer transition-all hover:border-indigo-500/50"
                      onClick={() => document.getElementById('notice-image')?.click()}
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Upload className="text-white" size={24} />
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="mx-auto text-gray-300 dark:text-gray-700 mb-1" size={28} />
                          <p className="text-[9px] font-bold uppercase tracking-tighter text-gray-400">Click para subir</p>
                        </div>
                      )}
                      <input id="notice-image" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </div>
                  </div>
                  
                  <div className="flex flex-col justify-end space-y-3">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
                      <div className="flex gap-2">
                        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold leading-tight uppercase tracking-tight">
                          Las imágenes aumentan la efectividad del mensaje táctico.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Estado Activo</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${formData.is_active ? 'bg-indigo-600 shadow-md shadow-indigo-500/20' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <span className={`${formData.is_active ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 text-gray-500 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Guardando...' : formData.id ? 'Guardar Cambios' : 'Publicar Ahora'}
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
        />
      )}
    </div>
  );
};

export default NoticesManager;
