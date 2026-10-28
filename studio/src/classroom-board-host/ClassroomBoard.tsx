import {useMemo} from 'react';
import type {Lesson} from '../workspace/types';
import type {LessonBoardSurfaceProps} from '../lesson-board-ui/types';
import {LessonBoardAdapter} from '../lesson-board-ui/LessonBoardAdapter';
import {projectLessonBoard} from './model';

function LessonSurface({board,activeSlideId,onElementSelect}:LessonBoardSurfaceProps){
 const slide=board.slides.find(value=>value.id===activeSlideId);if(!slide)return null;
 return <article aria-label={slide.heading}><h3>{slide.heading}</h3>{slide.elements.map(element=>element.id.includes('-citation-')?<button key={element.id} type="button" onClick={()=>onElementSelect(element.id)}>{element.text}</button>:<p key={element.id} style={{whiteSpace:'pre-wrap'}}>{element.text}</p>)}</article>;
}
export default function ClassroomBoard({lesson}:{lesson:Lesson}){
 const value=useMemo(()=>projectLessonBoard(lesson),[lesson]);
 if(!value)return <p role="status">This lesson is better shown in the full reading view below. All your lesson text and sources remain available.</p>;
 return <div><p className="ka-small">Explore the same saved lesson by step. Select a source label to inspect its citation. To edit, choose Shape this lesson.</p><LessonBoardAdapter key={`${lesson.id}-${lesson.revision}`} board={value.board} sourceAnchorByElementId={value.anchors} Surface={LessonSurface} readingContent={<div>{lesson.chapters.map((chapter,index)=><section key={index}><h3>{chapter.title}</h3><p style={{whiteSpace:'pre-wrap'}}>{chapter.explanation}</p><p>{chapter.example}</p></section>)}</div>}/></div>;
}
