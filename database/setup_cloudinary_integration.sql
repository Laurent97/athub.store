-- Setup for Cloudinary integration with loan applications
-- This creates the database structure to work with Cloudinary for document storage

-- Update loan_applications table to work with Cloudinary URLs
-- (This assumes the loan_applications table already exists)

-- Add Cloudinary-specific columns if they don't exist
ALTER TABLE loan_applications 
ADD COLUMN IF NOT EXISTS cloudinary_public_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cloudinary_secure_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cloudinary_resource_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cloudinary_formats TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cloudinary_sizes JSONB DEFAULT '{}';

-- Create function to add Cloudinary document metadata
CREATE OR REPLACE FUNCTION add_cloudinary_document(
    p_application_id UUID,
    p_public_id TEXT,
    p_secure_url TEXT,
    p_resource_type TEXT,
    p_format TEXT,
    p_size_bytes INTEGER,
    p_document_name TEXT,
    p_document_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_public_ids TEXT[];
    current_secure_urls TEXT[];
    current_resource_types TEXT[];
    current_formats TEXT[];
    current_sizes JSONB;
    new_document JSONB;
BEGIN
    -- Get current Cloudinary data
    SELECT 
        cloudinary_public_ids,
        cloudinary_secure_urls,
        cloudinary_resource_types,
        cloudinary_formats,
        cloudinary_sizes
    INTO 
        current_public_ids,
        current_secure_urls,
        current_resource_types,
        current_formats,
        current_sizes
    FROM loan_applications
    WHERE id = p_application_id;
    
    -- Create new document metadata
    new_document := jsonb_build_object(
        'public_id', p_public_id,
        'secure_url', p_secure_url,
        'resource_type', p_resource_type,
        'format', p_format,
        'size_bytes', p_size_bytes,
        'document_name', p_document_name,
        'document_type', p_document_type,
        'uploaded_at', NOW()
    );
    
    -- Update arrays and JSON
    UPDATE loan_applications
    SET 
        cloudinary_public_ids = array_append(current_public_ids, p_public_id),
        cloudinary_secure_urls = array_append(current_secure_urls, p_secure_url),
        cloudinary_resource_types = array_append(current_resource_types, p_resource_type),
        cloudinary_formats = array_append(current_formats, p_format),
        cloudinary_sizes = jsonb_set(
            COALESCE(cloudinary_sizes, '{}'::jsonb),
            p_public_id::text,
            new_document
        ),
        updated_at = NOW()
    WHERE id = p_application_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove Cloudinary document
CREATE OR REPLACE FUNCTION remove_cloudinary_document(
    p_application_id UUID,
    p_public_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_public_ids TEXT[];
    current_secure_urls TEXT[];
    current_resource_types TEXT[];
    current_formats TEXT[];
    current_sizes JSONB;
    index_to_remove INTEGER;
BEGIN
    -- Get current Cloudinary data
    SELECT 
        cloudinary_public_ids,
        cloudinary_secure_urls,
        cloudinary_resource_types,
        cloudinary_formats,
        cloudinary_sizes
    INTO 
        current_public_ids,
        current_secure_urls,
        current_resource_types,
        current_formats,
        current_sizes
    FROM loan_applications
    WHERE id = p_application_id;
    
    -- Find index of the public_id to remove
    SELECT array_position(current_public_ids, p_public_id)
    INTO index_to_remove;
    
    IF index_to_remove IS NOT NULL THEN
        -- Remove from arrays
        UPDATE loan_applications
        SET 
            cloudinary_public_ids = array_remove(current_public_ids, p_public_id),
            cloudinary_secure_urls = array_remove(current_secure_urls, current_secure_urls[index_to_remove]),
            cloudinary_resource_types = array_remove(current_resource_types, current_resource_types[index_to_remove]),
            cloudinary_formats = array_remove(current_formats, current_formats[index_to_remove]),
            cloudinary_sizes = cloudinary_sizes - p_public_id,
            updated_at = NOW()
        WHERE id = p_application_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create view for loan application documents with Cloudinary metadata
CREATE OR REPLACE VIEW v_loan_application_cloudinary_documents AS
SELECT 
    la.id as application_id,
    la.application_number,
    la.business_name,
    la.user_id,
    la.status,
    -- Extract document info from JSON
    (key).key as public_id,
    (value).value->>'document_name' as document_name,
    (value).value->>'document_type' as document_type,
    (value).value->>'secure_url' as document_url,
    (value).value->>'resource_type' as resource_type,
    (value).value->>'format' as format,
    (value).value->>'size_bytes' as size_bytes,
    (value).value->>'uploaded_at' as uploaded_at
FROM loan_applications la,
     jsonb_each_text(la.cloudinary_sizes) as key,
     jsonb_each(la.cloudinary_sizes) as value
WHERE la.cloudinary_sizes IS NOT NULL AND jsonb_typeof(la.cloudinary_sizes) = 'object';

-- Grant access to the Cloudinary documents view
GRANT SELECT ON v_loan_application_cloudinary_documents TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_cloudinary_document TO authenticated;
GRANT EXECUTE ON FUNCTION remove_cloudinary_document TO authenticated;

-- Create function to get document statistics
CREATE OR REPLACE FUNCTION get_loan_document_statistics()
RETURNS TABLE(
    total_applications BIGINT,
    applications_with_documents BIGINT,
    total_documents BIGINT,
    total_size_bytes BIGINT,
    avg_size_bytes NUMERIC,
    document_types JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_applications,
        COUNT(*) FILTER (WHERE cloudinary_public_ids IS NOT NULL AND array_length(cloudinary_public_ids, 1) > 0) as applications_with_documents,
        COALESCE(array_length(cloudinary_public_ids, 1), 0) as total_documents,
        COALESCE(
            (SELECT SUM((value->>'size_bytes')::BIGINT) 
             FROM loan_applications, 
                  jsonb_each(cloudinary_sizes) as value
             WHERE cloudinary_sizes IS NOT NULL), 0
        ) as total_size_bytes,
        COALESCE(
            (SELECT AVG((value->>'size_bytes')::NUMERIC) 
             FROM loan_applications, 
                  jsonb_each(cloudinary_sizes) as value
             WHERE cloudinary_sizes IS NOT NULL), 0
        ) as avg_size_bytes,
        COALESCE(
            (SELECT jsonb_object_agg(
                     (value->>'document_type'), 
                     COUNT(*)
                 ) 
             FROM loan_applications, 
                  jsonb_each(cloudinary_sizes) as value
             WHERE cloudinary_sizes IS NOT NULL), 
            '{}'::jsonb
        ) as document_types
    FROM loan_applications;
END;
$$ LANGUAGE plpgsql;

-- Grant access to statistics function
GRANT EXECUTE ON FUNCTION get_loan_document_statistics TO authenticated;

-- Create trigger to ensure Cloudinary arrays are properly initialized
CREATE OR REPLACE FUNCTION ensure_cloudinary_arrays()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure Cloudinary arrays are not null
    IF NEW.cloudinary_public_ids IS NULL THEN
        NEW.cloudinary_public_ids := '{}';
    END IF;
    IF NEW.cloudinary_secure_urls IS NULL THEN
        NEW.cloudinary_secure_urls := '{}';
    END IF;
    IF NEW.cloudinary_resource_types IS NULL THEN
        NEW.cloudinary_resource_types := '{}';
    END IF;
    IF NEW.cloudinary_formats IS NULL THEN
        NEW.cloudinary_formats := '{}';
    END IF;
    IF NEW.cloudinary_sizes IS NULL THEN
        NEW.cloudinary_sizes := '{}'::jsonb;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize Cloudinary arrays
CREATE TRIGGER ensure_loan_applications_cloudinary_arrays
    BEFORE INSERT OR UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION ensure_cloudinary_arrays();

-- Add indexes for Cloudinary-related queries
CREATE INDEX IF NOT EXISTS idx_loan_applications_cloudinary_public_ids ON loan_applications USING GIN(cloudinary_public_ids);
CREATE INDEX IF NOT EXISTS idx_loan_applications_cloudinary_sizes ON loan_applications USING GIN(cloudinary_sizes);

-- Comments for documentation
COMMENT ON COLUMN loan_applications.cloudinary_public_ids IS 'Array of Cloudinary public IDs for uploaded documents';
COMMENT ON COLUMN loan_applications.cloudinary_secure_urls IS 'Array of Cloudinary secure URLs for uploaded documents';
COMMENT ON COLUMN loan_applications.cloudinary_resource_types IS 'Array of Cloudinary resource types (image, raw, etc.)';
COMMENT ON COLUMN loan_applications.cloudinary_formats IS 'Array of file formats (jpg, pdf, etc.)';
COMMENT ON COLUMN loan_applications.cloudinary_sizes IS 'JSON object with detailed document metadata';
COMMENT ON FUNCTION add_cloudinary_document IS 'Adds Cloudinary document metadata to a loan application';
COMMENT ON FUNCTION remove_cloudinary_document IS 'Removes Cloudinary document metadata from a loan application';
COMMENT ON VIEW v_loan_application_cloudinary_documents IS 'View showing all loan application documents with Cloudinary metadata';
COMMENT ON FUNCTION get_loan_document_statistics IS 'Returns statistics about uploaded loan documents';
