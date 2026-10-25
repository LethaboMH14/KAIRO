// Dev-only harness for SASL-CAPTURE-001: open /src/signing/preview.html on the dev server. Not routed in the app.
import { createRoot } from 'react-dom/client';
import '../experience/experience.css';
import TrackingPanel from './TrackingPanel';
import { manifest } from './browserDeps';

createRoot(document.getElementById('root')!).render(
  <>
    <TrackingPanel />
    <details style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px 32px', fontSize: 13 }}>
      <summary>Pinned files</summary>
      <p>@mediapipe/tasks-vision {manifest.runtime.version} ({manifest.runtime.license}); hand model sha256 {manifest.model.asset.sha256.slice(0, 16)}…; worker sha256 {manifest.worker.sha256.slice(0, 16)}…</p>
    </details>
  </>,
);
