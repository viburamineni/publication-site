# Publication Site

A static-first news publication built with Astro, Contentful, Pagefind, GitHub Actions, and Cloudflare Workers Static Assets. Contentful is contacted only during builds. Readers receive static HTML, locally deployed responsive images, and a local search index.

## Architecture

`Contentful web app -> GitHub Actions -> Delivery API at build time -> Zod normalization -> Astro static HTML -> Cloudflare Workers Static Assets`

Each successful build is also copied to GitHub Pages at <https://viburamineni.github.io> as an independently hosted fallback. The former Cloudflare Pages deployment remains available during migration.

The committed fixture publication is fictional and exists for development and CI. Production builds require Contentful credentials and fail closed when content is invalid.

Normal editorial work uses Authors, Categories, Topics, Images, Sources, Books, Articles, and the
single Homepage entry. Site Settings is permanent one-time configuration. Homepage controls the
lead Article, Editor’s picks, Analysis, Opinion, Reviews, featured Topic, and announcement; Latest
stays automatic. Published Categories control navigation through their own visibility and
display-order fields.

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
npm run contentful:seed
npm run contentful:smoke:publish
npm run contentful:smoke:unpublish
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
- Production Worker: <https://publication-site-live.intraducine.workers.dev>
- Independent fallback: <https://viburamineni.github.io>
- Migration fallback: <https://publication-site.pages.dev>

Publishing, unpublishing, and deletion events invoke GitHub's `contentful-published` repository dispatch through a Contentful webhook. The workflow waits 90 seconds and cancels superseded runs so nearby editorial changes collapse into one final build. GitHub stores the Contentful delivery credentials, the Cloudflare deployment token, and the fallback deploy key. Cloudflare receives only the validated `dist` directory and does not run the build.

Repository variables:

| Name                    | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `PUBLIC_SITE_URL`       | Production Worker canonical origin       |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare deployment account identifier |

Repository secrets:

| Name                        | Purpose                                     |
| --------------------------- | ------------------------------------------- |
| `CONTENTFUL_SPACE_ID`       | Production Contentful space                 |
| `CONTENTFUL_DELIVERY_TOKEN` | Read-only production delivery credential    |
| `FALLBACK_DEPLOY_KEY`       | Write-only SSH key for the fallback repo    |
| `CLOUDFLARE_API_TOKEN`      | Worker deployment token scoped to this work |

See [EDITORIAL_GUIDE.md](EDITORIAL_GUIDE.md), [CONTENT_MODEL.md](CONTENT_MODEL.md), [RUNBOOK.md](RUNBOOK.md), and [SECURITY.md](SECURITY.md).
