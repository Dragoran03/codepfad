import { Fragment } from 'react';
import type { ReactNode } from 'react';

function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/**
 * Mini-Formatierung für kurze Texte aus den Inhaltsdateien:
 * `code`, **fett**, Absätze durch Leerzeile, einfacher Zeilenumbruch bleibt erhalten.
 */
export function fmt(text: string): ReactNode {
  return text.split(/\n\s*\n/).map((para, p) => (
    <Fragment key={p}>
      {p > 0 && <span className="para-gap" />}
      {para.split('\n').map((line, l) => (
        <Fragment key={l}>
          {l > 0 && <br />}
          {inline(line)}
        </Fragment>
      ))}
    </Fragment>
  ));
}
