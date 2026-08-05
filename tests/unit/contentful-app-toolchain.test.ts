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

describe('Contentful app upload toolchain', () => {
  it('invokes the repository-installed uploader without ad hoc package execution', () => {
    const uploadCommand = manifest.scripts['contentful:app:upload'];

    expect(uploadCommand).toContain('contentful-app-scripts upload');
    expect(uploadCommand).not.toMatch(/\b(?:npx|npm exec)\b/);
  });

  it('locks the privileged uploader and its executable artifact', () => {
    const version = manifest.devDependencies['@contentful/app-scripts'];
    const rootLock = lockfile.packages[''];
    const uploaderLock = lockfile.packages['node_modules/@contentful/app-scripts'];

    expect(version).toBe('4.1.6');
    expect(rootLock?.devDependencies?.['@contentful/app-scripts']).toBe(version);
    expect(uploaderLock?.version).toBe(version);
    expect(uploaderLock?.resolved).toBe(
      `https://registry.npmjs.org/@contentful/app-scripts/-/app-scripts-${version}.tgz`,
    );
    expect(uploaderLock?.integrity).toMatch(/^sha512-/);
    expect(uploaderLock?.bin).toEqual({ 'contentful-app-scripts': 'lib/bin.js' });
  });
});
