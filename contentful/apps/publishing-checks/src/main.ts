import { init, locations, type ConfigAppSDK, type SidebarAppSDK } from '@contentful/app-sdk';
import {
  evaluatePublishingChecks,
  publishingChecksPass,
  type LinkedEntryStatus,
  type PublishingCheck,
} from './rules';
import './styles.css';

const ARTICLE_CONTENT_TYPE = 'article';
const VALIDATION_FIELD = 'publishingChecks';
const READY_VALUE = 'ready';

function requireAppRoot(): HTMLElement {
  const element = document.querySelector<HTMLElement>('#app');
  if (!element) throw new Error('Publishing checks app root is missing.');
  return element;
}

const app = requireAppRoot();

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderChecks(checks: PublishingCheck[], busy = false): void {
  const failureCount = checks.filter((check) => check.state === 'fail').length;
  const passed = failureCount === 0;
  const summary = busy
    ? 'Checking article…'
    : passed
      ? 'Ready for Contentful to publish'
      : `${failureCount} ${failureCount === 1 ? 'issue' : 'issues'} to fix`;
  const summaryState = busy ? 'checking' : passed ? 'pass' : 'fail';

  app.innerHTML = `
    <section class="panel" aria-labelledby="publishing-checks-title">
      <h2 class="title" id="publishing-checks-title">Publishing checks</h2>
      <p class="summary" data-state="${summaryState}" role="status" aria-live="polite">${summary}</p>
      <ul class="check-list">
        ${checks
          .map((check) => {
            const mark = check.state === 'pass' ? '✓' : check.state === 'fail' ? '!' : '–';
            return `
              <li class="check" data-state="${check.state}">
                <span class="check-mark" aria-hidden="true">${mark}</span>
                <div>
                  <p class="check-label">${escapeHtml(check.label)}</p>
                  <p class="check-detail">${escapeHtml(check.detail)}</p>
                </div>
              </li>
            `;
          })
          .join('')}
      </ul>
      <button class="action" type="button" ${busy ? 'disabled' : ''}>Check again</button>
    </section>
  `;
}

function renderSidebarSetupError(message: string): void {
  app.innerHTML = `
    <section class="panel" aria-labelledby="publishing-checks-title">
      <h2 class="title" id="publishing-checks-title">Publishing checks</h2>
      <p class="summary" data-state="fail">${escapeHtml(message)}</p>
    </section>
  `;
}

async function linkedEntryStatus(sdk: SidebarAppSDK, entryId: string): Promise<LinkedEntryStatus> {
  try {
    const entry = await sdk.cma.entry.get({ entryId });
    return entry.sys.publishedVersion ? 'published' : 'draft';
  } catch (error) {
    const status = (error as { status?: unknown }).status;
    return status === 404 ? 'missing' : 'unavailable';
  }
}

async function syncValidationField(sdk: SidebarAppSDK, checks: PublishingCheck[]): Promise<void> {
  const field = sdk.entry.fields[VALIDATION_FIELD];
  const locale = sdk.locales.default;
  const nextValue = publishingChecksPass(checks) ? READY_VALUE : undefined;
  const currentValue = field?.getValue(locale);

  if (!field) {
    throw new Error('Run the publishing-checks content model migration before using this app.');
  }
  if (nextValue === currentValue) return;
  if (nextValue) {
    await field.setValue(nextValue, locale);
  } else if (currentValue !== undefined) {
    await field.removeValue(locale);
  }
}

function setupSidebar(sdk: SidebarAppSDK): void {
  sdk.window.startAutoResizer();

  if (sdk.ids.contentType !== ARTICLE_CONTENT_TYPE) {
    renderSidebarSetupError('This app is only configured for Article entries.');
    return;
  }

  const storyLabel = sdk.entry.fields.articleType;
  const heroImage = sdk.entry.fields.heroImage;
  const book = sdk.entry.fields.book;
  const validationField = sdk.entry.fields[VALIDATION_FIELD];

  if (!storyLabel || !heroImage || !book || !validationField) {
    renderSidebarSetupError(
      'The Article content model is missing fields required by Publishing checks.',
    );
    return;
  }

  let refreshNumber = 0;
  let timer: number | undefined;
  let latestChecks: PublishingCheck[] = [];

  const refresh = async (): Promise<void> => {
    const thisRefresh = ++refreshNumber;
    renderChecks(latestChecks, true);

    const checks = await evaluatePublishingChecks(
      {
        storyLabel: storyLabel.getValue(sdk.locales.default),
        heroImage: heroImage.getValue(sdk.locales.default),
        book: book.getValue(sdk.locales.default),
      },
      (entryId) => linkedEntryStatus(sdk, entryId),
    );

    if (thisRefresh !== refreshNumber) return;

    try {
      await syncValidationField(sdk, checks);
      latestChecks = checks;
      renderChecks(checks);
    } catch {
      latestChecks = [
        ...checks,
        {
          id: 'contentful-validation',
          label: 'Contentful validation',
          detail: 'The publishing status could not be updated. Check your editing permissions.',
          state: 'fail',
        },
      ];
      renderChecks(latestChecks);
    }

    app.querySelector<HTMLButtonElement>('.action')?.addEventListener('click', () => {
      void refresh();
    });
  };

  const queueRefresh = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void refresh(), 120);
  };

  const unsubscribe = [
    storyLabel.onValueChanged(sdk.locales.default, queueRefresh),
    heroImage.onValueChanged(sdk.locales.default, queueRefresh),
    book.onValueChanged(sdk.locales.default, queueRefresh),
  ];
  window.addEventListener('focus', queueRefresh);
  window.addEventListener(
    'beforeunload',
    () => {
      unsubscribe.forEach((stopListening) => stopListening());
      window.removeEventListener('focus', queueRefresh);
    },
    { once: true },
  );
}

async function setupConfiguration(sdk: ConfigAppSDK): Promise<void> {
  let modelReady = false;
  try {
    const contentType = await sdk.cma.contentType.get({ contentTypeId: ARTICLE_CONTENT_TYPE });
    modelReady = contentType.fields.some((field) => field.id === VALIDATION_FIELD);
  } catch {
    modelReady = false;
  }

  app.innerHTML = `
    <section class="configuration" aria-labelledby="configuration-title">
      <h1 class="title" id="configuration-title">Publishing checks</h1>
      <p class="configuration-copy">
        Adds a live checklist to the Article sidebar. Contentful will block publishing when a
        required hero image is missing or an attached Book entry is unpublished.
      </p>
      <p class="configuration-status" data-state="${modelReady ? 'pass' : 'fail'}">
        ${modelReady ? 'Article content model is ready.' : 'Article content model migration required.'}
      </p>
      <p class="configuration-note">
        ${
          modelReady
            ? 'Choose Install or Save to add the checklist to the Article sidebar.'
            : 'Run migration 004-add-publishing-checks before installing this app.'
        }
      </p>
    </section>
  `;

  sdk.app.onConfigure(async () => {
    if (!modelReady) {
      sdk.notifier.error('Run migration 004-add-publishing-checks before installing this app.');
      return false;
    }

    const currentState = await sdk.app.getCurrentState();
    return {
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [ARTICLE_CONTENT_TYPE]: {
            ...currentState?.EditorInterface?.[ARTICLE_CONTENT_TYPE],
            sidebar: { position: 0 },
          },
        },
      },
    };
  });

  await sdk.app.setReady();
}

function renderLocalPreview(preview: string): void {
  if (preview === 'config') {
    app.innerHTML = `
      <section class="configuration" aria-labelledby="configuration-title">
        <h1 class="title" id="configuration-title">Publishing checks</h1>
        <p class="configuration-copy">
          Adds a live checklist to the Article sidebar. Contentful will block publishing when a
          required hero image is missing or an attached Book entry is unpublished.
        </p>
        <p class="configuration-status" data-state="pass">Article content model is ready.</p>
        <p class="configuration-note">
          Choose Install or Save to add the checklist to the Article sidebar.
        </p>
      </section>
    `;
    return;
  }

  const ready = preview === 'ready';
  renderChecks([
    {
      id: 'story-label',
      label: 'Story label',
      detail: 'Review selected.',
      state: 'pass',
    },
    {
      id: 'hero-image',
      label: 'Hero image',
      detail: ready
        ? 'Hero image is selected and published.'
        : 'Publish the selected hero image before publishing this article.',
      state: ready ? 'pass' : 'fail',
    },
    {
      id: 'book',
      label: 'Book',
      detail: ready
        ? 'Book is selected and published.'
        : 'Optional. Add a Book when this Review is about a book.',
      state: ready ? 'pass' : 'not-applicable',
    },
  ]);
  app.querySelector<HTMLButtonElement>('.action')?.addEventListener('click', () => {
    renderLocalPreview(preview);
  });
}

const preview = new URLSearchParams(window.location.search).get('preview');
if (preview) {
  renderLocalPreview(preview);
} else {
  init((sdk) => {
    if (sdk.location.is(locations.LOCATION_ENTRY_SIDEBAR)) {
      setupSidebar(sdk as SidebarAppSDK);
      return;
    }
    if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
      void setupConfiguration(sdk as ConfigAppSDK);
      return;
    }
    renderSidebarSetupError('Publishing checks is not configured for this Contentful location.');
  });
}
