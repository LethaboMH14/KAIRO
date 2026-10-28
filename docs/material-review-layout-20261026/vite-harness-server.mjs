import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const studioPackage = new URL('../../studio/package.json', import.meta.url);
const require = createRequire(studioPackage);
const { createServer } = require('vite');
const reactPluginModule = await import(pathToFileURL(require.resolve('@vitejs/plugin-react')).href);
const docsRoot = fileURLToPath(new URL('.', import.meta.url));
const workspaceRoot = fileURLToPath(new URL('../../', import.meta.url));
const studioRoot = fileURLToPath(new URL('../../studio/', import.meta.url));

const server = await createServer({
  root: docsRoot,
  configFile: false,
  plugins: [reactPluginModule.default()],
  resolve: { alias: [
    { find: /^react\/jsx-dev-runtime$/, replacement: `${studioRoot}/node_modules/react/jsx-dev-runtime.js` },
    { find: /^react\/jsx-runtime$/, replacement: `${studioRoot}/node_modules/react/jsx-runtime.js` },
    { find: /^react-dom\/client$/, replacement: `${studioRoot}/node_modules/react-dom/client.js` },
    { find: /^react-dom$/, replacement: `${studioRoot}/node_modules/react-dom/index.js` },
    { find: /^react$/, replacement: `${studioRoot}/node_modules/react/index.js` },
  ] },
  optimizeDeps: { noDiscovery: true, include: [] },
  cacheDir: `${docsRoot}/.vite-cache`,
  server: { host: '127.0.0.1', port: 4191, strictPort: true, fs: { allow: [workspaceRoot] } },
});
await server.listen();
console.log('Synthetic material review harness: http://127.0.0.1:4191/harness.html');
process.on('SIGINT', async () => { await server.close(); process.exit(0); });

