import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import Button from './Button';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageSelect: (file: File) => void;
  onRemoveImage?: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onImageSelect,
  onRemoveImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemoveImage?.();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-purple-500"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-purple-700 flex items-center justify-center">
            <Upload className="w-8 h-8 text-purple-300" />
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        color="secondary"
        size="small"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4"
      >
        {previewUrl ? 'Change Photo' : 'Upload Photo'}
      </Button>
    </div>
  );
};

export default ImageUpload;