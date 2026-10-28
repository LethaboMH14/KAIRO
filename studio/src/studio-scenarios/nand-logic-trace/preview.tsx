import { createRoot } from 'react-dom/client';
import NandLogicLab from './NandLogicLab';

const root = document.getElementById('root');
if (!root) throw new Error('Missing isolated NAND logic preview root');
createRoot(root).render(<NandLogicLab />);
