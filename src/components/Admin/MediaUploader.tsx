import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Video, Play, Trash2, GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cloudinaryService } from '@/lib/cloudinary/cloudinary-service';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  is_primary: boolean;
  sort_order: number;
  file_name?: string;
  file_size?: number;
}

interface MediaUploaderProps {
  value: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  error?: string;
  maxImages?: number;
  maxVideos?: number;
}

const MAX_FILE_SIZE_IMAGE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE_VIDEO = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export default function MediaUploader({ 
  value, 
  onChange, 
  error, 
  maxImages = 10, 
  maxVideos = 2 
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [includeVideo, setIncludeVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'upload' | 'url'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const currentImages = value.filter(item => item.type === 'image');
  const currentVideos = value.filter(item => item.type === 'video');

  const validateFile = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'image' ? MAX_FILE_SIZE_IMAGE : MAX_FILE_SIZE_VIDEO;
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Please use ${type === 'image' ? 'JPG, PNG, or WebP' : 'MP4, WebM, or MOV'}.`);
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${type === 'image' ? '5MB' : '100MB'}.`);
    }

    return true;
  };

  const uploadFile = async (file: File, type: 'image' | 'video'): Promise<string> => {
    validateFile(file, type);

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadDocument(
      file,
      'products', // Folder for product media
      type
    );

    return uploadResult.secure_url;
  };

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files || files.length === 0) return;

    const maxCount = type === 'image' ? maxImages : maxVideos;
    const currentCount = type === 'image' ? currentImages.length : currentVideos.length;

    if (currentCount >= maxCount) {
      alert(`Maximum ${type} count (${maxCount}) reached.`);
      return;
    }

    setUploading(true);

    try {
      const newMedia: MediaItem[] = [];

      for (let i = 0; i < Math.min(files.length, maxCount - currentCount); i++) {
        const file = files[i];
        const url = await uploadFile(file, type);

        const mediaItem: MediaItem = {
          id: `${Date.now()}-${i}`,
          url,
          type,
          is_primary: type === 'image' && currentImages.length === 0 && i === 0,
          sort_order: value.length,
          file_name: file.name,
          file_size: file.size
        };

        newMedia.push(mediaItem);
      }

      onChange([...value, ...newMedia]);
    } catch (error) {
      console.error('Upload error:', error);
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUrl = () => {
    if (!videoUrl.trim()) return;

    // Basic URL validation
    try {
      new URL(videoUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    const videoItem: MediaItem = {
      id: `video-${Date.now()}`,
      url: videoUrl.trim(),
      type: 'video',
      is_primary: false,
      sort_order: value.length
    };

    onChange([...value, videoItem]);
    setVideoUrl('');
  };

  const removeMedia = (id: string) => {
    onChange(value.filter(item => item.id !== id));
  };

  const setPrimaryImage = (id: string) => {
    onChange(value.map(item => ({
      ...item,
      is_primary: item.id === id && item.type === 'image'
    })));
  };

  const reorderMedia = (fromIndex: number, toIndex: number) => {
    const reordered = [...value];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    
    // Update sort orders
    return reordered.map((item, index) => ({
      ...item,
      sort_order: index
    }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      // Determine if it's an image or video based on first file
      const firstFile = files[0];
      const type = firstFile.type.startsWith('image/') ? 'image' : 'video';
      handleFileUpload(files, type);
    }
  }, []);

  const renderMediaItem = (item: MediaItem, index: number) => (
    <Card key={item.id} className="relative group">
      <CardContent className="p-2">
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.file_name || 'Product image'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          {/* Action buttons */}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.type === 'image' && (
              <Button
                size="sm"
                variant={item.is_primary ? "default" : "secondary"}
                onClick={() => setPrimaryImage(item.id)}
                className="h-6 w-6 p-0"
              >
                {item.is_primary ? '★' : '☆'}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeMedia(item.id)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Drag handle */}
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0 cursor-move"
            >
              <GripVertical className="h-3 w-3" />
            </Button>
          </div>

          {/* Primary badge */}
          {item.is_primary && (
            <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">
              Primary
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {item.file_name || (item.type === 'video' ? 'Video' : 'Image')}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Product Images *</Label>
          <span className="text-sm text-muted-foreground">
            {currentImages.length}/{maxImages} images
          </span>
        </div>

        {/* Primary Image Upload */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          } ${currentImages.length === 0 ? 'border-primary' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileUpload(e.target.files, 'image')}
            className="hidden"
            title="Upload product images"
            aria-label="Product image upload"
          />
          
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {currentImages.length === 0 ? 'Add Primary Image' : 'Add More Images'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Drag & drop or click to upload
          </p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || currentImages.length >= maxImages}
          >
            {uploading ? 'Uploading...' : 'Select Images'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            JPG, PNG, WebP up to 5MB each
          </p>
        </div>

        {/* Image Gallery */}
        {currentImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {currentImages.map((item, index) => renderMediaItem(item, index))}
          </div>
        )}
      </div>

      {/* Video Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="include-video"
              checked={includeVideo}
              onCheckedChange={setIncludeVideo}
            />
            <Label htmlFor="include-video">Include Product Video</Label>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentVideos.length}/{maxVideos} videos
          </span>
        </div>

        {includeVideo && (
          <div className="space-y-4">
            {/* Video Type Selection */}
            <div className="flex gap-2">
              <Button
                variant={videoType === 'upload' ? 'default' : 'outline'}
                onClick={() => setVideoType('upload')}
                disabled={currentVideos.length >= maxVideos}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
              <Button
                variant={videoType === 'url' ? 'default' : 'outline'}
                onClick={() => setVideoType('url')}
                disabled={currentVideos.length >= maxVideos}
              >
                <Video className="w-4 h-4 mr-2" />
                Video URL
              </Button>
            </div>

            {/* Video Upload */}
            {videoType === 'upload' && (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleFileUpload(e.target.files, 'video')}
                  className="hidden"
                  title="Upload product video"
                  aria-label="Product video upload"
                />
                
                <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Upload Video</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag & drop or click to upload
                </p>
                <Button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploading || currentVideos.length >= maxVideos}
                >
                  {uploading ? 'Uploading...' : 'Select Video'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  MP4, WebM, MOV up to 100MB
                </p>
              </div>
            )}

            {/* Video URL */}
            {videoType === 'url' && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVideoUrl()}
                  title="Video URL for product demonstration"
                  aria-label="Video URL"
                />
                <Button onClick={handleVideoUrl} disabled={!videoUrl.trim()}>
                  Add Video
                </Button>
              </div>
            )}

            {/* Video Gallery */}
            {currentVideos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentVideos.map((item, index) => renderMediaItem(item, index))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Validation Info */}
      {currentImages.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            At least one product image is required.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
