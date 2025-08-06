# 🚨 FLEEKS SECURITY REMEDIATION GUIDE
**CRITICAL: Follow these steps immediately to secure the Fleeks platform**

## 📅 Security Incident Summary
- **Date**: 2025-08-06
- **Issue**: Exposed Supabase credentials in `.env.local` file
- **Severity**: CRITICAL
- **Status**: REMEDIATION IN PROGRESS

## 🔐 Immediate Actions Required

### 1. Create New Supabase Project
```bash
# Visit https://app.supabase.com
# Create new project with name: fleeks-production-v2
# Region: Japan (Tokyo) for optimal performance
# Database Password: Generate strong password (min 16 chars)
```

### 2. Required Environment Variables
Create new `.env.local` file with these variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_new_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=https://fleeks.jp
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Square Payment API
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=production

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@fleeks.jp

# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Security Headers
ENCRYPTION_KEY=generate_with_openssl_rand_hex_32
JWT_SECRET=generate_with_openssl_rand_base64_64
```

### 3. Generate Secure Keys
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32

# Generate JWT_SECRET
openssl rand -base64 64
```

### 4. Update Supabase Database Schema
Run these SQL commands in your new Supabase project:

```sql
-- Users table with membership tiers
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'premium', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Video access logs
CREATE TABLE video_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    watch_duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    square_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    tier TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own video logs" ON video_access_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video logs" ON video_access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);
```

### 5. Vercel Environment Variables
Add these to your Vercel project settings:

1. Go to https://vercel.com/your-team/fleeks/settings/environment-variables
2. Add all variables from `.env.local`
3. Set appropriate scopes (Production, Preview, Development)

### 6. Security Best Practices Implemented

#### 🛡️ Authentication Security
- [ ] JWT tokens with 1-hour expiration
- [ ] Refresh token rotation
- [ ] CSRF protection enabled
- [ ] Secure cookie settings

#### 🔒 API Security
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention via parameterized queries
- [ ] XSS protection headers

#### 📊 Monitoring & Logging
- [ ] Failed login attempt tracking
- [ ] Suspicious activity alerts
- [ ] API usage monitoring
- [ ] Error tracking with Sentry

### 7. Post-Remediation Checklist
- [ ] Revoke old Supabase project access
- [ ] Update all API keys in production
- [ ] Clear all browser caches
- [ ] Invalidate existing JWT tokens
- [ ] Notify users of security update (if needed)
- [ ] Run security audit
- [ ] Update security documentation

## 🚦 Verification Steps

1. **Test Authentication Flow**
   ```bash
   npm run dev
   # Test login/logout
   # Verify JWT token generation
   # Check session persistence
   ```

2. **Verify Database Access**
   ```bash
   # Check RLS policies
   # Test CRUD operations
   # Verify user isolation
   ```

3. **API Security Test**
   ```bash
   # Test rate limiting
   # Verify CORS settings
   # Check API key validation
   ```

## 📞 Emergency Contacts
- Security Team: security@fleeks.jp
- DevOps Lead: devops@fleeks.jp
- CTO: cto@fleeks.jp

## 📝 Incident Log
- 2025-08-06 08:27 - Security breach identified
- 2025-08-06 08:30 - Remediation started
- [TO BE UPDATED] - New Supabase project created
- [TO BE UPDATED] - Environment variables rotated
- [TO BE UPDATED] - Production deployment updated

---
**Remember**: Security is an ongoing process. Regular audits and updates are essential.