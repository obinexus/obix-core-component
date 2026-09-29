import type { ValidationState } from '../types/base.js';

/**
 * Text-field validation shared by Input and Textarea. Pure: the result depends only on the arguments.
 * Messages follow the documentation's examples ("Invalid email address").
 */
export interface TextRules {
  label: string;
  type?: string;
  required?: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string;
  /** Replaces every generated message (the documented `errorMessage`). */
  errorMessage?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The messages the rules produce for `value`; empty when the value is acceptable. */
export function textErrors(value: string, rules: TextRules): string[] {
  const errors: string[] = [];
  const say = (generated: string): string => rules.errorMessage || generated;
  if (rules.required && !value.trim()) errors.push(say(`${rules.label} is required.`));
  if (value) {
    if (rules.type === 'email' && !EMAIL.test(value)) errors.push(say('Invalid email address'));
    if (rules.type === 'url') {
      try {
        new URL(value);
      } catch {
        errors.push(say('Invalid URL'));
      }
    }
    if (rules.minLength != null && value.length < rules.minLength) errors.push(say(`${rules.label} must be at least ${rules.minLength} characters.`));
    if (rules.maxLength != null && value.length > rules.maxLength) errors.push(say(`${rules.label} must be at most ${rules.maxLength} characters.`));
    if (rules.pattern) {
      let matches = true;
      try {
        matches = new RegExp(`^(?:${rules.pattern})$`).test(value);
      } catch {
        matches = true; // an unusable pattern cannot reject input (the browser ignores it too)
      }
      if (!matches) errors.push(say(`${rules.label} is not in the expected format.`));
    }
  }
  return errors;
}

/** `ValidationState` for `value` (`touched` as given). */
export function validationFor(value: string, rules: TextRules, touched: boolean): ValidationState {
  const errors = textErrors(value, rules);
  return { valid: errors.length === 0, errors, touched };
}
