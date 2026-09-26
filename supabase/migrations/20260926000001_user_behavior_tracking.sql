-- ==============================================================================
-- SUPABASE POSTGRESQL MIGRATION: User Behavior Tracking & Scalable Recommendations
-- Version: 20260926000001
-- Target: Supabase / PostgreSQL 15+
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. ENUMS & DOMAINS
-- ==============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'interaction_type_enum') THEN
        CREATE TYPE interaction_type_enum AS ENUM (
            'product_view',
            'product_click',
            'category_view',
            'brand_view',
            'search',
            'add_to_cart',
            'remove_from_cart',
            'wishlist',
            'transaction'
        );
    END IF;
END $$;

-- ==============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 4.1. PROFILES (Linked to Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_id TEXT UNIQUE, -- Cross-link for legacy/demo RetailRocket visitor IDs (e.g. '1000294')
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'shopper' CHECK (role IN ('shopper', 'admin', 'analyst')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4.2. PRODUCTS (Preserves existing catalog & supports string IDs like '48030')
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- Stores existing IDs ('48030', '89323') or UUIDs
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    formatted_price TEXT, -- Formatted currency e.g. '₹29,990'
    image_url TEXT,
    description TEXT,
    stock INTEGER DEFAULT 100 NOT NULL CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4.3. PRODUCT INTERACTIONS (User engagement & behavioral events)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    interaction_type interaction_type_enum NOT NULL,
    session_id TEXT,
    category TEXT,
    brand TEXT,
    price_at_interaction NUMERIC(12, 2),
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4.4. CART ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    price_at_addition NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_cart_product UNIQUE (user_id, product_id)
);

CREATE TRIGGER set_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4.5. USER PREFERENCES (Aggregated behavioral profiles)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_min_price NUMERIC(12, 2) DEFAULT 0.00,
    preferred_max_price NUMERIC(12, 2),
    preferred_price_average NUMERIC(12, 2),
    preferred_categories JSONB DEFAULT '[]'::jsonb, -- e.g. [{"category": "Audio", "weight": 0.85}]
    preferred_brands JSONB DEFAULT '[]'::jsonb,     -- e.g. [{"brand": "Sony", "weight": 0.90}]
    top_category TEXT,
    top_brand TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER set_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 4.6. RECOMMENDATIONS (Personalized hybrid recommendation scores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ranking_score NUMERIC(10, 6) NOT NULL,
    price_match_score NUMERIC(10, 6) DEFAULT 0.0,
    category_score NUMERIC(10, 6) DEFAULT 0.0,
    brand_score NUMERIC(10, 6) DEFAULT 0.0,
    interaction_score NUMERIC(10, 6) DEFAULT 0.0,
    cart_score NUMERIC(10, 6) DEFAULT 0.0,
    ml_score NUMERIC(10, 6) DEFAULT 0.0, -- SVD / Latent dot product score
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4.7. PREDICTION HISTORY (Audit trail & ML model explanations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL, -- e.g. 'collaborative_filtering_svd', 'churn_propensity', 'price_elasticity'
    prediction_result JSONB NOT NULL,
    confidence NUMERIC(6, 4),
    input_features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- 5. INDEXES & QUERY OPTIMIZATION
-- ==============================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_price ON public.products(category, price);

-- Product interactions indexes (frequently queried & real-time analytics)
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON public.product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_product_id ON public.product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON public.product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.product_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_category ON public.product_interactions(category);
CREATE INDEX IF NOT EXISTS idx_interactions_brand ON public.product_interactions(brand);
CREATE INDEX IF NOT EXISTS idx_interactions_session ON public.product_interactions(session_id);

-- Composite indexes for ML aggregation & user history queries
CREATE INDEX IF NOT EXISTS idx_interactions_user_created ON public.product_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_user_type_created ON public.product_interactions(user_id, interaction_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_product_type ON public.product_interactions(product_id, interaction_type);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_created_at ON public.cart_items(created_at DESC);

-- Recommendations indexes (high-speed ranking lookup)
CREATE INDEX IF NOT EXISTS idx_rec_user_ranking ON public.recommendations(user_id, ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_rec_product_id ON public.recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_rec_created_at ON public.recommendations(created_at DESC);

-- Prediction history indexes
CREATE INDEX IF NOT EXISTS idx_pred_user_id ON public.prediction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_pred_type ON public.prediction_history(prediction_type);
CREATE INDEX IF NOT EXISTS idx_pred_created_at ON public.prediction_history(created_at DESC);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6.1. Products Policies (Publicly readable, admin manageable)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
CREATE POLICY "Products are publicly readable"
    ON public.products FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Service role full access on products" ON public.products;
CREATE POLICY "Service role full access on products"
    ON public.products FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- ------------------------------------------------------------------------------
-- 6.2. Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 6.3. Product Interactions Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own interactions" ON public.product_interactions;
CREATE POLICY "Users can read own interactions"
    ON public.product_interactions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own interactions" ON public.product_interactions;
CREATE POLICY "Users can insert own interactions"
    ON public.product_interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ------------------------------------------------------------------------------
-- 6.4. Cart Items Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own cart" ON public.cart_items;
CREATE POLICY "Users can read own cart"
    ON public.cart_items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;
CREATE POLICY "Users can manage own cart items"
    ON public.cart_items FOR ALL
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6.5. User Preferences Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own preferences" ON public.user_preferences;
CREATE POLICY "Users can read own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6.6. Recommendations Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own recommendations" ON public.recommendations;
CREATE POLICY "Users can read own recommendations"
    ON public.recommendations FOR SELECT
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 6.7. Prediction History Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own predictions" ON public.prediction_history;
CREATE POLICY "Users can read own predictions"
    ON public.prediction_history FOR SELECT
    USING (auth.uid() = user_id);

-- ==============================================================================
-- 7. AUTH TRIGGER: Auto-create profile on signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Shopper'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. INITIAL CATALOG SEEDING (Matches existing RetailRocket dataset products)
-- ==============================================================================
INSERT INTO public.products (id, name, category, brand, price, formatted_price, image_url)
VALUES 
    ('48030', 'Sony WH-1000XM5 Wireless Headphones', 'Audio & Electronics', 'Sony', 29990.00, '₹29,990', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80'),
    ('89323', 'Apple Watch Series 9 Smartwatch', 'Wearable Tech', 'Apple', 41900.00, '₹41,900', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'),
    ('228644', 'Herschel Supply Co. Everyday Backpack', 'Bags & Travel', 'Herschel', 6499.00, '₹6,499', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80'),
    ('291877', 'Logitech MX Master 3S Wireless Mouse', 'Computer Accessories', 'Logitech', 8995.00, '₹8,995', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80'),
    ('65273', 'Samsung Galaxy Tab S9 Ultra', 'Tablets & Computers', 'Samsung', 108999.00, '₹1,08,999', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop&q=80'),
    ('294676', 'Apple MacBook Pro 16-inch M3', 'Laptops', 'Apple', 249900.00, '₹2,49,900', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop&q=80'),
    ('310944', 'Keychron K2 Mechanical Gaming Keyboard', 'Gaming Peripherals', 'Keychron', 9499.00, '₹9,499', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80'),
    ('9877', 'JBL Charge 5 Portable Bluetooth Speaker', 'Audio Systems', 'JBL', 14999.00, '₹14,999', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=80'),
    ('148103', 'Sony WF-1000XM5 True Wireless Earbuds', 'Audio & Electronics', 'Sony', 19990.00, '₹19,990', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&auto=format&fit=crop&q=80'),
    ('166306', 'Canon EOS R6 Mark II Mirrorless Camera', 'Cameras & Optics', 'Canon', 215995.00, '₹2,15,995', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80'),
    ('215503', 'Nike Air Max 270 Sport Running Shoes', 'Footwear & Apparel', 'Nike', 12995.00, '₹12,995', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80'),
    ('24059', 'Bose QuietComfort Ultra Headphones', 'Audio & Electronics', 'Bose', 35900.00, '₹35,900', 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop&q=80'),
    ('255908', 'Dell UltraSharp 27 4K USB-C Monitor', 'Monitors & Displays', 'Dell', 49990.00, '₹49,990', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=80'),
    ('279531', 'Anker 737 Power Bank 24,000mAh', 'Mobile Accessories', 'Anker', 11999.00, '₹11,999', 'https://images.unsplash.com/photo-1609592424079-24751433f81e?w=500&auto=format&fit=crop&q=80'),
    ('347226', 'Kindle Paperwhite Signature Edition', 'E-Readers & Tablets', 'Amazon Kindle', 14999.00, '₹14,999', 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=500&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    brand = EXCLUDED.brand,
    price = EXCLUDED.price,
    formatted_price = EXCLUDED.formatted_price,
    image_url = EXCLUDED.image_url;
