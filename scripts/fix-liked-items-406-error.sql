-- Fix Liked Items 406 Error - Complete Solution

-- Step 1: Check if liked_items table exists and drop if needed
DROP TABLE IF EXISTS liked_items CASCADE;

-- Step 2: Create liked_items table with proper structure
CREATE TABLE liked_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'store', 'partner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, item_type)
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_liked_items_user_id ON liked_items(user_id);
CREATE INDEX idx_liked_items_item_id ON liked_items(item_id);
CREATE INDEX idx_liked_items_item_type ON liked_items(item_type);
CREATE INDEX idx_liked_items_user_item_type ON liked_items(user_id, item_type);

-- Step 4: Enable Row Level Security
ALTER TABLE liked_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
-- Policy 1: Users can view their own liked items
CREATE POLICY "Users can view their own liked items" 
ON liked_items FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own liked items
CREATE POLICY "Users can insert their own liked items" 
ON liked_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own liked items
CREATE POLICY "Users can update their own liked items" 
ON liked_items FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy 4: Users can delete their own liked items
CREATE POLICY "Users can delete their own liked items" 
ON liked_items FOR DELETE 
USING (auth.uid() = user_id);

-- Step 6: Grant access to authenticated users
GRANT ALL ON liked_items TO authenticated;

-- Step 7: Insert some test data (optional - uncomment if needed)
-- INSERT INTO liked_items (user_id, item_id, item_type) VALUES
-- ('4b3628ab-bd6a-424e-b99a-857d6c9a7fbc', 'd437c33e-5391-469d-9b9d-1f99ab3325a7', 'product'),
-- ('4b3628ab-bd6a-424e-b99a-857d6c9a7fbc', '8d821102-703f-467f-9a53-c15f56fdf1bd', 'product');

COMMIT;
