import type {CvFactInput} from '../cv-draft/model.ts';

/** A wording/category change always needs a fresh applicant confirmation. */
export function editFact(facts:CvFactInput[],id:string,change:Pick<Partial<CvFactInput>,'text'|'section'>):CvFactInput[]{
 return facts.map(fact=>fact.id===id?{...fact,...change,confirmation:'unconfirmed'}:fact);
}
