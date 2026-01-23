// Complete ProductForm Component (With Cloudinary Image Upload & Fixed Visibility)
// This includes Cloudinary image upload functionality and fixes all text visibility issues

import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createProduct, updateProduct, getProductById, validateProductData, checkSkuExists } from '../../services/productService'
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary, deleteImageFromCloudinary, getPublicIdFromUrl } from '../../services/cloudinaryService'
import { supabase } from '../../lib/supabase/client'

// Retry wrapper for SKU validation with exponential backoff
const checkSkuExistsWithRetry = async (sku: string, maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await checkSkuExists(sku)
      return result
    } catch (error) {
      console.warn(`SKU validation attempt ${attempt} failed:`, error)
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return false
}

// Retry wrapper for Cloudinary uploads with exponential backoff
const uploadMultipleImagesToCloudinaryWithRetry = async (files: File[], maxRetries = 3): Promise<string[]> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadMultipleImagesToCloudinary(files)
      return result
    } catch (error) {
      console.warn(`Cloudinary upload attempt ${attempt} failed:`, error)
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return []
}

interface ProductFormData {
  sku: string
  title: string
  description: string
  category: string
  make: string          // Correct field name (not 'brand')
  model: string
  year: number
  mileage: number
  condition: string
  original_price: number
  sale_price: number
  stock_quantity: number
  is_active: boolean
  featured: boolean     // Add featured field
  images?: string[]     // Add images field
}

export default function ProductForm({ productId: propProductId, onSuccess }: { productId?: string; onSuccess?: () => void }) {
  const { productId: urlProductId } = useParams()
  const navigate = useNavigate()
  const productId = propProductId || urlProductId  // Use prop or URL param
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [skuError, setSkuError] = useState('')
  const [skuTimeoutId, setSkuTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    title: '',
    description: '',
    category: 'part',
    make: '',          // Correct field name
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    condition: 'new',
    original_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    is_active: true,
    featured: false,   // Add featured field with default
    images: [] // Add images field
  })

  // Debug: Log when component mounts
  console.log('ProductForm component mounted, productId:', productId)
  console.log('propProductId:', propProductId, 'urlProductId:', urlProductId)

  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData)
  }, [formData])

  // Force load product if productId exists but form is empty
  useEffect(() => {
    if (productId && !formData.title && !loading) {
      console.log('Forcing product load - productId exists but form is empty')
      loadProduct()
    }
  }, [productId, formData.title, loading])

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview))
    }
  }, [])

  // Load existing product if editing
  useEffect(() => {
    console.log('useEffect triggered, productId:', productId)
    if (productId) {
      loadProduct()
    } else {
      console.log('No productId, not loading product')
    }
  }, [productId])

  const loadProduct = async () => {
    if (!productId) return

    setLoading(true)
    try {
      console.log('Loading product with ID:', productId)
      
      // Use direct query to get actual product data with correct field names
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      console.log('Product data from DB:', data)
      console.log('DB Error:', error)

      if (error) {
        console.error('Error fetching product:', error)
        setError('Failed to load product: ' + error.message)
        return
      }

      if (data) {
        console.log('Setting form data with:', {
          sku: data.sku,
          title: data.title,
          make: data.make,
          original_price: data.original_price,
          stock_quantity: data.stock_quantity,
          featured: data.featured
        })
        
        setFormData({
          sku: data.sku || '',
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'part',
          make: data.make || '',        // Use make field from database
          model: data.model || '',
          year: data.year || new Date().getFullYear(),
          mileage: data.mileage || 0,
          condition: data.condition || 'new',
          original_price: data.original_price || 0,  // Use original_price field from database
          sale_price: data.sale_price || 0,
          stock_quantity: data.stock_quantity || 0,  // Use stock_quantity field from database
          is_active: data.is_active !== undefined ? data.is_active : true,
          featured: data.featured || false
        })
        
        console.log('Form data set successfully')
      } else {
        console.log('No product data found')
        setError('Product not found')
      }
    } catch (err) {
      setError('Failed to load product')
      console.error('Error loading product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : 0) : value
    }))

    // Clear SKU error when user changes it
    if (name === 'sku') {
      setSkuError('')
      if (skuTimeoutId) {
        clearTimeout(skuTimeoutId)
      }
    }
    
    // Check SKU uniqueness with improved debouncing and error handling
    if (name === 'sku' && value.trim()) {
      // Clear any existing timeout
      if (skuTimeoutId) {
        clearTimeout(skuTimeoutId)
      }
      
      // Set a new timeout to check after user stops typing (increased to 2 seconds)
      const timeoutId = setTimeout(async () => {
        // Only check if SKU is at least 3 characters long
        if (value.trim().length >= 3) {
          try {
            const exists = await checkSkuExistsWithRetry(value.trim())
            if (exists) {
              setSkuError(`SKU "${value}" already exists. Please use a different SKU.`)
            } else {
              // Clear the error if SKU is available
              setSkuError('')
            }
          } catch (err) {
            // Don't show error for validation check failures, but log for debugging
            console.warn('SKU validation failed:', err)
            // Optionally clear error to allow user to proceed
            setSkuError('')
          }
        }
      }, 2000) // Wait 2 seconds after user stops typing
      
      setSkuTimeoutId(timeoutId)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate files
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        console.error('File too large:', file.size)
        return false
      }
      return true
    })
    
    if (validFiles.length !== files.length) {
      setError('Some files were invalid. Only images under 10MB are allowed.')
      setTimeout(() => setError(''), 3000)
    }
    
    setImages(prev => [...prev, ...validFiles])
    
    // Create local previews for immediate display
    const newPreviews = validFiles.map(file => {
      const url = URL.createObjectURL(file)
      console.log('Created preview URL:', url, 'for file:', file.name)
      return url
    })
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = async (index: number) => {
    // Clean up the object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index])
    
    // If image was uploaded to Cloudinary, delete it
    if (uploadedImageUrls[index]) {
      try {
        const publicId = getPublicIdFromUrl(uploadedImageUrls[index])
        await deleteImageFromCloudinary(publicId)
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error)
      }
    }
    
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setUploadedImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (images.length === 0) return []
    
    setUploading(true)
    try {
      const urls = await uploadMultipleImagesToCloudinaryWithRetry(images)
      setUploadedImageUrls(urls)
      return urls
    } catch (error) {
      console.error('Error uploading images:', error)
      // Provide more user-friendly error message
      if (error.message.includes('DNS') || error.message.includes('network')) {
        setError('Network connection issue. Please check your internet connection and try again.')
      } else {
        setError('Failed to upload images to Cloudinary. Please try again.')
      }
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check for SKU error first
    if (skuError) {
      setError('Please fix SKU error before submitting')
      return
    }
    
    // Validate form data
    const validation = validateProductData(formData)
    if (!validation.isValid) {
      setError(validation.errors.join(', '))
      return
    }

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      // Upload images to Cloudinary first
      const imageUrls = await uploadImages()
      
      // Prepare product data with correct field mapping for database
      const productData = {
        sku: formData.sku,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        make: formData.make,        // Use make field directly
        model: formData.model,
        year: formData.year,
        mileage: formData.mileage,
        condition: formData.condition,
        original_price: formData.original_price,  // Use original_price field directly
        sale_price: formData.sale_price,
        stock_quantity: formData.stock_quantity,  // Use stock_quantity field directly
        is_active: formData.is_active,
        featured: formData.featured,
        images: imageUrls
      }

      let savedProduct

      if (productId) {
        // Update existing product using direct Supabase query
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single()

        if (error) throw error
        savedProduct = data
      } else {
        // Create new product using direct Supabase query
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single()

        if (error) throw error
        savedProduct = data
      }

      if (savedProduct) {
        setSuccess(true)
        setTimeout(() => {
          if (onSuccess) {
            onSuccess()
          } else {
            navigate('/admin/products')
          }
        }, 2000)
      } else {
        setError('Failed to save product')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product')
      console.error('Error saving product:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        <span className="ml-4 text-slate-600">Loading product...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h1>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Debug: productId={productId}, formData.title={formData.title}, loading={loading}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">Product saved successfully! Redirecting...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Product Images</h3>
            
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:pl-2 file:border-2 file:border-slate-300 file:rounded-md file:text-sm file:font-semibold file:bg-white hover:file:bg-slate-50 cursor-pointer"
                />
                
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative group">
                        <img 
                          src={uploadedImageUrls[index] || preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-slate-200"
                          onError={(e) => {
                            console.error('Image failed to load:', preview, 'Cloudinary URL:', uploadedImageUrls[index])
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+'
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', uploadedImageUrls[index] || preview)
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {imagePreviews.length === 0 && (
                  <div className="mt-4 p-8 border-2 border-dashed border-slate-300 rounded-lg text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-600">No images selected</p>
                    <p className="text-xs text-slate-500">Click above to select product images</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
              {skuError && (
                <p className="mt-1 text-sm text-red-600">{skuError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ color: '#1e293b', backgroundColor: '#ffffff', resize: 'vertical' }}
            />
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              >
                <option value="car">Car</option>
                <option value="vehicle">Vehicle</option>
                <option value="part">Part</option>
                <option value="accessory">Accessory</option>
                <option value="tool">Tool</option>
                <option value="fluid">Fluid</option>
                <option value="tire">Tire</option>
                <option value="battery">Battery</option>
                <option value="engine">Engine</option>
                <option value="transmission">Transmission</option>
                <option value="brake">Brake</option>
                <option value="suspension">Suspension</option>
                <option value="electrical">Electrical</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="performance">Performance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Make *</label>
              <input
                type="text"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mileage</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Condition</label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Original Price *</label>
              <input
                type="number"
                name="original_price"
                value={formData.original_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sale Price</label>
              <input
                type="number"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              />
            </div>
          </div>

          {/* Stock and Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stock Quantity *</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                name="is_active"
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                className="w-full px-3 py-2 text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ color: '#1e293b', backgroundColor: '#ffffff' }}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Featured Product</label>
              <div className="flex items-center h-10">
                <input
                  id="featured"
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-sm text-slate-600">
                  Show on homepage featured products
                </label>
              </div>
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-slate-50 p-4 rounded-md">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Price Preview</h3>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(formData.sale_price || formData.original_price)}
              </p>
              {formData.sale_price > 0 && formData.sale_price < formData.original_price && (
                <p className="text-sm text-slate-500 line-through">
                  {formatCurrency(formData.original_price)}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (onSuccess) {
                  onSuccess()
                } else {
                  navigate('/admin/products')
                }
              }}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
