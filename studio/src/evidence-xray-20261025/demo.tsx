// Dev-only Vite entry. Run: cd studio && npx vite --host 127.0.0.1 --port 4189
// Open: http://127.0.0.1:4189/src/evidence-xray-20261025/demo.html
// Deliberately never loads private owner content or authenticates on behalf of a learner.
import React from 'react';
import {createRoot} from 'react-dom/client';
import EvidenceXRay from './EvidenceXRay';
import {preparedPumpExercise} from './prepared-pump.mjs';
const host=document.getElementById('root');
if(!host)throw new Error('Evidence X-Ray demo root missing');
createRoot(host).render(<React.StrictMode><EvidenceXRay activity={preparedPumpExercise}/></React.StrictMode>);