import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';
export type TooltipTriggerMode = 'hover' | 'focus' | 'click';

export interface TooltipState {
  content: string;
  visible: boolean;
  /** A show or hide that is waiting out its delay (the driver runs the timer declared in the markup, `data-obix-after`). */
  pending: 'show' | 'hide' | null;
  placement: TooltipPlacement;
  /** How the tooltip is revealed. Keyboard focus always reveals it (except in `click` mode, where the trigger is a button). */
  mode: TooltipTriggerMode;
  tooltipId: string;
  /** Id of the element the tooltip describes. */
  triggerId: string;
  /** When set, the component renders the trigger itself (a focusable text with `aria-describedby`); otherwise the trigger is an existing element. */
  triggerText: string;
  /** Milliseconds before showing (default 0) and before hiding (default 200: the grace that lets the pointer travel onto the tip, WCAG 1.4.13). */
  delay: number;
  closeDelay: number;
  label: string;
}

export interface TooltipConfig {
  content: string;
  placement?: TooltipPlacement;
  /**
   * The documented `trigger` is declared twice, with incompatible types (an element or selector, and the mode `'hover' | 'focus' | 'click'`) — see
   * docs/recovery/known-defects.md. The MODE is honoured. An element or selector is accepted and ignored: a pure renderer cannot attach to an
   * element it does not own, so name the trigger with `triggerText` (rendered here) or `triggerId` (the id of an existing element).
   */
  trigger?: TooltipTriggerMode | (string & Record<never, never>) | { nodeType: number };
  /** Id of the trigger element (the implemented form). */
  triggerId?: string;
  /** Text of a trigger to render. */
  triggerText?: string;
  delay?: number;
  closeDelay?: number;
  ariaLabel?: string;
  id?: string;
}

const ariaOf = (s: TooltipState): AriaAttributes => ({ role: 'tooltip', 'aria-label': s.label });

const EVENTS: Record<TooltipTriggerMode, string> = {
  hover: 'mouseenter.self=requestShow; mouseleave.self=requestHide; focus=requestShow; blur=hide',
  focus: 'focus=requestShow; blur=hide',
  click: 'click=toggle; blur=hide',
};

function renderTooltip(s: TooltipState): string {
  const triggerAttrs = { id: s.triggerId, class: 'obix-tooltip__trigger', 'aria-describedby': s.tooltipId };
  const trigger = s.triggerText
    ? s.mode === 'click'
      ? `<button${attrs({ ...triggerAttrs, type: 'button', 'aria-expanded': String(s.visible) })}>${esc(s.triggerText)}</button>`
      : `<span${attrs({ ...triggerAttrs, tabindex: '0' })}>${esc(s.triggerText)}</span>`
    : '';
  // WCAG 1.4.13: dismissible (Escape), hoverable (the wrapper includes the tooltip) and persistent (stays while hovered or focused).
  // `.self`: only the wrapper's own enter/leave, so moving between the trigger and the tooltip inside it does not flicker.
  const after = s.pending === 'show' ? `reveal:${s.delay}` : s.pending === 'hide' ? `conceal:${s.closeDelay}` : undefined;
  return `<span${attrs({ class: 'obix-tooltip', 'data-obix-on': EVENTS[s.mode], 'data-obix-dismiss': s.visible || s.pending ? 'hide' : undefined, 'data-obix-after': after })}>${trigger}` +
    `<span${attrs({ id: s.tooltipId, role: 'tooltip', class: cx('obix-tooltip__content', `obix-tooltip__content--${s.placement}`), 'data-jfix-strategy': 'box-shadow', hidden: !s.visible })}>${esc(s.content)}</span></span>`;
}

const MODES: readonly string[] = ['hover', 'focus', 'click'];

export function createTooltip(config: TooltipConfig): ObixComponent<TooltipState> {
  const id = createId('obix-tooltip', config.id);
  return defineComponent<TooltipState>({
    name: 'ObixTooltip',
    state: {
      content: config.content,
      visible: false,
      pending: null,
      placement: config.placement ?? 'top',
      mode: typeof config.trigger === 'string' && MODES.includes(config.trigger) ? (config.trigger as TooltipTriggerMode) : 'hover',
      tooltipId: id,
      triggerId: config.triggerId ?? `${id}-trigger`,
      triggerText: config.triggerText ?? '',
      delay: Math.max(0, config.delay ?? 0),
      closeDelay: Math.max(0, config.closeDelay ?? 200),
      label: config.ariaLabel ?? config.content,
    },
    actions: {
      // show / hide are immediate (and cancel whatever is pending)
      show: () => ({ visible: true, pending: null }),
      hide: (state) => (state.visible || state.pending ? { visible: false, pending: null } : state),
      toggle: (state) => ({ visible: !state.visible, pending: null }),
      // what pointer and focus events call: show after `delay`; leaving hides after `closeDelay`, and coming back within that grace cancels it
      requestShow: (state) => {
        if (state.visible) return state.pending ? { pending: null } : state;
        return state.delay > 0 ? { pending: 'show' as const } : { visible: true, pending: null };
      },
      requestHide: (state) => {
        if (!state.visible) return state.pending ? { pending: null } : state;
        return state.closeDelay > 0 ? { pending: 'hide' as const } : { visible: false, pending: null };
      },
      // the timers the markup declares
      reveal: () => ({ visible: true, pending: null }),
      conceal: () => ({ visible: false, pending: null }),
      setContent: (_state, content: unknown) => ({ content: String(content), label: String(content) }),
      setPlacement: (_state, placement: unknown) => ({ placement: placement as TooltipPlacement }),
    },
    render: renderTooltip,
    aria: ariaOf,
    reducedMotionConfig: { respectPreference: true, fallback: 'instant' },
  });
}
