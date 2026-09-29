import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface SwitchState {
  checked: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
  ariaDescribedBy: string;
  name: string;
  size: 'sm' | 'md' | 'lg';
  focused: boolean;
  switchId: string;
}

export interface SwitchConfig {
  label: string;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  id?: string;
}

const ariaOf = (s: SwitchState): AriaAttributes => ({
  role: 'switch',
  'aria-label': s.ariaLabel || s.label,
  'aria-checked': s.checked,
  'aria-disabled': s.disabled,
  'aria-describedby': s.ariaDescribedBy || undefined,
});

function renderSwitch(s: SwitchState): string {
  // A real <button role="switch">: Space and Enter operate it natively, it is focusable, and the label is associated with it. (The old
  // div[role=switch] had a tabindex but no key handling, so it could not be operated from the keyboard.)
  const control = `<button${attrs({
    type: 'button',
    id: s.switchId,
    name: s.name || undefined,
    role: 'switch',
    class: cx('obix-switch', `obix-switch--${s.size}`, s.checked && 'is-checked'),
    'aria-checked': String(s.checked),
    'aria-label': s.ariaLabel || undefined,
    'aria-describedby': s.ariaDescribedBy || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'data-jfix-strategy': 'transform-scale',
    'data-obix-on': 'click=toggle; focus=focus; blur=blur',
  })}><span class="obix-switch__track"><span class="obix-switch__thumb"></span></span></button>`;
  return `<div class="obix-switch-wrapper"><label for="${esc(s.switchId)}" class="obix-switch__label">${esc(s.label)}</label>${control}</div>`;
}

export function createSwitch(config: SwitchConfig): ObixComponent<SwitchState> {
  return defineComponent<SwitchState>({
    name: 'ObixSwitch',
    state: {
      checked: config.checked ?? false,
      disabled: config.disabled ?? false,
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      ariaDescribedBy: config.ariaDescribedBy ?? '',
      name: config.name ?? '',
      size: config.size ?? 'md',
      focused: false,
      switchId: createId('obix-switch', config.id),
    },
    actions: {
      toggle: (state) => (state.disabled ? state : { checked: !state.checked }),
      setChecked: (state, checked: unknown) => (state.disabled ? state : { checked: Boolean(checked) }),
      on: (state) => (state.disabled ? state : { checked: true }),
      off: (state) => (state.disabled ? state : { checked: false }),
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false }),
    },
    render: renderSwitch,
    aria: ariaOf,
  });
}
