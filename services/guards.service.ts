import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Guard } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Servicio para gestionar guardias en Supabase
 */
export class GuardsService {
    /**
     * Obtener todos los guardias
     */
    static async getAll(): Promise<{ data: Guard[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('guards')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            // Mapear de snake_case a camelCase
            const guards: Guard[] = (data || []).map(guard => ({
                id: guard.id,
                fullName: guard.full_name,
                rut: guard.rut,
                phone: guard.phone,
                email: guard.email,
                os10Expiry: guard.os10_expiry,
                isActive: guard.is_active,
                assignedInstallationId: guard.assigned_installation_id || undefined,
                shift: guard.shift || undefined,
            }));

            return { data: guards, error: null };
        } catch (error) {
            console.error('Error fetching guards:', error);
            return { data: null, error: 'Error al obtener guardias' };
        }
    }

    /**
     * Obtener un guardia por ID
     */
    static async getById(id: string): Promise<{ data: Guard | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('guards')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            if (!data) {
                return { data: null, error: 'Guardia no encontrado' };
            }

            const guard: Guard = {
                id: data.id,
                fullName: data.full_name,
                rut: data.rut,
                phone: data.phone,
                email: data.email,
                os10Expiry: data.os10_expiry,
                isActive: data.is_active,
                assignedInstallationId: data.assigned_installation_id || undefined,
                shift: data.shift || undefined,
            };

            return { data: guard, error: null };
        } catch (error) {
            console.error('Error fetching guard:', error);
            return { data: null, error: 'Error al obtener guardia' };
        }
    }

    /**
     * Crear un nuevo guardia
     */
    static async create(guard: Omit<Guard, 'id'>): Promise<{ data: Guard | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('guards')
                .insert({
                    full_name: guard.fullName,
                    rut: guard.rut,
                    phone: guard.phone,
                    email: guard.email,
                    os10_expiry: guard.os10Expiry,
                    is_active: guard.isActive,
                    assigned_installation_id: guard.assignedInstallationId || null,
                    shift: guard.shift || null,
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const newGuard: Guard = {
                id: data.id,
                fullName: data.full_name,
                rut: data.rut,
                phone: data.phone,
                email: data.email,
                os10Expiry: data.os10_expiry,
                isActive: data.is_active,
                assignedInstallationId: data.assigned_installation_id || undefined,
                shift: data.shift || undefined,
            };

            return { data: newGuard, error: null };
        } catch (error) {
            console.error('Error creating guard:', error);
            return { data: null, error: 'Error al crear guardia' };
        }
    }

    /**
     * Actualizar un guardia existente
     */
    static async update(id: string, guard: Partial<Omit<Guard, 'id'>>): Promise<{ data: Guard | null; error: string | null }> {
        try {
            const updateData: any = {};

            if (guard.fullName !== undefined) updateData.full_name = guard.fullName;
            if (guard.rut !== undefined) updateData.rut = guard.rut;
            if (guard.phone !== undefined) updateData.phone = guard.phone;
            if (guard.email !== undefined) updateData.email = guard.email;
            if (guard.os10Expiry !== undefined) updateData.os10_expiry = guard.os10Expiry;
            if (guard.isActive !== undefined) updateData.is_active = guard.isActive;
            if (guard.assignedInstallationId !== undefined) updateData.assigned_installation_id = guard.assignedInstallationId || null;
            if (guard.shift !== undefined) updateData.shift = guard.shift || null;

            const { data, error } = await supabase
                .from('guards')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const updatedGuard: Guard = {
                id: data.id,
                fullName: data.full_name,
                rut: data.rut,
                phone: data.phone,
                email: data.email,
                os10Expiry: data.os10_expiry,
                isActive: data.is_active,
                assignedInstallationId: data.assigned_installation_id || undefined,
                shift: data.shift || undefined,
            };

            return { data: updatedGuard, error: null };
        } catch (error) {
            console.error('Error updating guard:', error);
            return { data: null, error: 'Error al actualizar guardia' };
        }
    }

    /**
     * Actualizar contraseña de un guardia en Supabase Auth + tabla guards
     * Llama a la Edge Function que usa la Service Role Key para operar como admin
     */
    static async updatePassword(guardId: string, email: string, newPassword: string, guardName?: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/update-guard-password`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                    },
                    body: JSON.stringify({ email, newPassword, guardId, guardName }),
                }
            );

            const result = await response.json();

            if (!response.ok || result.error) {
                return { success: false, error: result.error || 'Error al actualizar contraseña' };
            }

            return { success: true, error: null };
        } catch (error: any) {
            console.error('Error updating guard password:', error);
            return { success: false, error: 'Error de conexión al actualizar contraseña' };
        }
    }

    /**
     * Eliminar un guardia
     */
    static async delete(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await supabase
                .from('guards')
                .delete()
                .eq('id', id);

            if (error) {
                return { success: false, error: handleSupabaseError(error) };
            }

            return { success: true, error: null };
        } catch (error) {
            console.error('Error deleting guard:', error);
            return { success: false, error: 'Error al eliminar guardia' };
        }
    }

    /**
     * Obtener guardias por instalación
     */
    static async getByInstallation(installationId: string): Promise<{ data: Guard[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('guards')
                .select('*')
                .eq('assigned_installation_id', installationId)
                .order('full_name', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const guards: Guard[] = (data || []).map(guard => ({
                id: guard.id,
                fullName: guard.full_name,
                rut: guard.rut,
                phone: guard.phone,
                email: guard.email,
                os10Expiry: guard.os10_expiry,
                isActive: guard.is_active,
                assignedInstallationId: guard.assigned_installation_id || undefined,
                shift: guard.shift || undefined,
            }));

            return { data: guards, error: null };
        } catch (error) {
            console.error('Error fetching guards by installation:', error);
            return { data: null, error: 'Error al obtener guardias' };
        }
    }

    /**
     * Obtener guardias activos
     */
    static async getActive(): Promise<{ data: Guard[] | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('guards')
                .select('*')
                .eq('is_active', true)
                .order('full_name', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const guards: Guard[] = (data || []).map(guard => ({
                id: guard.id,
                fullName: guard.full_name,
                rut: guard.rut,
                phone: guard.phone,
                email: guard.email,
                os10Expiry: guard.os10_expiry,
                isActive: guard.is_active,
                assignedInstallationId: guard.assigned_installation_id || undefined,
                shift: guard.shift || undefined,
            }));

            return { data: guards, error: null };
        } catch (error) {
            console.error('Error fetching active guards:', error);
            return { data: null, error: 'Error al obtener guardias activos' };
        }
    }
}
