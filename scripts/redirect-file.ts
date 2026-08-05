export interface Redirect {
  from: string;
  to: string;
  status: number;
}

const articleRedirectPath = /^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

function parseRedirect(value: unknown, index: number): Redirect {
  if (!value || typeof value !== 'object') {
    throw new Error(`Redirect ${index} must be an object.`);
  }

  const { from, to, status } = value as Record<string, unknown>;
  if (
    typeof from !== 'string' ||
    typeof to !== 'string' ||
    !articleRedirectPath.test(from) ||
    !articleRedirectPath.test(to)
  ) {
    throw new Error(`Redirect ${index} must use canonical internal article paths.`);
  }
  if (status !== 301) {
    throw new Error(`Redirect ${index} must use status 301.`);
  }

  return { from, to, status };
}

export function serializeRedirectFile(value: unknown): string {
  if (!Array.isArray(value)) {
    throw new Error('Generated redirects must be an array.');
  }

  const redirects = value.map(parseRedirect);
  const sources = new Set<string>();
  for (const redirect of redirects) {
    if (redirect.from === redirect.to) {
      throw new Error(`Redirect source ${redirect.from} creates a self-loop.`);
    }
    if (sources.has(redirect.from)) {
      throw new Error(`Duplicate redirect source: ${redirect.from}`);
    }
    sources.add(redirect.from);
  }

  for (const redirect of redirects) {
    if (sources.has(redirect.to)) {
      throw new Error(
        `Redirect target ${redirect.to} is not canonical because it is also a redirect source.`,
      );
    }
  }

  return [
    '# Generated from published Article.previousSlugs values.',
    ...redirects.map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`),
    '',
  ].join('\n');
}
