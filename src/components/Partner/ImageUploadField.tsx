import React, { useRef, memo } from 'react';
import { Upload, X } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  description: string;
  preview: string;
  maxSize: number;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  uploadProgress?: number;
  error?: string;
}

/**
 * Optimized image upload component
 * - Memoized to prevent unnecessary re-renders
 * - Handles file validation
 * - Shows upload progress
 */
const ImageUploadField = memo<ImageUploadFieldProps>(({
  label,
  description,
  preview,
  maxSize,
  onFileSelect,
  onRemove,
  uploadProgress = 0,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        console.error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        return;
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type');
        return;
      }

      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      fileInputRef.current?.dispatchEvent(
        new DragEvent('change', {
          bubbles: true,
          dataTransfer: new DataTransfer()
        })
      );
      handleFileChange({ target: { files: e.dataTransfer.files } } as any);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>

      {preview ? (
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <img
              src={preview}
              alt={label}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white text-sm font-medium">{uploadProgress}%</div>
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            type="button"
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-800/30"
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-foreground">
            Drag and drop or click to select
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {maxSize / (1024 * 1024)}MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

ImageUploadField.displayName = 'ImageUploadField';

export default ImageUploadField;
