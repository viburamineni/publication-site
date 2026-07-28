# Editorial Guide

## Create and publish

1. Sign in at the [Contentful space](https://app.contentful.com/spaces/iea4zh2wm1z5/views/entries) and select the `master` environment.
2. Open **Content**, choose **Add entry**, then **Article**.
3. Enter a 10-140 character title, a 30-350 character dek, type, author, primary category, and publication date.
4. For the hero, create an **Image** entry, upload the asset, and provide useful alternative text and a photographer/source credit. Record rights notes. News Brief is the only type that may omit a hero.
5. In Body, use paragraphs, H2/H3, links, lists, or blockquotes. To add a Pull Quote or Fact Box, use **Embed > Entry**, create or select the corresponding type, then insert it.
6. Use **Analysis** for evidence-led explanation and **Opinion** for an argued position. A Book Review also requires a Book entry.
7. Add sources and related articles. Never paste scripts, arbitrary HTML, or iframe code.
8. Review facts, sources, attribution, headings, links, and image rights. Keep the entry as a draft until that review is complete.
9. Click **Publish**. Published articles appear publicly after the automatic Cloudflare build; drafts remain private.

On the free plan, use the least-privileged role the actual space offers. If Author is available, writers use Author and editors use Editor. Otherwise both use Editor, and the team should treat **Publish** as final editorial approval. Never make ordinary writers Administrators.

## Corrections and removal

For a correction, edit the article, fill **Correction note** with what changed and why, update the display-updated date, and republish. For a slug change, add the old slug to **Previous slugs** first. To withdraw an article, unpublish it; do not redirect it to unrelated content.

To unpublish, open the entry menu and choose **Unpublish**. The webhook rebuild removes it while the previous successful deployment remains available until the rebuild succeeds.

Image-only changes do not intentionally trigger a second build. Republish one referencing article or manually trigger a Cloudflare deployment.
