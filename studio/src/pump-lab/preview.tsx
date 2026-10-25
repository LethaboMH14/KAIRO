// Isolated preview harness for PUMP-LAB-001. Dev server only: open
// /src/pump-lab/preview.html. It reads the shell stylesheet for the Manrope
// face and page reset only; the lab styles itself under .pl.
import { createRoot } from 'react-dom/client';
import '../styles.css';
import PumpLab from './PumpLab';

createRoot(document.getElementById('root')!).render(<PumpLab onExit={() => { window.location.href = '/'; }} />);
