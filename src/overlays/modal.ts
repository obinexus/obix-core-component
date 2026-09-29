import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface ModalAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ModalState {
  open: boolean;
  /** The documented name of `open`. */
  isOpen: boolean;
  title: string;
  /** HTML (trusted markup). */
  content: string;
  /** Close on Escape (documented `closeOnEscape`, default true). */
  closeOnEscape: boolean;
  /** Close when the backdrop is clicked (documented `closeOnBackdropClick`, implemented `backdropClose`; default true). */
  backdropClose: boolean;
  size: 'sm' | 'md' | 'lg';
  centered: boolean;
  backdrop: 'dark' | 'light' | 'blur';
  actions: ModalAction[];
  /** The last action button pressed (`index`), and how many were pressed — the application observes this (callbacks are not state). */
  lastAction: { index: number; count: number } | null;
  modalId: string;
  titleId: string;
  label: string;
}

export interface ModalConfig {
  title: string;
  content?: string;
  open?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
  backdropClose?: boolean;
  size?: 'sm' | 'md' | 'lg';
  centered?: boolean;
  backdrop?: 'dark' | 'light' | 'blur';
  /** Buttons at the foot of the dialog. Pressing one records it in `lastAction` and closes the dialog. `onClick` is kept on `component.onAction`. */
  actions?: Array<ModalAction & { onClick?: () => void }>;
  label?: string;
  id?: string;
}

export function getFocusableElements(container: Element): HTMLElement[] {
  const selectors = [
    'a[href]', 'button:not([disabled])', 'textarea:not([disabled])',
    'input:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

export function createFocusTrap(container: Element): (e: KeyboardEvent) => void {
  return (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusable = getFocusableElements(container);
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
}

const ariaOf = (s: ModalState): AriaAttributes => ({ role: 'dialog', 'aria-label': s.label, 'aria-modal': true });

function renderModal(s: ModalState): string {
  if (!s.open) return '';
  const actions = s.actions.length
    ? `<div class="obix-modal-actions obix-modal__actions">${s.actions.map((a, i) => `<button${attrs({ type: 'button', class: cx('obix-button', `obix-button--${a.variant ?? 'secondary'}`), 'data-index': String(i), 'data-obix-on': 'click=activate(@attr:data-index)' })}>${esc(a.label)}</button>`).join('')}</div>`
    : '';
  // The backdrop closes the dialog only when it is itself the click target (`.self`), never for clicks inside the dialog.
  return `<div${attrs({ class: cx('obix-modal__overlay', 'obix-modal-backdrop'), 'data-backdrop': s.backdrop, 'data-obix-on': s.backdropClose ? 'click.self=backdropClick' : undefined })}>` +
    `<div${attrs({ class: cx('obix-modal__dialog', 'obix-modal', `obix-modal--${s.size}`, s.centered && 'obix-modal--centered'), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': s.titleId, id: s.modalId, 'data-jfix-strategy': 'box-shadow', tabindex: '-1',
      'data-obix-trap': '', 'data-obix-dismiss': s.closeOnEscape ? 'close' : undefined })}>` +
    `<button class="obix-modal__close obix-button" type="button" aria-label="Close dialog" data-obix-on="click=close">×</button>` +
    `<h2 id="${esc(s.titleId)}" class="obix-modal__title">${esc(s.title)}</h2>` +
    `<div class="obix-modal__content">${s.content}</div>${actions}</div></div>`;
}

export function createModal(config: ModalConfig): ObixComponent<ModalState> & { onAction?: (index: number) => void } {
  const id = createId('obix-modal', config.id);
  const handlers = (config.actions ?? []).map((a) => a.onClick);
  const isOpen = config.open ?? false;
  const component = defineComponent<ModalState>({
    name: 'ObixModal',
    state: {
      open: isOpen,
      isOpen,
      title: config.title,
      content: config.content ?? '',
      closeOnEscape: config.closeOnEscape ?? true,
      backdropClose: config.closeOnBackdropClick ?? config.backdropClose ?? true,
      size: config.size ?? 'md',
      centered: config.centered ?? true,
      backdrop: config.backdrop ?? 'dark',
      actions: (config.actions ?? []).map(({ label, variant }) => ({ label, ...(variant ? { variant } : {}) })),
      lastAction: null,
      modalId: id,
      titleId: `${id}-title`,
      label: config.label ?? config.title,
    },
    actions: {
      open: () => ({ open: true, isOpen: true }),
      close: () => ({ open: false, isOpen: false }),
      toggle: (state) => ({ open: !state.open, isOpen: !state.open }),
      setContent: (_state, content: unknown) => ({ content: String(content) }),
      backdropClick: (state) => (state.backdropClose ? { open: false, isOpen: false } : state),
      activate: (state, index: unknown) => {
        const i = Number(index);
        return state.actions[i] ? { lastAction: { index: i, count: (state.lastAction?.count ?? 0) + 1 }, open: false, isOpen: false } : state;
      },
    },
    render: renderModal,
    aria: ariaOf,
    focusConfig: { trapFocus: true, restoreFocus: true, focusVisible: true },
  });
  const onAction = (index: number): void => handlers[index]?.();
  return Object.assign(component, handlers.some(Boolean) ? { onAction } : {});
}
