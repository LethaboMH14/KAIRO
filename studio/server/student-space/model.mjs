import {readFile} from 'node:fs/promises';
const cohorts=new Set(['engineering','informatics']);
export async function loadCurricula(){return Object.fromEntries(await Promise.all([...cohorts].map(async key=>[key,JSON.parse(await readFile(new URL(`../../data/student-spaces/${key}.json`,import.meta.url),'utf8'))])));}
export function studentSpace(enrolment,curricula){
 if(!enrolment)return null;
 if(enrolment.schemaVersion!==1||enrolment.synthetic!==true||!cohorts.has(enrolment.cohort)||typeof enrolment.studentId!=='string'||!/^KAIRO-(ENG|INF)-[0-9]{4}$/.test(enrolment.studentId))throw Error('Student space could not be verified.');
 if(!enrolment.studentId.startsWith(enrolment.cohort==='engineering'?'KAIRO-ENG-':'KAIRO-INF-'))throw Error('Student identity mismatch.');
 const curriculum=curricula[enrolment.cohort];if(!curriculum||curriculum.field!==enrolment.cohort||!Array.isArray(curriculum.modules)||!curriculum.modules.length)throw Error('Curriculum is unavailable.');
 const materialLinks=Object.create(null);for(const [key,value] of Object.entries(enrolment.materialLinks||{})){if(typeof value?.sourceId==='string'&&/^[a-f0-9]{24}$/.test(value.sourceId)&&typeof value.lessonId==='string'&&/^[a-f0-9]{24}$/.test(value.lessonId))materialLinks[key]={sourceId:value.sourceId,lessonId:value.lessonId};}
 return {synthetic:true,studentId:enrolment.studentId,cohort:enrolment.cohort,displayName:typeof enrolment.displayName==='string'?enrolment.displayName.slice(0,80):'Demo learner',curriculum,materialLinks,studios:enrolment.cohort==='engineering'?['/engineering','/pump-lab','/classroom','/lecture']:['/computer-science','/classroom','/lecture']};
}
export async function resolveStudentSpace(repository,uid,curricula){const record=await repository.get(uid,'progress','enrolment');return studentSpace(record?.value,curricula);}
