# Green Sync go-live checklist

This checklist records release evidence without storing secret values. Complete it in staging first, then repeat the release-gate items against production.

## Automated repository gates

- [ ] `npm run preflight:production` passes with the deployment environment.
- [ ] Backend build, unit tests, and HTTP E2E tests pass.
- [ ] Frontend production build and unit tests pass.
- [ ] `docker compose -f docker-compose.prod.yml config` resolves without warnings or missing required values.
- [ ] Database migrations are reviewed and run; `DB_SYNCHRONIZE=false` is confirmed.
- [ ] `/health` returns HTTP 200 through the deployed load balancer.

## Security and privacy gates

- [ ] Production secrets are held in the deployment secret store and are not copied into this document or logs.
- [ ] Allowed origins contain only approved HTTPS application origins.
- [ ] Swagger is disabled or restricted to the approved internal environment.
- [ ] Tenant-boundary, role, upload ownership, webhook-signature, and 500-error redaction tests pass.
- [ ] Data retention periods, deletion owners, legal holds, and backup retention are approved.
- [ ] Privacy notice, Terms versions, consent/acceptance evidence, processor list, and cross-border transfer basis are reviewed by the responsible legal/privacy owner.
- [ ] Incident response contacts and personal-data breach assessment procedure are exercised.

## Operational gates

- [ ] A database backup is restored into an isolated staging environment and sample records are verified.
- [ ] Critical flow smoke test passes: login → assessment → evidence → review → certificate.
- [ ] Stripe sandbox flow passes: setup intent → signed webhook → subscription state update.
- [ ] Monitoring receives a controlled test error without exposing request secrets or personal data.
- [ ] Load test meets the agreed response-time and error-rate targets.
- [ ] Rollback owner, migration rollback decision, maintenance window, and communication channel are recorded.

## Release sign-off

- [ ] Product owner / copyright owner
- [ ] Engineering owner
- [ ] Security owner
- [ ] Privacy or legal owner
- [ ] Release timestamp, version/commit, approvers, known limitations, and rollback result are attached to the release record.

Passing repository checks establishes technical readiness evidence; it does not replace an external penetration test, legal opinion, regulator filing, or production restore exercise.
