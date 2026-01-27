# Cloudinary Integration for Loan Applications

This document describes the integration between the loan applications system and Cloudinary for document storage and management.

## Overview

Since you're using Cloudinary instead of Supabase Storage, this integration provides a robust solution for uploading, storing, and managing loan application documents with advanced features like image optimization, transformations, and analytics.

## Database Changes

### New Columns in `loan_applications` Table

The loan applications table has been enhanced with Cloudinary-specific columns:

```sql
-- Cloudinary-specific columns
cloudinary_public_ids TEXT[] DEFAULT '{}',
cloudinary_secure_urls TEXT[] DEFAULT '{}',
cloudinary_resource_types TEXT[] DEFAULT '{}',
cloudinary_formats TEXT[] DEFAULT '{}',
cloudinary_sizes JSONB DEFAULT '{}'
```

### Database Functions

#### 1. `add_cloudinary_document()`

Adds Cloudinary document metadata to a loan application.

**Parameters:**
- `p_application_id`: UUID of the loan application
- `p_public_id`: Cloudinary public ID
- `p_secure_url`: Cloudinary secure URL
- `p_resource_type`: Resource type (image, raw, etc.)
- `p_format`: File format (jpg, pdf, etc.)
- `p_size_bytes`: File size in bytes
- `p_document_name`: Original file name
- `p_document_type`: Document type category

#### 2. `remove_cloudinary_document()`

Removes Cloudinary document metadata from a loan application.

**Parameters:**
- `p_application_id`: UUID of the loan application
- `p_public_id`: Cloudinary public ID to remove

#### 3. `get_loan_document_statistics()`

Returns statistics about uploaded loan documents.

**Returns:**
- Total applications
- Applications with documents
- Total documents
- Total size in bytes
- Average size
- Document types breakdown

### Views

#### `v_loan_application_cloudinary_documents`

View showing all loan application documents with Cloudinary metadata.

## Frontend Integration

### Cloudinary Service

The `cloudinaryService` class provides a comprehensive interface for Cloudinary operations:

```typescript
import { cloudinaryService } from '../lib/cloudinary/cloudinary-service';

// Upload a document
const uploadResponse = await cloudinaryService.uploadDocument(file, applicationId, documentType);

// Delete a document
const deleted = await cloudinaryService.deleteDocument(publicId);

// Get document URL with transformations
const url = cloudinaryService.getDocumentUrl(publicId, { width: 200, height: 150 });

// Get thumbnail for images
const thumbnail = cloudinaryService.getThumbnailUrl(publicId);
```

### Updated Loan Service

The `loanService` has been updated to use Cloudinary:

```typescript
// Upload document (now uses Cloudinary)
const result = await loanService.uploadDocument(applicationId, file, 'tax_return');

// Delete document (removes from both Cloudinary and database)
const result = await loanService.deleteDocument(applicationId, publicId);
```

## Cloudinary Configuration

### Environment Variables

Add these to your `.env` file:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_API_KEY=your-api-key
REACT_APP_CLOUDINARY_API_SECRET=your-api-secret
REACT_APP_CLOUDINARY_UPLOAD_PRESET=loan_documents
```

### Upload Preset Configuration

Create an upload preset in Cloudinary dashboard:

1. Go to Settings → Upload
2. Create new upload preset named `loan_documents`
3. Configure:
   - **Signing Mode**: Signed
   - **Allowed Formats**: pdf, jpg, jpeg, png, doc, docx
   - **Max File Size**: 10MB
   - **Folder**: `loan_applications`
   - **Tags**: `loan_document`
   - **Return Delete Token**: Enabled

### Folder Structure

Documents are organized in Cloudinary using this structure:

```
loan_applications/
├── {application_id}/
│   ├── tax_return_{timestamp}.pdf
│   ├── business_license_{timestamp}.pdf
│   ├── financial_statements_{timestamp}.pdf
│   └── bank_statements_{timestamp}.pdf
```

## Document Management Features

### File Validation

Automatic validation for:
- **File Size**: Maximum 10MB
- **File Types**: PDF, JPEG, PNG, Word documents
- **File Names**: Sanitized for safety

### Image Optimization

Automatic optimization for images:
- **Compression**: Optimized for web
- **Format Conversion**: Auto-convert to best format
- **Resizing**: Multiple sizes generated
- **Quality Control**: Balanced quality vs size

### Document Categories

Documents are categorized by type:
- `pdf`: PDF documents
- `image`: Image files (JPEG, PNG)
- `document`: Word documents (DOC, DOCX)
- `other`: Other file types

### URL Generation

Different URL types for different use cases:

```typescript
// Original document
const originalUrl = cloudinaryService.getDocumentUrl(publicId);

// Thumbnail (for images)
const thumbnailUrl = cloudinaryService.getThumbnailUrl(publicId, 200, 150);

// Download URL (PDF format)
const downloadUrl = cloudinaryService.getDownloadUrl(publicId);

// Custom transformation
const customUrl = cloudinaryService.getDocumentUrl(publicId, {
  width: 800,
  height: 600,
  quality: 90,
  format: 'auto'
});
```

## Security Features

### Access Control

- **Signed Uploads**: All uploads require signed URLs
- **Folder Isolation**: Documents isolated by application ID
- **API Key Security**: Server-side API calls for sensitive operations
- **Delete Tokens**: Secure deletion with signed tokens

### Data Protection

- **No Local Storage**: Documents stored only in Cloudinary
- **Metadata Only**: Database stores only metadata and URLs
- **Secure URLs**: All URLs use HTTPS
- **Access Logging**: All operations logged in database

## Setup Instructions

### 1. Database Setup

Run the Cloudinary integration SQL script:

```sql
-- Execute setup_cloudinary_integration.sql
```

This will:
- Add Cloudinary columns to loan_applications table
- Create helper functions
- Set up views and indexes
- Add triggers for data consistency

### 2. Cloudinary Setup

1. **Create Account**: Sign up for Cloudinary account
2. **Configure Upload Preset**: Create `loan_documents` preset
3. **Set Environment Variables**: Add required environment variables
4. **Test Integration**: Upload a test document

### 3. Frontend Setup

The Cloudinary service is ready to use:

```typescript
import { cloudinaryService } from '../lib/cloudinary/cloudinary-service';

// Service is automatically available as singleton
const service = cloudinaryService;
```

## Usage Examples

### Upload Multiple Documents

```typescript
const files = [file1, file2, file3];
const uploadPromises = files.map(file => 
  loanService.uploadDocument(applicationId, file, 'supporting_document')
);

const results = await Promise.all(uploadPromises);
```

### Get Document Analytics

```typescript
const analytics = await cloudinaryService.getDocumentAnalytics(applicationId);
console.log('Document analytics:', analytics);
/*
{
  totalDocuments: 3,
  totalSize: 2048576,
  documentTypes: { pdf: 2, image: 1 },
  uploadDates: ['2024-01-15', '2024-01-16', '2024-01-17']
}
*/
```

### Display Document List

```typescript
const documents = await loanService.getApplicationDocuments(applicationId);

documents.forEach(doc => {
  const icon = cloudinaryService.getDocumentTypeIcon(doc.format);
  const size = cloudinaryService.formatFileSize(doc.bytes);
  const isImage = cloudinaryService.isImageDocument(doc.resource_type, doc.format);
  
  console.log(`${icon} ${doc.document_name} (${size})`);
  
  if (isImage) {
    const thumbnail = cloudinaryService.getThumbnailUrl(doc.public_id);
    // Display thumbnail
  }
});
```

## Benefits of Cloudinary Integration

### Performance
- **CDN Delivery**: Global CDN for fast document access
- **Image Optimization**: Automatic compression and format selection
- **Caching**: Built-in caching for improved performance
- **Scalability**: Handle unlimited document uploads

### Features
- **Transformations**: Dynamic image resizing and effects
- **Analytics**: Detailed upload and usage statistics
- **Security**: Advanced security features and access control
- **Reliability**: 99.99% uptime guarantee

### Cost-Effectiveness
- **Pay-per-use**: Only pay for what you use
- **Free Tier**: Generous free tier for small applications
- **Optimization**: Reduced bandwidth costs through optimization
- **Storage**: Efficient storage with automatic optimization

## Migration from Supabase Storage

If migrating from Supabase Storage:

### 1. Export Existing Documents

```sql
-- Get existing document URLs
SELECT id, documents FROM loan_applications WHERE documents IS NOT NULL;
```

### 2. Upload to Cloudinary

Use the Cloudinary service to upload existing documents to Cloudinary.

### 3. Update Database

Run the Cloudinary integration script to add new columns and functions.

### 4. Update Frontend

Replace Supabase Storage calls with Cloudinary service calls.

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check API keys and cloud name
   - Verify upload preset exists
   - Check file size and type restrictions

2. **Signature Errors**
   - Ensure API secret is correct
   - Check timestamp synchronization
   - Verify signing mode in upload preset

3. **Access Denied**
   - Check CORS settings in Cloudinary
   - Verify API key permissions
   - Ensure upload preset is properly configured

### Debug Tips

```typescript
// Enable debug mode
cloudinaryService.setDebugMode(true);

// Check configuration
console.log('Cloudinary config:', {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
});

// Validate file before upload
const validation = cloudinaryService.validateFile(file);
if (!validation.valid) {
  console.error('File validation failed:', validation.error);
}
```

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Document view tracking
   - Download statistics
   - User engagement metrics

2. **AI Integration**
   - Document classification
   - Content extraction
   - Automated tagging

3. **Workflow Automation**
   - Document processing pipelines
   - Automated approvals
   - Notification systems

4. **Security Enhancements**
   - Watermarking
   - Access logging
   - Document expiration

## Support

For Cloudinary-specific issues:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Support](https://cloudinary.com/support)

For database integration issues:
- Check SQL script syntax
- Verify database permissions
- Review function signatures

For frontend integration issues:
- Check environment variables
- Verify API key configuration
- Review service implementation
