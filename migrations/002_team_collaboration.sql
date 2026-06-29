-- Teams table (workspaces)
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INT REFERENCES users(id),
    description VARCHAR(500),
    logo_url VARCHAR(512),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members with role-based access
CREATE TABLE team_members (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    user_id INT REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'buyer',
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Shared deals across team
CREATE TABLE shared_deals (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    deal_id INT REFERENCES negotiation_deals(id),
    shared_by_id INT REFERENCES users(id),
    shared_at TIMESTAMPTZ DEFAULT NOW(),
    notes VARCHAR(500)
);

-- Team API keys for B2B integrations
CREATE TABLE team_api_keys (
    id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(id),
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_shared_deals_team_id ON shared_deals(team_id);
CREATE INDEX idx_shared_deals_deal_id ON shared_deals(deal_id);
CREATE INDEX idx_team_api_keys_team_id ON team_api_keys(team_id);
CREATE INDEX idx_team_api_keys_key ON team_api_keys(key);
