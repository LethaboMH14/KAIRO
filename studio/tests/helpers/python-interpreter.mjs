import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

// KAIRO_PYTHON selects the same interpreter as the application and CI. Local
// Windows contributors retain the documented isolated OCR environment.
const repoRoot=fileURLToPath(new URL('../../../',import.meta.url));
export const testPython=process.env.KAIRO_PYTHON || (process.platform==='win32'
  ? join(repoRoot,'tools','course_sources','.venv-ocr','Scripts','python.exe')
  : 'python3');
