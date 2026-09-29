import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectOptGroup {
  label: string;
  options: SelectOption[];
}

export type SelectItem = SelectOption | SelectOptGroup;

export interface SelectState {
  options: SelectItem[];
  selectedValues: string[];
  /** The documented single-value view of `selectedValues`. */
  selected: string;
  name: string;
  multiple: boolean;
  /** Kept for API compatibility. A native <select> popup is controlled by the browser, so this flag does not drive markup. */
  open: boolean;
  disabled: boolean;
  required: boolean;
  placeholder: string;
  label: string;
  ariaLabel: string;
  selectId: string;
  searchQuery: string;
  focused: boolean;
  touched: boolean;
}

export interface SelectConfig {
  label: string;
  options: SelectItem[];
  name?: string;
  selectedValue?: string;
  selected?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
}

const isOptGroup = (item: SelectItem): item is SelectOptGroup => 'options' in item && Array.isArray((item as SelectOptGroup).options);

const allValues = (items: SelectItem[]): string[] => items.flatMap((i) => (isOptGroup(i) ? i.options.map((o) => o.value) : [i.value]));

const ariaOf = (s: SelectState): AriaAttributes => ({
  role: s.multiple ? 'listbox' : 'combobox',
  'aria-label': s.ariaLabel || s.label,
  'aria-required': s.required,
  'aria-disabled': s.disabled,
  'aria-multiselectable': s.multiple ? true : undefined,
});

function renderSelect(s: SelectState): string {
  const option = (o: SelectOption): string =>
    `<option${attrs({ value: o.value, disabled: !!o.disabled, selected: s.selectedValues.includes(o.value) })}>${esc(o.label)}</option>`;
  const items = s.options.map((item) => (isOptGroup(item) ? `<optgroup label="${esc(item.label)}">${item.options.map(option).join('')}</optgroup>` : option(item))).join('');
  const placeholder = s.placeholder && !s.multiple
    ? `<option${attrs({ value: '', disabled: true, selected: s.selectedValues.length === 0 })}>${esc(s.placeholder)}</option>`
    : '';
  const select = `<select${attrs({
    id: s.selectId,
    name: s.name || undefined,
    class: 'obix-select',
    'data-jfix-strategy': 'fixed-size',
    multiple: s.multiple,
    required: s.required,
    disabled: s.disabled,
    'aria-label': s.ariaLabel || undefined,
    'data-obix-on': 'change=change(@selected); focus=focus; blur=blur',
  })}>${placeholder}${items}</select>`;
  return `<div class="obix-field"><label for="${esc(s.selectId)}" class="obix-field__label">${esc(s.label)}${s.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${select}</div>`;
}

export function createSelect(config: SelectConfig): ObixComponent<SelectState> {
  const selectedValue = config.selected ?? config.selectedValue;
  const initial = selectedValue !== undefined && selectedValue !== '' ? [selectedValue] : [];
  const known = (state: SelectState, values: string[]): string[] => {
    const valid = new Set(allValues(state.options));
    return values.filter((v) => valid.has(v));
  };
  const withSelection = (state: SelectState, values: string[]): Partial<SelectState> => {
    const next = known(state, state.multiple ? values : values.slice(0, 1));
    return { selectedValues: next, selected: next[0] ?? '', touched: true };
  };
  return defineComponent<SelectState>({
    name: 'ObixSelect',
    state: {
      options: config.options,
      selectedValues: initial,
      selected: initial[0] ?? '',
      name: config.name ?? '',
      multiple: config.multiple ?? false,
      open: false,
      disabled: config.disabled ?? false,
      required: config.required ?? false,
      placeholder: config.placeholder ?? '',
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      selectId: createId('obix-select', config.id),
      searchQuery: '',
      focused: false,
      touched: false,
    },
    actions: {
      // documented: `change(value | values)` — what the native control reports
      change: (state, value: unknown) => (state.disabled ? state : withSelection(state, Array.isArray(value) ? value.map(String) : value === '' || value == null ? [] : [String(value)])),
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false, touched: true }),
      open: () => ({ open: true }),
      close: () => ({ open: false }),
      toggle: (state) => ({ open: !state.open }),
      selectOption: (state, value: unknown) => {
        if (state.disabled) return state;
        const v = String(value);
        if (state.multiple) {
          return withSelection(state, state.selectedValues.includes(v) ? state.selectedValues.filter((x) => x !== v) : [...state.selectedValues, v]);
        }
        return { ...withSelection(state, [v]), open: false };
      },
      deselectOption: (state, value: unknown) => withSelection(state, state.selectedValues.filter((s) => s !== value)),
      setSearch: (_state, query: unknown) => ({ searchQuery: String(query) }),
      clearSearch: () => ({ searchQuery: '' }),
    },
    render: renderSelect,
    aria: ariaOf,
  });
}
