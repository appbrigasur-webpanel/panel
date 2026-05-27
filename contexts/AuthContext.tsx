import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService, type AuthUser } from '../services/auth.service';
import type { Session } from '@supabase/supabase-js';

/**
 * Contexto de Autenticación
 */
interface AuthContextType {
    user: AuthUser | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    isRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de Autenticación
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Cargar usuario al montar el componente
    useEffect(() => {
        loadUser();

        // Suscribirse a cambios de autenticación
        const { data: { subscription } } = AuthService.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                setSession(session);

                if (event === 'SIGNED_IN' && session) {
                    await loadUser();
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setSession(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    /**
     * Cargar usuario actual
     */
    const loadUser = async () => {
        try {
            setLoading(true);

            // 1. Primero intentar cargar usuario (esto ya maneja sys_admin de localStorage)
            const { data: userData, error } = await AuthService.getCurrentUser();

            if (userData) {
                setUser(userData);
                // Si es un usuario normal de Supabase, cargar su sesión también
                const { data: sessionData } = await AuthService.getSession();
                setSession(sessionData);
                return;
            }

            // 2. Si no hay usuario, limpiar todo
            setUser(null);
            setSession(null);
        } catch (error) {
            console.error('Error in loadUser:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Iniciar sesión
     */
    const login = async (email: string, password: string) => {
        try {
            setLoading(true);

            const { data, error } = await AuthService.login({ email, password });

            if (error) {
                return { error };
            }

            if (data) {
                setUser(data);
                setSession(await AuthService.getSession().then(r => r.data));
            }

            return { error: null };
        } catch (error) {
            console.error('Login error:', error);
            return { error: 'Error al iniciar sesión' };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Cerrar sesión
     */
    const logout = async () => {
        try {
            setLoading(true);
            await AuthService.logout();
            setUser(null);
            setSession(null);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Verificar si el usuario tiene un permiso
     */
    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        return user.permissions.includes(permission);
    };

    /**
     * Verificar si el usuario tiene un rol específico
     */
    const isRole = (role: string): boolean => {
        if (!user) return false;
        return user.profile.role === role;
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        login,
        logout,
        hasPermission,
        isRole,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useRequireAuth = () => {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            // Redirigir al login si no está autenticado
            console.warn('User not authenticated');
        }
    }, [user, loading]);

    return { user, loading };
};

/**
 * Hook para verificar permisos
 */
export const usePermission = (permission: string) => {
    const { hasPermission } = useAuth();
    return hasPermission(permission);
};

/**
 * Hook para verificar rol
 */
export const useRole = (role: string) => {
    const { isRole } = useAuth();
    return isRole(role);
};
