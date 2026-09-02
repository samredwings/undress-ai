import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ENV_FILE = '.env.production';
const REQUIRED_KEY = 'NEXT_PUBLIC_API_URL';

function loadEnvFile() {
  if (!existsSync(ENV_FILE)) return {};
  const entries = {};
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match) entries[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return entries;
}

const fileEnv = loadEnvFile();
const value = process.env[REQUIRED_KEY] ?? fileEnv[REQUIRED_KEY];

if (!value) {
  console.error(
    `[cap:sync] Missing ${REQUIRED_KEY}.\n` +
      `The static export inlines the API base URL at build time — without it every API call in the APK breaks.\n` +
      `Copy .env.production.example to ${ENV_FILE} and set your API server address, e.g.:\n` +
      `  NEXT_PUBLIC_API_URL=http://192.168.1.100:3001  (your machine's LAN IP for phone testing)\n` +
      `or pass it inline: NEXT_PUBLIC_API_URL=http://... npm run cap:sync`
  );
  process.exit(1);
}

console.log(`[cap:sync] Using API URL: ${value}`);
execSync('next build && cap sync', { stdio: 'inherit', shell: process.platform === 'win32' });

