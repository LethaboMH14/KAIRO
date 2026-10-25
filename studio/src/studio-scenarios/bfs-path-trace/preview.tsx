import { createRoot } from 'react-dom/client';
import BfsPathLab from './BfsPathLab';

const root = document.getElementById('root');
if (!root) throw new Error('BFS preview root not found');
createRoot(root).render(<BfsPathLab />);
