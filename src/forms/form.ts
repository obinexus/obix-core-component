import type { AriaAttributes, ValidationState } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface FieldState {
  value: string;
  validation: ValidationState;
  label: string;
}

export interface FormState {
  fields: Record<string, FieldState>;
  valid: boolean;
  submitting: boolean;
  submitted: boolean;
  /** The data of the last submission. */
  data: Record<string, unknown>;
  submitCount: number;
  formId: string;
  formLabel: string;
  name: string;
  showErrorSummary: boolean;
  errorSummaryPosition: 'top' | 'bottom';
  /** `{ field, message }` for every failing field — the error summary links each message to its field. */
  errorSummary: string[];
  errorFields: string[];
}

export type FieldConfig = { label?: string; required?: boolean; validate?: (value: any) => string | null };

export interface FormConfig {
  /** Accessible name (`label`, implemented) — `name` (documented) is used when there is no label. */
  label?: string;
  name?: string;
  /** Either the implemented record `{ email: { label, required } }` or the documented array `[{ name, required, validate }]`. */
  fields?: Record<string, FieldConfig> | Array<FieldConfig & { name: string }>;
  /** Called by the application with the submitted data (see `onSubmit` on the returned component); actions stay pure. */
  onSubmit?: (data: Record<string, unknown>) => void;
  showErrorSummary?: boolean;
  errorSummaryPosition?: 'top' | 'bottom';
  id?: string;
}

const fieldsOf = (fields: FormConfig['fields']): Array<[string, FieldConfig]> =>
  Array.isArray(fields) ? fields.map((f) => [f.name, f] as [string, FieldConfig]) : Object.entries(fields ?? {});

const ariaOf = (s: FormState): AriaAttributes => ({
  role: 'form',
  'aria-label': s.formLabel,
  'aria-busy': s.submitting,
  'aria-describedby': s.submitted && !s.valid && s.errorSummary.length ? `${s.formId}-errors` : undefined,
});

function renderForm(s: FormState, props?: { content?: string }): string {
  const showErrors = s.submitted && !s.valid && s.errorSummary.length > 0;
  const summary = s.showErrorSummary && showErrors
    ? `<div class="obix-form__error-summary" role="alert" aria-live="assertive"><h2 id="${esc(s.formId)}-errors">Please correct the following errors:</h2>` +
      `<ul>${s.errorSummary.map((message, i) => `<li><a href="#${esc(s.errorFields[i] ?? '')}">${esc(message)}</a></li>`).join('')}</ul></div>`
    : '';
  const body = `<div class="obix-form__fields">${props?.content ?? ''}</div>`;
  return `<form${attrs({ id: s.formId, name: s.name || undefined, class: 'obix-form', 'aria-label': s.formLabel, 'aria-busy': s.submitting ? 'true' : undefined,
    'aria-describedby': showErrors ? `${s.formId}-errors` : undefined, novalidate: true, 'data-obix-on': 'submit=submitForm(@form)!' })}>` +
    `${s.errorSummaryPosition === 'top' ? summary : ''}${body}${s.errorSummaryPosition === 'bottom' ? summary : ''}</form>`;
}

export function createForm(config: FormConfig): ObixComponent<FormState> & { onSubmit?: (data: Record<string, unknown>) => void } {
  const entries = fieldsOf(config.fields);
  const validators = new Map(entries.map(([name, f]) => [name, f]));
  const initialFields: Record<string, FieldState> = {};
  for (const [key, field] of entries) initialFields[key] = { value: '', label: field.label ?? key, validation: { valid: true, errors: [], touched: false } };

  /** Validate one field against its declared rules; the error text is the field's own `validate` result, else "<label> is required." */
  const check = (name: string, value: string, label: string): string[] => {
    const rules = validators.get(name);
    if (!rules) return [];
    if (rules.required && !value.trim()) return [`${label} is required.`];
    const custom = rules.validate?.(value);
    return custom ? [custom] : [];
  };
  const summarize = (fields: Record<string, FieldState>): { errorSummary: string[]; errorFields: string[]; valid: boolean } => {
    const errorSummary: string[] = [];
    const errorFields: string[] = [];
    for (const [key, f] of Object.entries(fields)) for (const e of f.validation.errors) { errorSummary.push(e); errorFields.push(key); }
    return { errorSummary, errorFields, valid: errorSummary.length === 0 };
  };
  const validateAll = (state: FormState, touched = true): Partial<FormState> => {
    const fields: Record<string, FieldState> = {};
    for (const [key, f] of Object.entries(state.fields)) {
      const errors = check(key, f.value, f.label);
      fields[key] = { ...f, validation: { valid: errors.length === 0, errors, touched } };
    }
    return { fields, ...summarize(fields) };
  };

  const component = defineComponent<FormState>({
    name: 'ObixForm',
    state: {
      fields: initialFields,
      valid: true,
      submitting: false,
      submitted: false,
      data: {},
      submitCount: 0,
      formId: createId('obix-form', config.id),
      formLabel: config.label ?? config.name ?? 'Form',
      name: config.name ?? '',
      showErrorSummary: config.showErrorSummary ?? true,
      errorSummaryPosition: config.errorSummaryPosition ?? 'top',
      errorSummary: [],
      errorFields: [],
    },
    actions: {
      setFieldValue: (state, key: unknown, value: unknown) => {
        const name = String(key);
        const existing = state.fields[name] ?? { value: '', label: name, validation: { valid: true, errors: [], touched: false } };
        return { fields: { ...state.fields, [name]: { ...existing, value: String(value) } } };
      },
      validate: (state) => validateAll(state, false),
      validateAll: (state) => validateAll(state, true),
      // Validates every field; only a valid form starts submitting. The application performs the submission (see `onSubmit`).
      submitForm: (state, data?: unknown) => {
        const values = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
        const filled: FormState = {
          ...state,
          fields: Object.fromEntries(Object.entries(state.fields).map(([k, f]) => [k, k in values ? { ...f, value: String(values[k] ?? '') } : f])),
        };
        const result = validateAll(filled, true);
        const valid = (result.valid as boolean) ?? true;
        return { ...result, submitted: true, submitting: valid, data: values, submitCount: state.submitCount + 1 };
      },
      submit: (state) => ({ ...validateAll(state, true), submitting: true, submitted: true, submitCount: state.submitCount + 1 }),
      submitComplete: () => ({ submitting: false }),
      setFieldError: (state, key: unknown, message: unknown) => {
        const name = String(key);
        const existing = state.fields[name];
        if (!existing) return state;
        const fields = { ...state.fields, [name]: { ...existing, validation: { valid: false, errors: [String(message)], touched: true } } };
        return { fields, ...summarize(fields) };
      },
      clearFieldError: (state, key: unknown) => {
        const name = String(key);
        const existing = state.fields[name];
        if (!existing) return state;
        const fields = { ...state.fields, [name]: { ...existing, validation: { valid: true, errors: [], touched: existing.validation.touched } } };
        return { fields, ...summarize(fields) };
      },
      reset: () => ({ fields: initialFields, valid: true, submitting: false, submitted: false, data: {}, submitCount: 0, errorSummary: [], errorFields: [] }),
    },
    aliases: { resetForm: 'reset' },
    render: renderForm as (state: FormState) => string,
    aria: ariaOf,
  });
  return Object.assign(component, config.onSubmit ? { onSubmit: config.onSubmit } : {});
}
