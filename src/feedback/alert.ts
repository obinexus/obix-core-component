import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type AlertType = 'info' | 'warning' | 'error' | 'success';

export interface AlertState {
  message: string;
  type: AlertType;
  dismissible: boolean;
  /** Show the decorative type icon (`aria-hidden`). */
  icon: boolean;
  visible: boolean;
  /** `assertive` interrupts the reader (errors, warnings), `polite` waits its turn. Default by type. */
  ariaLive: 'polite' | 'assertive';
  returnFocusId: string | null;
}

export interface AlertConfig {
  message: string;
  type?: AlertType;
  dismissible?: boolean;
  icon?: boolean;
  ariaLive?: 'polite' | 'assertive';
  returnFocusId?: string;
}

const ICON: Record<AlertType, string> = { info: 'ℹ', warning: '⚠', error: '✖', success: '✓' };
const assertiveByDefault = (type: AlertType): boolean => type === 'error' || type === 'warning';

const ariaOf = (s: AlertState): AriaAttributes => ({
  role: s.ariaLive === 'assertive' ? 'alert' : 'status',
  'aria-label': s.message,
  'aria-live': s.ariaLive,
  'aria-atomic': true,
});

function renderAlert(s: AlertState): string {
  if (!s.visible) return '';
  // `alert` is implicitly assertive; a polite message is a `status`. (The documentation lists role="alert" together with aria-live="polite",
  // which contradict each other — the role decides.)
  const role = s.ariaLive === 'assertive' ? 'alert' : 'status';
  const dismiss = s.dismissible
    ? `<button class="obix-alert__dismiss obix-button" type="button" aria-label="Dismiss ${esc(s.type)} message" data-obix-on="click=dismiss"${s.returnFocusId ? ` data-obix-then-focus="#${esc(s.returnFocusId)}"` : ''}>×</button>`
    : '';
  return `<div${attrs({ class: cx('obix-alert', `obix-alert--${s.type}`), role, 'aria-live': s.ariaLive, 'aria-atomic': 'true', 'data-jfix-strategy': 'box-shadow' })}>` +
    `${s.icon ? `<span class="obix-alert-icon" aria-hidden="true">${ICON[s.type]}</span>` : ''}<span class="obix-alert__message">${esc(s.message)}</span>${dismiss}</div>`;
}

export function createAlert(config: AlertConfig): ObixComponent<AlertState> {
  const type = config.type ?? 'info';
  return defineComponent<AlertState>({
    name: 'ObixAlert',
    state: {
      message: config.message,
      type,
      dismissible: config.dismissible ?? true,
      icon: config.icon ?? true,
      visible: true,
      ariaLive: config.ariaLive ?? (assertiveByDefault(type) ? 'assertive' : 'polite'),
      returnFocusId: config.returnFocusId ?? null,
    },
    actions: {
      dismiss: () => ({ visible: false }),
      show: () => ({ visible: true }),
      hide: () => ({ visible: false }),
      setMessage: (_state, message: unknown) => ({ message: String(message) }),
      // an explicit `ariaLive` is kept; otherwise it follows the new type
      setType: (state, next: unknown) => ({ type: next as AlertType, ...(config.ariaLive ? {} : { ariaLive: assertiveByDefault(next as AlertType) ? 'assertive' as const : 'polite' as const }) }),
    },
    render: renderAlert,
    aria: ariaOf,
  });
}
