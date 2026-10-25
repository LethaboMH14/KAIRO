import { createRoot } from 'react-dom/client';
import SqlJoinLab from './SqlJoinLab';

const root = document.getElementById('root');
if (!root) throw new Error('Missing isolated SQL join preview root');
createRoot(root).render(<SqlJoinLab />);
