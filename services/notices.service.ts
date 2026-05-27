import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Notice = Database['public']['Tables']['notices']['Row'];
type NoticeInsert = Database['public']['Tables']['notices']['Insert'];
type NoticeUpdate = Database['public']['Tables']['notices']['Update'];

/**
 * Servicio para gestionar avisos/comunicados en Supabase
 */
export class NoticesService {
    /**
     * Obtener todos los avisos
     */
    static async getAll(): Promise<{ data: Notice[] | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('notices')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching notices:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Crear nuevo aviso
     */
    static async create(notice: NoticeInsert): Promise<{ data: Notice | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('notices')
                .insert(notice)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating notice:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Actualizar aviso
     */
    static async update(id: string, updates: NoticeUpdate): Promise<{ data: Notice | null; error: Error | null }> {
        try {
            const { data, error } = await supabase
                .from('notices')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error updating notice:', error);
            return { data: null, error: error as Error };
        }
    }

    /**
     * Eliminar aviso
     */
    static async delete(id: string): Promise<{ error: Error | null }> {
        try {
            const { error } = await supabase
                .from('notices')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { error: null };
        } catch (error) {
            console.error('Error deleting notice:', error);
            return { error: error as Error };
        }
    }

    /**
     * Subir imagen para aviso
     */
    static async uploadImage(file: File): Promise<{ data: string | null; error: Error | null }> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `notices/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('notices')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('notices')
                .getPublicUrl(filePath);

            return { data: publicUrl, error: null };
        } catch (error) {
            console.error('Error uploading notice image:', error);
            return { data: null, error: error as Error };
        }
    }
}
