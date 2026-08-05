# Editorial Guide

## What editors normally use

**Site Settings is one-time setup.** Keep exactly one Site Settings entry published and leave
**Site launched** on for the deployed publication. Ordinary publishing never requires editing it.

The site updates itself from editorial entries:

- Published Categories marked **Show in navigation** appear in the menu, ordered by their
  **Display order** value.
- When no Homepage entry is published, the newest published Article marked **Featured** becomes
  the homepage lead. If no Article is marked Featured, the newest published Article is used.
- Other recent Articles populate **Editor’s picks**. **Latest** always remains automatic and
  chronological.
- Analysis, Opinion, and Review stories populate their matching homepage sections.
- A published Topic marked **Featured** can populate the homepage topic position.

Publishing the single Homepage entry switches the front page into manual curation. Its fields
control the featured Article, Editor’s picks, the Analysis, Opinion, and Books sections, the
featured Topic, and the optional announcement. The order selected in each field is the order shown
on the site. Leaving an optional list or Topic empty hides that block. Leaving **Featured article** empty
safely falls back to the Article Featured toggle and then the newest published Article.
**Latest is never manually curated.**

Keep the Homepage entry published when editors want these controls available. Edit and republish
that one entry whenever the front-page selection changes. If it is unpublished, the automatic
rules above take over again.

## Configured publication structure

The temporary publication name is **The Transoceanic Cable**.

The navigation Categories are, in display order:

1. Analysis
2. Guest Articles
3. Culture and History
4. Africa
5. Americas
6. Asia
7. Australia and Oceania
8. Europe

The available Topics are:

- Book Reviews
- Invitational Pieces
- Analysis
- World History
- World Events
- Geopolitics

Categories determine the main section where a story belongs. Topics collect related stories across
Categories. Story Labels remain a separate editorial choice and do not alter this taxonomy.

## Create and publish

1. Sign in at the [Contentful space](https://app.contentful.com/spaces/iea4zh2wm1z5/views/entries) and select the `master` environment.
2. Open **Content**, choose **Add entry**, then **Article**.
3. Enter a 10-140 character title, a 30-350 character dek, author, publication date, and answer the two editorial questions below.
   - **Where does this story belong?** Choose the main subject or section.
   - **Does this story need a special label?** Keep **Standard story** for most work. Choose **Brief**, **Analysis**, **Opinion**, or **Review** only when that distinction helps the reader.
4. For the hero, create an **Image** entry, upload the asset, and provide useful alternative text and a photographer/source credit. Record rights notes. Brief is the only Story Label that may omit a hero.
5. In Body, use paragraphs, H2/H3, links, lists, or blockquotes. To add a Pull Quote or Fact Box, use **Embed > Entry**, create or select the corresponding type, then insert it.
6. Use **Analysis** for evidence-led explanation, **Opinion** for an argued position, and **Review** for criticism of a book, performance, exhibition, or other work. A Book entry is optional; attach it only when the Review is about a book.
7. Review **Publishing checks** in the sidebar and fix every failed item before publishing the
   Article. The checklist verifies the Hero Image rule and confirms that selected Authors,
   Category, Topics, Sources, Book, Related Articles, Body links, images, and assets are published.
   It does not judge which Category or Topic is editorially appropriate. The production build
   independently validates the current published content and refuses deployment if these structural
   or reference requirements are not satisfied.
8. Add sources and related articles. Never paste scripts, arbitrary HTML, or iframe code.
9. Review facts, sources, attribution, headings, links, and image rights. Keep the entry as a draft until that review is complete.
10. Click **Publish**. Published articles appear publicly after the automatic Cloudflare build; drafts remain private.

## Curate the homepage

1. Open the single **Homepage** entry. Do not create a second one.
2. Choose one **Featured article** for the main position. If it is empty, the newest published
   Article marked **Featured** is used; if none are marked, the newest published Article is used.
3. Choose and order up to three Articles in **Editor’s picks**.
4. Choose and order up to three Articles in **Analysis section**, **Opinion section**, and
   **Books and reviews section**. Empty lists remove those sections from the homepage.
5. Choose a **Featured topic**, or leave it empty to remove the Topic block.
6. Use **Homepage announcement** only for a short reader-facing notice.
7. Publish or republish Homepage. **Latest** continues to update automatically from publication
   dates and does not need editing.

Breaking-news and Category-order controls are hidden because the current homepage does not use
them. Navigation order belongs on each Category through **Display order**.

Readers never see the label **Standard story**. Brief, Analysis, Opinion, and Review appear only as
plain editorial labels where useful, alongside the independently editable Category. A Category can
therefore contain more than one kind of story, such as a Standard story and a Brief in Americas.

When creating a new Category, set **Show in navigation** and **Display order** on that Category.
Do not update Site Settings or Homepage just to add it to the menu.

On the free plan, use the least-privileged role the actual space offers. If Author is available, writers use Author and editors use Editor. Otherwise both use Editor, and the team should treat **Publish** as final editorial approval. Never make ordinary writers Administrators.

## Corrections and removal

For a correction, edit the article, fill **Correction note** with what changed and why, update the display-updated date, and republish. For a slug change, add the old slug to **Previous slugs** first. To withdraw an article, unpublish it; do not redirect it to unrelated content.

To unpublish, open the entry menu and choose **Unpublish**. The webhook rebuild removes it while the previous successful deployment remains available until the rebuild succeeds.

Image-only changes do not intentionally trigger a second build. Republish one referencing article or manually trigger a Cloudflare deployment.
