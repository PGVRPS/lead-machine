-- Add Zoho Bigin integration columns

-- Track the Bigin Contact record id after syncing
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bigin_contact_id TEXT;

-- Track the Bigin email message id (replaces the placeholder resend_message_id)
ALTER TABLE outreach ADD COLUMN IF NOT EXISTS bigin_message_id TEXT;
