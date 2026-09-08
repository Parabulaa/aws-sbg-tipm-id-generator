import { spawnSync, spawn } from 'node:child_process';
if (!process.env.ID_TEST_STATE)
  throw new Error('ID_TEST_STATE must name an isolated test directory.');
const env = {
  ...process.env,
  WRANGLER_LOG_PATH: '.wrangler/logs',
  WRANGLER_SEND_METRICS: 'false',
};
const migration = spawnSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'migrations',
    'apply',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--persist-to',
    process.env.ID_TEST_STATE,
  ],
  { env, stdio: 'inherit' },
);
if (migration.status !== 0) process.exit(migration.status || 1);
const server = spawn(
  process.execPath,
  ['node_modules/vinext/dist/cli.js', 'dev', '--port', '3100'],
  { env, stdio: 'inherit' },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code || 0));
