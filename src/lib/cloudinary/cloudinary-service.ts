// Cloudinary service for loan application document management
// This handles upload, storage, and retrieval of documents using Cloudinary

interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  created_at: string;
}

interface CloudinaryDocument {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  document_name: string;
  document_type: string;
  uploaded_at: string;
}

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'product_media';

export class CloudinaryService {
  private static instance: CloudinaryService;

  public static getInstance(): CloudinaryService {
    if (!CloudinaryService.instance) {
      CloudinaryService.instance = new CloudinaryService();
    }
    return CloudinaryService.instance;
  }

  /**
   * Upload a document to Cloudinary
   */
  async uploadDocument(
    file: File, 
    folder: string, 
    documentType: string
  ): Promise<CloudinaryUploadResponse> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', folder);
      formData.append('context', `folder=${folder};type=${documentType}`);
      
      // Add tags for better organization
      const tags = [`${folder}_${documentType}`, documentType, 'media'];
      formData.append('tags', tags.join(','));

      // Determine upload endpoint based on file type
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

      fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          reject(new Error(data.error.message || 'Upload failed'));
        } else {
          resolve({
            public_id: data.public_id,
            secure_url: data.secure_url,
            resource_type: data.resource_type,
            format: data.format,
            bytes: data.bytes,
            created_at: data.created_at
          });
        }
      })
      .catch(error => {
        reject(new Error(`Cloudinary upload error: ${error.message}`));
      });
    });
  }

  /**
   * Delete a document from Cloudinary
   */
  async deleteDocument(publicId: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateSignature(`public_id=${publicId}&timestamp=${timestamp}`);
      
      fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature: signature,
          api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
          timestamp: timestamp
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          reject(new Error(data.error.message || 'Delete failed'));
        } else {
          resolve(data.result === 'ok');
        }
      })
      .catch(error => {
        reject(new Error(`Cloudinary delete error: ${error.message}`));
      });
    });
  }

  /**
   * Get document URL with transformations
   */
  getDocumentUrl(
    publicId: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    } = {}
  ): string {
    const transformations = [];
    
    if (options.width) transformations.push(`w_${options.width}`);
    if (options.height) transformations.push(`h_${options.height}`);
    if (options.quality) transformations.push(`q_${options.quality}`);
    if (options.format) transformations.push(`f_${options.format}`);
    
    const transformationString = transformations.length > 0 ? transformations.join(',') : '';
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
  }

  /**
   * Generate signature for Cloudinary API calls
   */
  private generateSignature(stringToSign: string): string {
    // In a real implementation, this should be done on the backend
    // For now, return a placeholder
    return 'placeholder_signature';
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (100MB limit for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }

    // Check file type
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/png', 
      'image/webp',
      'image/gif',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Only JPEG, PNG, WebP, GIF images and MP4, WebM, MOV videos are allowed' 
      };
    }

    return { valid: true };
  }

  /**
   * Get file type category
   */
  getFileTypeCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    return 'other';
  }

  /**
   * Create document metadata
   */
  createDocumentMetadata(
    uploadResponse: CloudinaryUploadResponse,
    originalName: string,
    documentType: string
  ): CloudinaryDocument {
    return {
      public_id: uploadResponse.public_id,
      secure_url: uploadResponse.secure_url,
      resource_type: uploadResponse.resource_type,
      format: uploadResponse.format,
      bytes: uploadResponse.bytes,
      document_name: originalName,
      document_type: documentType,
      uploaded_at: uploadResponse.created_at
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get document type icon
   */
  getDocumentTypeIcon(format: string): string {
    const iconMap: Record<string, string> = {
      'pdf': '📄',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'doc': '📝',
      'docx': '📝',
      'default': '📎'
    };
    
    return iconMap[format.toLowerCase()] || iconMap.default;
  }

  /**
   * Generate download URL
   */
  getDownloadUrl(publicId: string): string {
    return this.getDocumentUrl(publicId, {
      format: 'pdf', // Force PDF format for documents
      quality: 80
    });
  }

  /**
   * Check if document is an image
   */
  isImageDocument(resourceType: string, format: string): boolean {
    return resourceType === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase());
  }

  /**
   * Get thumbnail URL for images
   */
  getThumbnailUrl(publicId: string, width = 200, height = 150): string {
    return this.getDocumentUrl(publicId, {
      width,
      height,
      quality: 80,
      format: 'jpg'
    });
  }

  /**
   * Batch upload multiple documents
   */
  async uploadMultipleDocuments(
    files: File[], 
    applicationId: string, 
    documentType: string
  ): Promise<CloudinaryUploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadDocument(file, applicationId, documentType)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      throw new Error(`Batch upload failed: ${error.message}`);
    }
  }

  /**
   * Search documents by tags
   */
  async searchDocumentsByTag(tag: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/tags/${tag}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${process.env.REACT_APP_CLOUDINARY_API_KEY}:${process.env.REACT_APP_CLOUDINARY_API_SECRET}`)}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          reject(new Error(data.error.message || 'Search failed'));
        } else {
          resolve(data.resources || []);
        }
      })
      .catch(error => {
        reject(new Error(`Cloudinary search error: ${error.message}`));
      });
    });
  }

  /**
   * Get document analytics
   */
  async getDocumentAnalytics(applicationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const tag = `loan_application_${applicationId}`;
      
      this.searchDocumentsByTag(tag)
        .then(resources => {
          const analytics = {
            totalDocuments: resources.length,
            totalSize: resources.reduce((sum, resource) => sum + (resource.bytes || 0), 0),
            documentTypes: resources.reduce((types, resource) => {
              const type = this.getFileTypeCategory(resource.format || 'unknown');
              types[type] = (types[type] || 0) + 1;
              return types;
            }, {}),
            uploadDates: resources.map(resource => resource.created_at).sort()
          };
          
          resolve(analytics);
        })
        .catch(error => {
          reject(error);
        });
    });
  }
}

// Export singleton instance
export const cloudinaryService = CloudinaryService.getInstance();
