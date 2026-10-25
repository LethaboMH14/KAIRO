import type {Lesson} from '../workspace/types';
import type {LessonDraft} from '../lesson-draft-core/types';

export default function DraftReading({draft,lesson,onRead,onPractise}:{draft:LessonDraft;lesson:Lesson;onRead?:(text:string)=>void;onPractise?:()=>void}){
 return <section className={`le-reading le-layout-${draft.layout}`} aria-label="Your lesson preview"><header><p className="le-kicker">Your learning copy</p><h2>{draft.title}</h2><p>Source links let you check the material. Edited explanations, worked examples and personal reflections are not independently verified.</p></header><div className="le-reading-blocks">{draft.blocks.map(block=><article key={block.id} className={`le-reading-card le-kind-${block.kind}`}>
  <p className="le-kicker">{block.kind==='worked-example'?'Worked example':block.kind==='question'?'Scored practice':block.kind==='reflection'?'Your reflection':'Explanation'} · {block.origin==='source'?'Source excerpt':block.origin==='generated'?'Generated draft':'Authored text'}</p><h3>{block.title}</h3><p className="le-copy">{block.text}</p>
  {block.kind==='question'&&<><ol>{block.question?.options.map((option,i)=><li key={i}>{option}</li>)}</ol><p className="le-small">Original wording and answer key are preserved. Answers are not shown in this preview.</p>{onPractise&&<button onClick={onPractise}>Try the practice questions</button>}</>}
  {block.citationIds.length>0&&<details><summary>Check the supporting source ({block.citationIds.length})</summary>{block.citationIds.map(id=>{const item=lesson.evidence.find(e=>e.id===id);return item?<div key={id}><p className="le-small">{item.locator} · source revision {lesson.revision}</p><blockquote>{item.quote}</blockquote></div>:<p key={id}>This source link is unavailable. Return to the original lesson.</p>;})}</details>}
  {onRead&&<button onClick={()=>onRead(block.text)}>Read this part aloud</button>}
 </article>)}</div></section>;
}
