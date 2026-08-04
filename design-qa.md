# Newspaper Skin Design QA

## Comparison setup

- Source visual truth: `/Users/viburamineni/.codex/generated_images/019fa8df-5e46-7d71-ab99-6f45b4a7ea99/call_i5X2KT2g92ODWUTofllDZs6o.png`
- Source pixels: 1487 x 1058
- Implementation URL: `http://127.0.0.1:4173/`
- Final desktop screenshot: `/tmp/newspaper-skin-desktop-1440x1024-v2.png`
- Final desktop pixels and CSS viewport: 1440 x 1024
- Mobile screenshot: `/tmp/newspaper-skin-mobile-390x844.png`
- Mobile pixels and CSS viewport: 390 x 844
- Annotated desktop correction: `/tmp/newspaper-annotations-884x784-v2.png`
- Right-aligned subtitle evidence: `/tmp/newspaper-subtitle-right-aligned-884x784.png`
- Featured-topic evidence: `/tmp/newspaper-featured-topic-884x784.png`
- Annotated mobile correction: `/tmp/newspaper-annotations-mobile-390x844.png`
- Editorial metadata correction: `/tmp/newspaper-editorial-metadata-1159x784.png`
- One-story archive correction: `/tmp/archive-single-after-457x784.png`
- Multi-story archive final-row correction: `/tmp/archive-multi-last-row-457x784.png`
- Reader-language homepage correction: `/tmp/newspaper-clarity-home-767x784.png`
- Ongoing-coverage explanation: `/tmp/newspaper-ongoing-coverage-767x784.png`
- 404 spacing and masthead correction: `/tmp/newspaper-404-spacing-767x784.png`
- Medium-width archive correction: `/tmp/newspaper-archive-medium-767x784.png`
- Mobile clarity correction: `/tmp/newspaper-clarity-mobile-390x844.png`
- Device density: 1
- Density normalization: the source was resized with contain-fit to 1440 x 1024 on white. The implementation was captured at 1440 x 1024. Both normalized images were joined into one 2880 x 1024 comparison.
- Full-view comparison: `/tmp/newspaper-design-comparison-1440x1024.png`
- Focused masthead and lead-story comparison: `/tmp/newspaper-design-comparison-focus.png`
- State: homepage using the repository's approved fictional fixtures. Production uses the same templates with published Contentful data.

## Findings

No actionable P0, P1, or P2 findings remain.

The following differences are expected product constraints, not design drift:

- The mockup includes weather, subscription, sign-in, live-news, events, and public-service features. They were not built because the existing product does not offer them.
- The implementation uses the existing Contentful-driven hero image and story data instead of embedding the mockup's generated photography or copy.
- The masthead remains a text mark until the client selects a real logo. No placeholder logo was fabricated.

## Required fidelity surfaces

- Fonts and typography: the centered masthead uses the self-hosted Chomsky blackletter face, while Avara is reserved for article initials and Georgia carries story display and reading text. Utility text uses the system sans stack. The roles are distinct and readable without adding a third-party font request.
- Spacing and layout rhythm: the utility row, masthead, double-rule navigation, update strip, photo-led story grid, and latest-news rail reproduce the source's newspaper rhythm. Page gutters are consistent. Desktop and mobile have no horizontal overflow.
- Colors and visual tokens: white paper, near-black ink, oxblood editorial labels, blue utility links, and gray rules form one restrained print palette. There are no gradients, glows, translucent panels, or default gray card surfaces.
- Image quality and asset fidelity: the existing responsive image component remains the sole image path. The hero keeps its source aspect, cover crop, caption, credit, and alternative text. No CSS, inline SVG, or placeholder art was introduced to imitate the mockup.
- Copy and content: existing story, navigation, footer, and announcement content remains authoritative. The added fixed labels “Edition update,” “Search the edition,” and “Featured topic” describe existing behavior.
- Responsiveness: at 390 x 844 the masthead, announcement, hero image, caption, and headline remain readable; the page measures 390 CSS pixels wide with a 390-pixel scroll width.
- Accessibility: focus visibility, skip-link behavior, semantic landmarks, image alternatives, reduced-motion handling, and no-JavaScript content remain in place. The automated accessibility suite passed on the homepage, article, staff, and search routes.
- Interactions: the mobile Sections disclosure was opened and its links were confirmed visible. The search link navigated to `/search/`. Browser console warnings and errors were checked and none were present.

## Comparison history

### Pass 1

- Finding: P2, the first implementation made the masthead and hero image too tall, pushing the lead headline almost entirely below the desktop fold.
- Evidence: `/tmp/newspaper-skin-desktop-1440x1024.png`
- Fix: reduced the masthead's minimum height and display scale, removed the unsuitable favicon mark, and reduced the desktop hero image height while preserving its crop.

### Pass 2

- Evidence: `/tmp/newspaper-skin-desktop-1440x1024-v2.png`, `/tmp/newspaper-design-comparison-1440x1024.png`, and `/tmp/newspaper-design-comparison-focus.png`
- Result: the masthead, navigation, update strip, hero, caption, lead headline, and latest rail now share the source's proportions and hierarchy. No new P0, P1, or P2 issue was found.

### Pass 3: browser annotations

- Finding: P2, the desktop navigation was left-biased at the annotated 884-pixel viewport because the tablet media rule overrode its centered alignment.
- Fix: retained horizontal overflow support but centered the navigation at every width where the desktop navigation remains visible.
- Post-fix evidence: the viewport, navigation shell, and link group all have a measured center of 442 CSS pixels in `/tmp/newspaper-annotations-884x784-v2.png`.
- Finding: the user requested right alignment for the recurring section subtitles.
- Fix: the subtitle now aligns to the right edge of the section grid and uses balanced wrapping. This remains readable without overflow at desktop and mobile widths.
- Post-fix evidence: `/tmp/newspaper-subtitle-right-aligned-884x784.png` and `/tmp/newspaper-annotations-mobile-390x844.png`.
- Finding: the “Continuing story” label did not clearly explain the existing topic-promotion block.
- Fix: changed the label to “Featured topic.” The existing Contentful topic, image, summary, and topic-archive link remain unchanged.
- Post-fix evidence: `/tmp/newspaper-featured-topic-884x784.png`.

### Pass 4: editorial metadata

- Finding: P2, an Opinion article whose Story Label and Category were both named “Opinion” rendered the label twice.
- Fix: introduced one shared metadata rule that suppresses a Category only when it duplicates the Story Label. Distinct pairs such as “Brief · Technology” remain intact, while Standard story has no public label.
- Post-fix evidence: `/tmp/newspaper-editorial-metadata-1159x784.png`. The latest rail exposes one “Opinion” label, retains every distinct Story Label/Category pair, and has no horizontal overflow.

### Pass 5: archive endings

- Finding: P2, the final archive row drew a redundant single rule above the footer's double rule. At the phone breakpoint, an overly broad story-card selector also pushed archive metadata into an unintended second column.
- Fix: removed the bottom border from every final archive row and from the empty archive state. Scoped the mobile story-card grid selectors so archive rows use one true column with equal 24.8-pixel top and bottom padding.
- Post-fix evidence: `/tmp/archive-single-after-457x784.png` and `/tmp/archive-multi-last-row-457x784.png`. The one-story, empty, and six-story cases have zero horizontal overflow; only rows with a following story retain the single separator.

### Pass 6: reader language and medium layouts

- Finding: P2, legacy editorial terms such as “Long Form” and “News Brief” did not explain themselves to readers.
- Fix: this display-only mapping was superseded by migration 005. Contentful now uses Standard story, Brief, Analysis, Opinion, and Review; Standard story is omitted publicly, while the four special labels use the same words editors select.
- Post-fix evidence: `/tmp/newspaper-clarity-home-767x784.png` and `/tmp/newspaper-ongoing-coverage-767x784.png`.
- Finding: P2, “Current edition” added no useful information, the 404 sentence lost a visible word space, and masthead top and bottom whitespace differed.
- Fix: removed the filler status, kept the date and search action, inserted an explicit 404 word space, and set symmetric masthead padding. Measured masthead whitespace is 20 CSS pixels at 767 pixels wide and 16 CSS pixels at 390 pixels wide.
- Post-fix evidence: `/tmp/newspaper-404-spacing-767x784.png` and `/tmp/newspaper-clarity-mobile-390x844.png`.
- Finding: P2, the three-column archive row became visually disconnected at the 767-pixel reference width.
- Fix: switch archive rows to their clear stacked reading order at 900 pixels instead of waiting until 760 pixels.
- Post-fix evidence: `/tmp/newspaper-archive-medium-767x784.png`. Both rows use one 727-pixel column, left-aligned metadata, and no horizontal overflow.

### Pass 7: archive balance and search language

- Finding: P2, a one-story category left substantially more blank space below its last story than above the page title, so the archive module appeared vertically off-center.
- Fix: introduced one shared outer-spacing value for the archive header and its final story. The final row still has no redundant bottom rule, and its content now sits the same visual distance from the footer's double rule as the title sits from the navigation's double rule.
- Post-fix evidence: `/tmp/newspaper-world-balanced-1159x784.png`.
- Finding: P2, the search introduction explained the site's indexing and deployment implementation instead of helping a reader search.
- Fix: replaced the technical explanation and internal “topic” terminology with the reader-facing instruction “Find stories by headline, author, subject, or phrase.” The search behavior is unchanged.
- Post-fix evidence: `/tmp/newspaper-search-reader-copy-1159x784.png`.

### Pass 8: homepage responsive rhythm and editorial links

- Finding: P2, the stacked mobile homepage retained the desktop section's larger bottom padding, leaving more whitespace after the final latest story than above the lead image.
- Fix: matched the mobile front-page top and bottom padding and removed the final latest item's redundant bottom padding. The first and last content now sit the same distance from their section boundaries.
- Finding: P2, section descriptions stayed right-aligned at narrow widths and appeared detached from their headings, while “The wider edition” wrapped unnecessarily at the large reference width.
- Fix: section descriptions now sit left-aligned below their headings on narrow screens. Desktop section headings use their natural width, keeping “The wider edition” on one line while retaining the right-aligned description.
- Finding: P2, the masthead's mathematically equal padding did not look optically equal around the wrapped display face.
- Fix: redistributed the small-screen masthead padding to account for the display face's internal top and bottom whitespace. The visible title and tagline now have balanced breathing room.
- Finding: P2, the lead image caption and credit were split across the row at medium widths, and bylines did not expose the existing author archive.
- Fix: stacked the caption and credit at every width. Author names in homepage, archive, card, and article bylines now link to the existing author profiles and reveal their link treatment on hover.
- Finding: the label “Ongoing coverage” claimed an ongoing state that the template could not infer.
- Fix: renamed the block “Topic collection.” The block still renders only the topic explicitly selected in the homepage's Contentful configuration.
- Post-fix evidence: `/tmp/newspaper-home-masthead-609x784.png`, `/tmp/newspaper-home-section-496x784.png`, and `/tmp/newspaper-home-wide-1159x784.png`.

### Pass 9: optical spacing and editorial intent

- Finding: P2, the masthead still used different top and bottom padding values, so its visible whitespace changed across wrapped and single-line layouts.
- Fix: gave the masthead one shared block padding value at every breakpoint. The measured space above the identity and below the tagline is now exactly 19.2 CSS pixels at 609, 792, and 1159 pixels.
- Finding: P2, the desktop front-page module retained a larger bottom inset than its top inset.
- Fix: matched the lead module's top and bottom padding. At 792 pixels, the measured image-to-top and lead-rule-to-bottom gaps are both exactly 16 CSS pixels.
- Finding: the demonstration announcement conveyed no useful reader information.
- Fix: removed the fixture announcement. The optional CMS announcement slot remains available for a real notice and now uses the neutral label “Notice.”
- Finding: the navigation ended with Books, Opinion, Analysis while the homepage sections read Analysis, Opinion, Books.
- Fix: aligned the configured fixture navigation order with the homepage's reading order.
- Finding: P2, the three-column article reading grid left only 449 pixels for body text at the 792-pixel reference width.
- Fix: reduced the side rails and raised the article measure modestly. The same viewport now provides a 576-pixel reading column without horizontal overflow.
- Finding: “Continue reading” sounded algorithmic even though related stories are explicitly selected in each article's Contentful relationship field.
- Fix: renamed the section “Related stories” and widened a one-story related grid so the card does not occupy an awkward one-third column.
- Post-fix evidence: `/tmp/newspaper-home-792x784-pass9.png` and `/tmp/newspaper-article-792x784-pass9.png`.

### Pass 10: visible-ink centering

- Finding: P1, equal masthead box padding did not center the visible Avara letterforms. The title and tagline read high inside the available space even though their line boxes measured equally.
- Fix: restored deliberate optical padding around the visible type instead of centering its invisible font boxes. Browser screenshots at 609 and 1159 pixels confirm that the wrapped and single-line mastheads now sit visually centered.
- Finding: P1, the Sources module accumulated a default list margin, the article grid's row gap, and the Related stories margin, leaving far more whitespace below the source than above it.
- Fix: separated the article grid's column and row gaps and added an adjacency rule for Sources followed by Related stories. The measured whitespace from the upper rule to the Sources heading and from the final source line to the lower rule is exactly 28 CSS pixels at the 1159-pixel reference width.

### Pass 11: blackletter masthead integration

- Direction: moved the publication name to the self-hosted Chomsky blackletter face, which was designed specifically as a newspaper masthead in the New York Times tradition. Avara remains limited to article initials.
- Fix: changed the placeholder wordmark to title case, increased the desktop masthead scale, and retuned its optical padding for Chomsky's letterforms. The mobile scale remains deliberately smaller so the name stays on one line with clear gutters.
- Cross-page review: captured and inspected the homepage, article, World archive, topic archive, search, and 404 pages at 1159 pixels, plus the homepage at 390 pixels. The masthead remains centered, does not overflow, and maintains a consistent hierarchy above each page type.
- Evidence: `/tmp/newspaper-font-audit/01-home-1159.png` through `/tmp/newspaper-font-audit/07-home-390.png`.

### Pass 12: topic discovery and publication-name consistency

- Finding: the site generated individual topic archives but did not provide an index where readers could discover every topic.
- Fix: added `/topics/` as a static, typography-led coverage index. Each entry explains the topic, reports its current story count, and identifies the newest related story without introducing new editorial controls or CMS behavior.
- Finding: production Contentful stored an uppercase `textLogo` while the development fixture used a title-cased value, causing the masthead to differ between environments.
- Fix: the masthead now uses the canonical `publicationName`, which was already used by accessibility labels, metadata, and the footer. The footer publication name now uses the same Chomsky face and shifts to a less cramped two-column layout at medium widths.
- Navigation: desktop and mobile readers can reach the index through the header's edition tools; the mobile Sections menu also includes Topics and exposes its active state.
- Evidence: browser inspection at 1280 pixels confirmed a centered masthead, readable index hierarchy, aligned topic rows, a consistent footer wordmark, and zero horizontal overflow.

## Anti-slop review

- No blue-purple or candy gradients, background glows, radial halos, bloom shadows, glass, or clipped glow.
- No pills, eyebrow chips, gradient labels, floating cards, hover lifts, button boops, countdowns, testimonial presets, pricing presets, or pre-footer CTA slabs.
- No fake app windows, code windows, macOS chrome, dashboards, CSS illustrations, inline SVG substitutes, decorative blobs, or graph-paper backgrounds.
- No Inter, Space Grotesk, Sora, Syne, Archivo, Fraunces, Cormorant, Didone, or mono house voice. The self-hosted newspaper-specific blackletter face carries only the masthead.
- No generic split hero, SaaS hero stack, filled-plus-outline action pair, comparison-card grid, numbered rail, inset form island, or repeated marketing-section skeleton.
- No invented logos, icon tiles, gradient initials, decorative quote marks, floating image tags, active-nav dots, animated underlines, or theme toggle.
- No all-around shadows, fake offset shadow boxes, botched glass, clipped text, hard image seams, or content hidden behind entrance animations.
- Text has deliberate gutters, strong contrast, readable line height, and no section-edge clipping. Parallel story regions align to stable grid tracks.
- Rules are used for newspaper structure, not as isolated eyebrow decoration. The restrained double rule is a deliberate print convention from the selected source.
- The page uses one coherent publication palette and one newspaper-specific composition. It does not add features or decorative controls that the product cannot support.
- Every visible control has real existing behavior. The core content remains fully available without JavaScript.

## Validation

- `npm run test`: 26 passed.
- `npm run typecheck`: passed with 12 dependency deprecation hints and no errors.
- `npm run build:test`: passed, 30 pages built.
- `npm run test:e2e`: passed, including the Topics route, desktop and mobile topic navigation, editorial-order, optional-notice, related-story, author-link, and accessibility coverage.
- `npm run deploy:worker:dry-run`: passed, 105 static assets, no bindings.
- Prettier, ESLint, and the full `npm run ci` gate: passed.
- Browser console: no warnings or errors.

final result: passed
