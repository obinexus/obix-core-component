import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  /** The documented name of `visible`. */
  isVisible: boolean;
  /** Milliseconds before the toast closes itself (the driver runs the timer: `data-obix-after`). */
  duration: number;
  position: ToastPosition;
  toastId: string;
  pauseOnHover: boolean;
  isPaused: boolean;
  /** Remaining time as a percentage; shown by a CSS animation of `duration`, not by ticking state. */
  progress: number;
  action: { label: string } | null;
  /** How many times the action button was pressed (the application observes this; callbacks are not state). */
  actionCount: number;
}

export interface ToastConfig {
  message: string;
  type?: ToastType;
  /** Default 3000 (the documented value; the implementation used 5000). */
  duration?: number;
  position?: ToastPosition;
  pauseOnHover?: boolean;
  action?: { label: string; onClick?: () => void };
  id?: string;
}

const ariaOf = (s: ToastState): AriaAttributes => ({ role: 'status', 'aria-label': s.message, 'aria-live': 'polite', 'aria-atomic': true });

function renderToast(s: ToastState): string {
  // The live region is ALWAYS rendered and only its content comes and goes: a message inserted into an existing status region is announced
  // reliably, a region that appears together with its message often is not.
  const region = (inner: string): string => `<div${attrs({ class: 'obix-toast-region', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' })}>${inner}</div>`;
  if (!s.visible) return region('');
  const hover = s.pauseOnHover ? 'mouseenter.self=pause; mouseleave.self=resume; focus=pause; blur=resume' : undefined;
  const toast = `<div${attrs({
    id: s.toastId,
    class: cx('obix-toast', `obix-toast--${s.type}`, `obix-toast--${s.position}`),
    'data-jfix-strategy': 'box-shadow',
    'data-pause-on-hover': String(s.pauseOnHover),
    // the driver arms a timer for `hide` and re-arms it whenever the pause state changes
    'data-obix-after': s.duration > 0 ? `hide:${s.duration}` : undefined,
    'data-obix-after-paused': s.isPaused ? '' : undefined,
    'data-obix-on': hover,
    'data-obix-dismiss': 'dismiss',
  })}><span class="obix-toast__message">${esc(s.message)}</span>` +
    `${s.action ? `<button class="obix-toast__action obix-button" type="button" data-obix-on="click=activate">${esc(s.action.label)}</button>` : ''}` +
    `<button class="obix-toast__dismiss obix-button" type="button" aria-label="Dismiss notification" data-obix-on="click=dismiss">×</button>` +
    `${s.duration > 0 ? `<div class="obix-toast-progress" aria-hidden="true" style="animation-duration:${s.duration}ms;animation-play-state:${s.isPaused ? 'paused' : 'running'}"></div>` : ''}</div>`;
  return region(toast);
}

export function createToast(config: ToastConfig): ObixComponent<ToastState> & { onAction?: () => void } {
  const component = defineComponent<ToastState>({
    name: 'ObixToast',
    state: {
      message: config.message,
      type: config.type ?? 'info',
      visible: true,
      isVisible: true,
      duration: config.duration ?? 3000,
      position: config.position ?? 'bottom-right',
      toastId: createId('obix-toast', config.id),
      pauseOnHover: config.pauseOnHover ?? true,
      isPaused: false,
      progress: 100,
      action: config.action ? { label: config.action.label } : null,
      actionCount: 0,
    },
    actions: {
      show: () => ({ visible: true, isVisible: true, isPaused: false, progress: 100 }),
      hide: () => ({ visible: false, isVisible: false, isPaused: false }),
      dismiss: () => ({ visible: false, isVisible: false, isPaused: false }),
      pause: (state) => (state.pauseOnHover ? { isPaused: true } : state),
      resume: () => ({ isPaused: false }),
      activate: (state) => (state.action ? { actionCount: state.actionCount + 1 } : state),
      setMessage: (_state, message: unknown) => ({ message: String(message) }),
      setDuration: (_state, duration: unknown) => ({ duration: Math.max(0, Number(duration) || 0) }),
    },
    render: renderToast,
    aria: ariaOf,
  });
  return Object.assign(component, config.action?.onClick ? { onAction: config.action.onClick } : {});
}
