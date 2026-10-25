/**
 * Pinned, read-only staging inputs. A changed PR head must be reviewed and
 * explicitly re-pinned. These are candidates, NOT approved/merged features.
 */
export const REPOSITORY='LethaboMH14/KAIRO';
export const CANDIDATES=Object.freeze([
  Object.freeze({
    number:55, sha:'a46838a82e3a564223196e1f270c369207771e90',
    files:Object.freeze([
      'coordination/handoffs/2026-10-25-issue49-pump-what-if-gpt6.md',
      'studio/src/studio-scenarios/pump-what-if/PumpWhatIf.tsx',
      'studio/src/studio-scenarios/pump-what-if/challenge.ts',
      'studio/src/studio-scenarios/pump-what-if/preview.html',
      'studio/src/studio-scenarios/pump-what-if/preview.tsx',
      'studio/src/studio-scenarios/pump-what-if/pump-what-if.css',
      'studio/tests/pump-what-if.test.mjs',
    ]),
  }),
  Object.freeze({
    number:64, sha:'d2bafd1183ef74bee56eaf616ca3c8ca7c09f2ad',
    files:Object.freeze([
      'coordination/handoffs/2026-10-25-issue49-attempt-contract-gpt6-f.md',
      'studio/src/studio-scenarios/attempt-contract/README.md',
      'studio/src/studio-scenarios/attempt-contract/local-review.mjs',
      'studio/tests/studio-attempt-contract.test.mjs',
    ]),
  }),
  Object.freeze({
    number:68, sha:'f2b45fe1be0592e7305a2aea12dcb20cff11edfd',
    files:Object.freeze([
      'coordination/handoffs/2026-10-25-issue49-pump-replay-gpt6-j.md',
      'studio/server/studio-evidence-replay/README.md',
      'studio/server/studio-evidence-replay/audit.mjs',
      'studio/tests/studio-evidence-replay.test.mjs',
    ]),
  }),
  Object.freeze({
    number:70, sha:'911f23a22c14958619a06f7990058e80f6ec1718',
    files:Object.freeze([
      'coordination/handoffs/2026-10-25-issue49-lesson-link-gpt6-l.md',
      'studio/server/studio-lesson-link/README.md',
      'studio/server/studio-lesson-link/index.mjs',
      'studio/tests/studio-lesson-link.test.mjs',
    ]),
  }),
]);
export const SHA=/^[0-9a-f]{40}$/;
const safePath=p=>typeof p==='string'&&p.length<=240&&p.length>0&&!p.includes('\\')&&!p.startsWith('/')&&!p.includes('\0')&&
  p.split('/').every(segment=>segment&&segment!=='.'&&segment!=='..');
const same=(a,b)=>a.length===b.length&&a.every((value,index)=>value===b[index]);
const fail=message=>{throw new Error(message);};
export function validateManifest(candidates=CANDIDATES){
 if(!Array.isArray(candidates)||!candidates.length||candidates.length>12)fail('Invalid candidate count');
 const numbers=new Set(),allPaths=new Set();
 for(const c of candidates){
   if(!Number.isSafeInteger(c.number)||c.number<1||numbers.has(c.number)||!SHA.test(c.sha))fail('Duplicate or invalid candidate identity/SHA');
   numbers.add(c.number);
   if(!Array.isArray(c.files)||!c.files.length||c.files.length>30)fail('Invalid candidate file count');
   const paths=new Set();
   for(const path of c.files){
     if(!safePath(path)||paths.has(path)||allPaths.has(path))fail('Unsafe, duplicate or conflicting candidate path: '+path);
     paths.add(path);allPaths.add(path);
   }
 }
 return true;
}
export function validatePR(candidate,pr,files){
 if(!pr||pr.number!==candidate.number||pr.state!=='open'||pr.merged_at||
    pr.head?.sha!==candidate.sha||pr.head?.repo?.full_name!==REPOSITORY||
    pr.base?.ref!=='main'||pr.base?.repo?.full_name!==REPOSITORY)fail('Candidate PR identity, state, repo or pinned head changed: #'+candidate.number);
 if(!Array.isArray(files)||files.length!==candidate.files.length||
    files.some(f=>!f||f.status!=='added'||!safePath(f.filename))||
    !same(files.map(f=>f.filename).sort(),[...candidate.files].sort()))
    fail('Candidate changed-file scope differs from pinned manifest: #'+candidate.number);
 return true;
}
export function validateComposedDiff(candidate,paths){
 if(!Array.isArray(paths)||!same([...paths].sort(),[...candidate.files].sort()))
   fail('Unexpected changed files in temporary composition: #'+candidate.number);
 return true;
}
