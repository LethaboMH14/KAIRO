// Standalone Vite development preview. Not mounted in authenticated StudioRouter.
// From studio/: npx vite --host 127.0.0.1, then visit
// /src/studio-scenarios/pump-what-if/preview.html (no cloud keys required).
import { createRoot } from 'react-dom/client';
import PumpWhatIf from './PumpWhatIf.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Pump What-If preview root missing');
createRoot(root).render(<PumpWhatIf />);
