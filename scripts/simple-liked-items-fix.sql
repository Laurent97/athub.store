-- Simple SQL script to create liked_items table with RLS policies

-- Step 1: Drop existing table if it exists
DROP TABLE IF EXISTS liked_items CASCADE;

-- Step 2: Create liked_items table
CREATE TABLE liked_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN ('product', 'store', 'partner')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id, item_type)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_liked_items_user_id ON liked_items(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_id ON liked_items(item_id);
CREATE INDEX IF NOT EXISTS idx_liked_items_item_type ON liked_items(item_type);
CREATE INDEX IF NOT EXISTS idx_liked_items_user_item_type ON liked_items(user_id, item_type);

-- Step 4: Enable Row Level Security
ALTER TABLE liked_items ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
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

-- Step 6: Grant permissions to authenticated users
GRANT ALL ON liked_items TO authenticated;

-- Step 7: Insert test data (optional)
INSERT INTO liked_items (user_id, item_id, item_type) VALUES
('4b3628ab-bd6a-424e-b99a-857d6c9a7fbc', 'd437c33e-5391-469d-9b9d-1f99ab3325a7', 'product'),
('4b3628ab-bd6a-424e-b99a-857d6c9a7fbc', '8d821102-703f-467f-9a53-c15f56fdf1bd', 'product');

-- Step 8: Verify table creation
SELECT 
    'liked_items table created successfully' as status,
    COUNT(*) as total_rows
FROM liked_items;

COMMIT;
