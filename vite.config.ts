import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import path from 'node:path';

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
};

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  // Use Nitro for Vercel deployments. Local development and the existing
  // Cloudflare deployment keep the Cloudflare runtime and bindings.
  const runtimePlugin = isVercel
    ? (await import('nitro/vite')).nitro()
    : (await import('@cloudflare/vite-plugin')).cloudflare({
        persistState: process.env.ID_TEST_STATE
          ? { path: process.env.ID_TEST_STATE }
          : true,
        inspectorPort: false,
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: {
          ...localBindingConfig,
          vars: command === 'serve' ? { DEV_LOCAL_ONLY: 'true' } : {},
        },
      });

  return {
    resolve: isVercel
      ? { alias: { 'cloudflare:workers': path.resolve('lib/server/vercel-cloudflare-env.ts') } }
      : undefined,
    optimizeDeps: { include: ['exceljs', 'pdf-lib', 'jszip'] },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      runtimePlugin,
    ],
  };
});
