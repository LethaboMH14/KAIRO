import type { Lesson } from '../workspace/types';
import './lesson-reading.css';

export type LessonReadingProps = {
  lesson: Lesson;
  step: number;
  onStep: (step: number) => void;
  onRead: (text: string) => void;
  onStuck: () => void;
};

/** A stateless, source-linked reading pane for the reviewed Rain classroom. */
export default function LessonReading({ lesson, step, onStep, onRead, onStuck }: LessonReadingProps) {
  const chapterIndex = Math.min(Math.max(Number.isFinite(step) ? Math.trunc(step) : 0, 0), lesson.chapters.length - 1);
  const chapter = lesson.chapters[chapterIndex];
  const citations = chapter
    ? chapter.citationIds.flatMap((id) => {
        const evidence = lesson.evidence.find((item) => item.id === id);
        return evidence ? [evidence] : [];
      })
    : [];

  if (!chapter) {
    return (
      <section className="sw-teaching source-rain-reading" aria-labelledby="source-reading-title">
        <div className="sw-chapter">
          <h2 id="source-reading-title">This lesson has no chapters yet</h2>
          <p>Return to your reviewed material and create a lesson with at least one chapter.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sw-teaching source-rain-reading" aria-labelledby="source-reading-title">
      <nav className="sw-program" aria-label="Lesson chapters">
        <h2>Chapters</h2>
        <ol className="sw-chapter-list">
          {lesson.chapters.map((item, index) => (
            <li key={`${index}-${item.title}`}>
              <button
                type="button"
                aria-current={index === chapterIndex ? 'step' : undefined}
                onClick={() => onStep(index)}
              >
                <span>{index + 1}</span>{item.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <article className="sw-chapter">
        <div className="sw-chapter-heading">
          <span>Chapter {chapterIndex + 1} of {lesson.chapters.length}</span>
          <button type="button" onClick={() => onRead(chapter.explanation)}>
            Read this explanation aloud
          </button>
        </div>
        <h2 id="source-reading-title">{chapter.title}</h2>
        <p>{chapter.explanation}</p>

        <section className="sw-example" aria-labelledby="source-reading-example">
          <h3 id="source-reading-example">Example</h3>
          <p>{chapter.example}</p>
        </section>

        <section aria-labelledby="source-reading-evidence">
          <h3 id="source-reading-evidence">Passages from the reviewed source</h3>
          {citations.length ? (
            <ol>
              {citations.map((evidence) => (
                <li key={evidence.id}>
                  <article className="sw-evidence-open">
                    <h4>{evidence.title}</h4>
                    <p className="sw-fine">
                      {evidence.locator} · characters {evidence.start}–{evidence.end}
                      {' · reviewed revision '}{lesson.revision}
                      {evidence.edited ? ' · edited after extraction' : ''}
                    </p>
                    <blockquote>{evidence.quote}</blockquote>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <p>No reviewed source passages are linked to this chapter.</p>
          )}
        </section>

        <p className="sw-fine">
          {lesson.mode === 'vertex' ? 'AI draft · check each explanation against its cited passage.' : 'Local source reading'}
        </p>

        <div className="sw-pagination">
          <button
            className="sw-secondary"
            type="button"
            disabled={chapterIndex === 0}
            onClick={() => onStep(chapterIndex - 1)}
          >
            Previous chapter
          </button>
          <button className="sw-secondary" type="button" onClick={onStuck}>
            I’m stuck
          </button>
          <button
            className="sw-primary"
            type="button"
            disabled={chapterIndex === lesson.chapters.length - 1}
            onClick={() => onStep(chapterIndex + 1)}
          >
            Next chapter
          </button>
        </div>
      </article>
    </section>
  );
}
