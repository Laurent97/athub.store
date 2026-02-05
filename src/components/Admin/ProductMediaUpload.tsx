import React, { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import { cloudinaryService } from '../../lib/cloudinary/cloudinary-service';
import { Upload, X, Image as ImageIcon, Video, Trash2 } from 'lucide-react';

interface ProductMediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
  id: string;
}

interface ProductMediaUploadProps {
  productId: string;
  onMediaChange: (media: ProductMediaFile[]) => void;
  existingMedia?: Array<{
    id: string;
    file_path: string;
    media_type: 'image' | 'video';
    is_primary: boolean;
  }>;
}

export default function ProductMediaUpload({ productId, onMediaChange, existingMedia = [] }: ProductMediaUploadProps) {
  const [mediaFiles, setMediaFiles] = useState<ProductMediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize existing media
  React.useEffect(() => {
    const initialMedia = existingMedia.map(media => ({
      file: new File([], media.file_path),
      preview: media.file_path, // Use Cloudinary URL directly
      type: media.media_type,
      id: media.id
    }));
    setMediaFiles(initialMedia);
  }, [existingMedia]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newMediaFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
      id: Math.random().toString(36).substring(7)
    }));

    setMediaFiles(prev => [...prev, ...newMediaFiles]);
  };

  const removeFile = (id: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id));
  };

  const setPrimaryMedia = (id: string) => {
    setMediaFiles(prev => prev.map(file => ({
      ...file,
      is_primary: file.id === id
    })));
  };

  const uploadFiles = async () => {
    if (mediaFiles.length === 0) return;

    setUploading(true);
    const newProgress: Record<string, number> = {};

    try {
      for (const mediaFile of mediaFiles) {
        // Skip if already uploaded (existing media)
        if (mediaFile.file.size === 0) continue;

        newProgress[mediaFile.id] = 0;
        setUploadProgress({ ...newProgress });

        // Upload to Cloudinary
        const uploadResult = await cloudinaryService.uploadDocument(
          mediaFile.file,
          productId,
          mediaFile.type
        );

        const publicUrl = uploadResult.secure_url;

        // Save to database
        const { error: dbError } = await supabase
          .from('product_media')
          .insert({
            product_id: productId,
            file_name: mediaFile.file.name,
            file_path: publicUrl,
            file_size: uploadResult.bytes,
            mime_type: mediaFile.file.type,
            media_type: mediaFile.type,
            is_primary: mediaFiles.findIndex(f => f.id === mediaFile.id) === 0, // First image is primary
            sort_order: mediaFiles.findIndex(f => f.id === mediaFile.id)
          });

        if (dbError) {
          console.error('Database error:', dbError);
        }

        newProgress[mediaFile.id] = 100;
        setUploadProgress({ ...newProgress });
      }

      onMediaChange(mediaFiles);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const isImage = (file: ProductMediaFile) => file.type === 'image';
  const isVideo = (file: ProductMediaFile) => file.type === 'video';

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
          title="Upload product images and videos"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 text-amber-600 hover:text-amber-700"
        >
          <Upload className="w-8 h-8" />
          <span className="font-medium">Upload Images & Videos</span>
          <span className="text-sm text-gray-500">
            Supports: JPG, PNG, GIF, WebP, MP4, WebM
          </span>
        </button>
      </div>

      {/* Media Preview Grid */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaFiles.map((mediaFile, index) => (
            <div key={mediaFile.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {isImage(mediaFile) ? (
                  <img
                    src={mediaFile.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {/* Progress Overlay */}
                {uploading && uploadProgress[mediaFile.id] !== undefined && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Type Badge */}
              <div className="absolute top-2 left-2">
                {isImage(mediaFile) ? (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </div>
                ) : (
                  <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Video
                  </div>
                )}
              </div>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute top-2 right-2">
                  <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Primary
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  {index !== 0 && (
                    <button
                      onClick={() => setPrimaryMedia(mediaFile.id)}
                      className="bg-white p-1 rounded-full shadow-md hover:bg-amber-100"
                      title="Set as primary"
                    >
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFile(mediaFile.id)}
                    className="bg-white p-1 rounded-full shadow-md hover:bg-red-100"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              {/* File Info */}
              <div className="mt-2 text-xs text-gray-600">
                <p className="truncate font-medium">{mediaFile.file.name}</p>
                <p>{(mediaFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {mediaFiles.length > 0 && (
        <button
          onClick={uploadFiles}
          disabled={uploading}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-medium hover:from-amber-700 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
              Uploading Media...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Upload className="w-5 h-5" />
              Upload All Media
            </div>
          )}
        </button>
      )}
    </div>
  );
}
