# Publication Site

A static-first news publication built with Astro, Contentful, Pagefind, GitHub Actions, and Cloudflare Pages. Contentful is contacted only during builds. Readers receive static HTML, locally deployed responsive images, and a local search index.

## Architecture

`Contentful web app -> Delivery API at build time -> Zod normalization -> Astro static HTML -> Cloudflare Pages CDN`

The committed fixture publication is fictional and exists for development and CI. Production builds require Contentful credentials and fail closed when content is invalid.

## Setup

Requires Node 24 LTS and npm 11.

```sh
npm ci
cp .env.example .env
npm run dev
```

Environment variables:

| Name                        | Purpose                                   |
| --------------------------- | ----------------------------------------- |
| `CONTENTFUL_SPACE_ID`       | Contentful space ID                       |
| `CONTENTFUL_ENVIRONMENT`    | Environment, normally `master`            |
| `CONTENTFUL_DELIVERY_TOKEN` | Read-only Delivery API token              |
| `PUBLIC_SITE_URL`           | Canonical URL                             |
| `PUBLICATION_ENV`           | `production`, `preview`, or local         |
| `PUBLICATION_USE_FIXTURES`  | Use fictional fixtures outside production |

Management and preview tokens are never public runtime variables. See [.env.example](.env.example).

## Commands

```sh
npm run dev
npm run validate:content
npm run typecheck
npm test
npm run build:test
npm run test:e2e
npm run ci
```

The build downloads Contentful images into versioned local paths, generates at most three WebP variants, builds Pagefind, generates redirects, and fails above 18,000 files or 20 MiB per file.

## Services

- CMS: <https://app.contentful.com/spaces/iea4zh2wm1z5/views/entries>
- Repository: <https://github.com/viburamineni/publication-site>
- Cloudflare: <https://dash.cloudflare.com/>
- Production: configured after the first Pages deployment

Cloudflare Pages settings: production branch `main`, command `npm ci && npm run build`, output `dist`, Node 24. Configure the five production variables listed above. Publishing and unpublishing events invoke the protected Pages deploy hook.

See [EDITORIAL_GUIDE.md](EDITORIAL_GUIDE.md), [CONTENT_MODEL.md](CONTENT_MODEL.md), [RUNBOOK.md](RUNBOOK.md), and [SECURITY.md](SECURITY.md).
