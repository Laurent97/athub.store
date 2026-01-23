// Cloudinary Service for Image Upload
// Uses fetch API to upload images to Cloudinary with retry mechanism

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxqfel9iy';
const UPLOAD_PRESET = 'Autoroad'; // Use unsigned upload for simplicity

// Network error detection helper
const isNetworkError = (error: any): boolean => {
  return error instanceof TypeError && 
         (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_NAME_NOT_RESOLVED') ||
          error.message.includes('ERR_CONNECTION_RESET'));
}

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error);
      
      // If it's the last attempt or not a network error, throw the error
      if (attempt === maxRetries || !isNetworkError(error)) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// Upload image to Cloudinary using unsigned upload with retry mechanism
export async function uploadImageToCloudinary(file: File): Promise<string> {
  return retryWithBackoff(async () => {
    // Validate file
    if (!file || file.size === 0) {
      throw new Error('No file provided or file is empty');
    }

    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('Cloud name:', CLOUD_NAME);
    console.log('Upload preset:', UPLOAD_PRESET);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', 'auto-drive-depot/products');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    console.log('Upload URL:', uploadUrl);

    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Add headers to prevent CORS issues
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cloudinary error response:', errorText);
        
        // Create a more specific error for different status codes
        if (response.status === 401) {
          throw new Error('Cloudinary authentication failed. Check your configuration.');
        } else if (response.status === 400) {
          throw new Error('Invalid file or upload parameters.');
        } else if (response.status >= 500) {
          throw new Error('Cloudinary server error. Please try again.');
        } else {
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Cloudinary success response:', data);
      
      if (!data.secure_url) {
        throw new Error('No secure_url in Cloudinary response');
      }
      
      return data.secure_url;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out. Please try again.');
      }
      
      throw error;
    }
  }, 3, 1000);
}

// Upload multiple images to Cloudinary with better error handling
export async function uploadMultipleImagesToCloudinary(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) {
    return [];
  }

  console.log('Starting upload of', files.length, 'files');
  
  try {
    // Upload images sequentially to avoid overwhelming the network
    const urls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading file ${i + 1}/${files.length}:`, file.name);
      
      try {
        const url = await uploadImageToCloudinary(file);
        urls.push(url);
        console.log(`Successfully uploaded file ${i + 1}/${files.length}`);
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}/${files.length}:`, error);
        
        // If this is the first file and it fails, we might want to fail fast
        // But if we have some successful uploads, we can continue
        if (i === 0) {
          throw error;
        }
        
        // For subsequent files, we can choose to continue or fail
        // For now, we'll continue and let the user know some files failed
        console.warn(`Skipping file ${i + 1} due to upload error`);
      }
    }
    
    if (urls.length === 0) {
      throw new Error('No images could be uploaded successfully');
    }
    
    if (urls.length < files.length) {
      console.warn(`Only ${urls.length} out of ${files.length} images were uploaded successfully`);
    }
    
    console.log('Upload completed. Successful uploads:', urls.length);
    return urls;
    
  } catch (error) {
    console.error('Error uploading multiple images to Cloudinary:', error);
    throw new Error(`Failed to upload images to Cloudinary: ${error.message}`);
  }
}

// Delete image from Cloudinary (optional - requires API secret)
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    // Note: This requires server-side implementation due to API secret
    console.log('Delete from Cloudinary not implemented client-side for security');
    // You would need to implement this on your backend
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

// Get public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}

export default {
  uploadImageToCloudinary,
  uploadMultipleImagesToCloudinary,
  deleteImageFromCloudinary,
  getPublicIdFromUrl
};
