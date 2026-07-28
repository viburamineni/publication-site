# Security

Report security concerns privately to the repository owner. Do not open a public issue containing a secret or exploit.

- The user owns GitHub, Contentful, and Cloudflare. Use delegated access and least privilege.
- `CONTENTFUL_DELIVERY_TOKEN` is read-only and stored only in trusted GitHub Actions secrets.
- Preview and management tokens are server/setup-only. A temporary management token must be revoked after migration/export.
- The Contentful webhook's GitHub authorization header is a secret fine-grained token restricted to this repository. Contentful hides it from its web app, API responses, and logs.
- `CLOUDFLARE_API_TOKEN` is restricted to Worker deployment and stored only in GitHub Actions.
- `FALLBACK_DEPLOY_KEY` can write only to `viburamineni/viburamineni.github.io` and is stored only in GitHub Actions.
- Never commit `.env`, tokens, webhook URLs, exports containing secrets, or user personal data.
- Browser pages render no arbitrary CMS HTML. Rich Text is allowlisted, external URLs are protocol-checked, and CSP limits resources to those used.
- Dependabot and GitHub alerts monitor dependencies. CI runs audit-relevant checks, strict types, tests, static build, and accessibility E2E.
- Before making the repository public or releasing a build, inspect Git history and `dist` for token patterns. Keep production and preview secrets separate.
