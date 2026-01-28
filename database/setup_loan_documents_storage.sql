-- Setup storage bucket for loan application documents
-- This creates the storage bucket and policies for managing loan documents

-- Create storage bucket for loan documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'loan_documents', 
    'loan_documents', 
    false, 
    10485760, -- 10MB limit per file
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create policies for loan documents storage

-- Policy for authenticated users to upload documents to their own application folder
CREATE POLICY "Users can upload loan documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'loan_documents' AND
        auth.role() = 'authenticated' AND
        -- Extract application_id from the path (format: application_id/filename)
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM loan_applications WHERE user_id = auth.uid()
        )
    );

-- Policy for users to view their own loan documents
CREATE POLICY "Users can view own loan documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'loan_documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM loan_applications WHERE user_id = auth.uid()
        )
    );

-- Policy for users to update their own loan documents
CREATE POLICY "Users can update own loan documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'loan_documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM loan_applications WHERE user_id = auth.uid()
        )
    );

-- Policy for users to delete their own loan documents
CREATE POLICY "Users can delete own loan documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'loan_documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM loan_applications WHERE user_id = auth.uid()
        )
    );

-- Policy for admins to manage all loan documents
CREATE POLICY "Admins can manage all loan documents" ON storage.objects
    FOR ALL USING (
        bucket_id = 'loan_documents' AND
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND user_type = 'admin'
        )
    );

-- Grant permissions on the storage bucket
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- Create helper function to extract folder name from storage path
CREATE OR REPLACE FUNCTION storage.foldername(path text)
RETURNS text[] AS $$
BEGIN
    RETURN string_to_array(path, '/');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for loan application documents with metadata
CREATE OR REPLACE VIEW v_loan_application_documents AS
SELECT 
    la.id as application_id,
    la.application_number,
    la.business_name,
    la.user_id,
    la.status,
    doc.name as document_name,
    doc.type as document_type,
    doc.url as document_url,
    doc.uploaded_at,
    doc.size as document_size
FROM loan_applications la,
     jsonb_array_elements(la.documents) as doc
WHERE la.documents IS NOT NULL;

-- Grant access to the documents view
GRANT SELECT ON v_loan_application_documents TO authenticated;
