import type { AriaAttributes } from '../types/base.js';
import type { JfixStrategy } from '../types/jfix.js';
import { OBIX_MIN_TARGET_PX } from '../types/base.js';
import { attrs, cx, esc, ariaBool, defineComponent, type ObixComponent } from '../kit/index.js';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonState {
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  type: ButtonType;
  disabled: boolean;
  loading: boolean;
  /** `undefined` for a plain button, `boolean` for a toggle button. */
  pressed: boolean | undefined;
  expanded: boolean | undefined;
  /** Accessible name when it differs from the visible label (icon-only buttons, extra context). */
  ariaLabel: string;
  ariaControls: string;
  touched: boolean;
  focused: boolean;
  /** Minimum target size, enforced by the touch-target policy and emitted as inline style so it holds without the stylesheet. */
  minWidth: string;
  minHeight: string;
  jfixStrategy: JfixStrategy;
}

export interface ButtonConfig {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  toggle?: boolean;
  /** Initial pressed state of a toggle button. */
  ariaPressed?: boolean;
  ariaLabel?: string;
  ariaControls?: string;
  jfixStrategy?: JfixStrategy;
}

const ariaOf = (state: ButtonState): AriaAttributes => ({
  role: 'button',
  'aria-label': state.ariaLabel || state.label,
  'aria-busy': state.loading,
  'aria-disabled': state.disabled,
  'aria-pressed': state.pressed,
  'aria-expanded': state.expanded,
  'aria-controls': state.ariaControls || undefined,
});

function renderButton(state: ButtonState): string {
  const aria = ariaOf(state);
  const open = attrs({
    type: state.type,
    class: cx('obix-button', `obix-button--${state.variant}`, `obix-button--${state.size}`, state.loading && 'is-loading'),
    'data-jfix-strategy': state.jfixStrategy,
    style: `min-width:${state.minWidth};min-height:${state.minHeight}`,
    'aria-label': aria['aria-label'],
    'aria-busy': state.loading ? 'true' : undefined,
    'aria-disabled': state.disabled ? 'true' : undefined,
    'aria-pressed': ariaBool(aria['aria-pressed']),
    'aria-expanded': ariaBool(aria['aria-expanded']),
    'aria-controls': aria['aria-controls'],
    // a submit button that is only aria-disabled would still submit its form
    disabled: state.type === 'submit' && (state.disabled || state.loading),
    'data-obix-on': 'click=click',
  });
  return `<button${open}>${state.loading ? '<span aria-hidden="true" class="obix-button__spinner"></span>' : ''}${esc(state.label)}</button>`;
}

export function createButton(config: ButtonConfig): ObixComponent<ButtonState> {
  const px = `${OBIX_MIN_TARGET_PX}px`;
  const isToggle = config.toggle ?? config.ariaPressed !== undefined;
  return defineComponent<ButtonState>({
    name: 'ObixButton',
    state: {
      label: config.label,
      variant: config.variant ?? 'primary',
      size: config.size ?? 'md',
      type: config.type ?? 'button',
      disabled: config.disabled ?? false,
      loading: config.loading ?? false,
      pressed: isToggle ? config.ariaPressed ?? false : undefined,
      expanded: undefined,
      ariaLabel: config.ariaLabel ?? '',
      ariaControls: config.ariaControls ?? '',
      touched: false,
      focused: false,
      minWidth: px,
      minHeight: px,
      jfixStrategy: config.jfixStrategy ?? 'transform-scale',
    },
    actions: {
      click: (state) => {
        if (state.disabled || state.loading) return state;
        return { touched: true, ...(state.pressed !== undefined ? { pressed: !state.pressed } : {}) };
      },
      toggle: (state) => (state.disabled || state.loading ? state : { pressed: !(state.pressed ?? false), touched: true }),
      setLoading: (_state, loading: unknown) => ({ loading: Boolean(loading), disabled: Boolean(loading) }),
      setDisabled: (_state, disabled: unknown) => ({ disabled: Boolean(disabled) }),
      setExpanded: (_state, expanded: unknown) => ({ expanded: Boolean(expanded) }),
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false }),
      setJfixStrategy: (_state, strategy: unknown) => ({ jfixStrategy: strategy as JfixStrategy }),
    },
    render: renderButton,
    aria: ariaOf,
  });
}
