-- STEP 1: Create liked_items table with proper RLS
-- Run this in Supabase SQL Editor FIRST

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS liked_items CASCADE;

-- Create the table with proper structure
CREATE TABLE liked_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'store', 'partner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, item_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_liked_items_user_id ON liked_items(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_id ON liked_items(item_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_type ON liked_items(item_type);
CREATE INDEX IF NOT EXISTS idx_liked_items_user_item_type ON liked_items(user_id, item_type);

-- Enable Row Level Security
ALTER TABLE liked_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using a transaction to avoid race conditions
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own liked items" ON liked_items;
    DROP POLICY IF EXISTS "Users can insert their own liked items" ON liked_items;
    DROP POLICY IF EXISTS "Users can update their own liked items" ON liked_items;
    DROP POLICY IF EXISTS "Users can delete their own liked items" ON liked_items;
    
    -- Create new policies
    CREATE POLICY "Users can view their own liked items" 
    ON liked_items FOR SELECT 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can insert their own liked items" 
    ON liked_items FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Users can update their own liked items" 
    ON liked_items FOR UPDATE 
    USING (auth.uid() = user_id);
    
    CREATE POLICY "Users can delete their own liked items" 
    ON liked_items FOR DELETE 
    USING (auth.uid() = user_id);
END $$;

-- Grant permissions to authenticated users
GRANT ALL ON liked_items TO authenticated;

-- Verify table creation
SELECT 
    'liked_items table created successfully' as status,
    COUNT(*) as total_rows
FROM liked_items;
