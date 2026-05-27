
import { supabase } from '../lib/supabase';
import imageCompression from 'browser-image-compression';

export class StorageService {
    private static BUCKET_NAME = 'media';

    /**
     * Comprime una imagen antes de subirla
     */
    private static async compressImage(file: File): Promise<File> {
        const options = {
            maxSizeMB: 0.15, // Máximo 150KB para ahorrar espacio
            maxWidthOrHeight: 640, // Redimensionar a 640px (atendiendo a 640x480)
            useWebWorker: true,
            initialQuality: 0.6 // Calidad optimizada para reporte visual
        };

        try {
            console.log(`Original size: ${(file.size / 1024).toFixed(2)} KB`);
            const compressedFile = await imageCompression(file, options);
            console.log(`Compressed size: ${(compressedFile.size / 1024).toFixed(2)} KB`);
            return compressedFile;
        } catch (error) {
            console.error('Error compressing image:', error);
            return file; // Si falla, devolvemos el original
        }
    }

    /**
     * Sube una imagen al bucket configured
     * @param file Archivo de imagen
     * @param folder Carpeta dentro del bucket (ej: 'incidents', 'profiles')
     */
    static async uploadImage(file: File, folder: string = 'general'): Promise<string | null> {
        try {
            // 1. Comprimir (Aplica resizre a 640x480 y compresión alta)
            const compressedFile = await this.compressImage(file);

            // 2. Generar nombre único
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // 3. Subir a Supabase
            const { data, error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .upload(filePath, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error('Error uploading to Supabase Storage:', error);
                return null;
            }

            // 4. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from(this.BUCKET_NAME)
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Unexpected error in uploadImage:', error);
            return null;
        }
    }

    /**
     * Elimina una imagen del storage
     */
    static async deleteImage(url: string): Promise<boolean> {
        try {
            // Extraer el path relativo de la URL pública
            // URL format: https://[ID].supabase.co/storage/v1/object/public/image/folder/file.jpg
            const pathParts = url.split(`${this.BUCKET_NAME}/`);
            if (pathParts.length < 2) return false;

            const path = pathParts[1];
            const { error } = await supabase.storage
                .from(this.BUCKET_NAME)
                .remove([path]);

            return !error;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    }
}
