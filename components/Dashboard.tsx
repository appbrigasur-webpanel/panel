
import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

import { supabase } from '../lib/supabase';
import {
  Shield, AlertTriangle, Building2, Siren, ScanLine, Nfc,
  MapPin, UserCog, TrendingUp, CheckCircle, Clock, Activity,
  AlertCircle, ArrowUpRight, ArrowDownRight, QrCode, Users
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Guard, Installation, LogEntry } from '../types';

interface DashboardProps {
  apiKey?: string;
  guards: Guard[];
  supervisors: Guard[];
  installations: Installation[];
}

const Dashboard: React.FC<DashboardProps> = ({ apiKey, guards, supervisors, installations }) => {
  const [aiAnalysis, setAiAnalysis] = React.useState<string | null>(null);
  const [loadingAi, setLoadingAi] = React.useState(false);
  const [realLogs, setRealLogs] = React.useState<LogEntry[]>([]);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent logs
        const { data: logsData } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500);

        // Fetch recent reports
        const { data: reportsData } = await (supabase as any)
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        // Map guards for fast lookup
        const guardMap = new Map<string, string>();
        guards.forEach(g => guardMap.set(g.id, g.fullName));

        const mappedLogs = (logsData || []).map(log => {
          const inst = installations.find(i => i.id === log.installation_id);
          return {
            id: log.id,
            type: log.type,
            guardId: log.guard_id,
            guardName: log.guard_name || guardMap.get(log.guard_id) || 'Guardia',
            installationId: log.installation_id,
            installationName: log.installation_name || inst?.name || 'Instalación',
            pointName: log.point_name || log.title,
            tagId: log.tag_id || '',
            title: log.title || log.type,
            detail: log.detail || '',
            photos: log.photos || [],
            timestamp: log.timestamp
          };
        });

        // Fetch recent alerts (SOS)
        const { data: alertsData } = await (supabase as any)
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(500);

        const mappedAlerts = (alertsData || []).map((a: any) => {
          return {
            id: a.id,
            type: a.type || 'SOS',
            guardId: a.guard_id,
            guardName: a.guard_name || guardMap.get(a.guard_id) || 'Guardia',
            installationId: '', 
            installationName: a.installation_name || a.location || 'Instalación',
            pointName: a.location || 'Alerta Móvil',
            tagId: '',
            title: a.details || '🚨 ALERTA SOS',
            detail: 'Alerta SOS generada desde la App Móvil.',
            photos: [],
            timestamp: a.alert_time || a.created_at
          };
        });

        const mappedReports = (reportsData || []).map((r: any) => {
          // mobile reports save installation name in 'installation'
          const instName = (r.installation || '').trim();
          const inst = installations.find(i => i.name.trim().toLowerCase() === instName.toLowerCase());
          
          let pointName = instName;
          let inferredType = r.type;
          const match = (r.description || '').match(/(?:NFC|QR):\s*(.+?)\s*\(([^)]+)\)\s*$/);
          if (match) {
            pointName = match[1].trim();
          }
          if ((r.description || '').includes('NFC:')) {
            inferredType = 'NFC';
          } else if ((r.description || '').includes('QR:')) {
            inferredType = 'QR';
          }

          return {
            id: r.id,
            type: inferredType,
            guardId: r.guard_id,
            guardName: guardMap.get(r.guard_id) || 'Guardia', // Simplificado para dashboard
            installationId: inst?.id || '',
            installationName: instName || 'Instalación',
            pointName,
            tagId: '',
            title: r.type,
            detail: r.description,
            photos: [],
            timestamp: r.created_at
          };
        });

        const combined = [...mappedLogs, ...mappedReports, ...mappedAlerts].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRealLogs(combined);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    };
    if (guards.length > 0 && installations.length > 0) {
      fetchDashboardData();
    }
  }, [guards, installations]);

  // --- Data Processing & Metrics ---

  const metrics = useMemo(() => {
    const totalGuards = guards.length;
    const activeGuards = guards.filter(g => g.isActive).length;
    const totalSupervisors = supervisors.length;
    const activeSupervisors = supervisors.filter(s => s.isActive).length;

    const incidents = realLogs.filter(l => l.type === 'INCIDENT' || (l.type || '').toUpperCase().includes('INCIDENT'));
    const sosAlerts = realLogs.filter(l => l.type === 'SOS');
    const qrScans = realLogs.filter(l => l.type === 'QR');
    const nfcScans = realLogs.filter(l => l.type === 'NFC');

    // Calculate Operational Compliance
    // (Actual Scans / Required Scans)
    const totalRequiredScans = installations.reduce((acc, inst) => acc + (inst.requiredDailyScans || 20), 0);
    const actualScansToday = qrScans.length + nfcScans.length; // Simplified for demo
    const complianceRate = Math.min(100, Math.round((actualScansToday / (totalRequiredScans || 1)) * 100));

    return {
      totalGuards, activeGuards,
      totalSupervisors, activeSupervisors,
      totalInstallations: installations.length,
      totalIncidents: incidents.length,
      totalSOS: sosAlerts.length,
      totalQR: qrScans.length,
      totalNFC: nfcScans.length,
      complianceRate,
      activeAlerts: sosAlerts.length + incidents.filter(i => !i.detail?.includes('Cerrado')).length
    };
  }, [guards, supervisors, installations, realLogs]);

  // Chart Data: Compliance by Installation
  const installationStats = useMemo(() => {
    return installations.map(inst => {
      const scans = realLogs.filter(l => l.installationId === inst.id && (l.type === 'QR' || l.type === 'NFC')).length;
      const required = inst.requiredDailyScans || 20;
      const compliance = Math.min(100, Math.round((scans / required) * 100));
      return {
        name: inst.name,
        compliance,
        scans,
        required
      };
    });
  }, [installations, realLogs]);

  // Chart Data: Weekly Trends (calculated from real logs)
  const trendData = useMemo(() => {
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      return {
        date: d.toISOString().split('T')[0],
        dayName: days[d.getDay()],
        scans: 0,
        incidents: 0,
        compliance: 0
      };
    });

    last7Days.forEach(day => {
      const dayLogs = realLogs.filter(l => l.timestamp.startsWith(day.date));
      day.scans = dayLogs.filter(l => l.type === 'QR' || l.type === 'NFC').length;
      day.incidents = dayLogs.filter(l => l.type === 'INCIDENT' || l.type === 'SOS').length;
      
      const totalRequired = installations.reduce((acc, inst) => acc + (inst.requiredDailyScans || 20), 0);
      day.compliance = Math.min(100, Math.round((day.scans / (totalRequired || 1)) * 100));
    });

    return last7Days.map(d => ({
      name: d.dayName,
      scans: d.scans,
      incidents: d.incidents,
      compliance: d.compliance
    }));
  }, [realLogs, installations]);

  // Intelligent Alerts Logic
  const intelligentAlerts = useMemo(() => {
    const alerts = [];

    // Check for low compliance
    installationStats.forEach(inst => {
      if (inst.compliance < 70) {
        alerts.push({
          id: `low-comp-${inst.name}`,
          type: 'warning',
          title: 'Bajo Cumplimiento',
          message: `${inst.name} tiene un ${inst.compliance}% de cumplimiento hoy.`,
          icon: AlertTriangle,
          color: 'text-orange-500'
        });
      }
    });

    // SOS check
    if (metrics.totalSOS > 0) {
      alerts.push({
        id: 'active-sos',
        type: 'danger',
        title: 'SOS Activo',
        message: 'Hay alertas SOS que requieren atención inmediata.',
        icon: Siren,
        color: 'text-red-500'
      });
    }

    return alerts;
  }, [installationStats, metrics.totalSOS]);

  const handleAiAnalysis = async () => {
    const key = apiKey || process.env.API_KEY || (window as any).GEMINI_API_KEY;
    if (!key) {
      setAiAnalysis("API Key no configurada.");
      return;
    }
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `Actúa como un experto en seguridad operacional de Tentación Food Store. Analiza estos KPIs y dame un reporte de riesgos y tendencias proyectadas:
      - Cumplimiento Operativo General: ${metrics.complianceRate}%
      - Alertas Críticas: ${metrics.totalSOS} SOS y ${metrics.totalIncidents} Incidentes.
      - Dotación: ${metrics.activeGuards}/${metrics.totalGuards} Guardias activos.
      - Detalle por Instalación: ${JSON.stringify(installationStats)}
      Proporciona un resumen ejecutivo de 2 párrafos con 3 puntos clave de acción y una conclusión sobre la seguridad global.`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      setAiAnalysis((response as any).text || "Análisis completado. Por favor, revise los KPIs en pantalla.");
    } catch (error) {
      console.error(error);
      setAiAnalysis("Error al conectar con la IA de Google. Verifique su API Key en la configuración.");
    } finally {
      setLoadingAi(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <div className="flex flex-col h-full w-full gap-6 p-6 overflow-hidden bg-gray-50/50 dark:bg-transparent">

      {/* --- HEADER: TOP KPIs --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* Instalaciones */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-blue-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">INSTALACIONES</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalInstallations}</h3>
            </div>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <Building2 size={60} />
          </div>
        </div>

        {/* Guardias */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-purple-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">GUARDIAS</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{metrics.activeGuards}/{metrics.totalGuards}</h3>
            </div>
            <div className="bg-purple-500/10 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <Users size={60} />
          </div>
        </div>

        {/* Alertas SOS */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-red-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">ALERTAS SOS</p>
              <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{metrics.totalSOS}</h3>
            </div>
            <div className="bg-red-500/10 p-2 rounded-lg">
              <Siren className={`w-5 h-5 text-red-500 ${metrics.totalSOS > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <AlertCircle size={60} />
          </div>
        </div>

        {/* Incidencias */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-orange-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">INCIDENCIAS</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalIncidents}</h3>
            </div>
            <div className="bg-orange-500/10 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <AlertTriangle size={60} />
          </div>
        </div>

        {/* Marcaciones QR */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-emerald-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">PUNTOS QR</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalQR}</h3>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <QrCode className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <ScanLine size={60} />
          </div>
        </div>

        {/* Marcaciones NFC */}
        <div className="glass-panel p-4 rounded-2xl border-b-4 border-indigo-500 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">PUNTOS NFC</p>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white">{metrics.totalNFC}</h3>
            </div>
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              <Nfc className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
            <TrendingUp size={60} />
          </div>
        </div>
      </div>

      {/* --- MAIN DASHBOARD CONTENT --- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">

        {/* Left Col: Charts (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

          {/* Trend Chart */}
          <div className="glass-panel p-6 rounded-2xl min-h-[300px] flex flex-col shadow-lg border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Tendencia de Seguridad</h3>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">Comparativa semanal de marcajes e incidentes</p>
              </div>
            </div>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" vertical={false} className="opacity-10" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', backdropFilter: 'blur(4px)', borderColor: '#4b5563', color: '#fff', fontSize: '12px', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="scans" name="Escaneos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                  <Area type="monotone" dataKey="compliance" name="Cumplimiento %" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compliance by Installation */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-lg border border-white/10">
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Desempeño por Instalación</h3>
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={installationStats} 
                    layout="vertical"
                    margin={{ left: 10, right: 10 }}
                  >
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke="#9ca3af" 
                      fontSize={13} 
                      width={150}
                      tick={{ fill: '#9ca3af', fontWeight: 600 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }} 
                      contentStyle={{ 
                        backgroundColor: 'rgba(31, 41, 55, 0.95)', 
                        borderColor: '#3b82f6', 
                        borderRadius: '8px',
                        fontSize: '11px' 
                      }}
                    />
                    <Bar dataKey="compliance" radius={[0, 6, 6, 0]} barSize={32}>
                      {installationStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.compliance < 80 ? '#ef4444' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col shadow-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black text-purple-600 dark:text-purple-300 flex items-center gap-2 uppercase tracking-tight">
                  ✨ Análisis de Tendencias IA
                </h3>
                <button
                  onClick={handleAiAnalysis}
                  disabled={loadingAi}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {loadingAi ? 'Procesando...' : 'Actualizar'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto text-xs text-gray-600 dark:text-gray-300 leading-normal custom-scrollbar">
                {aiAnalysis ? (
                  <div className="prose prose-xs dark:prose-invert">
                    {aiAnalysis.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <TrendingUp size={24} className="mb-2" />
                    Genera un análisis predictivo basado en los datos de la semana.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Intelligent Alerts & Real-time (1/3) */}
        <div className="flex flex-col gap-6">

          {/* Alertas Inteligentes */}
          <div className="glass-panel p-6 rounded-2xl shadow-lg border border-white/10 flex flex-col h-full">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle size={20} className="text-orange-500" /> Alertas Inteligentes
            </h3>
            <div className="flex flex-col gap-3 h-full overflow-y-auto">
              {intelligentAlerts.length > 0 ? intelligentAlerts.map(alert => (
                <div key={alert.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 flex gap-3 group hover:border-orange-500/50 transition-colors">
                  <div className={`mt-0.5 ${alert.color}`}>
                    <alert.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-tight">{alert.title}</h4>
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400 mt-1 leading-normal">{alert.message}</p>
                    <button className="mt-2 text-[10px] font-black text-blue-500 dark:text-blue-400 hover:underline hover:text-blue-600 transition-colors uppercase tracking-widest">VER DETALLE</button>
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-40">
                  <CheckCircle size={32} className="text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">Todo bajo control</p>
                  <p className="text-[10px]">No se detectan anomalías operativas</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Real-time Log Feed */}
          <div className="glass-panel p-6 rounded-2xl shadow-lg border border-white/10 flex flex-col max-h-[300px]">
            <h3 className="text-base font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              Monitor de Actividad
            </h3>
            <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
              {realLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex gap-3 items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${log.type === 'SOS' ? 'bg-red-500/20 text-red-500' :
                    log.type === 'INCIDENT' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                    {log.type === 'SOS' ? <Siren size={16} /> :
                      log.type === 'INCIDENT' ? <AlertTriangle size={16} /> :
                        <ScanLine size={16} />}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex justify-between items-center gap-4">
                      <p className="text-base font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{log.guardName}</p>
                      <span className="text-xs text-gray-400 font-black bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 truncate mt-0.5 tracking-tight">{log.installationName} • {log.pointName || log.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
