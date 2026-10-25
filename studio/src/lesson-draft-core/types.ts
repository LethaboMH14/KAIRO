import type { Lesson } from '../workspace/types';

export type DraftBlock = {
  id: string;
  kind: 'explanation' | 'worked-example' | 'question' | 'reflection';
  title: string;
  text: string;
  citationIds: string[];
  origin: 'source' | 'generated' | 'authored';
  question?: {
    options: string[];
    correct: number;
    supportQuote: string;
  };
};

export type LessonDraft = {
  schemaVersion: 1;
  lessonId: string;
  sourceId: string;
  sourceRevision: string;
  title: string;
  layout: 'reading' | 'split' | 'practice';
  blocks: DraftBlock[];
};

export type DraftAction =
  | { kind: 'edit'; id: string; patch: { title?: string; text?: string } }
  | { kind: 'move'; id: string; direction: -1 | 1 }
  | { kind: 'remove'; id: string }
  | { kind: 'add-reflection'; id: string }
  | { kind: 'split'; id: string; newId: string; offset: number }
  | { kind: 'layout'; layout: LessonDraft['layout'] }
  | { kind: 'title'; title: string };

export type NativeLesson = Lesson;
