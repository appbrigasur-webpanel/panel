import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, AlertCircle, Eye, EyeOff, Loader } from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
    onLoginSuccess: () => void;
    theme: 'dark' | 'light';
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, theme }) => {
    const { login: authLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (!email || !password) {
            setError('Por favor complete todos los campos');
            return;
        }

        if (!AuthService.isValidEmail(email)) {
            setError('Email inválido');
            return;
        }

        setLoading(true);

        try {
            const { error: loginError } = await authLogin(email, password);

            if (loginError) {
                setError(loginError);
                return;
            }

            onLoginSuccess();
        } catch (err) {
            setError('Error al iniciar sesión. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResetSuccess(false);

        if (!resetEmail) {
            setError('Por favor ingrese su email');
            return;
        }

        if (!AuthService.isValidEmail(resetEmail)) {
            setError('Email inválido');
            return;
        }

        setLoading(true);

        try {
            const { error: resetError } = await AuthService.resetPassword(resetEmail);

            if (resetError) {
                setError(resetError);
                return;
            }

            setResetSuccess(true);
            setTimeout(() => {
                setShowForgotPassword(false);
                setResetSuccess(false);
                setResetEmail('');
            }, 3000);
        } catch (err) {
            setError('Error al enviar email de recuperación');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAccess = (role: 'admin' | 'super') => {
        const credentials = {
            admin: { email: 'admin@brigasur.com', password: 'Admin123!' },
            super: { email: 'super@brigasur.com', password: 'Super123!' },
        };

        setEmail(credentials[role].email);
        setPassword(credentials[role].password);
    };

    if (showForgotPassword) {
        return (
            <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-full`}>
                <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0f172a] relative overflow-hidden transition-colors duration-300">
                    {/* Background Effects */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px]"></div>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl w-full max-w-md z-10 border-t border-white/10 shadow-2xl relative">
                        <div className="flex justify-center mb-6">
                            <img
                                src="/logo_brigasur.png"
                                alt="Brigasur Logo"
                                className="h-20 w-auto object-contain dark:invert-[0.1] dark:brightness-110"
                            />
                        </div>

                        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2 tracking-tight">
                            Recuperar Contraseña
                        </h2>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-8 text-sm">
                            Ingresa tu email para recibir instrucciones
                        </p>

                        {resetSuccess ? (
                            <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 p-4 rounded-lg mb-6 text-center">
                                <p className="font-semibold">✅ Email enviado</p>
                                <p className="text-sm mt-1">Revisa tu bandeja de entrada</p>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword} className="space-y-6">
                                <div>
                                    <label className="text-xs uppercase text-gray-500 font-semibold ml-1">
                                        Email
                                    </label>
                                    <div className="relative mt-1">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="tu@email.com"
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white p-3 pl-11 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Instrucciones'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        setError('');
                                        setResetEmail('');
                                    }}
                                    className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                                >
                                    ← Volver al login
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${theme === 'dark' ? 'dark' : ''} h-screen w-full`}>
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#0f172a] relative overflow-hidden transition-colors duration-300 p-4">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-600/20 rounded-full blur-[100px]"></div>
                </div>

                {/* Main Card */}
                <div className="w-full max-w-5xl z-10 relative">
                    <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border-2 border-[#f15a09] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl flex flex-col md:flex-row">

                        {/* Left Column: Branding */}
                        <div className="md:w-1/2 p-12 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/20">
                            <div className="mb-8 p-4">
                                <img
                                    src="/logo_brigasur.png"
                                    alt="Brigasur Logo"
                                    className="h-32 w-auto object-contain"
                                />
                            </div>

                            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">
                                Bienvenido
                            </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                                Panel de Gestión Brigasur
                            </p>
                            <div className="mt-8 flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-[#f15a09]"></div>
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                            </div>
                        </div>

                        {/* Right Column: Form */}
                        <div className="md:w-1/2 p-12 bg-white/40 dark:bg-gray-900/40 flex flex-col justify-center">
                            <form onSubmit={handleLogin} className="space-y-6 max-w-sm mx-auto w-full">

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-2 ml-1">
                                        Email Corporativo
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="usuario@brigasur.server"
                                            className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold mb-2 ml-1">
                                        Contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            className="block w-full pl-11 pr-11 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#1b4ed8] hover:bg-[#1e40af] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Verificando Credenciales...
                                            </>
                                        ) : (
                                            'Ingresar al Sistema'
                                        )}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
