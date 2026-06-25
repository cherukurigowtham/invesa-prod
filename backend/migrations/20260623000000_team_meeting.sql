-- Create team_messages table for group chats
CREATE TABLE IF NOT EXISTS team_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for fast querying of group chats
CREATE INDEX IF NOT EXISTS idx_team_messages_idea_id ON team_messages(idea_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at);
