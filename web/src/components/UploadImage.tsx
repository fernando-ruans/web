import React, { useRef, useState } from 'react';

interface UploadImageProps {
  onUpload: (url: string) => void;
  label?: string;
  buttonClassName?: string;
  className?: string;
}

const UploadImage: React.FC<UploadImageProps> = ({ onUpload, label, buttonClassName, className }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Tamanho máximo: 5MB.');
      return;
    }
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    const formData = new FormData();
    formData.append('imagem', file);
    try {
      const res = await fetch('/api/auth/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.url) {
        onUpload(data.url);
      } else {
        setError(data.error || 'Erro no upload');
      }
    } catch {
      setError('Erro ao enviar imagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className || ''}`}>
      {label && <label className="text-gray-300 mb-1">{label}</label>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className={buttonClassName || "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? 'Enviando...' : 'Selecionar Imagem'}
      </button>
      {preview && <img src={preview} alt="preview" className="w-24 h-24 object-cover rounded mt-2" />}
      {error && <div className="text-red-400 text-sm">{error}</div>}
    </div>
  );
};

export default UploadImage;
