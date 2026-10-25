import { createHash } from 'node:crypto';

export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function text(value, max, name = 'Text') {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new TypeError(`${name} must contain 1–${max} characters.`);
  return value.trim();
}
export function reviewedPages(pages, originals) {
  if (!Array.isArray(pages) || pages.length !== originals.length) throw new TypeError('Review every extracted section.');
  const result = pages.map((p, i) => ({ ...originals[i], text: typeof p.text === 'string' ? p.text.trim() : '', edited: p.text?.trim() !== originals[i].text.trim() }));
  if (result.some(p => p.text.length > 16000) || result.reduce((n,p) => n+p.text.length,0) > 48000 || !result.some(p => p.text.length >= 80)) throw new TypeError('Keep 80–48,000 characters in total, at most 16,000 per section.');
  return result;
}
export function evidenceFor(source) {
  const evidence = []; let budget = 12000;
  for (const [index, page] of source.reviewedPages.entries()) {
    for (let start=0; start<page.text.length && budget>0; start+=1400) {
      const quote=page.text.slice(start,start+Math.min(1400,budget)); budget-=quote.length;
      if (quote.trim()) evidence.push({ id:`S${index+1}-${start}`, sourceId:source.id, title:source.title, locator:page.locator, quote, start, end:start+quote.length, edited:page.edited });
    }
  }
  return evidence;
}
export function validateLesson(raw, evidence) {
  const known=new Map(evidence.map(e=>[e.id,e]));
  const citations = value => {
    if (!Array.isArray(value) || !value.length || value.length>4 || value.some(id=>!known.has(id))) throw new TypeError('Lesson returned an unknown or missing source citation.');
    return [...new Set(value)];
  };
  if (!Array.isArray(raw.chapters) || raw.chapters.length<2 || raw.chapters.length>5) throw new TypeError('Lesson needs 2–5 chapters.');
  const chapters=raw.chapters.map(c=>({title:text(c.title,100), explanation:text(c.explanation,1300), example:text(c.example,900), citationIds:citations(c.citationIds)}));
  if (!Array.isArray(raw.quiz) || raw.quiz.length<1 || raw.quiz.length>4) throw new TypeError('Lesson needs 1–4 practice questions.');
  const quiz=raw.quiz.map(q=>{
    if (!Array.isArray(q.options) || q.options.length!==4 || !Number.isInteger(q.correct) || q.correct<0 || q.correct>3) throw new TypeError('Invalid practice question.');
    const options=q.options.map(o=>text(o,350));
    if(new Set(options).size!==4) throw new TypeError('Practice choices must differ.');
    const ids=citations(q.citationIds); const quote=text(q.supportQuote,700);
    if (!ids.some(id=>known.get(id).quote.includes(quote))) throw new TypeError('Practice answer has no exact source anchor.');
    return {question:text(q.question,450),options,correct:q.correct,explanation:text(q.explanation,900),citationIds:ids,supportQuote:quote};
  });
  return {title:text(raw.title,120),objective:text(raw.objective,350),chapters,quiz};
}
export function localLesson(source, evidence) {
  const excerpts=evidence.filter(e=>e.quote.trim().length>=80).slice(0,4);
  if (!excerpts.length) throw new TypeError('This source needs more readable text.');
  const chapters=excerpts.map((e,i)=>({title:`Read & connect ${i+1}`,explanation:e.quote.slice(0,1200),example:'Explain this passage in your own words. Connect it to an example from your studies or work; check your explanation against the source.',citationIds:[e.id]}));
  if(chapters.length===1) chapters.push({title:'Apply the passage',explanation:excerpts[0].quote.slice(0,1200),example:'Identify one claim and the exact words that support it. What would you need to verify before applying it in a workplace?',citationIds:[excerpts[0].id]});
  const quote=excerpts[0].quote.trim().slice(0,240);
  return {title:source.title,objective:'Read the reviewed source, make a connection, and practise checking evidence.',chapters,quiz:[{question:'Which passage appears in your reviewed material?',options:[quote,'The supplied source guarantees every answer is correct.','This source proves that no further study is needed.','A simulation automatically grants an accredited qualification.'],correct:0,explanation:'This is an exact passage from the reviewed source. This local exercise checks source recognition, not subject mastery.',citationIds:[excerpts[0].id],supportQuote:quote}]};
}
