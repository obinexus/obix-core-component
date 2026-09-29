import type { AriaAttributes, ValidationState } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';
import { validationFor, type TextRules } from '../kit/validate.js';

export type ResizeMode = 'none' | 'vertical' | 'horizontal' | 'both';

export interface TextareaState {
  value: string;
  name: string;
  label: string;
  ariaLabel: string;
  ariaDescribedBy: string;
  placeholder: string;
  rows: number;
  cols: number;
  minLength: number | null;
  maxLength: number | null;
  resize: ResizeMode;
  autoExpand: boolean;
  showCharCount: boolean;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  validation: ValidationState;
  touched: boolean;
  focused: boolean;
  textareaId: string;
}

export interface TextareaConfig {
  label: string;
  name?: string;
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  minLength?: number;
  maxLength?: number;
  resize?: ResizeMode;
  autoExpand?: boolean;
  /** Default: shown when `maxLength` is set. */
  showCharCount?: boolean;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  id?: string;
}

const rulesOf = (s: TextareaState): TextRules => ({ label: s.label, required: s.required, minLength: s.minLength, maxLength: s.maxLength });

const ariaOf = (s: TextareaState): AriaAttributes => ({
  role: 'textbox',
  'aria-label': s.ariaLabel || s.label,
  'aria-multiline': true,
  'aria-required': s.required,
  'aria-disabled': s.disabled,
  'aria-invalid': s.validation.touched && !s.validation.valid,
});

function renderTextarea(s: TextareaState): string {
  const invalid = s.validation.touched && !s.validation.valid;
  const counterId = `${s.textareaId}-counter`;
  const errorId = `${s.textareaId}-error`;
  const counter = s.showCharCount;
  const describedBy = [counter ? counterId : '', invalid ? errorId : '', s.ariaDescribedBy].filter(Boolean).join(' ');
  const text = `<textarea${attrs({
    id: s.textareaId,
    name: s.name || undefined,
    class: 'obix-textarea',
    placeholder: s.placeholder || undefined,
    rows: String(s.rows),
    cols: s.cols ? String(s.cols) : undefined,
    minlength: s.minLength ?? undefined,
    maxlength: s.maxLength ?? undefined,
    style: `resize:${s.resize}`,
    required: s.required,
    disabled: s.disabled,
    readonly: s.readonly,
    'aria-label': s.ariaLabel || undefined,
    'aria-invalid': invalid ? 'true' : undefined,
    'aria-describedby': describedBy || undefined,
    'data-jfix-strategy': 'fixed-size',
    'data-obix-autoexpand': s.autoExpand ? '' : undefined,
    'data-obix-on': 'input=change(@value); blur=blur; focus=focus',
  })}>${esc(s.value)}</textarea>`;
  const remaining = s.maxLength !== null ? s.maxLength - s.value.length : null;
  return `<div class="obix-field"><label for="${esc(s.textareaId)}" class="obix-field__label">${esc(s.label)}${s.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${text}` +
    `${counter ? `<div id="${esc(counterId)}" class="obix-textarea__counter" aria-live="polite" aria-atomic="true">${remaining === null ? `${s.value.length} characters` : `${remaining} characters remaining`}</div>` : ''}` +
    `<span id="${esc(errorId)}" class="obix-field__error" aria-live="polite">${invalid ? esc(s.validation.errors.join(' ')) : ''}</span></div>`;
}

export function createTextarea(config: TextareaConfig): ObixComponent<TextareaState> {
  return defineComponent<TextareaState>({
    name: 'ObixTextarea',
    state: {
      value: config.value ?? '',
      name: config.name ?? '',
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      ariaDescribedBy: config.ariaDescribedBy ?? '',
      placeholder: config.placeholder ?? '',
      rows: config.rows ?? 4,
      cols: config.cols ?? 0,
      minLength: config.minLength ?? null,
      maxLength: config.maxLength ?? null,
      resize: config.resize ?? 'vertical',
      autoExpand: config.autoExpand ?? false,
      showCharCount: config.showCharCount ?? config.maxLength !== undefined,
      required: config.required ?? false,
      disabled: config.disabled ?? false,
      readonly: config.readonly ?? false,
      validation: { valid: true, errors: [], touched: false },
      touched: false,
      focused: false,
      textareaId: createId('obix-textarea', config.id),
    },
    actions: {
      change: (state, value: unknown) => {
        const next = { ...state, value: String(value) };
        // once errors are showing, keep them in step with what the user types
        return state.validation.touched ? { value: next.value, validation: validationFor(next.value, rulesOf(next), true) } : { value: next.value };
      },
      blur: (state) => ({ validation: validationFor(state.value, rulesOf(state), true), touched: true, focused: false }),
      focus: () => ({ focused: true }),
      clear: () => ({ value: '', validation: { valid: true, errors: [], touched: false }, touched: false }),
      validate: (state) => ({ validation: validationFor(state.value, rulesOf(state), true) }),
    },
    render: renderTextarea,
    aria: ariaOf,
  });
}
