import type { AriaAttributes } from '../types/base.js';
import { attrs, defineComponent, esc, type ObixComponent, safeUrl } from '../kit/index.js';

export interface Crumb {
  label: string;
  /** Omitted for the current page. */
  href?: string;
  /** Marks the current page. The last crumb is the current page whether or not it is marked. */
  current?: boolean;
}

export interface BreadcrumbState {
  crumbs: Crumb[];
  /** Drawn by CSS (`data-separator`), never in the DOM: assistive technology does not read separators. */
  separator: string;
  ariaLabel: string;
}

export interface BreadcrumbConfig {
  /** `crumbs` is the implemented name, `items` the documented one. */
  crumbs?: Crumb[];
  items?: Crumb[];
  separator?: string;
  /** Default "Breadcrumb". */
  ariaLabel?: string;
}

const ariaOf = (s: BreadcrumbState): AriaAttributes => ({ role: 'navigation', 'aria-label': s.ariaLabel });

function renderBreadcrumb(s: BreadcrumbState): string {
  const last = s.crumbs.length - 1;
  const items = s.crumbs.map((crumb, i) => {
    const current = i === last || !!crumb.current;
    const inner = current || !crumb.href
      ? `<span${attrs({ class: 'obix-breadcrumb__item', 'aria-current': current ? 'page' : undefined })}>${esc(crumb.label)}</span>`
      : `<a${attrs({ href: safeUrl(crumb.href) ?? '#', class: 'obix-breadcrumb__item', 'data-jfix-strategy': 'fixed-size', 'data-index': String(i), 'data-obix-on': 'click=navigate(@attr:data-index)' })}>${esc(crumb.label)}</a>`;
    return `<li class="obix-breadcrumb__item-wrapper" data-separator="${esc(s.separator)}"${current ? ' aria-current="page"' : ''}>${inner}</li>`;
  }).join('');
  return `<nav aria-label="${esc(s.ariaLabel)}" class="obix-breadcrumb"><ol class="obix-breadcrumb__list">${items}</ol></nav>`;
}

export function createBreadcrumb(config: BreadcrumbConfig): ObixComponent<BreadcrumbState> {
  return defineComponent<BreadcrumbState>({
    name: 'ObixBreadcrumb',
    state: { crumbs: config.crumbs ?? config.items ?? [], separator: config.separator ?? '/', ariaLabel: config.ariaLabel ?? 'Breadcrumb' },
    actions: {
      setCrumbs: (_state, crumbs: unknown) => ({ crumbs: crumbs as Crumb[] }),
      push: (state, crumb: unknown) => ({ crumbs: [...state.crumbs, crumb as Crumb] }),
      pop: (state) => ({ crumbs: state.crumbs.slice(0, -1) }),
      // documented: going to a crumb makes it the end of the trail
      navigate: (state, index: unknown) => {
        const i = Number(index);
        return Number.isInteger(i) && i >= 0 && i < state.crumbs.length - 1 ? { crumbs: state.crumbs.slice(0, i + 1) } : state;
      },
    },
    render: renderBreadcrumb,
    aria: ariaOf,
  });
}
