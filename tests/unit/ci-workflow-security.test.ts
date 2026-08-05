import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(path.resolve('.github', 'workflows', 'ci.yml'), 'utf8');
const deploymentWorkflow = readFileSync(path.resolve('.github', 'workflows', 'deploy.yml'), 'utf8');

function getJobBlock(jobName: string): string {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === `  ${jobName}:`);
  const end = lines.findIndex((line, index) => index > start && /^ {2}[a-zA-Z0-9_-]+:$/.test(line));

  if (start === -1) {
    throw new Error(`Missing ${jobName} job in CI workflow.`);
  }

  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

function getDeploymentStepBlock(stepName: string): string {
  const lines = deploymentWorkflow.split('\n');
  const start = lines.findIndex((line) => line === `      - name: ${stepName}`);
  const end = lines.findIndex((line, index) => index > start && /^ {6}- name: /.test(line));

  if (start === -1) {
    throw new Error(`Missing ${stepName} step in deployment workflow.`);
  }

  return lines.slice(start, end === -1 ? undefined : end).join('\n');
}

describe('CI workflow secret isolation', () => {
  const verifyJob = getJobBlock('verify');
  const contentfulJob = getJobBlock('contentful-integration');

  it('keeps Contentful secrets out of pull-request execution', () => {
    expect(contentfulJob.match(/^ {4}if: (.+)$/m)?.[1]).toBe("github.event_name == 'push'");
    expect(contentfulJob).not.toContain('github.event.pull_request.head.repo.full_name');
    expect(contentfulJob).toContain('${{ secrets.CONTENTFUL_DELIVERY_TOKEN }}');
  });

  it('preserves secretless pull-request checks and trusted post-merge validation', () => {
    expect(workflow).toContain('  pull_request:');
    expect(verifyJob).not.toMatch(/^ {4}if:/m);
    expect(contentfulJob).toContain('- name: Validate published Contentful content');
    expect(contentfulJob).toContain('npm run validate:content');
    expect(contentfulJob).toContain('[ -z "$CONTENTFUL_SPACE_ID" ]');
    expect(contentfulJob).toContain('[ -z "$CONTENTFUL_DELIVERY_TOKEN" ]');
    expect(contentfulJob).toContain('PUBLICATION_ENV: production');
  });
});

describe('production deployment action integrity', () => {
  it('pins the publication source checkout to the reviewed actions/checkout v7.0.1 commit', () => {
    const sourceCheckout = getDeploymentStepBlock('Check out publication source');

    expect(sourceCheckout).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    );
    expect(sourceCheckout).toContain('path: source');
  });

  it('pins the fallback checkout to the reviewed actions/checkout v7.0.1 commit', () => {
    const fallbackCheckout = getDeploymentStepBlock('Check out independent fallback site');

    expect(fallbackCheckout).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1',
    );
    expect(fallbackCheckout).not.toContain('actions/checkout@v7');
    expect(fallbackCheckout).toContain('repository: viburamineni/viburamineni.github.io');
    expect(fallbackCheckout).toContain('path: fallback');
    expect(fallbackCheckout).toContain('ssh-key: ${{ secrets.FALLBACK_DEPLOY_KEY }}');
  });

  it('pins Node setup to the reviewed actions/setup-node v7.0.0 commit', () => {
    const nodeSetup = getDeploymentStepBlock('Set up Node');

    expect(nodeSetup).toContain(
      'uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0',
    );
    expect(nodeSetup).toContain('node-version: 24');
    expect(nodeSetup).toContain('cache: npm');
    expect(nodeSetup).toContain('cache-dependency-path: source/package-lock.json');
  });

  it('pins generated-image cache restore to the reviewed actions/cache v4.3.0 commit', () => {
    const cacheRestore = getDeploymentStepBlock('Restore generated Contentful images');

    expect(cacheRestore).toContain(
      'uses: actions/cache/restore@0057852bfaa89a56745cba8c7296529d2fc39830 # v4.3.0',
    );
    expect(cacheRestore).not.toContain('actions/cache/restore@v4');
    expect(cacheRestore).toContain('id: image-cache');
    expect(cacheRestore).toContain('path: source/public/generated');
    expect(cacheRestore).toContain('key: contentful-images-${{ github.run_id }}');
    expect(cacheRestore).toContain('restore-keys:');
    expect(cacheRestore).toContain('contentful-images-');
  });

  it('pins generated-image cache save to the reviewed actions/cache v4.3.0 commit', () => {
    const cacheSave = getDeploymentStepBlock('Save generated Contentful images');

    expect(cacheSave).toContain(
      'uses: actions/cache/save@0057852bfaa89a56745cba8c7296529d2fc39830 # v4.3.0',
    );
    expect(cacheSave).not.toContain('actions/cache/save@v4');
    expect(cacheSave).toContain("if: success() && steps.image-cache.outputs.cache-hit != 'true'");
    expect(cacheSave).toContain('path: source/public/generated');
    expect(cacheSave).toContain('key: contentful-images-${{ github.run_id }}');
  });
});
