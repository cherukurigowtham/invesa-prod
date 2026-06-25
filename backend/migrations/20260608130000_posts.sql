-- Create IDEA_POSTS table
CREATE TABLE IF NOT EXISTS idea_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    post_type VARCHAR(50) NOT NULL CHECK (post_type IN ('update','milestone','media','announcement')),
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    likes INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_idea_posts_idea_id ON idea_posts(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_posts_created_at ON idea_posts(created_at DESC);

-- Create POST_LIKES table to track who liked which post (enables toggling)
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID REFERENCES idea_posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (post_id, user_id)
);
