import type { ComponentLogicWithAccessibility } from '../types/base.js';
import { PolicyViolationError } from './violation.js';

const ROLES_REQUIRING_LABEL = new Set([
  'button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'switch',
  'textbox', 'combobox', 'listbox', 'dialog', 'alertdialog', 'search',
  'slider', 'spinbutton', 'progressbar', 'tab', 'tabpanel',
]);

export function applyAccessibilityPolicy<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ComponentLogicWithAccessibility<S> {
  const { aria } = logic;

  if (!aria.role) {
    throw new PolicyViolationError(
      'AccessibilityPolicy',
      `Component "${logic.name}" must have an ARIA role defined.`,
    );
  }

  const needsLabel = ROLES_REQUIRING_LABEL.has(aria.role);
  if (needsLabel && !aria['aria-label'] && !aria['aria-labelledby']) {
    throw new PolicyViolationError(
      'AccessibilityPolicy',
      `Component "${logic.name}" with role="${aria.role}" requires aria-label or aria-labelledby.`,
    );
  }

  return logic;
}
