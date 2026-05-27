
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, Loader2 } from 'lucide-react';
import { StorageService } from '../services/storage.service';

interface ImageUploaderProps {
    onUploadComplete: (urls: string[]) => void;
    folder?: string;
    maxImages?: number;
    label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    onUploadComplete,
    folder = 'general',
    maxImages = 3,
    label = 'Capturar Evidencia'
}) => {
    const [uploading, setUploading] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        // Validar límite
        if (uploadedUrls.length + files.length > maxImages) {
            alert(`Máximo ${maxImages} imágenes permitidas.`);
            return;
        }

        setUploading(true);
        const newUrls: string[] = [...uploadedUrls];

        try {
            for (const file of files) {
                const url = await StorageService.uploadImage(file as File, folder);
                if (url) {
                    newUrls.push(url);
                }
            }

            setUploadedUrls(newUrls);
            onUploadComplete(newUrls);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Error al subir imágenes');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = async (index: number) => {
        const urlToRemove = uploadedUrls[index];
        // Opcionalmente borrar del storage
        // await StorageService.deleteImage(urlToRemove);

        const nextUrls = uploadedUrls.filter((_, i) => i !== index);
        setUploadedUrls(nextUrls);
        onUploadComplete(nextUrls);
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
                {uploadedUrls.map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-blue-500 shadow-lg group">
                        <img src={url} alt="upload" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                        <div className="absolute bottom-1 right-1 bg-green-500 text-white rounded-full p-0.5 shadow-sm">
                            <Check size={10} />
                        </div>
                    </div>
                ))}

                {uploadedUrls.length < maxImages && (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={`w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-1 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? (
                            <Loader2 size={24} className="text-blue-500 animate-spin" />
                        ) : (
                            <>
                                <Camera size={24} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Subir</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
            />

            <p className="text-[10px] text-gray-500 font-medium">
                {uploading ? 'Optimizando y subiendo...' : `${label} (${uploadedUrls.length}/${maxImages})`}
            </p>
        </div>
    );
};

export default ImageUploader;
