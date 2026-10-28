import express from 'express';
import {createAiService,requestSignal} from '../ai-runtime/service.mjs';
import {createLocalAiStore} from '../ai-runtime/local-store.mjs';
import { readFile, writeFile, mkdir, readdir, unlink, access } from 'node:fs/promises';
import { join, basename, extname, resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { hash, text, reviewedPages, localLesson, validateLesson } from './model.mjs';
import { generateSourceLesson, generatePassageHelp, cloudConfigured, googleConfiguration, getToken } from '../google.mjs';
import {createCloudLibrary} from '../cloud-library/store.mjs';
import {extractUpload} from '../learner-workspace/extraction.mjs';
import {nativeReview} from './native-extraction.mjs';
import {selectEvidence} from '../../src/evidence-selection-core/model.ts';
import { resolvePassage, validatePassageHelp } from './passages.mjs';
import {createVersionStore} from '../lesson-versions/store.mjs';
import {draftFromLesson,validateDraft,draftToLesson} from '../../src/lesson-draft-core/model.ts';

const exec = promisify(execFile);
const newId=()=>randomBytes(12).toString('hex');
const idPattern=/^[a-f0-9]{24}$/;
export async function workspaceRoutes(studioRoot, options={}) {
  const router=express.Router(); const repo=resolve(studioRoot,'..');
  const home=options.home||join(repo,'data/private/app-workspace'); const imported=options.imported||join(repo,'data/private/course-sources/extracted');
  for(const dir of ['sources','lessons','uploads','originals']) await mkdir(join(home,dir),{recursive:true});
  const versions=createVersionStore(join(home,'versions.sqlite'));
  const cloudLibrary=options.cloudLibrary||createCloudLibrary({enabled:process.env.KAIRO_CLOUD_LIBRARY_ENABLED==='1',bucket:process.env.KAIRO_CLOUD_BUCKET||'',getToken});
  let cloudCopyCalls=0;
  const aiStore=createLocalAiStore(join(home,'ai-runtime.sqlite'));
  const ai=createAiService({repository:aiStore,getSource:async(_uid,id)=>get('sources',id),getLesson:async(_uid,id)=>get('lessons',id),generate:options.generate||generateSourceLesson,generateHelp:options.generateHelp||generatePassageHelp});
  router.closeStore=()=>{versions.close();aiStore.close();};
  const jobs=new Map(); let extractionBusy=false; let generating=false; let cloudCalls=0; let lastCloud=0;
  let passageBusy=false,passageCalls=0,lastPassage=0;
  const get=async(kind,id)=>{
    if(!idPattern.test(id||''))throw new TypeError('Invalid item ID.');
    if(kind==='sources'){const current=versions.getSource(id);if(current)return current;}
    const value=JSON.parse(await readFile(join(home,kind,`${id}.json`),'utf8'));
    if(kind==='sources'){versions.seedSource(value);return versions.getSource(id);}
    return value;
  };
  const publicSource=async source=>{if(source.original){try{await access(join(home,'originals',source.id+'.bin'));}catch{return {...source,original:null};}}return source;};
  const save=async(kind,value)=>{await writeFile(join(home,kind,`${value.id}.json`),JSON.stringify(value,null,2),'utf8');if(kind==='sources')versions.seedSource(value);};
  const sourceAt=async(id,revision)=>{const current=await get('sources',id);if(current.revision===revision)return current;const previous=versions.getSource(id,revision);if(!previous){const e=new Error('Source revision unavailable.');e.code='ENOENT';throw e;}return previous;};
  const admission=(bytes,ext)=>{
    if(!Buffer.isBuffer(bytes)||bytes.length===0||bytes.length>8*1024*1024)throw new TypeError('Choose a nonempty file up to 8 MB.');
    const starts=values=>values.every((v,i)=>bytes[i]===v);
    if(ext==='.pdf'){if(!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))throw new TypeError('This file does not have a PDF signature.');return {kind:'pdf',mediaType:'application/pdf'};}
    if(ext==='.png'){if(!starts([137,80,78,71,13,10,26,10]))throw new TypeError('This file does not have a PNG signature.');return {kind:'image',mediaType:'image/png'};}
    if(['.jpg','.jpeg'].includes(ext)){if(!starts([255,216,255]))throw new TypeError('This file does not have a JPEG signature.');return {kind:'image',mediaType:'image/jpeg'};}
    if(['.docx','.pptx','.xlsx'].includes(ext)&&!starts([80,75,3,4]))throw new TypeError('This file is not an expected Office package.');
    return {kind:'download',mediaType:'application/octet-stream'};
  };
  const route=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){res.status(e.status===409?409:e instanceof TypeError?400:e.code==='ENOENT'?404:503).json({error:e.status===409?'This item changed in another tab. Your draft was kept; reload the saved version before trying again.':e instanceof TypeError?e.message:e.code==='ENOENT'?'Item not found.':'This step could not finish. Your reviewed source is still saved; try again or use the local lesson.'});}};
  const safeSource=(d,title)=>({id:newId(),title:title.slice(0,120),createdAt:new Date().toISOString(),pages:d.pages.slice(0,4).map((p,i)=>({text:(p.text||'').slice(0,16000),locator:p.locator|| (p.page?`Page ${p.page}`:p.sheet||`Section ${i+1}`),method:p.method||'text'})),limitNote:d.limitNote||'Pilot extraction: only the displayed sections are available. Originals are unchanged.',reviewed:false});
  router.use((_req,res,next)=>{res.set('Cache-Control','no-store');res.set('X-Content-Type-Options','nosniff');next();});
  router.get('/teacher-reference',(_req,res)=>res.sendFile(join(repo,'assets/design-reference/teacher/avatar-directions-v1.png')));
  router.post('/upload',express.raw({type:'application/octet-stream',limit:'8mb'}),route(async(req,res)=>{
    if(extractionBusy) return res.status(429).json({error:'Another document is being extracted. Try again shortly.'});
    const name=basename(text(req.query.name,180,'Filename')); const ext=extname(name).toLowerCase();
    if(!['.pdf','.docx','.pptx','.xlsx','.txt','.md','.png','.jpg','.jpeg'].includes(ext) || !Buffer.isBuffer(req.body)||!req.body.length) throw new TypeError('Choose a PDF, Office document, text file or PNG/JPEG image up to 8 MB.');
    const originalInfo=admission(req.body,ext);const retainOriginal=req.query.retainOriginal==='1';
    const id=newId();const path=join(home,'uploads',id+ext);extractionBusy=true;
    try{await writeFile(path,req.body);}catch(error){extractionBusy=false;throw error;}
    if(jobs.size>=30)jobs.delete(jobs.keys().next().value);
    jobs.set(id,{status:'extracting'});res.status(202).json({jobId:id});
    (async()=>{try{
      const python=join(repo,'tools/course_sources/.venv-ocr/Scripts/python.exe');
      let source;
      if(!options.extract&&!options.extractNative&&!options.extractOcr){
        const converted=await extractUpload(req.body,ext);source={id:newId(),title:name.slice(0,120),createdAt:new Date().toISOString(),...converted,reviewed:false};
      }else if(!options.extract&&!['.png','.jpg','.jpeg'].includes(ext)){
        const native=options.extractNative?await options.extractNative(path):JSON.parse((await exec(python,[join(repo,'tools/material_ingestion/extract.py'),'--input',path,'--max-units','100'],{cwd:repo,windowsHide:true,timeout:120000,maxBuffer:1100000,env:{...process.env,PYTHONIOENCODING:'utf-8'}})).stdout);
        const converted=nativeReview(native,createHash('sha256').update(req.body).digest('hex'));
        if(converted.pages.length&&(ext!=='.pdf'||converted.extraction.reviewCharacters>=80)){source={id:newId(),title:name.slice(0,120),createdAt:new Date().toISOString(),...converted,reviewed:false};}
        else if(ext==='.pdf'){
          const ocr=options.extractOcr?await options.extractOcr(path):JSON.parse((await exec(python,[join(repo,'tools/course_sources/app_worker.py'),path],{cwd:repo,windowsHide:true,timeout:120000,maxBuffer:1024*1024})).stdout);
          source=safeSource(ocr,name);source.extraction={...converted.extraction,reviewSections:source.pages.length,reviewCharacters:source.pages.reduce((n,p)=>n+p.text.length,0),warnings:[...converted.extraction.warnings,'Native text was insufficient for this review. The separate OCR preview is limited to the first four pages.']};
        }else throw new TypeError('No readable native text was extracted.');
      }else{
        const extracted=options.extract?await options.extract(path):JSON.parse((await exec(python,[join(repo,'tools/course_sources/app_worker.py'),path],{cwd:repo,windowsHide:true,timeout:120000,maxBuffer:1024*1024})).stdout);
        source=safeSource(extracted,name);
      }
      if(retainOriginal){source.original={...originalInfo,name,sha256:createHash('sha256').update(req.body).digest('hex'),bytes:req.body.length};await writeFile(join(home,'originals',source.id+'.bin'),req.body,{flag:'wx'});}
      try{await save('sources',source);}catch(error){await unlink(join(home,'originals',source.id+'.bin')).catch(()=>{});throw error;}jobs.set(id,{status:'ready',source});
    }catch{jobs.set(id,{status:'error',error:'Extraction failed. Try a smaller unencrypted file, a clearer image, or paste its text.'});}
    finally{extractionBusy=false;await unlink(path).catch(()=>{});}})();
  }));
  router.use(express.json({limit:'220kb'}));
  router.use(ai.router);
  router.get('/source/:id/selection',route(async(req,res)=>{const source=await get('sources',req.params.id);if(!source.reviewed||hash(source.reviewedPages)!==source.revision)throw new TypeError('Save the reviewed source first.');res.json(selectEvidence(source,typeof req.query.goal==='string'?req.query.goal.slice(0,1000):''));}));
  router.get('/jobs/:id',route(async(req,res)=>{const job=jobs.get(req.params.id);if(!job)return res.status(404).json({error:'Extraction job not found; choose the file again.'});res.json(job);}));
  router.get('/catalog',route(async(_req,res)=>{
    const catalog=[];for(const file of (await readdir(imported).catch(()=>[])).filter(f=>/^[a-f0-9]{24}\.json$/.test(f))){
      const d=JSON.parse(await readFile(join(imported,file),'utf8'));if(d.sourceId!==file.slice(0,24))continue;
      catalog.push({id:d.sourceId,title:basename(d.originalPath||'Course material'),codes:d.courseCodes||[],kind:d.kind,sections:d.pages.length});
    }
    for(const file of (await readdir(join(home,'sources'))).filter(f=>/^[a-f0-9]{24}\.json$/.test(f)).slice(-100)){const d=await get('sources',file.slice(0,24));catalog.unshift({id:d.id,title:d.title,codes:[],kind:'saved-source',sections:d.pages.length});}
    const lessons=[];for(const file of (await readdir(join(home,'lessons'))).filter(f=>/^[a-f0-9]{24}\.json$/.test(f)).slice(-30)){
      const d=await get('lessons',file.slice(0,24)); lessons.push({id:d.id,title:d.title,createdAt:d.createdAt,mode:d.mode});
    }
    res.json({catalog,lessons:lessons.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),cloudConfigured:ai.status().providers.some(p=>p.configured),storageScope:'local',storageLabel:'Saved in this local app workspace. Browser notes and account material stay separate.'});
  }));
  router.post('/import',route(async(req,res)=>{
    const id=req.body?.id;if(!idPattern.test(id||''))throw new TypeError('Select a catalog item.');
    const d=JSON.parse(await readFile(join(imported,`${id}.json`),'utf8'));if(d.sourceId!==id)throw new TypeError('Source ID mismatch.');
    const source=safeSource(d,basename(d.originalPath||'Course material'));await save('sources',source);res.json(source);
  }));
  router.post('/text',route(async(req,res)=>{
    const value=text(req.body?.text,16000,'Source text');if(value.length<80)throw new TypeError('Add at least 80 characters of source text.');
    const source=safeSource({pages:[{text:value,method:'pasted-text',locator:'Pasted text, section 1'}]},text(req.body?.title,120,'Title'));await save('sources',source);res.json(source);
  }));
  router.get('/source/:id',route(async(req,res)=>res.json(await publicSource(await get('sources',req.params.id)))));
  router.get('/cloud-library/status',(_req,res)=>res.json(cloudLibrary.status()));
  router.post('/source/:id/cloud-copy',route(async(req,res)=>{
    if(req.body?.consent!==true)throw new TypeError('Choose to send this reviewed source to private Google Cloud storage.');
    const source=await get('sources',req.params.id);
    if(!source.reviewed||source.revision!==req.body.expectedRevision)return res.status(409).json({error:'Save the current source review before making its cloud copy.'});
    if(!cloudLibrary.status().configured)return res.status(503).json({error:'Cloud source copies are not configured. Your local source is unchanged.'});
    if(cloudCopyCalls>=30)return res.status(429).json({error:'This local session reached its cloud-copy allowance.'});cloudCopyCalls++;
    const saved=await cloudLibrary.save(source);res.json(saved);
  }));
  router.get('/source/:id/cloud-copy',route(async(req,res)=>{
    const source=await get('sources',req.params.id);if(!source.reviewed||req.query.revision!==source.revision)throw new TypeError('Select the current reviewed source revision.');
    const saved=await cloudLibrary.load(source.id,source.revision);res.json({exists:!!saved,revision:source.revision,verifiedAt:new Date().toISOString()});
  }));
  router.delete('/source/:id/cloud-copy',route(async(req,res)=>{
    if(req.body?.consent!==true)throw new TypeError('Confirm removal of this cloud source copy.');
    const source=await get('sources',req.params.id);if(!source.reviewed||source.revision!==req.body.expectedRevision)return res.status(409).json({error:'Select the current reviewed source before removing its cloud copy.'});
    res.json(await cloudLibrary.remove(source.id,source.revision));
  }));
  router.get('/source/:id/revisions/:revision',route(async(req,res)=>{
    if(!/^[a-f0-9]{64}$/.test(req.params.revision))throw new TypeError('Invalid source revision.');
    res.json(await publicSource(await sourceAt(req.params.id,req.params.revision)));
  }));
  router.get('/source/:id/original',route(async(req,res)=>{
    const source=await get('sources',req.params.id);if(!source.original)return res.status(404).json({error:'This original was not retained. Upload it again with original comparison selected.'});
    const bytes=await readFile(join(home,'originals',source.id+'.bin'));if(bytes.length!==source.original.bytes||createHash('sha256').update(bytes).digest('hex')!==source.original.sha256)throw new TypeError('Original file integrity check failed.');
    const kind=source.original.kind,mediaType=source.original.mediaType;
    if(!['application/pdf','image/png','image/jpeg','application/octet-stream'].includes(mediaType))throw new TypeError('Unsupported original media type.');
    res.set('Content-Type',mediaType);res.set('Content-Security-Policy',"sandbox; default-src 'none'");res.set('Content-Disposition',`${kind==='download'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(source.original.name)}`);res.send(bytes);
  }));
  router.delete('/source/:id/original',route(async(req,res)=>{const source=await get('sources',req.params.id);await unlink(join(home,'originals',source.id+'.bin')).catch(e=>{if(e.code!=='ENOENT')throw e;});res.json({removed:true});}));
  router.post('/source/:id/review',route(async(req,res)=>{
    const source=await get('sources',req.params.id);if(req.body?.acknowledged!==true)throw new TypeError('Confirm you have checked the extracted text.');
    if(!Object.hasOwn(req.body,'expectedRevision'))return res.status(409).json({error:'Reload this source before saving: the expected revision is missing.'});
    const pages=reviewedPages(req.body.pages,source.pages),revision=hash(pages),expected=req.body.expectedRevision;
    if(expected!==(source.revision||null))return res.status(409).json({error:'This source changed in another tab. Your corrections remain in this editor; copy them before reloading.'});
    if(revision===source.revision)return res.json(source);
    const next=versions.getSource(source.id,revision)||{...source,reviewedPages:pages,revision,reviewed:true,reviewedAt:new Date().toISOString()};
    res.json(versions.reviewSource(source.id,expected,next));
  }));
  router.get('/lesson/:id/draft',route(async(req,res)=>{
    const lesson=await get('lessons',req.params.id);await sourceAt(lesson.sourceId,lesson.revision);
    const saved=versions.getDraft(lesson.id);res.json(saved?{...saved,document:validateDraft(saved.document,lesson)}:{version:0,document:draftFromLesson(lesson),updatedAt:null});
  }));
  router.post('/lesson/:id/draft',route(async(req,res)=>{
    const lesson=await get('lessons',req.params.id);await sourceAt(lesson.sourceId,lesson.revision);
    if(!Number.isSafeInteger(req.body?.expectedVersion)||req.body.expectedVersion<0)throw new TypeError('An expected draft version is required.');
    const document=validateDraft(req.body.document,lesson);res.json(versions.saveDraft(lesson.id,req.body.expectedVersion,document));
  }));
  router.get('/lesson/:id/draft/history',route(async(req,res)=>{await get('lessons',req.params.id);res.json({versions:versions.listDraftVersions(req.params.id)});}));
  router.get('/lesson/:id/draft/history/:version',route(async(req,res)=>{
    const lesson=await get('lessons',req.params.id),number=Number(req.params.version);if(!Number.isSafeInteger(number)||number<1)throw new TypeError('Invalid draft version.');
    const saved=versions.getDraftVersion(lesson.id,number);if(!saved)return res.status(404).json({error:'Draft version not found.'});res.json({...saved,document:validateDraft(saved.document,lesson)});
  }));
  router.post('/lesson/:id/draft/publish',route(async(req,res)=>{
    const lesson=await get('lessons',req.params.id);await sourceAt(lesson.sourceId,lesson.revision);const saved=versions.getDraft(lesson.id);
    if(!saved||saved.version!==req.body?.expectedVersion)return res.status(409).json({error:'Save and review the current draft before making a learning copy.'});
    const document=validateDraft(saved.document,lesson),projected=draftToLesson(document,lesson);
    const published={...projected,id:newId(),parentLessonId:lesson.id,draftVersion:saved.version,editorDocument:document,createdAt:new Date().toISOString(),reviewWarning:'Edited lesson copy: explanations, worked examples and reflection prompts are unverified. Native scored questions retain their original wording and answer keys. '+lesson.reviewWarning};
    await save('lessons',published);res.json(published);
  }));
  router.post('/generate',route(async(req,res)=>{
    const source=await get('sources',req.body?.sourceId);if(!source.reviewed || source.revision!==req.body.revision)throw new TypeError('Review and save the current source text first.');
    if(!['local','cloud'].includes(req.body.mode))throw new TypeError('Select local reading or cloud generation.');
    if(hash(source.reviewedPages)!==source.revision)throw new TypeError('The reviewed source revision could not be verified.');
    const goal=typeof req.body.goal==='string'?req.body.goal.slice(0,300):'';
    const selected=selectEvidence(source,goal),evidence=selected.evidence;const cloud=req.body.mode==='cloud';let raw,aiResult;
    if(cloud){
      if(req.body.consent!==true)throw new TypeError('Choose to send reviewed text to Google Cloud first.');
      if(!ai.status().providers.some(p=>p.configured))return res.status(503).json({error:'Cloud generation is off. Create a local reading lesson instead.'});
      if(generating||cloudCalls>=12||Date.now()-lastCloud<10000)return res.status(429).json({error:'Cloud generation is busy or has reached this preview’s allowance. Use local reading or try later.'});
      generating=true;cloudCalls++;lastCloud=Date.now();
      try{aiResult=await ai.lesson({uid:'local',source,goal,preferences:req.body.preferences,requestId:req.body.requestId,provider:req.body.provider||'google',providerConsent:req.body.providerConsent||['google'],fallback:req.body.fallback,signal:requestSignal(req,res)});raw=aiResult.value;}finally{generating=false;}
    }else raw=localLesson(source,evidence);
    const lesson={...raw,id:newId(),sourceId:source.id,sourceTitle:source.title,revision:source.revision,createdAt:new Date().toISOString(),mode:cloud?(aiResult.provider==='google'?'vertex':aiResult.provider):'local-extractive',model:cloud?aiResult.model:null,evidence:aiResult?.selected.evidence||evidence,evidenceSelection:aiResult?.selected.selection||selected.selection,...(aiResult?{curation:aiResult.curation,retrieval:aiResult.selected.retrieval,provider:aiResult.provider}:{}),coverage:`${(aiResult?.selected||selected).selection.method==='lexical-goal'?'Text selected by words in your learning goal':'Source order used because no meaningful terms matched your goal'}. ${selected.selection.selectedCharacters} characters selected from ${selected.selection.consideredChunks} reviewed-text chunks, within a 12,000-character limit. Selection is limited to this source; it is not a full-document analysis. See the saved retrieval method for AI drafts. Citations refer to this saved revision.`,reviewWarning:'Source text may contain errors or student answers. Citations provide traceability, not independent fact checking or an official marking memo.'};
    await save('lessons',lesson);res.json(lesson);
  }));
  router.get('/lesson/:id',route(async(req,res)=>{const lesson=await get('lessons',req.params.id);if(lesson.editorDocument){const original=await get('lessons',lesson.parentLessonId);if(lesson.sourceId!==original.sourceId||lesson.revision!==original.revision)throw new TypeError('Edited lesson source mismatch.');lesson.editorDocument=validateDraft(lesson.editorDocument,original);}res.json(lesson);}));
  router.post('/passage',route(async(req,res)=>{
    if(req.body?.consent!==true)throw new TypeError('Choose to send the selected passage and nearby context to Google Cloud.');
    const kind=req.body.kind;if(!['source','lesson'].includes(kind))throw new TypeError('Choose a source or lesson passage.');
    const document=await get(kind==='lesson'?'lessons':'sources',req.body.id);const context=resolvePassage(document,req.body);
    if(!ai.status().providers.some(p=>p.configured))return res.status(503).json({error:'Cloud help is off. Reading, narration and annotations remain available.'});
    if(passageBusy||passageCalls>=30||Date.now()-lastPassage<2000)return res.status(429).json({error:'The teacher is busy or this preview has reached its help allowance. Try later or continue with the source.'});
    passageBusy=true;passageCalls++;lastPassage=Date.now();
    try{res.json(await ai.help({uid:'local',context,requestId:req.body.requestId,signal:requestSignal(req,res),isCurrent:async()=>{const doc=await get(req.body.kind==='source'?'sources':'lessons',req.body.id),src=req.body.kind==='source'?doc:await get('sources',doc.sourceId);return src.revision===context.provenance.revision&&hash(src.reviewedPages)===src.revision;}}));}finally{passageBusy=false;}
  }));
  router.use((error,_req,res,next)=>{if(error?.type==='entity.too.large')return res.status(413).json({error:'This request is too large. Choose a file up to 8 MB or a smaller text draft.'});next(error);});
  return router;
}
