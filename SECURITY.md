# Security

Report security concerns privately to the repository owner. Do not open a public issue containing a secret or exploit.

- The user owns GitHub, Contentful, and Cloudflare. Use delegated access and least privilege.
- `CONTENTFUL_DELIVERY_TOKEN` is read-only and stored in Cloudflare production variables and trusted GitHub integration secrets only.
- Preview and management tokens are server/setup-only. A temporary management token must be revoked after migration/export.
- The Cloudflare deploy-hook URL is a secret. Rotate it immediately if logged, committed, or shared.
- Never commit `.env`, tokens, webhook URLs, exports containing secrets, or user personal data.
- Browser pages render no arbitrary CMS HTML. Rich Text is allowlisted, external URLs are protocol-checked, and CSP limits resources to those used.
- Dependabot and GitHub alerts monitor dependencies. CI runs audit-relevant checks, strict types, tests, static build, and accessibility E2E.
- Before release, inspect Git history and `dist` for token patterns. Keep production and preview secrets separate.
