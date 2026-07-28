# Publication Hosting and Capacity Guide

## Overview

The publication is designed so that audience growth does not place additional demand on the content-management system.

Editors publish through Contentful. GitHub prepares a complete version of the website, and Cloudflare serves that finished version to readers. The same website is also published to GitHub Pages as an independent fallback.

At an estimated size of 100 articles and 500 images, the publication remains comfortably within the current free-plan limits.

## How publishing works

When an editor publishes, unpublishes, or deletes content:

1. Contentful notifies GitHub.
2. GitHub waits 90 seconds for any related changes.
3. GitHub checks and builds the complete website.
4. The new version is sent to Cloudflare and GitHub Pages.

The public website normally updates about two to two and a half minutes after the final publish action.

Drafts remain private and do not affect the public site.

## What happens when readers visit

Readers receive finished pages and images from Cloudflare. They do not connect directly to Contentful.

This means:

- Reader visits do not use the Contentful API allowance.
- Reader visits do not use Contentful image bandwidth.
- More readers do not create more website builds.
- Cloudflare static page and image requests are free and unlimited.

Whether the publication has 100 readers or 100,000 readers, Contentful usage remains largely unchanged.

## Current capacity

### Publishing

Contentful includes 100,000 API calls per month. At the current publication size, one completed website build uses approximately one call.

| Completed builds | Approximate monthly usage |
| ---------------- | ------------------------: |
| 10 per day       |        300 calls, or 0.3% |
| 100 per day      |        3,000 calls, or 3% |
| 500 per day      |      15,000 calls, or 15% |

Normal editorial publishing is unlikely to approach this allowance.

### Images

Each image is prepared in several sizes for different screens. These files are saved and reused in later builds.

- A text-only edit normally downloads no images.
- One new image creates up to three optimized files.
- Processing all 500 images from scratch would use approximately 1.5% of Contentful's monthly image allowance under a conservative size estimate.

The image cache keeps routine builds much smaller.

### Website size

Cloudflare allows 20,000 files in one static deployment.

A publication with 100 articles and 500 images would likely use about 1,700 to 2,000 files, or approximately 10% of that allowance.

The GitHub Pages fallback has a separate 1 GB size limit. The total optimized image library is therefore the most important long-term measurement.

## Reliability and fallback

The previous successful website remains available if a new update fails.

| Situation                             | Result                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| Contentful is temporarily unavailable | The existing websites remain online; new publishing is delayed |
| A build fails                         | The previous successful version remains online                 |
| Cloudflare is unavailable             | The GitHub Pages fallback remains available                    |
| GitHub Pages is unavailable           | The Cloudflare site remains available                          |
| A faulty version is deployed          | Cloudflare can return to an earlier version                    |
| An editor's computer is unavailable   | The live website is unaffected                                 |

### Public addresses

Primary site:

<https://publication-site-live.intraducine.workers.dev>

Independent fallback:

<https://viburamineni.github.io>

The fallback uses a separate address. Automatic failover under one address would require a custom domain and a domain-switching plan.

## When to review the plans

The platform should be reviewed if:

- The Cloudflare deployment approaches 15,000 files.
- The GitHub Pages copy approaches 750 MB.
- Contentful regularly uses more than half of its monthly allowance.
- The editorial team approaches 10 Contentful users.
- The publication becomes commercial.
- Automatic failover becomes necessary.

These are planning thresholds, not immediate failure points.

## Summary

The current platform provides substantial room for growth:

- Reader traffic does not consume Contentful capacity.
- Publishing uses a small portion of the monthly allowance.
- Images are optimized once and reused.
- Failed updates do not replace the last working version.
- Production and fallback copies are hosted separately.

For a publication with approximately 100 articles and 500 images, no immediate plan upgrade is expected.

## Official plan information

- [Contentful usage limits](https://www.contentful.com/help/admin/usage/usage-limit/)
- [Cloudflare Static Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [GitHub Actions billing and usage](https://docs.github.com/en/actions/concepts/billing-and-usage)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
