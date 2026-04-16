-- Add Zoho Bigin integration columns

-- Track the Bigin Contact record id after syncing
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bigin_contact_id TEXT;

-- Track the Bigin email message id (replaces the placeholder resend_message_id)
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS bigin_message_id TEXT;

-- Persist the Bigin access token so server restarts don't trigger repeated refreshes
-- (Zoho rate limits the token refresh endpoint)
ALTER TABLE scrape_config ADD COLUMN IF NOT EXISTS bigin_access_token TEXT;
ALTER TABLE scrape_config ADD COLUMN IF NOT EXISTS bigin_token_expires_at BIGINT;

-- Store recipient info for custom sends (no linked contact/property)
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS recipient_name TEXT;
