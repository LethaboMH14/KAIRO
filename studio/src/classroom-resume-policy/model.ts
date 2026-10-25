import type { ResumeResult } from '../classroom-resume/model.ts';

export type ResumeStart = {
  step: number;
  reading: true;
  offer3D: boolean;
  message: string;
  origin: 'link' | 'saved' | 'start';
};

const canonicalStep = /^(0|[1-9][0-9]*)$/;
const recovery = (saved: ResumeResult) => saved.status === 'stale' || saved.status === 'invalid' || saved.status === 'unavailable';

export function chooseResumeStart(queryStep: string | null, saved: ResumeResult, chapterCount: number): ResumeStart {
  if (!Number.isSafeInteger(chapterCount) || chapterCount <= 0) throw new Error('Chapter count must be a positive safe integer.');
  const safeSaved = !!saved && typeof saved === 'object' && !!saved.state && Number.isSafeInteger(saved.state.step) && saved.state.step >= 0 && saved.state.step < chapterCount && typeof saved.state.reading === 'boolean' && ['empty','restored','stale','invalid','unavailable'].includes(saved.status);
  const link = typeof queryStep === 'string' && canonicalStep.test(queryStep) ? Number(queryStep) : NaN;
  const validLink = Number.isSafeInteger(link) && link >= 0 && link < chapterCount;
  const message = recovery(saved) ? saved.message : '';
  if (validLink) return { step: link, reading: true, offer3D: safeSaved && saved.status === 'restored' && !saved.state.reading, message, origin: 'link' };
  if (safeSaved && saved.status === 'restored') return { step: saved.state.step, reading: true, offer3D: !saved.state.reading, message: '', origin: 'saved' };
  return { step: 0, reading: true, offer3D: false, message, origin: 'start' };
}
