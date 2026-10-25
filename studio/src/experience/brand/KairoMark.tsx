// KAIRO master artwork for the app (outlined paths from design/brand-master-20261023). Switches to the micro art
// when the symbol would render below the measured 32 px limit. Decorative by default: label the surrounding link.
import { chooseArt } from './art.ts';

type Props = { kind?: 'symbol' | 'lockup'; height: number; title?: string; className?: string };

export default function KairoMark({ kind = 'symbol', height, title, className }: Props) {
  const art = chooseArt(kind, height);
  const [, , w, h] = art.viewBox.split(' ').map(Number);
  return (
    <svg className={className} viewBox={art.viewBox} height={height} width={(height * w) / h}
      role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} focusable="false">
      {title && <title>{title}</title>}
      <path fill="currentColor" d={art.d} />
    </svg>
  );
}
