import { createRoot } from 'react-dom/client';
import PumpPowerReasoning from './PumpPowerReasoning.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Preview mount missing');
createRoot(root).render(<PumpPowerReasoning />);
