# Operations Runbook

## Publishing and rebuilds

Publish only after Editorial state is Approved. Entry publish, unpublish, and deletion events invoke the `contentful-published-content` Cloudflare deploy hook. Draft edits and asset uploads do not. Manually rebuild from Cloudflare **Workers & Pages > publication-site > Deployments > Retry deployment**, or use the protected deploy hook.

## Failure and rollback

Contentful outage or validation errors fail the new build; the existing production deployment remains served. Read the first build error, locate its Contentful entry ID, fix and republish. For a bad frontend, open Cloudflare Deployments, select the last known-good deployment, and choose rollback. Never edit `dist` in production.

If a deploy-hook URL leaks: delete it, create a replacement for `main`, update the Contentful webhook, and test one controlled publish.

## Quotas

| Resource                   | Review |             Urgent |           Stop/batch |
| -------------------------- | -----: | -----------------: | -------------------: |
| Contentful API calls       |    70% |                85% |                  95% |
| Contentful asset bandwidth |    70% |                85% |                  95% |
| Cloudflare builds/month    |    350 |                425 |                  475 |
| Cloudflare files           | 16,000 | 18,000 build fails | 20,000 service limit |

Check Contentful **Settings > Usage**, Cloudflare project analytics/deployments, and GitHub Actions usage monthly. The build prints entry/image/file totals.

## Routine changes

- Add people under Contentful organization/space membership using the least privileged available role. Never use Administrator for ordinary writers.
- Add categories as Category entries, then update Site Settings navigation and Homepage ordering.
- Change publication branding only in Site Settings.
- To connect a domain later, add it in Cloudflare Pages, then change `PUBLIC_SITE_URL` and redeploy.
- Export the model with `CONTENTFUL_MANAGEMENT_TOKEN=... npm run contentful:export`; revoke the temporary token afterward.
- Seed a fresh space with `npm run contentful:seed`. The command publishes only shared reference/configuration entries and leaves all six fictional articles as drafts.
- Use `npm run contentful:smoke:publish` and `npm run contentful:smoke:unpublish` only for a controlled deployment test; the latter restores the sample brief to Drafting.
- Export content from Contentful **Settings > Content > Import/Export** or its CLI and store encrypted backups outside the public site.

Repository secrets belong in GitHub Actions; production build secrets belong in Cloudflare. Rotate by creating a replacement, updating consumers, testing, then revoking the old credential.
