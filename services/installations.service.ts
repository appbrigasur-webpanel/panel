import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Installation = Database['public']['Tables']['installations']['Row'];
type InstallationInsert = Database['public']['Tables']['installations']['Insert'];
type InstallationUpdate = Database['public']['Tables']['installations']['Update'];

/**
 * Servicio para gestionar instalaciones en Supabase
 */
export class InstallationsService {
    /**
     * Obtener todas las instalaciones
     */
    static async getAll(): Promise<{ data: any[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .rpc('get_installations_with_counts');

            if (error) throw error;

            const transformed = data?.map(inst => ({
                ...inst,
                checkpointType: inst.checkpoint_type || 'QR',
                requiredDailyScans: inst.required_daily_scans ?? 10,
                isActive: inst.is_active,
                markingsCount: Number(inst.logs_count || 0) + Number(inst.reports_count || 0) + Number(inst.alerts_count || 0)
            }));

            return { data: transformed, error: null };
        } catch (error) {
            console.error('Error fetching installations:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Obtener instalación por ID
     */
    static async getById(id: string): Promise<{ data: Installation | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching installation:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Crear nueva instalación
     */
    static async create(installation: InstallationInsert): Promise<{ data: Installation | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .insert(installation)
                .select()
                .single();

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error creating installation:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Actualizar instalación
     */
    static async update(id: string, updates: InstallationUpdate): Promise<{ data: Installation | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error updating installation:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Eliminar instalación
     */
    static async delete(id: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('installations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error deleting installation:', error);
            return { error: error as Error };
        }
    }

    /**
     * Buscar instalaciones por nombre o dirección
     */
    static async search(query: string): Promise<{ data: Installation[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .select('*')
                .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
                .order('name', { ascending: true });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error searching installations:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Obtener instalaciones activas
     */
    static async getActive(): Promise<{ data: Installation[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .select('*')
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching active installations:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Obtener instalaciones por tipo
     */
    static async getByType(type: string): Promise<{ data: Installation[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .select('*')
                .eq('type', type)
                .order('name', { ascending: true });

            if (error) throw error;

            return { data, error: null };
        } catch (error) {
            console.error('Error fetching installations by type:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Cambiar estado de instalación
     */
    static async updateStatus(id: string, status: 'active' | 'inactive' | 'maintenance'): Promise<{ data: Installation | null; error: Error | null }> {
        return this.update(id, { status });
    }

    /**
     * Obtener estadísticas de instalaciones
     */
    static async getStats(): Promise<{
        data: {
            total: number;
            active: number;
            inactive: number;
            maintenance: number;
            byType: Record<string, number>;
        } | null;
        error: Error | null
    }> {
        try {
            const { data: all, error: allError } = await this.getAll();
            if (allError) throw allError;

            const total = all?.length || 0;
            const active = all?.filter(i => i.status === 'active').length || 0;
            const inactive = all?.filter(i => i.status === 'inactive').length || 0;
            const maintenance = all?.filter(i => i.status === 'maintenance').length || 0;

            // Contar por tipo
            const byType: Record<string, number> = {};
            all?.forEach(installation => {
                const type = installation.type || 'Otro';
                byType[type] = (byType[type] || 0) + 1;
            });

            return {
                data: { total, active, inactive, maintenance, byType },
                error: null
            };
        } catch (error) {
            console.error('Error fetching installation stats:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Obtener instalaciones con guardias asignados
     */
    static async getWithGuards(): Promise<{
        data: (Installation & { guard_count: number })[] | null;
        error: Error | null
    }> {
        try {
            const { data, error } = await supabase
                .from('installations')
                .select(`
          *,
          guards:guards(count)
        `)
                .order('name', { ascending: true });

            if (error) throw error;

            // Transformar datos para incluir guard_count
            const transformed = data?.map(installation => ({
                ...installation,
                guard_count: installation.guards?.[0]?.count || 0
            }));

            return { data: transformed as any, error: null };
        } catch (error) {
            console.error('Error fetching installations with guards:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Actualizar coordenadas de instalación
     */
    static async updateCoordinates(
        id: string,
        latitude: number,
        longitude: number
    ): Promise<{ data: Installation | null; error: Error | null }> {
        return this.update(id, { latitude, longitude });
    }
}
