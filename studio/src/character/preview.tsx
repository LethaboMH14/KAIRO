// Isolated rehearsal harness for CHARACTER-002. Dev server only: open /src/character/preview.html. It loads the
// shell's global stylesheet read-only so the module is checked under the conditions it will be integrated in.
import { createRoot } from 'react-dom/client';
import '../styles.css';
import Rehearsal from './Rehearsal.tsx';

createRoot(document.getElementById('root')!).render(<Rehearsal />);
