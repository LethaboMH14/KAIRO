import type {Lesson} from '../workspace/types';
import type {LessonBoardV1,SourceAnchorByElementId} from '../lesson-board-ui/types';
import {validateLessonBoard,validateSourceAnchors} from '../lesson-board-ui/validateBoard';

export function projectLessonBoard(lesson:Lesson):{board:LessonBoardV1;anchors:SourceAnchorByElementId}|null{
 // Edited lessons have a different canonical document. Never display the older
 // generated chapter text as if it were the learner's latest wording.
 if(lesson.editorDocument)return null;
 const anchors:Record<string,{label:string;sourceRevision:string;excerpt?:string}> = Object.create(null);
 const slides=lesson.chapters.map((chapter,index)=>{
  const elements:{id:string;kind:'text';text:string}[]=[];
  for(const [section,text] of [['explanation',chapter.explanation],['example',chapter.example]] as const){
   for(let offset=0;offset<text.length;offset+=2400)elements.push({id:`chapter-${index}-${section}-${offset}`,kind:'text',text:text.slice(offset,offset+2400)});
  }
  for(const [citationIndex,id] of chapter.citationIds.entries()){
   const evidence=lesson.evidence.find(item=>item.id===id);if(!evidence)continue;
   const key=`chapter-${index}-citation-${citationIndex}`;
   const label=`${evidence.title} · ${evidence.locator}`;
   // Fail back to the complete reading view rather than shorten a source label.
   if(label.length>120) return null;
   elements.push({id:key,kind:'text',text:label});
   anchors[key]={label,sourceRevision:lesson.revision,...(evidence.quote.length<=500?{excerpt:evidence.quote}:{})};
  }
  return {id:`chapter-${index}`,heading:chapter.title,elements};
 });
 if(slides.some(slide=>slide===null))return null;
 const board=validateLessonBoard({schema:'kairo.lesson-board',version:1,lessonRevision:lesson.revision,title:lesson.title,slides});
 const checked=validateSourceAnchors(anchors);
 return board.ok&&checked.ok?{board:board.value,anchors:checked.value}:null;
}
