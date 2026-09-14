import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const url = process.env.DATABASE_TEST_URL;

if (!url) {
  console.error('DATABASE_TEST_URL não está definida.');
  process.exit(1);
}

execSync('prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: url },
});
