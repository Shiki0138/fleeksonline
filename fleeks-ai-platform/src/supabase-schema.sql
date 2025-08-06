-- Fleeks AI Beauty Platform - Supabase Schema
-- Multi-project compatible with prefix: beauty_

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings

-- Users table with AI preferences
CREATE TABLE beauty_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    encrypted_password TEXT,
    full_name TEXT,
    avatar_url TEXT,
    subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'trial', 'paid', 'cancelled')),
    subscription_id TEXT,
    subscription_expires_at TIMESTAMPTZ,
    ai_preferences JSONB DEFAULT '{}',
    biometric_data JSONB, -- Encrypted biometric templates
    trust_score NUMERIC(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

-- Videos table with AI metadata
CREATE TABLE beauty_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    youtube_id TEXT NOT NULL,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    category TEXT,
    tags TEXT[],
    ai_analysis JSONB DEFAULT '{}', -- Stores AI analysis results
    embedding vector(384), -- For semantic search
    view_count INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT true,
    preview_seconds INTEGER DEFAULT 300, -- 5 minutes preview
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- User interactions for AI learning
CREATE TABLE beauty_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES beauty_videos(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- 'view', 'like', 'share', 'complete'
    duration_watched INTEGER,
    context JSONB DEFAULT '{}', -- Device, location, time of day
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI recommendations
CREATE TABLE beauty_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES beauty_videos(id) ON DELETE CASCADE,
    score NUMERIC(3,2),
    reason TEXT,
    algorithm TEXT, -- collaborative, content-based, hybrid
    created_at TIMESTAMPTZ DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false,
    UNIQUE(user_id, video_id)
);

-- Community posts with AI moderation
CREATE TABLE beauty_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    images TEXT[],
    ai_moderation JSONB DEFAULT '{}', -- Toxicity scores, flags
    sentiment_score NUMERIC(3,2),
    is_visible BOOLEAN DEFAULT true,
    likes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI conversation threads
CREATE TABLE beauty_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
    thread_type TEXT NOT NULL, -- 'support', 'beauty_consultation', 'community'
    messages JSONB DEFAULT '[]',
    ai_context JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI challenges and gamification
CREATE TABLE beauty_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 100,
    requirements JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE beauty_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES beauty_challenges(id) ON DELETE CASCADE,
    progress NUMERIC(3,2) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- AI beauty profiles
CREATE TABLE beauty_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE CASCADE UNIQUE,
    skin_analysis JSONB DEFAULT '{}',
    style_preferences JSONB DEFAULT '{}',
    product_history JSONB DEFAULT '[]',
    ai_recommendations JSONB DEFAULT '[]',
    virtual_makeovers JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content scheduling with AI optimization
CREATE TABLE beauty_scheduled_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type TEXT NOT NULL, -- 'video', 'post', 'challenge'
    content_id UUID,
    scheduled_for TIMESTAMPTZ NOT NULL,
    ai_optimized_time BOOLEAN DEFAULT false,
    predicted_engagement NUMERIC(3,2),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security audit logs
CREATE TABLE beauty_security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES beauty_users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    risk_score NUMERIC(3,2),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_beauty_videos_embedding ON beauty_videos USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_beauty_interactions_user_video ON beauty_interactions(user_id, video_id);
CREATE INDEX idx_beauty_posts_user_created ON beauty_posts(user_id, created_at DESC);
CREATE INDEX idx_beauty_security_logs_user_created ON beauty_security_logs(user_id, created_at DESC);

-- Row Level Security Policies
ALTER TABLE beauty_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON beauty_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON beauty_users
    FOR UPDATE USING (auth.uid() = id);

-- Videos: Free users see preview, paid users see all
CREATE POLICY "Public can view video metadata" ON beauty_videos
    FOR SELECT USING (true);

-- Interactions: Users can only manage their own
CREATE POLICY "Users can create own interactions" ON beauty_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON beauty_interactions
    FOR SELECT USING (auth.uid() = user_id);

-- Posts: Public read, authenticated write
CREATE POLICY "Public can view visible posts" ON beauty_posts
    FOR SELECT USING (is_visible = true);

CREATE POLICY "Authenticated users can create posts" ON beauty_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON beauty_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Conversations: Private to user
CREATE POLICY "Users can manage own conversations" ON beauty_conversations
    FOR ALL USING (auth.uid() = user_id);

-- Profiles: Private to user
CREATE POLICY "Users can manage own beauty profile" ON beauty_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Functions for AI operations
CREATE OR REPLACE FUNCTION beauty_similarity_search(query_embedding vector(384), match_count int = 10)
RETURNS TABLE(id UUID, title TEXT, similarity float)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.title,
        1 - (v.embedding <=> query_embedding) as similarity
    FROM beauty_videos v
    WHERE v.embedding IS NOT NULL
    ORDER BY v.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_beauty_users_updated_at BEFORE UPDATE ON beauty_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beauty_videos_updated_at BEFORE UPDATE ON beauty_videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beauty_posts_updated_at BEFORE UPDATE ON beauty_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beauty_conversations_updated_at BEFORE UPDATE ON beauty_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beauty_profiles_updated_at BEFORE UPDATE ON beauty_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();