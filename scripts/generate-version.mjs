#!/usr/bin/env node
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distOnly = process.argv.includes('--dist-only');

function getBuildId() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.GITHUB_SHA?.slice(0, 12) ??
    (() => {
      try {
        return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      } catch {
        return `dev-${Date.now()}`;
      }
    })()
  );
}

const buildId = getBuildId();
const payload = {
  buildId,
  builtAt: new Date().toISOString(),
};

if (!distOnly) {
  const envPath = resolve(root, '.env.build');
  writeFileSync(
    envPath,
    `# generated at build time\nEXPO_PUBLIC_BUILD_ID=${buildId}\n`,
    'utf8'
  );
  console.log('✓ build id:', buildId);
}

const distDir = resolve(root, 'dist');
if (existsSync(distDir)) {
  writeFileSync(resolve(distDir, 'version.json'), JSON.stringify(payload, null, 2), 'utf8');
  console.log('✓ dist/version.json');
}

const publicDir = resolve(root, 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'version.json'), JSON.stringify(payload, null, 2), 'utf8');
console.log('✓ public/version.json');
