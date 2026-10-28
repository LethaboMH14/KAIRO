import express from 'express';
import {createBundleLessons} from './server/bundle-lessons/service.mjs';
import {createLocalBundleRepository} from './server/bundle-lessons/local-repository.mjs';
import {loadCurricula,studentSpace} from './server/student-space/model.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTraceEngine } from './server/trace.mjs';
import { askGuide, cloudConfigured, validateQuestion, googleConfiguration } from './server/google.mjs';
import { workspaceRoutes } from './server/workspace/routes.mjs';
import { speechRouter } from './server/avatar/speech.mjs';
import {createAccountRouter} from './server/account/routes.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const app = express();
const engine = createTraceEngine();
app.disable('x-powered-by');
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host || '') || (origin && origin !== `http://${req.headers.host}`)) {
    return res.status(403).json({ error: 'This local API accepts only studio requests.' });
  }
  next();
});
app.use('/api/account',createAccountRouter({secure:false,hostedUrl:process.env.KAIRO_LEARNER_APP_URL}));
const localCohort=['engineering','informatics'].includes(process.env.KAIRO_LOCAL_CURRICULUM)?process.env.KAIRO_LOCAL_CURRICULUM:null,localCurricula=localCohort?await loadCurricula():null;
app.get('/api/account/learning-space',(_req,res)=>{res.set('Cache-Control','no-store');res.json({space:localCohort?studentSpace({schemaVersion:1,synthetic:true,cohort:localCohort,studentId:localCohort==='engineering'?'KAIRO-ENG-0001':'KAIRO-INF-0001',displayName:'Local curriculum preview',materialLinks:{}},localCurricula):null});});
const localHome=process.env.KAIRO_LOCAL_WORKSPACE_DIR||join(root,'../data/private/app-workspace');
const bundleRepository=await createLocalBundleRepository(localHome);
app.use('/api/workspace',(req,_res,next)=>{req.kairoIdentity={uid:'local'};next();},createBundleLessons({repository:bundleRepository}).router);
app.use('/api/workspace', await workspaceRoutes(root,{home:localHome}));
app.use('/api/avatar', speechRouter());
app.use(express.json({ limit: '4kb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, runtime: 'local-node-sqlite', cloudConfigured: cloudConfigured() }));
app.get('/api/services', (_req,res)=>{res.set('Cache-Control','no-store');res.json({runtime:'local-node-sqlite',google:googleConfiguration(),storage:{mode:'local-files-and-browser'},security:{scope:'loopback-only'}});});
let guideCalls = 0;
let guideWindowStart = Date.now();
let guideWindowCalls = 0;
app.post('/api/ask', async (req, res) => {
  try {
    const question = validateQuestion(req.body?.question);
    const topic = typeof req.body?.topic === 'string' ? req.body.topic : 'database';
    if (Date.now() - guideWindowStart > 60000) { guideWindowStart = Date.now(); guideWindowCalls = 0; }
    if (guideCalls >= 30 || guideWindowCalls >= 6) return res.status(429).json({ error: 'This preview has reached its cloud-question allowance. Continue with the prepared lesson.' });
    if (!cloudConfigured()) return res.status(503).json({ error: 'Cloud teaching is not enabled in this local session.' });
    const result = engine.run(topic);
    guideCalls++; guideWindowCalls++;
    const stage = ['interface', 'api', 'database', 'response'].includes(req.body?.stage) ? req.body.stage : 'interface';
    res.json(await askGuide({ question, topic, stage, rows: result.rows }));
  } catch (error) {
    const invalid = error instanceof TypeError;
    res.status(invalid ? 400 : 503).json({ error: invalid ? error.message : 'The cloud guide is unavailable. The prepared lesson still works.' });
  }
});
app.post('/api/trace', (req, res) => {
  try { res.json(engine.run(req.body?.topic)); }
  catch (error) {
    if (error instanceof TypeError) return res.status(400).json({ error: error.message });
    console.error('Trace execution failed');
    res.status(500).json({ error: 'The local trace failed. Try again.' });
  }
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));
if (process.argv.includes('--production')) {
  app.use(express.static(join(root, 'dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(join(root, 'dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error, _req, res, _next) => {
  res.status(error.status === 413 ? 413 : 400).json({ error: 'Request could not be read.' });
});
const port = Number(process.env.PORT || 4173);
const server = app.listen(port, '127.0.0.1', () => console.log(`KAIRO Studio: http://127.0.0.1:${port}`));
function shutdown() { server.close(() => { bundleRepository.close();engine.close(); process.exit(0); }); server.closeAllConnections(); }
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
