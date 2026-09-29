import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type CheckedState = boolean | 'mixed';

export interface CheckboxState {
  /** `true`, `false`, or `'mixed'` (indeterminate — the "select all" pattern). */
  checked: CheckedState;
  /** The documented boolean view of `checked === 'mixed'`. */
  indeterminate: boolean;
  label: string;
  name: string;
  value: string;
  required: boolean;
  disabled: boolean;
  ariaLabel: string;
  ariaDescribedBy: string;
  groupLabel: string;
  touched: boolean;
  focused: boolean;
  inputId: string;
}

export interface CheckboxConfig {
  label: string;
  name?: string;
  value?: string;
  checked?: boolean;
  indeterminate?: boolean;
  required?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  groupLabel?: string;
  id?: string;
}

const withChecked = (state: CheckboxState, checked: CheckedState): Partial<CheckboxState> => ({ checked, indeterminate: checked === 'mixed' });

const ariaOf = (s: CheckboxState): AriaAttributes => ({
  role: 'checkbox',
  'aria-label': s.ariaLabel || s.label,
  'aria-checked': s.checked,
  'aria-required': s.required,
  'aria-disabled': s.disabled,
  'aria-describedby': [s.groupLabel ? `${s.inputId}-group` : '', s.ariaDescribedBy].filter(Boolean).join(' ') || undefined,
});

function renderCheckbox(s: CheckboxState): string {
  const described = ariaOf(s)['aria-describedby'];
  const input = `<input${attrs({
    type: 'checkbox',
    id: s.inputId,
    name: s.name || undefined,
    value: s.value,
    checked: s.checked === true,
    // The DOM `indeterminate` property has no attribute: the driver copies this marker onto it. aria-checked="mixed" states it for assistive technology.
    'data-indeterminate': s.checked === 'mixed' ? 'true' : undefined,
    'aria-checked': s.checked === 'mixed' ? 'mixed' : undefined,
    required: s.required,
    disabled: s.disabled,
    'aria-label': s.ariaLabel || undefined,
    'aria-describedby': described,
    'data-obix-on': 'change=toggle; focus=focus; blur=blur',
  })}>`;
  return `<div class="obix-checkbox" data-jfix-strategy="fixed-size">${input}<label for="${esc(s.inputId)}" class="obix-checkbox__label">${esc(s.label)}</label></div>`;
}

export function createCheckbox(config: CheckboxConfig): ObixComponent<CheckboxState> {
  const initial: CheckedState = config.indeterminate ? 'mixed' : (config.checked ?? false);
  return defineComponent<CheckboxState>({
    name: 'ObixCheckbox',
    state: {
      checked: initial,
      indeterminate: initial === 'mixed',
      label: config.label,
      name: config.name ?? '',
      value: config.value ?? config.label.toLowerCase().replace(/\s+/g, '-'),
      required: config.required ?? false,
      disabled: config.disabled ?? false,
      ariaLabel: config.ariaLabel ?? '',
      ariaDescribedBy: config.ariaDescribedBy ?? '',
      groupLabel: config.groupLabel ?? '',
      touched: false,
      focused: false,
      inputId: createId('obix-checkbox', config.id),
    },
    actions: {
      // activating a mixed checkbox checks it (APG); otherwise it flips
      toggle: (state) => (state.disabled ? state : { ...withChecked(state, state.checked === 'mixed' ? true : !state.checked), touched: true }),
      setChecked: (state, checked: unknown) => (state.disabled ? state : withChecked(state, Boolean(checked))),
      check: (state) => (state.disabled ? state : withChecked(state, true)),
      uncheck: (state) => (state.disabled ? state : withChecked(state, false)),
      // no argument (the implemented form) means "make it indeterminate"
      setIndeterminate: (state, flag?: unknown) => {
        if (state.disabled) return state;
        const on = flag === undefined ? true : Boolean(flag);
        return withChecked(state, on ? 'mixed' : state.checked === 'mixed' ? false : state.checked);
      },
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false, touched: true }),
    },
    render: renderCheckbox,
    aria: ariaOf,
  });
}
