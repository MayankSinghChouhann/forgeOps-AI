-- Tokens created before SHA-256-at-rest support were stored in plaintext.
-- Force one re-authentication after upgrade rather than retaining legacy secrets.
DELETE FROM refresh_tokens;
