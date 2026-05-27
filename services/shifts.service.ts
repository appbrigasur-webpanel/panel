import { supabase, handleSupabaseError } from '../lib/supabase';
import type { ShiftAssignment, Absence } from '../types';

/**
 * Servicio para gestionar turnos y ausencias en Supabase
 */
export class ShiftsService {
    /**
     * Obtener todos los turnos
     */
    static async getShifts(): Promise<{ data: ShiftAssignment[] | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('shift_assignments')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const shifts: ShiftAssignment[] = (data || []).map(s => ({
                id: s.id,
                guardId: s.guard_id,
                guardName: s.guard_name,
                installationId: s.installation_id,
                installationName: s.installation_name,
                date: s.date,
                shiftType: s.shift_type,
                startTime: s.start_time,
                endTime: s.end_time,
            }));

            return { data: shifts, error: null };
        } catch (error) {
            console.error('Error fetching shifts:', error);
            return { data: null, error: 'Error al obtener turnos' };
        }
    }

    /**
     * Crear un nuevo turno
     */
    static async createShift(shift: Omit<ShiftAssignment, 'id'>): Promise<{ data: ShiftAssignment | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('shift_assignments')
                .insert({
                    guard_id: shift.guardId,
                    guard_name: shift.guardName,
                    installation_id: shift.installationId,
                    installation_name: shift.installationName,
                    date: shift.date,
                    shift_type: shift.shiftType,
                    start_time: shift.startTime,
                    end_time: shift.endTime,
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            return {
                data: {
                    id: data.id,
                    guardId: data.guard_id,
                    guardName: data.guard_name,
                    installationId: data.installation_id,
                    installationName: data.installation_name,
                    date: data.date,
                    shiftType: data.shift_type,
                    startTime: data.start_time,
                    endTime: data.end_time,
                },
                error: null
            };
        } catch (error) {
            return { data: null, error: 'Error al guardar turno' };
        }
    }

    /**
     * Eliminar un turno
     */
    static async deleteShift(id: string): Promise<{ success: boolean; error: string | null }> {
        try {
            const { error } = await (supabase as any)
                .from('shift_assignments')
                .delete()
                .eq('id', id);

            if (error) return { success: false, error: handleSupabaseError(error) };
            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: 'Error al eliminar turno' };
        }
    }

    /**
     * Obtener ausencias
     */
    static async getAbsences(): Promise<{ data: Absence[] | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('absences')
                .select('*')
                .order('start_date', { ascending: false });

            if (error) return { data: null, error: handleSupabaseError(error) };

            const absences: Absence[] = (data || []).map(a => ({
                id: a.id,
                guardId: a.guard_id,
                guardName: a.guard_name,
                startDate: a.start_date,
                endDate: a.end_date,
                reason: a.reason,
                status: a.status,
                comment: a.comment,
            }));

            return { data: absences, error: null };
        } catch (error) {
            return { data: null, error: 'Error al obtener ausencias' };
        }
    }

    /**
     * Crear ausencia
     */
    static async createAbsence(absence: Omit<Absence, 'id'>): Promise<{ data: Absence | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('absences')
                .insert({
                    guard_id: absence.guardId,
                    guard_name: absence.guardName,
                    start_date: absence.startDate,
                    end_date: absence.endDate,
                    reason: absence.reason,
                    status: absence.status,
                    comment: absence.comment,
                })
                .select()
                .single();

            if (error) return { data: null, error: handleSupabaseError(error) };

            return {
                data: {
                    id: data.id,
                    guardId: data.guard_id,
                    guardName: data.guard_name,
                    startDate: data.start_date,
                    endDate: data.end_date,
                    reason: data.reason,
                    status: data.status,
                    comment: data.comment,
                },
                error: null
            };
        } catch (error) {
            return { data: null, error: 'Error al guardar ausencia' };
        }
    }
}
