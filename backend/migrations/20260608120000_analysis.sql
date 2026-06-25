-- Create IDEA_ANALYSES table
CREATE TABLE IF NOT EXISTS idea_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE UNIQUE NOT NULL,
    overall_score INT NOT NULL,
    market_fit_rating INT NOT NULL,
    viability_rating INT NOT NULL,
    innovation_rating INT NOT NULL,
    strengths TEXT[] DEFAULT '{}' NOT NULL,
    weaknesses TEXT[] DEFAULT '{}' NOT NULL,
    opportunities TEXT[] DEFAULT '{}' NOT NULL,
    threats TEXT[] DEFAULT '{}' NOT NULL,
    recommendations TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for fast lookup by idea_id
CREATE INDEX IF NOT EXISTS idx_idea_analyses_idea_id ON idea_analyses(idea_id);
