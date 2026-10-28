export type BoardTextElement = {
  id: string;
  kind: 'text';
  text: string;
};

export type LessonBoardSlide = {
  id: string;
  heading: string;
  elements: BoardTextElement[];
};

/** Plain-text, versioned boundary between KAIRO lesson data and a visual board. */
export type LessonBoardV1 = {
  schema: 'kairo.lesson-board';
  version: 1;
  lessonRevision: string;
  title: string;
  slides: LessonBoardSlide[];
};

export type SourceAnchor = {
  label: string;
  sourceRevision: string;
  excerpt?: string;
};

export type SourceAnchorByElementId = Readonly<Record<string, SourceAnchor>>;

export type LessonBoardSaveResult =
  | { ok: true; savedRevision?: string }
  | { ok: false; message?: string };

export type LessonBoardSurfaceProps = {
  board: LessonBoardV1;
  activeSlideId: string;
  editable: boolean;
  onChange: (nextBoard: unknown) => void;
  onElementSelect: (elementId: string) => void;
};

import type { ReactNode } from 'react';

export type LessonBoardSurface = (props: LessonBoardSurfaceProps) => ReactNode;
