-- AquaWatch Ghana — cap official response length
-- Run after 012_notifications_mark_read.sql (paste into Supabase Studio SQL
-- Editor; RESET ROLE first if you hit ownership errors)
--
-- AdminResponseDialog limits replies to 1000 characters, but that's only a
-- client-side check — this enforces the same limit (and rejects blank
-- replies) for any request that reaches the database directly.
--
-- NOT VALID: applies to new/updated rows only, so any existing reply that
-- happens to be longer doesn't make this migration fail.

RESET ROLE;

ALTER TABLE public.admin_responses DROP CONSTRAINT IF EXISTS admin_responses_message_length;
ALTER TABLE public.admin_responses ADD CONSTRAINT admin_responses_message_length
  CHECK (char_length(btrim(message)) BETWEEN 1 AND 1000) NOT VALID;
