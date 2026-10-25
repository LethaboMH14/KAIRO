// Explicit one-shot provisioning of two fictional demo learners. No paid model calls.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {getToken} from '../../studio/server/google.mjs';
import {createLearnerRepository} from '../../studio/server/learner-repository/index.mjs';
import {loadCurricula,resolveStudentSpace} from '../../studio/server/student-space/model.mjs';
import {hash,localLesson} from '../../studio/server/workspace/model.mjs';
import {selectEvidence} from '../../studio/src/evidence-selection-core/model.ts';
const require=createRequire(new URL('../../studio/package.json',import.meta.url)),{Firestore}=require('@google-cloud/firestore'),{GoogleAuth,OAuth2Client}=require('google-auth-library');
const projectId='kairo-access-20261021',client=new OAuth2Client();client.quotaProjectId=projectId;client.setCredentials({access_token:await getToken(),expiry_date:Date.now()+1800000});const firestore=new Firestore({projectId,auth:new GoogleAuth({projectId,authClient:client})});
const repo=createLearnerRepository({firestore,bucket:{file(){throw Error('Provisioning does not access original files');}}}),curricula=await loadCurricula();
const config=Object.fromEntries((await readFile(new URL('../connected_release/.env.cloud.local',import.meta.url),'utf8')).trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const credentialPath=new URL('../connected_release/judge-credentials.local.json',import.meta.url);let manifest;
try{manifest=JSON.parse(await readFile(credentialPath,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;manifest={syntheticOnly:true,accounts:[]};}
const report={checkedAt:new Date().toISOString(),syntheticOnly:true,profiles:[]};
for(const cohort of ['engineering','informatics']){
 let account=manifest.accounts.find(a=>a.cohort===cohort);
 if(!account){const email=`judge.${cohort}@kairo-demo.invalid`,password=randomBytes(22).toString('base64url')+'aA9!';const response=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+encodeURIComponent(config.KAIRO_FIREBASE_API_KEY),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Synthetic account creation failed: HTTP '+response.status);const user=await response.json();account={cohort,email,password,uid:user.localId};manifest.accounts.push(account);await writeFile(credentialPath,JSON.stringify(manifest,null,2),{mode:0o600});}
 const existing=await repo.get(account.uid,'progress','enrolment');if(existing){const checked=await resolveStudentSpace(repo,account.uid,curricula);report.profiles.push({studentId:checked.studentId,cohort,alreadyProvisioned:true});continue;}
 const materialLinks={};for(const [index,module] of curricula[cohort].modules.entries()){
  let pack=null;if(['motor','pump'].includes(module.activity))pack=JSON.parse(await readFile(new URL(`../../studio/src/studio-teaching-host/packs/${module.activity}.json`,import.meta.url),'utf8'));
  const body=pack?`KAIRO prepared enrichment for ${module.code}: ${module.title}.\n${pack.objective}\n\n${pack.steps.map(s=>s.title+'\n'+s.explanation+'\nTry: '+s.learnerAction).join('\n\n')}\n\nReferences for checking:\n${pack.sourceRefs.map(s=>s.url+' — '+s.locator).join('\n')}\n\nThis is KAIRO-authored enrichment, not university course material or a prescribed practical.`:`KAIRO module orientation: ${module.code} ${module.title}.\n${module.summary}\n\nOfficial curriculum reference: ${module.sourceUrl}\nLocator: ${module.sourceLocator}\n\nThis is a short module outline, not course notes or a complete lesson in the subject. Bring material you have permission to use, check its extraction, and choose a focused learning goal. No marks, deadlines or completed work have been supplied for this fictional learner.`;
  const sourceId=randomBytes(12).toString('hex'),pages=[{text:body,locator:pack?'KAIRO prepared public-reference note':'Public module orientation',method:'kairo-authored-demo'}],revision=hash(pages),source={id:sourceId,title:`${module.code} · ${module.title} · ${pack?'prepared enrichment':'module outline'}`,pages,reviewedPages:pages,reviewed:true,revision,reviewedAt:new Date().toISOString(),createdAt:new Date().toISOString(),moduleCode:module.code,limitNote:'KAIRO-authored orientation/enrichment. University references provide curriculum facts; not official course notes.'};
  await repo.put(account.uid,'sources',sourceId,source,{create:true});await repo.put(account.uid,'revisions',sourceId+'_'+revision,source,{create:true});
  const selected=selectEvidence(source,module.title),lesson={...localLesson(source,selected.evidence),id:randomBytes(12).toString('hex'),sourceId,sourceTitle:source.title,revision,createdAt:new Date().toISOString(),mode:'local-extractive',model:null,evidence:selected.evidence,coverage:'Prepared demo enrichment or module orientation, not complete course coverage.',reviewWarning:'Fictional learner; no attainment or official assessment. Check references and bring actual study material.'};await repo.put(account.uid,'lessons',lesson.id,lesson,{create:true});materialLinks[module.code||String(index)]={sourceId,lessonId:lesson.id};
 }
 const enrolment={schemaVersion:1,cohort,synthetic:true,studentId:cohort==='engineering'?'KAIRO-ENG-0001':'KAIRO-INF-0001',displayName:cohort==='engineering'?'Lerato':'Thabo',materialLinks};await repo.put(account.uid,'progress','enrolment',enrolment,{create:true});const checked=await resolveStudentSpace(repo,account.uid,curricula);report.profiles.push({studentId:checked.studentId,cohort,modules:checked.curriculum.modules.length,preparedMaterials:Object.keys(checked.materialLinks).length});
}
await mkdir(new URL('../../docs/judge-spaces-20261024/',import.meta.url),{recursive:true});await writeFile(new URL('../../docs/judge-spaces-20261024/provision-evidence.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));

await firestore.terminate();
