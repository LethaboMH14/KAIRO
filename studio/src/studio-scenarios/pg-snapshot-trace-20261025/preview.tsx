import { createRoot } from 'react-dom/client';
import PgSnapshotLab from './PgSnapshotLab';
const root = document.getElementById('root');
if (!root) throw new Error('Missing isolated database snapshot preview root');
createRoot(root).render(<PgSnapshotLab />);
