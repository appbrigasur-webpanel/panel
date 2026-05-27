import { supabase, handleSupabaseError } from '../lib/supabase';

export interface AppConfig {
    id: number;
    companyName: string;
    lightPrimaryColor: string;
    darkPrimaryColor: string;
    logo: string | null;
    googleMapsKey: string | null;
    supabaseUrl: string | null;
    supabaseKey: string | null;
    updated_at: string;
}

/**
 * Servicio para gestionar la configuración global de la aplicación
 */
export class ConfigService {
    /**
     * Obtener la configuración actual (siempre id=1)
     */
    static async getConfig(): Promise<{ data: AppConfig | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('*')
                .eq('id', 1)
                .single();

            if (error) {
                // Si no existe, intentar crear la configuración por defecto
                if (error.code === 'PGRST116') {
                    return await this.createDefaultConfig();
                }
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching config:', error);
            return { data: null, error: 'Error al obtener configuración' };
        }
    }

    /**
     * Crear configuración por defecto
     */
    private static async createDefaultConfig(): Promise<{ data: AppConfig | null; error: string | null }> {
        const defaultConfig = {
            id: 1,
            companyName: 'BRIGASUR',
            lightPrimaryColor: '#f97316',
            darkPrimaryColor: '#fb923c',
            logo: null,
            googleMapsKey: null,
            supabaseUrl: null,
            supabaseKey: null
        };

        const { data, error } = await supabase
            .from('app_config')
            .upsert(defaultConfig)
            .select()
            .single();

        if (error) {
            return { data: null, error: handleSupabaseError(error) };
        }

        return { data, error: null };
    }

    /**
     * Actualizar configuración
     */
    static async updateConfig(updates: Partial<Omit<AppConfig, 'id' | 'updated_at'>>): Promise<{ data: AppConfig | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .upsert({
                    id: 1,
                    ...updates,
                    updated_at: new Date().toISOString()
                } as any)
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error updating config:', error);
            return { data: null, error: 'Error al actualizar configuración' };
        }
    }

    /**
     * Obtener administradores del sistema
     */
    static async getSystemAdmins(): Promise<{ data: any[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('system_admins')
                .select('*')
                .order('email', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching system admins:', error);
            return { data: null, error: 'Error al obtener administradores' };
        }
    }

    /**
     * Guardar administrador del sistema
     */
    static async saveSystemAdmin(admin: { id?: string; email: string; password?: string; role: string }): Promise<{ data: any | null; error: string | null }> {
        try {
            if (admin.id && !admin.id.startsWith('new-')) {
                // Update
                const { data, error } = await supabase
                    .from('system_admins')
                    .update({
                        email: admin.email,
                        password: admin.password,
                        role: admin.role as any, // Cast to avoid TS enum error
                        updated_at: new Date().toISOString()
                    } as any)
                    .eq('id', admin.id)
                    .select()
                    .single();

                if (error) return { data: null, error: handleSupabaseError(error) };
                return { data, error: null };
            } else {
                // Create
                const { data, error } = await supabase
                    .from('system_admins')
                    .insert({
                        email: admin.email,
                        password: admin.password,
                        role: admin.role as any // Cast to avoid TS enum error
                    } as any)
                    .select()
                    .single();

                if (error) return { data: null, error: handleSupabaseError(error) };
                return { data, error: null };
            }
        } catch (error) {
            console.error('Error saving system admin:', error);
            return { data: null, error: 'Error al guardar administrador' };
        }
    }

    /**
     * Eliminar administrador del sistema
     */
    static async deleteSystemAdmin(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('system_admins')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: handleSupabaseError(error) };
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting system admin:', error);
            return { success: false, error: 'Error al eliminar administrador' };
        }
    }
}
