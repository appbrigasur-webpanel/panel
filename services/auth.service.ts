import { supabase, supabaseNoSession, handleSupabaseError } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Tipos para autenticación
 */
export interface UserProfile {
    id: string;
    full_name: string;
    role: 'Super Admin' | 'Admin' | 'Supervisor' | 'Guard';
    phone?: string;
    avatar_url?: string;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    updated_at: string;
}

export interface AuthUser {
    user: User;
    profile: UserProfile;
    permissions: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name: string;
    role: 'Super Admin' | 'Admin' | 'Supervisor' | 'Guard';
    phone?: string;
}

/**
 * Servicio de Autenticación con Supabase Auth
 */
export class AuthService {
    static async login(credentials: LoginCredentials): Promise<{
        data: AuthUser | null;
        error: string | null;
    }> {
        try {
            // 1. Intentar con email en minúsculas para la tabla local
            const normalizedEmail = credentials.email.toLowerCase().trim();

            const { data: admin, error: adminError } = await (supabase
                .from('system_admins')
                .select('*')
                .ilike('email', normalizedEmail)
                .eq('password', credentials.password)
                .maybeSingle() as any);

            if (admin) {
                const profile: UserProfile = {
                    id: admin.id,
                    full_name: admin.email.split('@')[0].toUpperCase(),
                    role: admin.role,
                    is_active: true,
                    created_at: admin.created_at,
                    updated_at: admin.updated_at
                };

                const authUser: AuthUser = {
                    user: { id: admin.id, email: admin.email } as any,
                    profile,
                    permissions: ['all']
                };

                localStorage.setItem('briga_sys_admin', JSON.stringify(authUser));
                return { data: authUser, error: null };
            }

            // 2. Si no es admin de BrigaSur, intentar Supabase Auth estándar (Guardias)
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: credentials.password,
            });

            if (authError) {
                return { data: null, error: 'Usuario o contraseña no encontrados en el sistema BrigaSur' };
            }

            if (!authData.user) {
                return { data: null, error: 'Error inesperado al recuperar sesión de usuario' };
            }

            // 3. Obtener perfil del usuario normal
            const { data: profile, error: profileError } = await (supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .single() as any);

            if (profileError || !profile) {
                return { data: null, error: 'Perfil de usuario no encontrado en la base de datos' };
            }

            if (!profile.is_active) {
                await this.logout();
                return { data: null, error: 'Acceso denegado: Su cuenta está inactiva.' };
            }

            const { data: permissionsData } = await (supabase.rpc('get_user_permissions', {
                user_id: authData.user.id,
            }) as any);

            const permissions = Array.isArray(permissionsData)
                ? permissionsData.map((p: any) => p.permission_code || p)
                : [];

            return {
                data: {
                    user: authData.user,
                    profile,
                    permissions,
                },
                error: null,
            };
        } catch (error: any) {
            console.error('🔥 Error crítico en Login:', error);
            return { data: null, error: `Error del sistema: ${error.message || 'Error desconocido'}` };
        }
    }

    /**
     * Registrar nuevo usuario (solo Super Admin)
     */
    static async register(data: RegisterData): Promise<{
        data: User | null;
        error: string | null;
    }> {
        try {
            // 1. Crear usuario en Supabase Auth usando el cliente sin sesión
            const { data: authData, error: authError } = await supabaseNoSession.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        full_name: data.full_name,
                        role: data.role,
                        phone: data.phone,
                    },
                },
            });

            if (authError) {
                return { data: null, error: this.getAuthErrorMessage(authError.message) };
            }

            if (!authData.user) {
                return { data: null, error: 'Error al crear usuario' };
            }

            return { data: authData.user, error: null };
        } catch (error) {
            console.error('Register error:', error);
            return { data: null, error: 'Error al registrar usuario' };
        }
    }

    /**
     * Cerrar sesión
     */
    static async logout(): Promise<{ error: string | null }> {
        try {
            localStorage.removeItem('briga_sys_admin');
            const { error } = await supabase.auth.signOut();

            if (error) {
                return { error: handleSupabaseError(error) };
            }

            return { error: null };
        } catch (error) {
            console.error('Logout error:', error);
            return { error: 'Error al cerrar sesión' };
        }
    }

    /**
     * Obtener sesión actual
     */
    static async getSession(): Promise<{
        data: Session | null;
        error: string | null;
    }> {
        try {
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data: data.session, error: null };
        } catch (error) {
            console.error('Get session error:', error);
            return { data: null, error: 'Error al obtener sesión' };
        }
    }

    /**
     * Obtener usuario actual con perfil y permisos
     */
    static async getCurrentUser(): Promise<{
        data: AuthUser | null;
        error: string | null;
    }> {
        try {
            // 0. Revisar si hay sesión de System Admin en localStorage
            const savedAdmin = localStorage.getItem('briga_sys_admin');
            if (savedAdmin) {
                return { data: JSON.parse(savedAdmin), error: null };
            }

            // 1. Obtener usuario autenticado
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                return { data: null, error: 'No hay sesión activa' };
            }

            // 2. Obtener perfil
            const { data: profile, error: profileError } = await (supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single() as any);

            if (profileError || !profile) {
                return { data: null, error: 'Error al obtener perfil' };
            }

            // 3. Obtener permisos
            const { data: permissionsData } = await (supabase.rpc('get_user_permissions', {
                user_id: user.id,
            }) as any);

            const permissions = Array.isArray(permissionsData)
                ? permissionsData.map((p: any) => p.permission_code || p)
                : [];

            return {
                data: {
                    user,
                    profile,
                    permissions,
                },
                error: null,
            };
        } catch (error) {
            console.error('Get current user error:', error);
            return { data: null, error: 'Error al obtener usuario actual' };
        }
    }

    /**
     * Solicitar recuperación de contraseña
     */
    static async resetPassword(email: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                return { error: this.getAuthErrorMessage(error.message) };
            }

            return { error: null };
        } catch (error) {
            console.error('Reset password error:', error);
            return { error: 'Error al solicitar recuperación de contraseña' };
        }
    }

    /**
     * Actualizar contraseña
     */
    static async updatePassword(newPassword: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                return { error: this.getAuthErrorMessage(error.message) };
            }

            return { error: null };
        } catch (error) {
            console.error('Update password error:', error);
            return { error: 'Error al actualizar contraseña' };
        }
    }

    /**
     * Actualizar perfil de usuario
     */
    static async updateProfile(
        userId: string,
        updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>>
    ): Promise<{ data: UserProfile | null; error: string | null }> {
        try {
            const { data, error } = await (supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single() as any);

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Update profile error:', error);
            return { data: null, error: 'Error al actualizar perfil' };
        }
    }

    /**
     * Verificar si el usuario tiene un permiso específico
     */
    static async hasPermission(userId: string, permission: string): Promise<boolean> {
        try {
            const { data } = await supabase.rpc('has_permission', {
                user_id: userId,
                permission,
            });

            return data === true;
        } catch (error) {
            console.error('Has permission error:', error);
            return false;
        }
    }

    /**
     * Obtener todos los permisos del usuario
     */
    static async getUserPermissions(userId: string): Promise<string[]> {
        try {
            const { data } = await (supabase.rpc('get_user_permissions', {
                user_id: userId,
            }) as any);

            return Array.isArray(data)
                ? data.map((p: any) => p.permission_code || p)
                : [];
        } catch (error) {
            console.error('Get user permissions error:', error);
            return [];
        }
    }

    /**
     * Suscribirse a cambios de autenticación
     */
    static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }

    /**
     * Mensajes de error amigables
     */
    private static getAuthErrorMessage(error: string): string {
        const errorMessages: Record<string, string> = {
            'Invalid login credentials': 'Email o contraseña incorrectos',
            'Email not confirmed': 'Email no confirmado. Revisa tu bandeja de entrada.',
            'User already registered': 'Este email ya está registrado',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
            'Unable to validate email address': 'Email inválido',
            'Email rate limit exceeded': 'Demasiados intentos. Intenta más tarde.',
        };

        return errorMessages[error] || error;
    }

    /**
     * Validar formato de email
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validar fortaleza de contraseña
     */
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Debe tener al menos 8 caracteres');
        }

        if (!/[A-Z]/.test(password)) {
            errors.push('Debe contener al menos una mayúscula');
        }

        if (!/[a-z]/.test(password)) {
            errors.push('Debe contener al menos una minúscula');
        }

        if (!/[0-9]/.test(password)) {
            errors.push('Debe contener al menos un número');
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Debe contener al menos un carácter especial');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
