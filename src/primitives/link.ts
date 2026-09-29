import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, esc, defineComponent, type ObixComponent, safeUrl } from '../kit/index.js';

export type LinkTarget = '_blank' | '_self' | '_parent' | '_top';

export interface LinkState {
  href: string;
  label: string;
  target: LinkTarget;
  rel: string;
  external: boolean;
  download: string;
  /** Extra context for screen readers. When empty a description is derived (new window / external / download). */
  ariaLabel: string;
  /** Styling hint (`obix-link--visited`); set by `navigate`. */
  visited: boolean;
}

export interface LinkConfig {
  href: string;
  label: string;
  target?: LinkTarget;
  /** Default for `_blank` is `noopener noreferrer`. */
  rel?: string;
  /** Shows the external indicator. Default: auto-detected from an absolute URL. */
  external?: boolean;
  /** File name when the link downloads. */
  download?: string;
  ariaLabel?: string;
  visited?: boolean;
}

const isAbsolute = (href: string): boolean => /^(https?:)?\/\//i.test(href);

function accessibleName(state: LinkState): string {
  if (state.ariaLabel) return state.ariaLabel;
  if (state.download) return `${state.label} (download)`;
  if (state.target === '_blank') return `${state.label} (opens in new window)`;
  if (state.external) return `${state.label} (external link)`;
  return state.label;
}

const ariaOf = (state: LinkState): AriaAttributes => ({ role: 'link', 'aria-label': accessibleName(state) });

function renderLink(state: LinkState): string {
  const open = attrs({
    href: safeUrl(state.href) ?? '#',
    class: cx('obix-link', state.external && 'obix-link--external', state.visited && 'obix-link--visited'),
    target: state.target === '_self' ? undefined : state.target,
    rel: state.rel || undefined,
    download: state.download ? state.download : undefined,
    'aria-label': accessibleName(state) === state.label ? undefined : accessibleName(state),
    'data-obix-on': 'click=navigate',
  });
  return `<a${open}>${esc(state.label)}${state.external ? '<span class="obix-link__icon" aria-hidden="true">↗</span>' : ''}</a>`;
}

export function createLink(config: LinkConfig): ObixComponent<LinkState> {
  const target = config.target ?? '_self';
  return defineComponent<LinkState>({
    name: 'ObixLink',
    state: {
      href: config.href,
      label: config.label,
      target,
      // an opener that can reach window.opener is a security hole: default rel for new windows
      rel: config.rel ?? (target === '_blank' ? 'noopener noreferrer' : ''),
      external: config.external ?? isAbsolute(config.href),
      download: config.download ?? '',
      ariaLabel: config.ariaLabel ?? '',
      visited: config.visited ?? false,
    },
    actions: {
      navigate: () => ({ visited: true }),
      setExternal: (_state, external: unknown) => ({ external: Boolean(external) }),
      updateHref: (_state, href: unknown) => ({ href: String(href) }),
      setLabel: (_state, label: unknown) => ({ label: String(label) }),
    },
    render: renderLink,
    aria: ariaOf,
  });
}
