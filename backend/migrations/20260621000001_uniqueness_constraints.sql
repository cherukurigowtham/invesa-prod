-- Clean up duplicate join_requests (keeping the newest)
DELETE FROM join_requests
WHERE id NOT IN (
    SELECT DISTINCT ON (idea_id, builder_id) id
    FROM join_requests
    WHERE status IN ('pending', 'accepted')
    ORDER BY idea_id, builder_id, created_at DESC
) AND status IN ('pending', 'accepted');

-- Clean up duplicate investor_interests (keeping the newest)
DELETE FROM investor_interests
WHERE id NOT IN (
    SELECT DISTINCT ON (idea_id, investor_id) id
    FROM investor_interests
    ORDER BY idea_id, investor_id, created_at DESC
);

-- Add uniqueness constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_join_requests_unique_pending_accepted
ON join_requests(idea_id, builder_id)
WHERE status IN ('pending', 'accepted');

CREATE UNIQUE INDEX IF NOT EXISTS idx_investor_interests_unique
ON investor_interests(idea_id, investor_id);
