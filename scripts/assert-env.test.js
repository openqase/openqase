import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = join(__dirname, 'assert-env.js');

function run(env) {
  return spawnSync('node', [scriptPath], {
    env: { ...process.env, ...env, PATH: process.env.PATH },
    encoding: 'utf8',
  });
}

describe('assert-env.js', () => {
  it('exits 1 when NODE_ENV=production and DEV_MODE_AUTH_BYPASS=true', () => {
    const result = run({
      NODE_ENV: 'production',
      DEV_MODE_AUTH_BYPASS: 'true',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/DEV_MODE_AUTH_BYPASS/);
  });

  it('exits 0 when NODE_ENV=development and DEV_MODE_AUTH_BYPASS=true', () => {
    const result = run({
      NODE_ENV: 'development',
      DEV_MODE_AUTH_BYPASS: 'true',
    });
    expect(result.status).toBe(0);
  });

  it('exits 0 when NODE_ENV=production and DEV_MODE_AUTH_BYPASS unset', () => {
    const result = run({
      NODE_ENV: 'production',
      DEV_MODE_AUTH_BYPASS: undefined,
    });
    expect(result.status).toBe(0);
  });

  it('exits 0 when both unset', () => {
    const result = run({
      NODE_ENV: undefined,
      DEV_MODE_AUTH_BYPASS: undefined,
    });
    expect(result.status).toBe(0);
  });
});
