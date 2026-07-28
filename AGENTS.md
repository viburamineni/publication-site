# Rules for Future Coding Agents

- Preserve Astro static rendering. Ordinary reader loads must never contact Contentful.
- Use only free services already in the documented architecture. Never add billing, trials, databases, hosted search, tracking, ads, or AI generation.
- Never expose Contentful tokens, management credentials, preview secrets, or deploy hooks in browser code, Git, logs, or documentation.
- Keep the Zod normalization boundary and fail builds on invalid or unresolved content.
- Render only the explicit Rich Text allowlist. Never add arbitrary HTML, script, iframe, or unsafe URL rendering.
- Preserve keyboard operation, focus visibility, semantic structure, image alternatives, contrast, reduced motion, and no-JavaScript core content.
- When the Contentful model changes, add a migration and update schemas, normalizers, tests, `CONTENT_MODEL.md`, and an export.
- Generated images must stay local, versioned, at most four variants, below 20 MiB each, and the site below 18,000 files.
- Keep fixtures clearly fictional. Do not publish real claims under the owner’s identity.
- Run `npm run ci` and `npm run test:e2e` before merging. Preserve unrelated user changes.
