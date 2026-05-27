import { supabase, handleSupabaseError } from '../lib/supabase';
import type { MonthlyReport } from '../types';

/**
 * Servicio para gestionar reportes mensuales en Supabase
 */
export class ReportsService {
    /**
     * Obtener todos los reportes
     */
    static async getAll(): Promise<{ data: MonthlyReport[] | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('monthly_reports')
                .select('*')
                .order('year', { ascending: false })
                .order('month', { ascending: false });

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            const reports: MonthlyReport[] = (data || []).map(r => ({
                id: r.id,
                installationId: r.installation_id,
                installationName: r.installation_name,
                month: r.month,
                year: r.year,
                pdfUrl: r.pdf_url,
                summaryData: r.summary_data,
                createdAt: r.created_at,
            }));

            return { data: reports, error: null };
        } catch (error) {
            console.error('Error fetching reports:', error);
            return { data: null, error: 'Error al obtener reportes' };
        }
    }

    /**
     * Guardar un nuevo reporte
     */
    static async create(report: Omit<MonthlyReport, 'id' | 'createdAt'>): Promise<{ data: MonthlyReport | null; error: string | null }> {
        try {
            const { data, error } = await (supabase as any)
                .from('monthly_reports')
                .insert({
                    installation_id: report.installationId,
                    installation_name: report.installationName,
                    month: report.month,
                    year: report.year,
                    pdf_url: report.pdfUrl,
                    summary_data: report.summaryData,
                })
                .select()
                .single();

            if (error) {
                return { data: null, error: handleSupabaseError(error) };
            }

            if (!data) {
                return { data: null, error: 'Error al obtener el reporte guardado' };
            }

            return {
                data: {
                    id: data.id,
                    installationId: data.installation_id,
                    installationName: data.installation_name,
                    month: data.month,
                    year: data.year,
                    pdfUrl: data.pdf_url,
                    summaryData: data.summary_data,
                    createdAt: data.created_at,
                },
                error: null
            };
        } catch (error) {
            console.error('Error creating report:', error);
            return { data: null, error: 'Error al guardar reporte' };
        }
    }

    /**
     * Simular el envío de un reporte por email
     */
    static async sendByEmail(reportId: string, email: string): Promise<{ success: boolean; error: string | null }> {
        try {
            // En una implementación real, aquí llamaríamos a una Edge Function 
            // que use Resend o SendGrid para enviar el PDF.
            console.log(`[SIMULATION] Enviando reporte ${reportId} a ${email}`);

            // Simulamos un retraso de red
            await new Promise(resolve => setTimeout(resolve, 1500));

            return { success: true, error: null };
        } catch (error) {
            return { success: false, error: 'Error al enviar email' };
        }
    }
}
