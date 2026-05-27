import React from 'react';
import { LayoutDashboard, Users, ScanLine, Nfc, AlertTriangle, Building2, UserCog, Settings, LogOut, Shield, Sun, Moon, Siren, UsersRound, Map as MapIcon, FileText, CalendarDays, Activity, QrCode, Route as RouteIcon, Megaphone } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    currentView: string;
    onChangeView: (view: string) => void;
    userRole: UserRole;
    onLogout: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    logo: string | null;
    primaryColor?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout, theme, toggleTheme, logo, primaryColor = '#3b82f6' }) => {
    const { user } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'avisos', label: 'Avisos', icon: Megaphone, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'map', label: 'Mapa General', icon: MapIcon, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'compliance', label: 'Cumplimiento GPS', icon: Activity, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'routes', label: 'Gestión de Rutas', icon: RouteIcon, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'checkpoints', label: 'Puntos QR / NFC', icon: QrCode, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'guards', label: 'Guardias', icon: Users, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'markings', label: 'Marcaciones', icon: ScanLine, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'shifts', label: 'Turnos y Horarios', icon: CalendarDays, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'incidents', label: 'Incidencias', icon: AlertTriangle, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'sos', label: 'Alertas SOS', icon: Siren, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPERVISOR] },
        { id: 'installations', label: 'Instalaciones', icon: Building2, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'reports', label: 'Reportes Mensuales', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'supervisors', label: 'Supervisores', icon: UserCog, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
        { id: 'settings', label: 'Configuración', icon: Settings, roles: [UserRole.SUPER_ADMIN] },
        { id: 'users', label: 'Usuarios', icon: UsersRound, roles: [UserRole.SUPER_ADMIN] },
    ];

    return (
        <div className="h-full w-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col no-print transition-colors duration-300">
            {/* Logo Area */}
            <div className="p-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-800">
                <div className="shrink-0 overflow-hidden w-full flex items-center justify-center h-16">
                    {logo ? (
                        <img
                            src={logo}
                            alt="Logo Corporativo"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => {
                                // Fallback en caso de que la imagen de Supabase falle
                                console.error("Error loading logo:", logo);
                            }}
                        />
                    ) : (
                        <div className="flex items-center gap-3">
                            <div
                                className="p-2 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] flex items-center justify-center w-10 h-10 transition-colors"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Shield size={18} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-gray-900 dark:text-white font-bold text-lg leading-tight uppercase tracking-tighter">
                                    BRIGA<span style={{ color: primaryColor }}>SUR</span>
                                </h1>
                                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Seguridad</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Menu Principal</p>
                {menuItems.map((item) => {
                    if (!item.roles.includes(userRole)) return null;
                    const active = currentView === item.id;
                    const isSos = item.id === 'sos';

                    // Dynamic styling for active state
                    const activeStyle = active && !isSos ? {
                        backgroundColor: `${primaryColor}1A`, // 10% opacity hex approximation
                        color: primaryColor,
                        borderRight: `2px solid ${primaryColor}`
                    } : {};

                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id)}
                            style={activeStyle}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${active
                                    ? isSos ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-r-2 border-red-500' : '' // Removed hardcoded blue, now handled by style
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }
                        ${!active && isSos ? 'hover:text-red-500 dark:hover:text-red-400' : ''}
                        `}
                        >
                            <item.icon
                                size={20}
                                className={isSos ? (active ? 'text-red-600 dark:text-red-400' : 'text-red-400') : (active ? '' : 'text-gray-500')}
                                style={active && !isSos ? { color: primaryColor } : {}}
                            />
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${primaryColor}, #a855f7)` }}
                    >
                        {userRole === UserRole.SUPER_ADMIN ? 'SA' : 'AD'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.profile.full_name || 'Usuario'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.profile.role || userRole}</p>
                    </div>
                </div>

                <div className="flex gap-2 mb-2">
                    <button
                        onClick={toggleTheme}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm transition-colors"
                        title="Cambiar Tema"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        <span className="text-xs">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 py-2 rounded-lg text-sm transition-colors"
                >
                    <LogOut size={16} /> Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Sidebar;