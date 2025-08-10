-- FLEEKS Platform Database Schema
-- Run this in your new Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS video_access_logs CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with membership tiers
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'premium', 'enterprise')),
    phone_number TEXT,
    salon_name TEXT,
    salon_address TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create video access logs for tracking viewing
CREATE TABLE video_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    video_title TEXT,
    watch_duration INTEGER DEFAULT 0, -- in seconds
    total_duration INTEGER, -- video total duration in seconds
    watch_percentage DECIMAL(5,2) DEFAULT 0, -- percentage watched
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    square_subscription_id TEXT UNIQUE,
    square_customer_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending', 'trial')),
    tier TEXT NOT NULL CHECK (tier IN ('basic', 'premium', 'enterprise')),
    price_per_month INTEGER, -- in yen
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payment history table
CREATE TABLE payment_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    square_payment_id TEXT UNIQUE,
    amount INTEGER NOT NULL, -- in yen
    currency TEXT DEFAULT 'JPY',
    status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
    payment_method TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create videos metadata table
CREATE TABLE videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    youtube_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    duration INTEGER, -- in seconds
    category TEXT,
    tags TEXT[],
    instructor_name TEXT,
    membership_required TEXT DEFAULT 'free' CHECK (membership_required IN ('free', 'basic', 'premium', 'enterprise')),
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_membership_tier ON users(membership_tier);
CREATE INDEX idx_video_access_logs_user_id ON video_access_logs(user_id);
CREATE INDEX idx_video_access_logs_video_id ON video_access_logs(video_id);
CREATE INDEX idx_video_access_logs_created_at ON video_access_logs(created_at DESC);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_videos_membership_required ON videos(membership_required);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for video_access_logs table
CREATE POLICY "Users can view own video logs" ON video_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video logs" ON video_access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for payment_history table
CREATE POLICY "Users can view own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for videos table (public read, admin write)
CREATE POLICY "Anyone can view active videos" ON videos
    FOR SELECT USING (is_active = true);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to check video access permission
CREATE OR REPLACE FUNCTION check_video_access(
    p_user_id UUID,
    p_video_id TEXT,
    p_required_tier TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_tier TEXT;
    v_tier_hierarchy JSONB := '{"free": 0, "basic": 1, "premium": 2, "enterprise": 3}'::JSONB;
BEGIN
    -- Get user's membership tier
    SELECT membership_tier INTO v_user_tier
    FROM users
    WHERE id = p_user_id;
    
    -- If user not found, deny access
    IF v_user_tier IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user's tier is sufficient
    RETURN (v_tier_hierarchy->>v_user_tier)::INTEGER >= (v_tier_hierarchy->>p_required_tier)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Create function to log video access
CREATE OR REPLACE FUNCTION log_video_access(
    p_user_id UUID,
    p_video_id TEXT,
    p_video_title TEXT,
    p_watch_duration INTEGER,
    p_total_duration INTEGER
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO video_access_logs (
        user_id,
        video_id,
        video_title,
        watch_duration,
        total_duration,
        watch_percentage
    ) VALUES (
        p_user_id,
        p_video_id,
        p_video_title,
        p_watch_duration,
        p_total_duration,
        CASE 
            WHEN p_total_duration > 0 THEN (p_watch_duration::DECIMAL / p_total_duration::DECIMAL * 100)
            ELSE 0
        END
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (remove in production)
-- Sample videos
INSERT INTO videos (youtube_id, title, description, duration, category, membership_required, is_featured) VALUES
('dQw4w9WgXcQ', 'Basic Hair Cutting Techniques', 'Learn fundamental hair cutting techniques', 600, 'Hair Cutting', 'free', true),
('watch?v=abc123', 'Advanced Color Theory', 'Master the art of hair coloring', 1800, 'Hair Coloring', 'basic', true),
('watch?v=def456', 'Salon Management Excellence', 'Build a successful salon business', 2400, 'Business', 'premium', false),
('watch?v=ghi789', 'Japanese Hair Styling Mastery', 'Traditional and modern Japanese styles', 3600, 'Styling', 'enterprise', false);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;