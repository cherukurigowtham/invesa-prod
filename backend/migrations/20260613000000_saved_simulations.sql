-- Create SAVED_SIMULATIONS table
CREATE TABLE IF NOT EXISTS saved_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    pre_money_valuation DOUBLE PRECISION NOT NULL,
    raise_amount DOUBLE PRECISION NOT NULL,
    option_pool_percent DOUBLE PRECISION NOT NULL,
    co_founder_percent DOUBLE PRECISION NOT NULL,
    series_a_valuation DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    series_a_raise DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    series_a_option_pool DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for lookup by user_id and idea_id
CREATE INDEX IF NOT EXISTS idx_saved_simulations_user_id ON saved_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_simulations_idea_id ON saved_simulations(idea_id);
