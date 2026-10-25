// Isolated preview harness for ENG-001. Dev server only: open
// /src/engineering/preview.html. It loads the shell's global stylesheet
// read-only so the module is checked under the conditions it will be integrated in.
import { createRoot } from 'react-dom/client';
import '../styles.css';
import EngineeringStudio from './EngineeringStudio';
import TeacherProvider from '../teacher/TeacherProvider';

createRoot(document.getElementById('root')!).render(<TeacherProvider><EngineeringStudio onExit={() => { window.location.href = '/'; }} /></TeacherProvider>);
