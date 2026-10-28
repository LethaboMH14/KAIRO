// Isolated Vite development preview. Not an authenticated learner route.
// Example local dev URL: /src/studio-scenarios/binary-search-trace/preview.html
import { createRoot } from 'react-dom/client';
import BinarySearchLab from './BinarySearchLab';

const mount = document.getElementById('root');
if (!mount) throw new Error('Binary search preview root missing');
createRoot(mount).render(<BinarySearchLab />);
