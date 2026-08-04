# Publishing checks Contentful app

This editor-only app adds a live checklist to the Article sidebar. It does not run on the public
site and does not use Contentful Functions.

The app checks publication readiness that Contentful's built-in field validations cannot express:

- every Article except a Brief needs a published Hero Image entry;
- the selected Authors and main Category must be published;
- selected Topics, Sources, Book, Related Articles, and Rich Text entry links must be published;
- selected Image entries and their assets must be published; and
- selected Author photographs, Category and Topic images, Book covers, Topic article links, and
  Related Articles block links must resolve to published content.

Category and Topic names are intentionally not hardcoded. Editors can rename or replace taxonomy
entries without rebuilding the app. The app checks that the selected entries are publishable, not
whether an editorial classification choice is subjectively correct.

The app writes `ready` to the disabled, required `publishingChecks` field only while those checks
pass. Contentful's normal publish validation blocks the Article when that field is empty. The
website's Zod validation remains the final deployment safety net.

## Build locally

```sh
npm run contentful:app:build
```

The uploadable bundle is written to `contentful/apps/publishing-checks/dist`.

For local development, create a Contentful app definition with the **App configuration** and
**Entry sidebar** locations, enable localhost, then run:

```sh
npm run contentful:app:dev
```

## Install with Contentful hosting

1. Apply `contentful/migrations/004-add-publishing-checks.cjs` to the intended environment.
2. In Contentful, create an app definition named **Publishing checks**.
3. Enable the **App configuration** and **Entry sidebar** locations and Contentful-hosted bundles.
4. Build the app.
5. Set `CONTENTFUL_ORGANIZATION_ID`, `CONTENTFUL_APP_DEF_ID`, and a temporary
   `CONTENTFUL_MANAGEMENT_TOKEN`, then run `npm run contentful:app:upload`.
6. Install the app into `master`. Its configuration screen automatically adds it to the Article
   sidebar.
7. Revoke the temporary management token.

The management token and app identifiers must not be committed.
