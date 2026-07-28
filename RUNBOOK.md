# Operations Runbook

## Publishing and rebuilds

Treat Contentful **Publish** as final editorial approval. Entry publish, unpublish, and deletion events invoke the `contentful-published` GitHub repository dispatch. Draft edits and asset uploads do not. GitHub waits 90 seconds before building and cancels any superseded run. Manually rebuild from GitHub **Actions > Production deployment > Run workflow**.

One successful workflow:

1. Fetches and validates published Contentful content.
2. Reuses cached, versioned Contentful image variants.
3. Builds the static Astro and Pagefind output.
4. Updates <https://viburamineni.github.io> as the independent fallback.
5. Deploys the same output to the production Cloudflare Worker.

## Failure and rollback

Contentful outage or validation errors fail the new build; the existing production Worker version and fallback snapshot remain served. Read the first build error, locate its Contentful entry ID, fix and republish. For a bad frontend, open the Worker's deployment history, select the last known-good version, and roll back. The former Pages site remains a migration fallback until explicitly retired. Never edit generated production output manually.

If the Contentful GitHub token leaks: revoke it in GitHub, create a replacement restricted to `viburamineni/publication-site` with Contents write access, replace the secret `Authorization` header in Contentful, and test one controlled dispatch. If the Cloudflare token or fallback deploy key leaks, rotate only that credential and test the production workflow.

## Quotas

| Resource                        | Review |             Urgent |           Stop/batch |
| ------------------------------- | -----: | -----------------: | -------------------: |
| Contentful API calls            |    70% |                85% |                  95% |
| Contentful asset bandwidth      |    70% |                85% |                  95% |
| Cloudflare static files/version | 16,000 | 18,000 build fails | 20,000 service limit |
| GitHub Pages fallback site size | 750 MB |             900 MB |   1 GB service limit |
| GitHub Pages fallback bandwidth |  70 GB |              85 GB |    100 GB soft limit |

Check Contentful **Settings > Usage**, the Worker deployment history, GitHub Pages, and GitHub Actions monthly. The build prints entry, image, and file totals. Static requests served directly by Workers Static Assets are free and unlimited; the 100,000 daily Workers request quota matters only if Worker code is added later.

## Routine changes

- Add people under Contentful organization/space membership using the least privileged available role. Never use Administrator for ordinary writers.
- Add categories as Category entries, then update Site Settings navigation and Homepage ordering.
- Change publication branding only in Site Settings.
- To connect a domain later, add it to the Cloudflare Worker, then change `PUBLIC_SITE_URL` and redeploy.
- Export the model with `CONTENTFUL_MANAGEMENT_TOKEN=... npm run contentful:export`; revoke the temporary token afterward.
- Seed a fresh space with `npm run contentful:seed`. The command publishes only shared reference/configuration entries and leaves all six fictional articles as drafts.
- Use `npm run contentful:smoke:publish` and `npm run contentful:smoke:unpublish` only for a controlled deployment test.
- Export content from Contentful **Settings > Content > Import/Export** or its CLI and store encrypted backups outside the public site.

Repository secrets belong in GitHub Actions. Cloudflare stores no Contentful credential because it serves prebuilt files only. Contentful stores one secret GitHub authorization header for repository dispatch. Rotate by creating a replacement, updating consumers, testing, then revoking the old credential.

## Repository protection

The source repository is public so standard GitHub-hosted Actions are free and unlimited. Protect `main` with the `verify` and `contentful-integration` checks, linear history, conversation resolution, no force pushes, and no deletions. The owner retains override access.
