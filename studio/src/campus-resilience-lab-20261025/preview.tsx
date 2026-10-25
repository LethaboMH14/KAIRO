import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CampusResilienceLab from './CampusResilienceLab.tsx';

const root = document.getElementById('root');
if (!root) throw new Error('Campus resilience preview missing #root');
createRoot(root).render(<StrictMode><CampusResilienceLab /></StrictMode>);
