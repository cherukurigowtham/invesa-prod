-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create USERS table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'founder', 'builder', 'investor'
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    linkedin VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Create IDEAS table
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    founder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    stage VARCHAR(50) NOT NULL, -- 'Idea', 'Prototype', 'MVP', 'Scaling'
    team_slots TEXT[] DEFAULT '{}' NOT NULL,
    ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create JOIN_REQUESTS table
CREATE TABLE IF NOT EXISTS join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    builder_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Create INVESTOR_INTERESTS table
CREATE TABLE IF NOT EXISTS investor_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    investor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Create TEAM_MEMBERS table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(idea_id, user_id) -- User can join an idea team once
);

-- Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_ideas_founder_id ON ideas(founder_id);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_join_requests_idea_id ON join_requests(idea_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_builder_id ON join_requests(builder_id);
CREATE INDEX IF NOT EXISTS idx_investor_interests_idea_id ON investor_interests(idea_id);
CREATE INDEX IF NOT EXISTS idx_team_members_idea_id ON team_members(idea_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
