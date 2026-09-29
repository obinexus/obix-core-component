import type { ComponentLogicWithAccessibility } from '../types/base.js';
import { DEFAULT_FOCUS_CONFIG } from '../types/base.js';
import { PolicyViolationError } from './violation.js';

const TRAP_FOCUS_ROLES = new Set(['dialog', 'alertdialog', 'menu', 'listbox']);

export function applyFocusPolicy<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ComponentLogicWithAccessibility<S> {
  if (!logic.focusConfig) {
    return { ...logic, focusConfig: DEFAULT_FOCUS_CONFIG };
  }

  const { trapFocus, focusVisible } = logic.focusConfig;
  const role = logic.aria.role ?? '';

  if (trapFocus && !TRAP_FOCUS_ROLES.has(role)) {
    throw new PolicyViolationError(
      'FocusPolicy',
      `Component "${logic.name}" sets trapFocus=true but role="${role}" does not warrant a focus trap. Use role: dialog, alertdialog, menu, or listbox.`,
    );
  }

  if (!focusVisible) {
    console.warn(
      `[OBIX FocusPolicy] Component "${logic.name}" has focusVisible=false. This may violate WCAG 2.4.11 Focus Appearance.`,
    );
  }

  return logic;
}
