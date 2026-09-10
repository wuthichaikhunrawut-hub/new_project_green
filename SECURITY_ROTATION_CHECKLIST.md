# Pilot credential rotation checklist

Status generated: 2026-08-31. Do not paste secret values into this file, issues, CI logs, or chat.

## Repository checks completed

- Current tracked tree scan found no Google API key, Stripe secret key, Supabase personal token, database URL with embedded password, or private-key block matching the configured patterns.
- Environment files are ignored; only `backend/.env.example` is tracked.
- Git history pattern scan identified commits that may contain credential-shaped values: `815e3c0`, `f6dee5d`, and `3902cf2`. This is a rotation trigger, not proof that a currently valid key remains in those commits.
- The history scan encountered a binary PDF diff limitation. Run a dedicated scanner such as Gitleaks or TruffleHog against all refs before Pilot sign-off.

## Owner actions required

- [ ] Google AI Studio/Cloud: revoke old Gemini keys, create a restricted replacement, update the runtime secret, and record key ID + rotation time.
- [ ] Supabase: rotate the anon/service key that was previously exposed, verify bucket policies, update the runtime secret, and record the rotation event.
- [ ] OpenAI (if enabled): rotate any historical key and restrict project/environment usage.
- [ ] Database: rotate the application password if it ever appeared outside the local `.env`; use a least-privilege application role.
- [ ] JWT: replace the signing secret, force existing sessions to re-authenticate, and record the cutover time.
- [ ] SMTP/Stripe: rotate credentials if any historical scan or provider audit shows exposure.
- [ ] Re-run full-history secret scanning after rotation and attach a redacted report to the Pilot evidence.

Rotation is complete only when the provider has revoked the old credential. Replacing `.env` locally is not sufficient.
