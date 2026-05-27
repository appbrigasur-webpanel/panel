import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Notification, Guard, Installation } from './types';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GuardsManager from './components/GuardsManager';
import SupervisorsManager from './components/SupervisorsManager';
import InstallationsManager from './components/InstallationsManager';
import LogsViewer from './components/LogsViewer';
import SuperAdminSettings from './components/SuperAdminSettings';
import UsersManager from './components/UsersManager';
import NotificationCenter from './components/NotificationCenter';
import InteractiveMap from './components/InteractiveMap';
import ReportsManager from './components/ReportsManager';
import ShiftsManager from './components/ShiftsManager';
import ComplianceDashboard from './components/ComplianceDashboard';
import CheckpointManager from './components/CheckpointManager';
import RouteManager from './components/RouteManager';
import NoticesManager from './components/NoticesManager';
import ErrorBoundary from './components/ErrorBoundary';

import { GuardsService } from './services/guards.service';
import { SupervisorsService } from './services/supervisors.service';
import { InstallationsService } from './services/installations.service';
import { ReportsService } from './services/reports.service';
import { ConfigService } from './services/config.service';
import { supabase } from './lib/supabase';
import { useNotifications } from './hooks/useNotifications';
import { useEffect, useRef, useMemo } from 'react';
import { SystemAdmin } from './types';

/**
 * Componente principal de la aplicación (con autenticación)
 */
const AppContent: React.FC = () => {
    const { user, loading, logout } = useAuth();

    // Estado de la aplicación
    const [currentView, setCurrentView] = useState('dashboard');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [logo, setLogo] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('BRIGASUR');

    // Color Palette State
    const [lightPrimaryColor, setLightPrimaryColor] = useState('#f97316');
    const [darkPrimaryColor, setDarkPrimaryColor] = useState('#fb923c');

    // Data State (Desde Supabase)
    const [guards, setGuards] = useState<Guard[]>([]);
    const [supervisors, setSupervisors] = useState<Guard[]>([]);
    const [installations, setInstallations] = useState<Installation[]>([]);

    // Integrations State
    const [googleMapsKey, setGoogleMapsKey] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [systemAdmins, setSystemAdmins] = useState<SystemAdmin[]>([]);



    // Cargar datos reales de Supabase
    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return;

            try {
                // 1. Cargar Configuración Global
                const { data: configData } = await ConfigService.getConfig();
                if (configData) {
                    setCompanyName(configData.companyName);
                    setLightPrimaryColor(configData.lightPrimaryColor);
                    setDarkPrimaryColor(configData.darkPrimaryColor);
                    setLogo(configData.logo);
                    setGoogleMapsKey(configData.googleMapsKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
                    setSupabaseUrl(configData.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '');
                    setSupabaseKey(configData.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
                }

                // 2. Cargar Instalaciones
                const { data: instData } = await InstallationsService.getAll();
                if (instData) setInstallations(instData as any);

                // 3. Cargar Supervisores
                const { data: supData } = await SupervisorsService.getAll();
                if (supData) setSupervisors(supData);

                // 4. Cargar Guardias
                const { data: guardsData } = await GuardsService.getAll();
                if (guardsData) setGuards(guardsData);

                // 5. Cargar Administradores del Sistema (si es Super Admin)
                if (user.profile.role === 'Super Admin') {
                    const { data: adminsData } = await ConfigService.getSystemAdmins();
                    if (adminsData) setSystemAdmins(adminsData);
                }
            } catch (error) {
                console.error('Error loading initial data from Supabase:', error);
            }
        };

        loadInitialData();
    }, [user]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    // Notification State & Real-time Integration
    const {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll
    } = useNotifications();

    // Effect for Simulation (Testing)
    useEffect(() => {
        const handleSimSOS = () => {
            addNotification({
                id: `test-${Date.now()}`,
                type: 'SOS',
                priority: 'critical',
                title: '🚨 SIMULACRO SOS ACTIVADO',
                message: 'El sistema ha detectado una emergencia de prueba en Torre Costanera.',
                created_at: new Date().toISOString(),
                read: false,
                guard_name: 'Simulador IA',
                installation_name: 'Torre Costanera'
            });
        };
        window.addEventListener('simulate-sos', handleSimSOS);
        return () => window.removeEventListener('simulate-sos', handleSimSOS);
    }, [addNotification]);

    // Use refs for real-time handlers to avoid stale closures
    const installationsRef = useRef(installations);
    const guardsRef = useRef(guards);

    useEffect(() => {
        installationsRef.current = installations;
    }, [installations]);

    useEffect(() => {
        guardsRef.current = guards;
    }, [guards]);

    // Effect for Critical Alerts (Real-time SOS from DB)
    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel('global-alerts')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'alerts', // now listening to 'alerts' table
                filter: 'type=eq.SOS'
            }, async (payload) => {
                const newSOS = payload.new;
                if (!newSOS) return;

                let guardName = newSOS.guard_name;
                let phone = newSOS.guard_phone;
                let resolvedInstallationName = '';

                // Lookup missing data if needed
                if (!guardName && newSOS.guard_id) {
                    const { data: g } = await supabase.from('guards').select('fullName, phone').eq('id', newSOS.guard_id).single();
                    if (g) {
                        guardName = (g as any).fullName;
                        if (!phone) phone = (g as any).phone;
                    } else {
                        const { data: p } = await (supabase as any).from('profiles').select('full_name, phone').eq('id', newSOS.guard_id).single();
                        if (p) {
                            guardName = (p as any).full_name;
                            if (!phone) phone = (p as any).phone;
                        }
                    }
                }
                
                // Resolve installation name from the current installations list
                if (newSOS.installation_id) {
                    const inst = installationsRef.current.find(i => String(i.id) === String(newSOS.installation_id));
                    if (inst) resolvedInstallationName = inst.name;
                }

                if (!resolvedInstallationName) {
                    resolvedInstallationName = newSOS.location || 'Ubicación GPS';
                }

                addNotification({
                    id: newSOS.id,
                    type: 'SOS',
                    priority: 'critical',
                    title: '🚨 ALERTA SOS REAL',
                    message: `Emergencia detectada: Guardia ${guardName || 'Desconocido'} en ${resolvedInstallationName}. Teléfono: ${phone || 'N/A'}`,
                    created_at: newSOS.alert_time || newSOS.created_at || new Date().toISOString(),
                    read: false,
                    guard_name: guardName || 'Guardia',
                    installation_name: resolvedInstallationName
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [addNotification]);

    useEffect(() => {
        const lastNotification = notifications[0];
        if (lastNotification && !lastNotification.read && lastNotification.priority === 'critical') {
            console.log(`[EMAIL SIMULATION] Enviando alerta crítica a gerencia: ${lastNotification.title} - ${lastNotification.message}`);
        }
    }, [notifications]);

    // Mostrar loading mientras se verifica la sesión
    if (loading) {
        return (
            <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-full`}>
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0f172a]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Mostrar login si no hay usuario autenticado
    if (!user) {
        return <LoginPage onLoginSuccess={() => { }} theme={theme} />;
    }

    // Aplicación principal (usuario autenticado)
    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} h-full w-full`}>
            <div className="flex h-screen bg-gray-50 dark:bg-[#0b1121] overflow-hidden text-gray-900 dark:text-white transition-colors duration-300">

                {/* Sidebar */}
                <div className="w-72 flex-shrink-0 h-full hidden md:block">
                    <Sidebar
                        currentView={currentView}
                        onChangeView={setCurrentView}
                        userRole={user.profile.role as any}
                        onLogout={logout}
                        theme={theme}
                        toggleTheme={toggleTheme}
                        logo={logo}
                        primaryColor={theme === 'dark' ? darkPrimaryColor : lightPrimaryColor}
                    />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Top Bar */}
                    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur flex items-center justify-between px-6 shrink-0 z-30 shadow-sm dark:shadow-md transition-colors duration-300">
                        {/* Left Spacer */}
                        <div className="w-20"></div>

                        {/* Company Name */}
                        <h1 className="text-xl font-black tracking-widest text-[#ff6b00] dark:text-[#ff8533] uppercase text-center truncate px-4 drop-shadow-sm">
                            {companyName}
                        </h1>

                        {/* Right Side: Notifications */}
                        <div className="flex items-center gap-4 w-20 justify-end">
                            <NotificationCenter
                                notifications={notifications}
                                onMarkAsRead={markAsRead}
                                onMarkAllAsRead={markAllAsRead}
                                onClearAll={clearAll}
                            />
                        </div>
                    </header>

                    {/* Content Body */}
                    <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                        {/* Background ambient glow */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                            <div
                                className="absolute top-10 left-10 w-96 h-96 rounded-full blur-[128px] transition-colors duration-700"
                                style={{ backgroundColor: `${theme === 'dark' ? darkPrimaryColor : lightPrimaryColor}1A` }} // ~10% opacity
                            ></div>
                            <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]"></div>
                        </div>

                        <div className="relative min-h-full p-1">
                            <ErrorBoundary name="Contenido Principal">
                                 {currentView === 'dashboard' && (
                                    <Dashboard
                                        apiKey={import.meta.env.VITE_GEMINI_API_KEY}
                                        guards={guards}
                                        supervisors={supervisors}
                                        installations={installations}
                                    />
                                )}

                                {currentView === 'avisos' && (
                                    <NoticesManager />
                                )}

                                {currentView === 'map' && (
                                    <ErrorBoundary name="Mapa Interactivo">
                                        <InteractiveMap
                                            apiKey={googleMapsKey}
                                            guards={guards}
                                            installations={installations}
                                            theme={theme}
                                        />
                                    </ErrorBoundary>
                                )}

                                {currentView === 'compliance' && (
                                    <ComplianceDashboard
                                        guards={guards}
                                        installations={installations}
                                        googleMapsKey={googleMapsKey}
                                    />
                                )}

                                {currentView === 'checkpoints' && (
                                    <CheckpointManager
                                        installations={installations}
                                    />
                                )}

                                {currentView === 'routes' && (
                                    <RouteManager
                                        installations={installations}
                                    />
                                )}

                                {currentView === 'guards' && (
                                    <GuardsManager
                                        guards={guards}
                                        setGuards={setGuards}
                                        installations={installations}
                                    />
                                )}

                                {currentView === 'installations' && (
                                    <InstallationsManager
                                        installations={installations}
                                        setInstallations={setInstallations}
                                        googleMapsKey={googleMapsKey}
                                        theme={theme}
                                    />
                                )}

                                {currentView === 'markings' && (
                                    <LogsViewer type="ALL" guards={guards} installations={installations} />
                                )}

                                {currentView === 'shifts' && (
                                    <ShiftsManager guards={guards} installations={installations} />
                                )}

                                {currentView === 'incidents' && (
                                    <LogsViewer type="INCIDENT" guards={guards} installations={installations} />
                                )}

                                {currentView === 'sos' && (
                                    <LogsViewer type="SOS" guards={guards} installations={installations} />
                                )}

                                {currentView === 'settings' && (
                                    <SuperAdminSettings
                                        logo={logo}
                                        setLogo={setLogo}
                                        companyName={companyName}
                                        setCompanyName={setCompanyName}
                                        googleMapsKey={googleMapsKey}
                                        setGoogleMapsKey={setGoogleMapsKey}
                                        supabaseUrl={supabaseUrl}
                                        setSupabaseUrl={setSupabaseUrl}
                                        supabaseKey={supabaseKey}
                                        setSupabaseKey={setSupabaseKey}
                                        systemAdmins={systemAdmins}
                                        setSystemAdmins={setSystemAdmins}
                                        lightPrimaryColor={lightPrimaryColor}
                                        setLightPrimaryColor={setLightPrimaryColor}
                                        darkPrimaryColor={darkPrimaryColor}
                                        setDarkPrimaryColor={setDarkPrimaryColor}
                                    />
                                )}

                                {currentView === 'reports' && (
                                    <ReportsManager installations={installations} />
                                )}

                                {currentView === 'supervisors' && (
                                    <SupervisorsManager
                                        supervisors={supervisors}
                                        setSupervisors={setSupervisors}
                                        installations={installations}
                                    />
                                )}

                                {/* Vista de Usuarios (Solo Super Admin) */}
                                {currentView === 'users' && user.profile.role === 'Super Admin' && (
                                    <UsersManager 
                                        users={systemAdmins} 
                                        setUsers={setSystemAdmins}
                                        installations={installations}
                                    />
                                )}
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

/**
 * App principal con AuthProvider
 */
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
