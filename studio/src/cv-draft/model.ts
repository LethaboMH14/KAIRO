export const CV_DRAFT_LIMITS={inputBytes:128*1024,outputBytes:128*1024,draftTextBytes:128*1024,facts:80,factTextBytes:1200,targetItems:40,targetTextBytes:1600,targetLabelBytes:200} as const;

export type CvSection='contact'|'profile'|'education'|'employment'|'projects'|'practice'|'volunteer'|'skills'|'certifications';
export type CvFactInput={id:string;section:CvSection;text:string;providedBy:'applicant';confirmation:'confirmed'|'unconfirmed'};
export type TargetRoleInput={label:string;requirements:string[]};
export type CvDraftInput={facts:CvFactInput[];targetRoleRequirements?:TargetRoleInput};
export type EvidenceLabel={factId:string;section:CvSection;source:'applicant-provided';confirmation:'applicant-confirmed';independentlyVerified:false};
export type CvDraft={format:'kairo-cv-draft-v1';draftText:string;evidenceLabels:EvidenceLabel[];excludedFacts:{factId:string;reason:'not-confirmed-by-applicant'}[];targetRoleRequirements:{label:string;requirements:string[];source:'applicant-supplied-not-verified';includedInDraft:false}|null;warnings:string[];provenance:{applicantFactsOnly:true;independentlyVerified:false;targetRequirementsTreatedAsApplicantFacts:false;atsScore:null}};

export class CvDraftInputError extends Error{
 readonly code:string;
 constructor(code:string,message:string){super(message);this.name='CvDraftInputError';this.code=code;}
}

const sectionOrder:CvSection[]=['contact','profile','education','employment','projects','practice','volunteer','skills','certifications'];
const sectionLabels:Record<CvSection,string>={contact:'Contact',profile:'Profile',education:'Education',employment:'Employment',projects:'Projects',practice:'Practice and learning (applicant-reported)',volunteer:'Volunteer experience',skills:'Skills',certifications:'Certifications'};
const idPattern=/^[a-z0-9][a-z0-9_-]{0,63}$/;
const sectionSet=new Set<string>(sectionOrder);
const unsafeControls=/[\u0000-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/u;
const angleMarkup=/[<>]/u;
const markdownLinkOrCode=/(?:!?\[[^\]]*\]\([^)]*\)|`+)/u;
const markdownEmphasis=/(?:\*\*[^\n]+\*\*|__[^\n]+__)/u;

function fail(code:string,message:string):never{throw new CvDraftInputError(code,message);}
function byteLength(value:string):number{return new TextEncoder().encode(value).length;}
function serializedBytes(value:unknown):number{
 let serialized:string|undefined;
 try{serialized=JSON.stringify(value);}catch{fail('INVALID_SERIALIZATION','Input must be bounded plain JSON data.');}
 if(typeof serialized!=='string')fail('INVALID_SERIALIZATION','Input must be bounded plain JSON data.');
 return byteLength(serialized);
}
function record(value:unknown,label:string):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('INVALID_OBJECT',`${label} must be a plain object.`);
 return value as Record<string,unknown>;
}
function exactKeys(value:Record<string,unknown>,allowed:string[],label:string):void{
 const keys=Reflect.ownKeys(value);
 if(keys.some(key=>typeof key!=='string'||!allowed.includes(key)))fail('UNKNOWN_FIELD',`${label} contains an unsupported field.`);
 for(const key of keys){
  const descriptor=Object.getOwnPropertyDescriptor(value,key);
  if(!descriptor||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))fail('INVALID_OBJECT',`${label} fields must be enumerable data values.`);
 }
}
function denseArray(value:unknown,maxItems:number,label:string,errorCode='INVALID_ARRAY'):unknown[]{
 if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype)fail(errorCode,`${label} must be a plain list.`);
 if(value.length>maxItems)fail(errorCode,`${label} must contain at most ${maxItems} items.`);
 const keys=Reflect.ownKeys(value);
 if(keys.some(key=>key!=='length'&&(typeof key!=='string'||! /^(0|[1-9][0-9]*)$/u.test(key)||Number(key)>=value.length)))fail(errorCode,`${label} cannot contain extra properties.`);
 const items:unknown[]=[];
 for(let index=0;index<value.length;index++){
  const descriptor=Object.getOwnPropertyDescriptor(value,String(index));
  if(!descriptor||!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))fail(errorCode,`${label} cannot contain missing or accessor items.`);
  items.push(descriptor.value);
 }
 if(keys.length!==value.length+1)fail(errorCode,`${label} cannot contain missing items.`);
 return items;
}
function validText(value:unknown,maxBytes:number,label:string):string{
 if(typeof value!=='string'||value.trim().length===0)fail('INVALID_TEXT',`${label} must be nonempty plain text.`);
 if(value.length>maxBytes)fail('TEXT_TOO_LONG',`${label} exceeds ${maxBytes} UTF-8 bytes.`);
 const bytes=byteLength(value);
 if(bytes>maxBytes)fail('TEXT_TOO_LONG',`${label} exceeds ${maxBytes} UTF-8 bytes.`);
 if(unsafeControls.test(value)||value.includes('\n')||value.includes('\r')||angleMarkup.test(value)||markdownLinkOrCode.test(value)||markdownEmphasis.test(value))fail('UNSAFE_TEXT',`${label} contains control characters or markup. Use plain text on one line.`);
 return value;
}
function validateFinalText(value:string):void{
 if(byteLength(value)>CV_DRAFT_LIMITS.draftTextBytes)fail('DRAFT_TOO_LARGE','The assembled plain-text CV exceeds the 128 KiB text limit.');
 if(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u2028\u2029\u202A-\u202E\u2066-\u2069]/u.test(value)||angleMarkup.test(value)||markdownLinkOrCode.test(value)||markdownEmphasis.test(value))fail('UNSAFE_OUTPUT','The assembled CV text did not pass the plain-text format check.');
}

function validateFact(value:unknown,index:number,seen:Set<string>):CvFactInput{
 const item=record(value,`Fact ${index+1}`);exactKeys(item,['id','section','text','providedBy','confirmation'],`Fact ${index+1}`);
 if(typeof item.id!=='string'||!idPattern.test(item.id))fail('INVALID_FACT_ID',`Fact ${index+1} needs a short lowercase identifier.`);
 if(seen.has(item.id))fail('DUPLICATE_FACT_ID',`Fact ID ${item.id} is repeated.`);seen.add(item.id);
 if(typeof item.section!=='string'||!sectionSet.has(item.section))fail('INVALID_SECTION',`Fact ${item.id} uses an unsupported section.`);
 if(item.providedBy!=='applicant')fail('INVALID_ORIGIN',`Fact ${item.id} must be supplied by the applicant.`);
 if(item.confirmation!=='confirmed'&&item.confirmation!=='unconfirmed')fail('INVALID_CONFIRMATION',`Fact ${item.id} must be explicitly confirmed or unconfirmed.`);
 const text=validText(item.text,CV_DRAFT_LIMITS.factTextBytes,`Fact ${item.id}`);
 return {id:item.id,section:item.section as CvSection,text,providedBy:'applicant',confirmation:item.confirmation};
}

function validateTargetRole(value:unknown):TargetRoleInput{
 const item=record(value,'Target-role requirements');exactKeys(item,['label','requirements'],'Target-role requirements');
 const label=validText(item.label,CV_DRAFT_LIMITS.targetLabelBytes,'Target-role label');
 const rawRequirements=denseArray(item.requirements,CV_DRAFT_LIMITS.targetItems,'Target-role requirements','INVALID_TARGET_REQUIREMENTS');
 const requirements=rawRequirements.map((requirement,index)=>validText(requirement,CV_DRAFT_LIMITS.targetTextBytes,`Target-role requirement ${index+1}`));
 return {label,requirements};
}

export function createCvDraft(input:CvDraftInput):CvDraft{
 const root=record(input,'CV draft input');exactKeys(root,['facts','targetRoleRequirements'],'CV draft input');
 const rawFacts=denseArray(root.facts,CV_DRAFT_LIMITS.facts,'Facts','INVALID_FACTS');
 const seen=new Set<string>(),facts=rawFacts.map((fact,index)=>validateFact(fact,index,seen));
 const targetRole=root.targetRoleRequirements===undefined?null:validateTargetRole(root.targetRoleRequirements);
 const validatedInput:CvDraftInput={facts,...(targetRole?{targetRoleRequirements:targetRole}:{})};
 if(serializedBytes(validatedInput)>CV_DRAFT_LIMITS.inputBytes)fail('INPUT_TOO_LARGE','Validated input exceeds the 128 KiB limit.');
 const included=facts.filter(fact=>fact.confirmation==='confirmed');
 const excluded=facts.filter(fact=>fact.confirmation==='unconfirmed');
 const sections=sectionOrder.flatMap(section=>{
  const sectionFacts=included.filter(fact=>fact.section===section);
  return sectionFacts.length?[`${sectionLabels[section]}\n${sectionFacts.map(fact=>`- ${fact.text}`).join('\n')}`]:[];
 });
 const draftText=sections.join('\n\n');validateFinalText(draftText);
 const missing=['contact','profile','education','employment','projects','skills'] as CvSection[];
 const warnings=missing.filter(section=>!included.some(fact=>fact.section===section)).map(section=>`No applicant-confirmed ${sectionLabels[section]} information was supplied. Add it only if applicable, or leave the section out.`);
 if(excluded.length)warnings.push(`${excluded.length} unconfirmed applicant fact${excluded.length===1?' was':'s were'} excluded; confirm each item before including it.`);
 if(targetRole)warnings.push('Target-role requirements are kept separate and are not evidence about the applicant.');
 if(!included.length)warnings.push('No applicant-confirmed facts are included, so the draft text is empty.');
 const result:CvDraft={
  format:'kairo-cv-draft-v1',draftText,
  evidenceLabels:included.map(fact=>({factId:fact.id,section:fact.section,source:'applicant-provided',confirmation:'applicant-confirmed',independentlyVerified:false})),
  excludedFacts:excluded.map(fact=>({factId:fact.id,reason:'not-confirmed-by-applicant'})),
  targetRoleRequirements:targetRole?{label:targetRole.label,requirements:[...targetRole.requirements],source:'applicant-supplied-not-verified',includedInDraft:false}:null,
  warnings,
  provenance:{applicantFactsOnly:true,independentlyVerified:false,targetRequirementsTreatedAsApplicantFacts:false,atsScore:null}
 };
 if(serializedBytes(result)>CV_DRAFT_LIMITS.outputBytes)fail('OUTPUT_TOO_LARGE','The complete CV draft record exceeds the 128 KiB output limit.');
 return result;
}

