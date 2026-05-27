import React, { useState } from 'react';
import { Settings, Database, Palette, Type, Upload, Image as ImageIcon, Map, Eye, EyeOff, Edit, Trash2, Plus, X, Save, Sun, Moon, Loader2 } from 'lucide-react';
import { SystemAdmin } from '../types';
import { ConfigService } from '../services/config.service';
import { StorageService } from '../services/storage.service';

interface SuperAdminSettingsProps {
    logo: string | null;
    setLogo: (logo: string | null) => void;
    companyName: string;
    setCompanyName: (name: string) => void;
    googleMapsKey: string;
    setGoogleMapsKey: (key: string) => void;
    supabaseUrl: string;
    setSupabaseUrl: (url: string) => void;
    supabaseKey: string;
    setSupabaseKey: (key: string) => void;
    systemAdmins: SystemAdmin[];
    setSystemAdmins: React.Dispatch<React.SetStateAction<SystemAdmin[]>>;
    lightPrimaryColor: string;
    setLightPrimaryColor: (color: string) => void;
    darkPrimaryColor: string;
    setDarkPrimaryColor: (color: string) => void;
}

const SuperAdminSettings: React.FC<SuperAdminSettingsProps> = ({
    logo, setLogo,
    companyName, setCompanyName,
    googleMapsKey, setGoogleMapsKey,
    supabaseUrl, setSupabaseUrl,
    supabaseKey, setSupabaseKey,
    systemAdmins, setSystemAdmins,
    lightPrimaryColor, setLightPrimaryColor,
    darkPrimaryColor, setDarkPrimaryColor
}) => {
    const [showKey, setShowKey] = useState(false);
    const [showSupabaseKey, setShowSupabaseKey] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [isAdminSaving, setIsAdminSaving] = useState(false);

    // Admin Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [adminFormData, setAdminFormData] = useState<Partial<SystemAdmin>>({});

    const [logoStatus, setLogoStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validar tamaño (máx 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setLogoStatus('error');
                setTimeout(() => setLogoStatus('idle'), 3000);
                return;
            }

            setIsSaving(true);
            setLogoStatus('uploading');

            try {
                // Intentar subir a Supabase Storage
                const url = await StorageService.uploadImage(file, 'branding');

                if (url) {
                    setLogo(url);
                    setLogoStatus('success');
                } else {
                    // Fallback: convertir a base64 local (funciona sin storage)
                    console.warn('Storage no disponible, usando base64 local');
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setLogo(base64);
                        setLogoStatus('success');
                    };
                    reader.onerror = () => setLogoStatus('error');
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error('Error uploading logo:', error);
                // Fallback base64
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const base64 = ev.target?.result as string;
                    setLogo(base64);
                    setLogoStatus('success');
                };
                reader.onerror = () => setLogoStatus('error');
                reader.readAsDataURL(file);
            } finally {
                setIsSaving(false);
                setTimeout(() => setLogoStatus('idle'), 3000);
            }
        }
    };

    // CRUD for System Admins
    const handleEditAdmin = (admin: SystemAdmin) => {
        setAdminFormData(admin);
        setIsModalOpen(true);
    };

    const handleDeleteAdmin = async (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (window.confirm('¿Está seguro que deseas eliminar este administrador del sistema? Esta acción no se puede deshacer.')) {
            try {
                const { success, error } = await ConfigService.deleteSystemAdmin(id);
                if (success) {
                    setSystemAdmins(prev => prev.filter(a => a.id !== id));
                } else {
                    alert(`Error: ${error}`);
                }
            } catch (error) {
                console.error('Error deleting admin:', error);
            }
        }
    };

    const handleAddAdmin = () => {
        setAdminFormData({ role: 'Admin' });
        setIsModalOpen(true);
    };

    const handleSaveAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminFormData.email) return;

        setIsAdminSaving(true);
        try {
            const { data, error } = await ConfigService.saveSystemAdmin({
                id: adminFormData.id,
                email: adminFormData.email,
                password: adminFormData.password,
                role: adminFormData.role || 'Admin'
            });

            if (data) {
                if (adminFormData.id) {
                    setSystemAdmins(prev => prev.map(a => a.id === data.id ? data : a));
                } else {
                    setSystemAdmins(prev => [...prev, data]);
                }
                setIsModalOpen(false);
            } else {
                alert(`Error: ${error}`);
            }
        } catch (error) {
            console.error('Error saving admin:', error);
        } finally {
            setIsAdminSaving(false);
        }
    };

    const handleGlobalSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await ConfigService.updateConfig({
                companyName,
                lightPrimaryColor,
                darkPrimaryColor,
                logo,
                googleMapsKey,
                supabaseUrl,
                supabaseKey
            });

            if (!error) {
                alert("Configuración global guardada correctamente.");
            } else {
                alert(`Error al guardar: ${error}`);
            }
        } catch (error) {
            console.error('Error saving global config:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-24">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-8">
                <Settings className="text-purple-500" /> Configuración Global (Super Admin)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Branding */}
                <div className="glass-panel p-6 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <Palette size={18} /> Branding & Apariencia
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre Empresa</label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Logo Corporativo</label>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                    {logo ? (
                                        <img src={logo} alt="Logo Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <ImageIcon className="text-gray-400 w-8 h-8" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className={`cursor-pointer text-white px-4 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors w-fit ${
                                        logoStatus === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                        logoStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                        'bg-blue-600 hover:bg-blue-700'
                                    } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                        {isSaving ? 'Cargando...' :
                                         logoStatus === 'success' ? '✓ Logo cargado' :
                                         logoStatus === 'error' ? '✗ Error - reintenta' :
                                         'Subir Logo (PC)'}
                                        <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} disabled={isSaving} />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-2">Formatos: PNG, JPG, WebP, SVG (Max 2MB)</p>
                                    {logo && (
                                        <button
                                            type="button"
                                            onClick={() => setLogo(null)}
                                            className="text-xs text-red-500 hover:text-red-600 mt-1 flex items-center gap-1"
                                        >
                                            <X size={10} /> Quitar logo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <Sun size={12} /> Color Primario (Modo Claro)
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={lightPrimaryColor}
                                        onChange={(e) => setLightPrimaryColor(e.target.value)}
                                        className="h-9 w-9 bg-transparent cursor-pointer border-none p-0 rounded overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={lightPrimaryColor}
                                        onChange={(e) => setLightPrimaryColor(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                                    <Moon size={12} /> Color Primario (Modo Oscuro)
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={darkPrimaryColor}
                                        onChange={(e) => setDarkPrimaryColor(e.target.value)}
                                        className="h-9 w-9 bg-transparent cursor-pointer border-none p-0 rounded overflow-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={darkPrimaryColor}
                                        onChange={(e) => setDarkPrimaryColor(e.target.value)}
                                        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database */}
                <div className="glass-panel p-6 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <Database size={18} /> Base de Datos (Supabase)
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Supabase URL</label>
                            <input
                                type="text"
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Supabase Anon Key</label>
                            <div className="relative">
                                <input
                                    type={showSupabaseKey ? "text" : "password"}
                                    value={supabaseKey}
                                    onChange={(e) => setSupabaseKey(e.target.value)}
                                    placeholder="eyJ..."
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                                />
                                <button
                                    onClick={() => setShowSupabaseKey(!showSupabaseKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showSupabaseKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm transition-colors mt-2">
                            Probar Conexión
                        </button>
                    </div>
                </div>

                {/* System Admins */}
                <div className="glass-panel p-6 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <Type size={18} /> Administradores del Sistema
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">Gestión de usuarios con acceso al panel administrativo.</div>

                    <div className="space-y-2">
                        {systemAdmins.map(admin => (
                            <div key={admin.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded gap-2 relative">
                                <div className="overflow-hidden flex-1">
                                    <span className="text-gray-900 dark:text-white block truncate">{admin.email}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded inline-block mt-1 ${admin.role === 'Super Admin'
                                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300'
                                        : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                        }`}>{admin.role}</span>
                                </div>
                                <div className="flex gap-1 z-10">
                                    <button type="button" onClick={() => handleEditAdmin(admin)} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => handleDeleteAdmin(admin.id, e)}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded text-red-500 cursor-pointer relative z-50"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={handleAddAdmin}
                        className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded text-sm transition-colors mt-4 flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Agregar Administrador
                    </button>
                </div>

                {/* Integraciones Externas (Google Maps) */}
                <div className="glass-panel p-6 rounded-xl border border-purple-200 dark:border-purple-900/50">
                    <h3 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-4 flex items-center gap-2">
                        <Map size={18} /> Integraciones Externas
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Google Maps API Key</label>
                            <div className="relative">
                                <input
                                    type={showKey ? "text" : "password"}
                                    value={googleMapsKey}
                                    onChange={(e) => setGoogleMapsKey(e.target.value)}
                                    placeholder="AIzaSy..."
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 pr-10 text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono text-sm"
                                />
                                <button
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">
                                Requerido para funcionalidades avanzadas de geolocalización.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Save Button */}
            <div className="mt-8 flex justify-end border-t border-gray-200 dark:border-gray-800 pt-6">
                <button
                    onClick={handleGlobalSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {/* Modal for Admin CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-2xl relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                            {adminFormData.id ? 'Editar Administrador' : 'Nuevo Administrador'}
                        </h3>

                        <form onSubmit={handleSaveAdmin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                    value={adminFormData.email || ''}
                                    onChange={e => setAdminFormData({ ...adminFormData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contraseña de Acceso</label>
                                <div className="relative">
                                    <input
                                        type={showKey ? "text" : "password"}
                                        placeholder="Min. 6 caracteres"
                                        required={!adminFormData.id}
                                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 pr-10 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                        value={adminFormData.password || ''}
                                        onChange={e => setAdminFormData({ ...adminFormData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    {adminFormData.id ? 'Dejar en blanco para no cambiar' : 'Define la clave de ingreso al sistema.'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Rol</label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded p-2 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                                    value={adminFormData.role || 'Admin'}
                                    onChange={e => setAdminFormData({ ...adminFormData, role: e.target.value as 'Admin' | 'Super Admin' })}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Super Admin">Super Admin</option>
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white py-2 rounded transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdminSaving}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isAdminSaving && <Loader2 size={16} className="animate-spin" />}
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminSettings;