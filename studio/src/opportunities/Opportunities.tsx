import './opportunities.css';

type Opportunity = {
  id: string; title: string; type: string; provider: string; discoveryUrl?: string; officialUrl: string;
  checkedAt: string; closesAt: string | null; requirements: string[]; disciplines: string[];
  status: 'open' | 'closed' | 'unknown'; verification: 'official' | 'discovery-only'; stale?: boolean;
};

export type OpportunitiesProps = { records: unknown; limitations?: unknown };

export function isSafeExternalHref(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') &&
      hostname.includes('.') && hostname !== 'localhost' && !hostname.endsWith('.local') && !hostname.endsWith('.localhost') &&
      !/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) && !hostname.startsWith('[');
  } catch { return false; }
}

function dateLabel(value: string | null | undefined): string {
  if (!value) return 'No closing date confirmed';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date could not be read' : new Intl.DateTimeFormat('en-ZA', { dateStyle: 'medium', timeZone: 'Africa/Johannesburg' }).format(date);
}

function Link({ href, children }: { href: unknown; children: string }) {
  if (!isSafeExternalHref(href)) return <span>{children} (link unavailable)</span>;
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function isOpportunity(value: unknown): value is Opportunity {
  if (!value || typeof value !== 'object') return false;
  const record = value as Opportunity;
  return typeof record.id === 'string' && typeof record.title === 'string' && typeof record.provider === 'string' &&
    typeof record.type === 'string' && typeof record.checkedAt === 'string' && Array.isArray(record.requirements) &&
    Array.isArray(record.disciplines) && ['open', 'closed', 'unknown'].includes(record.status) &&
    ['official', 'discovery-only'].includes(record.verification);
}

export default function Opportunities({ records, limitations }: OpportunitiesProps) {
  const entries = Array.isArray(records) ? records.filter(isOpportunity) : [];
  const notes = Array.isArray(limitations) ? limitations.filter((item): item is string => typeof item === 'string') : [];
  return (
    <section className="op-panel" aria-labelledby="op-title">
      <p className="op-eyebrow">Study and work opportunities</p>
      <h2 id="op-title">Find a place to start</h2>
      <p className="op-intro">Browse public listings, then check the provider’s own page for the latest details.</p>
      {entries.length === 0 ? <p className="op-empty" role="status">No checked listings are available right now.</p> : (
        <ul className="op-list">
          {entries.map((item) => (
            <li className="op-card" key={item.id}>
              <div className="op-card-head">
                <span className={`op-status op-status-${item.status}`}>{item.status === 'unknown' ? 'Status unknown' : item.status === 'open' ? 'Deadline ahead' : 'Deadline passed'}</span>
                <span className="op-type">{item.type}</span>
                {item.stale && <span className="op-status op-status-unknown">Listing may be out of date</span>}
              </div>
              <h3>{item.title}</h3>
              <p className="op-provider">{item.provider}</p>
              <dl className="op-dates">
                <div><dt>Closing date</dt><dd>{dateLabel(item.closesAt)}</dd></div>
                <div><dt>Checked</dt><dd>{dateLabel(item.checkedAt)}{item.stale ? ' · stale' : ''}</dd></div>
              </dl>
              {item.disciplines.length > 0 && <p><strong>Fields mentioned by the source:</strong> {item.disciplines.join(', ')}</p>}
              {item.requirements.length > 0 && <div><p><strong>Source requirements:</strong></p><ul className="op-requirements">{item.requirements.map((requirement, index) => <li key={`${item.id}-req-${index}`}>{requirement}</li>)}</ul></div>}
              <div className="op-links">
                {item.verification === 'official' ? <Link href={item.officialUrl}>Open provider’s page</Link> : <Link href={item.officialUrl}>Browse Graduates24 listings</Link>}
                {item.discoveryUrl && <Link href={item.discoveryUrl}>{item.discoveryUrl.includes('studentroom.co.za') ? 'See StudentRoom listing' : 'See discovery listing'}</Link>}
              </div>
              {item.verification === 'discovery-only' && <p className="op-note">Directory only. It does not confirm an active opportunity; follow a listing to its provider.</p>}
            </li>
          ))}
        </ul>
      )}
      {notes.length > 0 && <aside className="op-limitations" aria-label="About these listings"><h3>Before you apply</h3><ul>{notes.map((note, index) => <li key={`limitation-${index}`}>{note}</li>)}</ul></aside>}
    </section>
  );
}
