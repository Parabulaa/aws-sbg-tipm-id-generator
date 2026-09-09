import { spawn, spawnSync } from 'node:child_process';

const testEnv = {
  ...process.env,
  VITE_SUPABASE_URL: 'https://supabase.test',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
  WRANGLER_LOG_PATH: '.wrangler/logs',
  WRANGLER_SEND_METRICS: 'false',
};
const server = spawn(
  process.execPath,
  ['node_modules/vinext/dist/cli.js', 'dev', '--port', '3100'],
  { env: testEnv, stdio: 'inherit' },
);
server.unref();

function stopServer() {
  if (!server.pid) return;
  if (process.platform === 'win32')
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], {
      stdio: 'ignore',
    });
  else server.kill('SIGKILL');
}

for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    stopServer();
    process.exit(130);
  });

try {
  const deadline = Date.now() + 120_000;
  while (true) {
    if (server.exitCode !== null)
      throw new Error(
        `Development server stopped with code ${server.exitCode}.`,
      );
    try {
      const response = await fetch('http://localhost:3100/');
      if (response.ok) break;
    } catch {
      // The server is still starting.
    }
    if (Date.now() > deadline)
      throw new Error('Timed out starting the isolated Playwright server.');
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const runner = spawn(
    process.execPath,
    ['node_modules/@playwright/test/cli.js', 'test'],
    {
      env: { ...testEnv, PLAYWRIGHT_EXTERNAL_SERVER: 'true' },
      stdio: 'inherit',
    },
  );
  const exitCode = await new Promise((resolve) =>
    runner.once('exit', (code) => resolve(code ?? 1)),
  );
  process.exitCode = exitCode;
} finally {
  stopServer();
}
