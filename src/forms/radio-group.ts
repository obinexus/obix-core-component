import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupState {
  options: RadioOption[];
  selectedValue: string | null;
  /** The documented name of `selectedValue`. */
  selected: string | null;
  name: string;
  groupLabel: string;
  legend: string;
  ariaLabel: string;
  required: boolean;
  disabled: boolean;
  focusedIndex: number;
  focused: boolean;
  touched: boolean;
}

export interface RadioGroupConfig {
  /** Accessible name and visible legend. `legend` is the documented name, `groupLabel` the implemented one. */
  groupLabel?: string;
  legend?: string;
  ariaLabel?: string;
  options: RadioOption[];
  name?: string;
  selectedValue?: string;
  selected?: string;
  required?: boolean;
  disabled?: boolean;
}

const ariaOf = (s: RadioGroupState): AriaAttributes => ({
  role: 'radiogroup',
  'aria-label': s.ariaLabel || s.legend,
  'aria-required': s.required,
});

function renderRadioGroup(s: RadioGroupState): string {
  const radios = s.options
    .map((opt, i) => {
      const id = `${s.name}-${i}`;
      const input = `<input${attrs({
        type: 'radio',
        id,
        name: s.name,
        value: opt.value,
        checked: opt.value === s.selectedValue,
        disabled: !!opt.disabled || s.disabled,
        required: s.required,
        'data-obix-on': 'change=select(@value); focus=focus(@attr:data-index); blur=blur',
        'data-index': String(i),
      })}>`;
      return `<div class="obix-radio-group__item" data-jfix-strategy="fixed-size">${input}<label for="${esc(id)}">${esc(opt.label)}</label></div>`;
    })
    .join('');
  const label = s.ariaLabel || s.legend;
  return `<fieldset${attrs({ class: 'obix-radio-group', role: 'radiogroup', 'aria-label': s.legend ? undefined : label, 'aria-required': s.required ? 'true' : undefined })}>` +
    `${s.legend ? `<legend class="obix-radio-group__legend">${esc(s.legend)}</legend>` : ''}${radios}</fieldset>`;
}

const usable = (state: RadioGroupState): number[] => state.options.map((o, i) => (o.disabled || state.disabled ? -1 : i)).filter((i) => i >= 0);

export function createRadioGroup(config: RadioGroupConfig): ObixComponent<RadioGroupState> {
  const legend = config.legend ?? config.groupLabel ?? '';
  const selected = config.selected ?? config.selectedValue;
  const initialIndex = selected !== undefined ? config.options.findIndex((o) => o.value === selected) : 0;
  const moveTo = (state: RadioGroupState, index: number, select: boolean): Partial<RadioGroupState> => {
    const option = state.options[index];
    if (!option || option.disabled || state.disabled) return {};
    return select ? { focusedIndex: index, selectedValue: option.value, selected: option.value, touched: true } : { focusedIndex: index };
  };
  const step = (state: RadioGroupState, delta: 1 | -1): number => {
    const ok = usable(state);
    if (!ok.length) return state.focusedIndex;
    const at = ok.indexOf(state.focusedIndex);
    return ok[(at < 0 ? (delta === 1 ? 0 : ok.length - 1) : (at + delta + ok.length) % ok.length)] as number;
  };
  return defineComponent<RadioGroupState>({
    name: 'ObixRadioGroup',
    state: {
      options: config.options,
      selectedValue: selected ?? null,
      selected: selected ?? null,
      name: createId('obix-radio', config.name),
      groupLabel: legend,
      legend,
      ariaLabel: config.ariaLabel ?? '',
      required: config.required ?? false,
      disabled: config.disabled ?? false,
      focusedIndex: Math.max(0, initialIndex),
      focused: false,
      touched: false,
    },
    actions: {
      select: (state, value: unknown) => {
        const index = state.options.findIndex((o) => o.value === String(value));
        return index < 0 ? state : moveTo(state, index, true);
      },
      // documented: move the focus position without changing the selection
      focus: (state, index?: unknown) => ({ focused: true, ...(index === undefined ? {} : moveTo(state, Number(index), false)) }),
      blur: () => ({ focused: false, touched: true }),
      focusNext: (state) => moveTo(state, step(state, 1), false),
      focusPrev: (state) => moveTo(state, step(state, -1), false),
      // implemented: arrow-key navigation selects as it moves (native radio behaviour)
      navigateNext: (state) => moveTo(state, step(state, 1), true),
      navigatePrev: (state) => moveTo(state, step(state, -1), true),
      navigateFirst: (state) => moveTo(state, usable(state)[0] ?? 0, true),
      navigateLast: (state) => moveTo(state, usable(state).at(-1) ?? 0, true),
    },
    render: renderRadioGroup,
    aria: ariaOf,
  });
}
