import { useState } from 'react';

export const useMediaUpload = () => {
  const [loading, setLoading] = useState(false);

  const upload = (file: File | null, callback: (result: string) => void, type: 'image' | 'video' = 'image') => {
    if (!file) return;
    setLoading(true);
    
    const limit = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // Increased limits: 50MB video, 5MB image
    
    if (file.size > limit) {
      setLoading(false);
      alert(`Filen er for stor! Maks ${limit/(1024*1024)}MB.`);
      return; 
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        callback(reader.result);
      }
      setLoading(false);
    };
    reader.onerror = () => {
      setLoading(false);
      alert("Feil ved opplasting.");
    };
    reader.readAsDataURL(file);
  };

  return { upload, loading };
};