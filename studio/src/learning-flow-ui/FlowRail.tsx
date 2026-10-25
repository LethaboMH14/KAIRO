import './flow-rail.css';

export type FlowStage = 'material' | 'lesson' | 'studio' | 'evidence' | 'direction';

export type FlowRailItem = {
  stage: FlowStage;
  label: string;
  href?: string;
  note?: string;
};

export type FlowRailProps = {
  current: FlowStage;
  moduleLabel?: string;
  lessonTitle?: string;
  items: Array<FlowRailItem>;
};

function isAppPath(href: string | undefined): href is string {
  return typeof href === 'string'
    && href.startsWith('/')
    && !href.startsWith('//')
    && !/[\\\u0000-\u001f\u007f]/.test(href);
}

export default function FlowRail({ current, moduleLabel, lessonTitle, items }: FlowRailProps) {
  const context = [moduleLabel, lessonTitle].filter(Boolean);

  return (
    <nav className="flow-rail" aria-label="Learning journey">
      {context.length > 0 && (
        <p className="flow-rail__context">{context.join(' · ')}</p>
      )}
      <ol className="flow-rail__items">
        {items.map((item, index) => {
          const isCurrent = item.stage === current;
          const className = `flow-rail__item${isCurrent ? ' is-current' : ''}`;
          return (
            <li className={className} key={`${item.stage}-${index}`}>
              {isAppPath(item.href) ? (
                <a href={item.href} aria-current={isCurrent ? 'step' : undefined}>
                  <span className="flow-rail__label">{item.label}</span>
                  {item.note && <span className="flow-rail__note">{item.note}</span>}
                </a>
              ) : (
                <span aria-current={isCurrent ? 'step' : undefined}>
                  <span className="flow-rail__label">{item.label}</span>
                  {item.note && <span className="flow-rail__note">{item.note}</span>}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
