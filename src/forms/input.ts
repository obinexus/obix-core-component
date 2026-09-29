import type { AriaAttributes, ValidationState } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';
import { textErrors, validationFor, type TextRules } from '../kit/validate.js';

export type InputType = 'text' | 'email' | 'password' | 'url' | 'tel' | 'number' | 'search';
export type ValidationTiming = 'blur' | 'change' | 'submit';
export type AutocompleteValue = 'on' | 'off' | 'email' | 'username' | 'current-password' | 'new-password' | 'given-name' | 'family-name' | 'name' | 'tel' | 'url' | string;

export interface InputState {
  value: string;
  name: string;
  type: InputType;
  label: string;
  ariaLabel: string;
  ariaDescribedBy: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  minLength: number | null;
  maxLength: number | null;
  pattern: string;
  autocomplete: AutocompleteValue;
  validationTiming: ValidationTiming;
  validation: ValidationState;
  /** Custom message that replaces the generated ones. */
  errorMessage: string;
  hintText: string;
  errorId: string;
  inputId: string;
  // documented flat view of the same information (docs: `InputState extends InputConfig { touched, focused, error, valid, dirty }`)
  touched: boolean;
  focused: boolean;
  dirty: boolean;
  /** Does the current value satisfy the rules? (Computed on every change, whatever the validation timing.) */
  valid: boolean;
  /** The message being shown, or `null`. Set when validation runs (per `validationTiming`), cleared when the value becomes valid. */
  error: string | null;
  ariaInvalid: boolean;
}

export interface InputConfig {
  label: string;
  name?: string;
  type?: InputType;
  placeholder?: string;
  value?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autocomplete?: AutocompleteValue;
  /** `validationTiming` is the implemented name, `validation` the documented one. */
  validationTiming?: ValidationTiming;
  validation?: 'blur' | 'change';
  errorMessage?: string;
  hintText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  id?: string;
}

const rulesOf = (s: InputState): TextRules => ({
  label: s.label, type: s.type, required: s.required, minLength: s.minLength, maxLength: s.maxLength, pattern: s.pattern, errorMessage: s.errorMessage,
});

/** Recompute the derived, documented view (`valid`, `error`, …) from `validation`, `value` and `touched`. */
function derive(state: InputState): InputState {
  const errors = textErrors(state.value, rulesOf(state));
  const shown = state.validation.touched && !state.validation.valid ? state.validation.errors : [];
  return {
    ...state,
    valid: errors.length === 0,
    error: shown[0] ?? null,
    ariaInvalid: shown.length > 0,
    touched: state.validation.touched,
  };
}

const describedBy = (s: InputState): string =>
  [s.hintText ? `${s.inputId}-hint` : '', s.ariaInvalid ? s.errorId : '', s.ariaDescribedBy].filter(Boolean).join(' ');

const ariaOf = (s: InputState): AriaAttributes => ({
  role: 'textbox',
  'aria-label': s.ariaLabel || s.label,
  'aria-required': s.required,
  'aria-invalid': s.ariaInvalid,
  'aria-disabled': s.disabled,
  'aria-readonly': s.readonly,
  'aria-describedby': describedBy(s) || undefined,
});

function renderInput(s: InputState): string {
  const described = describedBy(s);
  const field = `<input${attrs({
    id: s.inputId,
    name: s.name || undefined,
    type: s.type,
    class: cx('obix-input', s.ariaInvalid && 'obix-input--invalid'),
    value: s.value,
    placeholder: s.placeholder || undefined,
    autocomplete: s.autocomplete,
    minlength: s.minLength ?? undefined,
    maxlength: s.maxLength ?? undefined,
    pattern: s.pattern || undefined,
    required: s.required,
    disabled: s.disabled,
    readonly: s.readonly,
    'aria-label': s.ariaLabel || undefined,
    'aria-invalid': s.ariaInvalid ? 'true' : undefined,
    'aria-describedby': described || undefined,
    'data-jfix-strategy': 'fixed-size',
    'data-obix-on': 'input=change(@value); blur=blur; focus=focus',
  })}>`;
  return `<div class="obix-field"><label for="${esc(s.inputId)}" class="obix-field__label">${esc(s.label)}${s.required ? ' <span aria-hidden="true">*</span>' : ''}</label>` +
    `${s.hintText ? `<span id="${esc(s.inputId)}-hint" class="obix-form__hint">${esc(s.hintText)}</span>` : ''}` +
    `${field}` +
    // the live region is always present, so a message that appears later is announced
    `<span id="${esc(s.errorId)}" class="obix-field__error" aria-live="polite">${s.ariaInvalid ? esc(s.error ?? '') : ''}</span></div>`;
}

export function createInput(config: InputConfig): ObixComponent<InputState> {
  const id = createId('obix-input', config.id);
  const timing = config.validationTiming ?? config.validation ?? 'blur';
  const base: InputState = {
    value: config.value ?? '',
    name: config.name ?? '',
    type: config.type ?? 'text',
    label: config.label,
    ariaLabel: config.ariaLabel ?? '',
    ariaDescribedBy: config.ariaDescribedBy ?? '',
    placeholder: config.placeholder ?? '',
    required: config.required ?? false,
    disabled: config.disabled ?? false,
    readonly: config.readonly ?? false,
    minLength: config.minLength ?? null,
    maxLength: config.maxLength ?? null,
    pattern: config.pattern ?? '',
    autocomplete: config.autocomplete ?? 'on',
    validationTiming: timing,
    validation: { valid: true, errors: [], touched: false },
    errorMessage: config.errorMessage ?? '',
    hintText: config.hintText ?? '',
    errorId: `${id}-error`,
    inputId: id,
    touched: false, focused: false, dirty: false, valid: true, error: null, ariaInvalid: false,
  };
  const initial = derive(base);
  return defineComponent<InputState>({
    name: 'ObixInput',
    state: config.ariaInvalid ? { ...initial, ariaInvalid: true } : initial,
    actions: {
      change: (state, value: unknown) => {
        const next = { ...state, value: String(value), dirty: true };
        // validation timing "change": show errors as the user types; otherwise only re-derive validity, and drop a shown error once fixed
        const validation: ValidationState = state.validationTiming === 'change'
          ? validationFor(next.value, rulesOf(next), true)
          : state.validation.touched && state.validation.errors.length && textErrors(next.value, rulesOf(next)).length === 0
            ? { valid: true, errors: [], touched: state.validation.touched }
            : state.validation;
        return derive({ ...next, validation });
      },
      focus: (state) => ({ focused: true }),
      blur: (state) => derive({ ...state, focused: false, validation: validationFor(state.value, rulesOf(state), true) }),
      clear: (state) => derive({ ...state, value: '', dirty: false, validation: { valid: true, errors: [], touched: false } }),
      validate: (state) => derive({ ...state, validation: validationFor(state.value, rulesOf(state), true) }),
      setError: (state, message: unknown) => {
        const text = String(message ?? '');
        return derive({ ...state, validation: text ? { valid: false, errors: [text], touched: true } : { valid: true, errors: [], touched: state.validation.touched } });
      },
      setDisabled: (_state, disabled: unknown) => ({ disabled: Boolean(disabled) }),
    },
    render: renderInput,
    aria: ariaOf,
  });
}
