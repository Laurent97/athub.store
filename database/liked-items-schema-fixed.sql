-- Liked Items Database Schema - Safe Migration
-- Run these SQL commands in your Supabase SQL Editor

-- First, let's check what columns currently exist and add missing ones
DO $$
BEGIN
    -- Check if table exists, create if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'liked_items'
    ) THEN
        CREATE TABLE liked_items (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            item_id VARCHAR(255) NOT NULL,
            item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'service', 'post', 'store')),
            item_data JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new liked_items table';
    ELSE
        RAISE NOTICE 'liked_items table already exists, checking columns...';
        
        -- Add missing columns one by one
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liked_items' 
            AND column_name = 'item_data'
        ) THEN
            ALTER TABLE liked_items ADD COLUMN item_data JSONB DEFAULT '{}';
            RAISE NOTICE 'Added item_data column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liked_items' 
            AND column_name = 'created_at'
        ) THEN
            ALTER TABLE liked_items ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added created_at column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liked_items' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE liked_items ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column';
        END IF;
        
        -- If liked_at doesn't exist but created_at does, copy data
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liked_items' 
            AND column_name = 'created_at'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'liked_items' 
            AND column_name = 'liked_at'
        ) THEN
            ALTER TABLE liked_items ADD COLUMN liked_at TIMESTAMP WITH TIME ZONE;
            UPDATE liked_items SET liked_at = created_at WHERE liked_at IS NULL;
            RAISE NOTICE 'Added liked_at column and copied data from created_at';
        END IF;
    END IF;
END $$;

-- Create indexes for better performance (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_liked_items_user_id ON liked_items(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_id ON liked_items(item_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_type ON liked_items(item_type);
CREATE INDEX IF NOT EXISTS idx_liked_items_created_at ON liked_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_liked_items_liked_at ON liked_items(liked_at DESC);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_data_gin ON liked_items USING GIN (item_data);

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE liked_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own liked items" ON liked_items;
DROP POLICY IF EXISTS "Users can insert their own liked items" ON liked_items;
DROP POLICY IF EXISTS "Users can update their own liked items" ON liked_items;
DROP POLICY IF EXISTS "Users can delete their own liked items" ON liked_items;

-- RLS Policies
CREATE POLICY "Users can view their own liked items" ON liked_items
    FOR SELECT USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can insert their own liked items" ON liked_items
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "Users can update their own liked items" ON liked_items
    FOR UPDATE USING (
        auth.uid() = user_id
    );

CREATE POLICY "Users can delete their own liked items" ON liked_items
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_liked_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_liked_items_updated_at_trigger ON liked_items;
CREATE TRIGGER update_liked_items_updated_at_trigger
    BEFORE UPDATE ON liked_items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_liked_items_updated_at();

-- Grant necessary permissions
GRANT ALL ON liked_items TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create view for liked items with extracted data (optional helper)
DROP VIEW IF EXISTS liked_items_view;
CREATE OR REPLACE VIEW liked_items_view AS
SELECT 
    li.*,
    li.item_data->>'title' as title,
    li.item_data->>'description' as description,
    (li.item_data->>'price')::numeric as price,
    (li.item_data->>'original_price')::numeric as original_price,
    li.item_data->>'image' as image,
    li.item_data->>'category' as category,
    li.item_data->>'make' as make,
    li.item_data->>'model' as model,
    li.item_data->>'status' as status
FROM liked_items li;
