// Khronos glTF-Validator over a GLB (gltf-validator is installed in tools/character/node, not in the app).
//   node design/character/blender/validate_glb.mjs <file.glb> [report.json]
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(fileURLToPath(new URL('../../../tools/character/node/package.json', import.meta.url)));
const validator = require('gltf-validator');
const [file, out] = process.argv.slice(2);
const bytes = new Uint8Array(await readFile(file));
const report = await validator.validateBytes(bytes, { maxIssues: 200, writeTimestamp: false });
const { numErrors, numWarnings, numInfos, numHints } = report.issues;
const summary = {
  validator: `${report.validatorVersion}`,
  file,
  errors: numErrors, warnings: numWarnings, infos: numInfos, hints: numHints,
  messages: report.issues.messages.map(m => ({ code: m.code, severity: m.severity, pointer: m.pointer, message: m.message })),
  info: report.info,
};
if (out) await writeFile(out, JSON.stringify(summary, null, 1));
console.log(JSON.stringify({ errors: numErrors, warnings: numWarnings, infos: numInfos, hints: numHints }));
for (const m of summary.messages.slice(0, 25)) console.log(`${['ERROR', 'WARNING', 'INFO', 'HINT'][m.severity]} ${m.code} ${m.pointer ?? ''} ${m.message}`);
process.exit(numErrors ? 1 : 0);
