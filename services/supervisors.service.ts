import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';
import type { Guard } from '../types';

type SupervisorRow = Database['public']['Tables']['supervisors']['Row'];

/**
 * Servicio para gestionar supervisores en Supabase
 */
export class SupervisorsService {
    /**
     * Mapear de DB a Guard type
     */
    /**
     * Mapear de DB a Guard type
     */
    private static mapFromDB(item: any): Guard {
        return {
            id: item.id,
            fullName: item.full_name || '',
            rut: item.rut || '',
            email: item.email || '',
            phone: item.phone || '',
            os10Expiry: item.os10_expiry || '',
            isActive: item.is_active === true,
            assignedInstallationId: item.assigned_installation_id || undefined,
            shift: item.shift || undefined
        };
    }

    /**
     * Obtener todos los supervisores
     */
    static async getAll(): Promise<{ data: Guard[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('supervisors')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return { data: (data || []).map(item => this.mapFromDB(item)), error: null };
        } catch (error) {
            console.error('Error fetching supervisors:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Obtener supervisor por ID
     */
    static async getById(id: string): Promise<{ data: Guard | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('supervisors')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return { data: data ? this.mapFromDB(data) : null, error: null };
        } catch (error) {
            console.error('Error fetching supervisor:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Crear nuevo supervisor
     */
    static async create(supervisor: Partial<Guard>): Promise<{ data: Guard | null; error: any | null }> {
        try {
            const dbData: any = {
                full_name: supervisor.fullName || '',
                rut: supervisor.rut || '',
                email: supervisor.email || '',
                phone: supervisor.phone || '',
                os10_expiry: supervisor.os10Expiry || '',
                is_active: supervisor.isActive !== false,
                assigned_installation_id: supervisor.assignedInstallationId || null,
                shift: supervisor.shift || null,
                password: (supervisor as any).password
            };

            // Si se proporciona un ID (por ejemplo de Auth), usarlo
            if (supervisor.id) dbData.id = supervisor.id;

            const { data, error } = await supabase
                .from('supervisors')
                .insert(dbData)
                .select()
                .single();

            if (error) throw error;

            return { data: data ? this.mapFromDB(data) : null, error: null };
        } catch (error) {
            console.error('Error creating supervisor:', error);
            return { data: null, error };
        }
    }

    /**
     * Actualizar supervisor
     */
    static async update(id: string, updates: Partial<Guard>): Promise<{ data: Guard | null; error: any | null }> {
        try {
            const dbData: any = {};
            if (updates.fullName !== undefined) dbData.full_name = updates.fullName;
            if (updates.rut !== undefined) dbData.rut = updates.rut;
            if (updates.email !== undefined) dbData.email = updates.email;
            if (updates.phone !== undefined) dbData.phone = updates.phone;
            if (updates.os10Expiry !== undefined) dbData.os10_expiry = updates.os10Expiry;
            if (updates.isActive !== undefined) dbData.is_active = updates.isActive;
            if (updates.assignedInstallationId !== undefined) dbData.assigned_installation_id = updates.assignedInstallationId || null;
            if (updates.shift !== undefined) dbData.shift = updates.shift || null;
            if ((updates as any).password !== undefined) dbData.password = (updates as any).password;

            const { data, error } = await supabase
                .from('supervisors')
                .update(dbData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { data: data ? this.mapFromDB(data) : null, error: null };
        } catch (error) {
            console.error('Error updating supervisor:', error);
            return { data: null, error };
        }
    }

    /**
     * Eliminar supervisor
     */
    static async delete(id: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('supervisors')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Error deleting supervisor:', error);
            return { error: error as Error };
        }
    }

    /**
     * Buscar supervisores por nombre o RUT
     */
    static async search(query: string): Promise<{ data: Guard[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('supervisors')
                .select('*')
                .or(`full_name.ilike.%${query}%,rut.ilike.%${query}%`)
                .order('full_name', { ascending: true });

            if (error) throw error;

            return { data: (data || []).map(item => this.mapFromDB(item)), error: null };
        } catch (error) {
            console.error('Error searching supervisors:', error);
            return { data: null, error: error as Error };
        }
    }
}
