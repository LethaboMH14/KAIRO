import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SqlWindowRankLab from './SqlWindowRankLab';

const root = document.getElementById('root');
if (!root) throw new Error('Missing SQL ranking preview root');
createRoot(root).render(<StrictMode><SqlWindowRankLab /></StrictMode>);
