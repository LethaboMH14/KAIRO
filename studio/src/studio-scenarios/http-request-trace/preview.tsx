// Isolated dev-only preview: /src/studio-scenarios/http-request-trace/preview.html
// Does not register an authenticated StudioRouter route or persist attempts.
import { createRoot } from 'react-dom/client';
import RequestTraceLab from './RequestTraceLab';

const mount = document.getElementById('root');
if (!mount) throw new Error('Missing HTTP request trace preview mount');
createRoot(mount).render(<RequestTraceLab />);
