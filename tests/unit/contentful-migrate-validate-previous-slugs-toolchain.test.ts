import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

type PackageManifest = {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};

type PackageLock = {
  packages: Record<
    string,
    {
      version?: string;
      resolved?: string;
      integrity?: string;
      devDependencies?: Record<string, string>;
      bin?: Record<string, string>;
    }
  >;
};

const manifest = JSON.parse(readFileSync(path.resolve('package.json'), 'utf8')) as PackageManifest;
const lockfile = JSON.parse(readFileSync(path.resolve('package-lock.json'), 'utf8')) as PackageLock;

describe('validate-previous-slugs Contentful migration toolchain', () => {
  it('invokes the repository-installed migrator with the exact target and arguments', () => {
    const migrationCommand = manifest.scripts['contentful:migrate:validate-previous-slugs'];

    expect(migrationCommand).toBe(
      'contentful-migration --space-id "$CONTENTFUL_SPACE_ID" --environment-id "${CONTENTFUL_ENVIRONMENT:-master}" --access-token "$CONTENTFUL_MANAGEMENT_TOKEN" --yes contentful/migrations/003-validate-previous-slugs.cjs',
    );
    expect(migrationCommand).not.toMatch(/\b(?:npx|npm exec)\b/);
  });

  it('locks the migrator and its executable artifact to the exact local version', () => {
    const version = manifest.devDependencies['contentful-migration'];
    const rootLock = lockfile.packages[''];
    const migratorLock = lockfile.packages['node_modules/contentful-migration'];

    expect(version).toBe('5.1.0');
    expect(rootLock?.devDependencies?.['contentful-migration']).toBe(version);
    expect(migratorLock?.version).toBe(version);
    expect(migratorLock?.resolved).toBe(
      `https://registry.npmjs.org/contentful-migration/-/contentful-migration-${version}.tgz`,
    );
    expect(migratorLock?.integrity).toMatch(/^sha512-/);
    expect(migratorLock?.bin).toEqual({
      'contentful-migration': 'bin/contentful-migration',
    });
  });
});
