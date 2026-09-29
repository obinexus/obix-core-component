import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface LoadingState {
  visible: boolean;
  /** Accessible name / message. */
  label: string;
  message: string;
  overlay: boolean;
  type: 'spinner' | 'skeleton' | 'dots';
  /** Explicit footprint of a skeleton (prevents layout shift). */
  dimensions: { width: string; height: string } | null;
  ariaLive: 'polite' | 'assertive';
}

export interface LoadingConfig {
  /** `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  message?: string;
  overlay?: boolean;
  /** Default false (implemented); the documentation says `show` defaults to true. */
  show?: boolean;
  type?: 'spinner' | 'skeleton' | 'dots';
  dimensions?: { width: string; height: string };
  ariaLive?: 'polite' | 'assertive';
}

const ariaOf = (s: LoadingState): AriaAttributes => ({ role: 'status', 'aria-label': s.label, 'aria-live': s.ariaLive, 'aria-busy': s.visible });

function renderLoading(s: LoadingState): string {
  if (!s.visible) return '';
  // a loading placeholder always has a footprint, so it appearing or disappearing does not shift the layout around it
  const style = s.type === 'skeleton' && s.dimensions ? `width:${s.dimensions.width};height:${s.dimensions.height}` : 'min-width:24px;min-height:24px';
  const visual = s.type === 'skeleton'
    ? '<div aria-hidden="true" class="obix-skeleton-line"></div><div aria-hidden="true" class="obix-skeleton-line"></div>'
    : s.type === 'dots'
      ? '<div class="obix-loading__dots" aria-hidden="true"><span></span><span></span><span></span></div>'
      : '<div class="obix-loading__spinner obix-spinner" aria-hidden="true"></div>';
  return `<div${attrs({ class: cx('obix-loading', s.overlay && 'obix-loading--overlay', `obix-loading--${s.type}`), role: 'status', 'aria-live': s.ariaLive, 'aria-busy': 'true', 'aria-label': s.label, style })}>` +
    `${visual}${s.message && s.type !== 'skeleton' ? `<span class="obix-loading__label">${esc(s.message)}</span>` : ''}</div>`;
}

export function createLoading(config: LoadingConfig): ObixComponent<LoadingState> {
  const label = config.ariaLabel ?? config.label ?? config.message ?? 'Loading…';
  return defineComponent<LoadingState>({
    name: 'ObixLoading',
    state: {
      visible: config.show ?? false,
      label,
      message: config.message ?? (config.type === 'skeleton' ? '' : config.label ?? 'Loading…'),
      overlay: config.overlay ?? false,
      type: config.type ?? 'spinner',
      dimensions: config.dimensions ?? null,
      ariaLive: config.ariaLive ?? 'polite',
    },
    actions: {
      show: () => ({ visible: true }),
      hide: () => ({ visible: false }),
      // the label is the announcement: blank is not a label, the previous one stays
      setLabel: (state, text: unknown) => (String(text ?? '').trim() === '' ? state : { label: String(text), message: String(text) }),
      setMessage: (_state, text: unknown) => ({ message: String(text) }),
    },
    render: renderLoading,
    aria: ariaOf,
    reducedMotionConfig: { respectPreference: true, fallback: 'instant' },
  });
}
