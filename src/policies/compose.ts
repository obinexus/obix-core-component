import type { ComponentLogicWithAccessibility } from '../types/base.js';
import type { PolicyResult, PolicyViolation } from './violation.js';
import { PolicyViolationError } from './violation.js';
import { applyAccessibilityPolicy } from './accessibility.js';
import { applyTouchTargetPolicy } from './touch-target.js';
import { applyReducedMotionPolicy } from './reduced-motion.js';
import { applyFocusPolicy } from './focus.js';
import { applyLoadingPolicy } from './loading.js';

export function applyAllFudPolicies<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ComponentLogicWithAccessibility<S> {
  let result = logic;
  result = applyAccessibilityPolicy(result);
  result = applyTouchTargetPolicy(result);
  result = applyFocusPolicy(result);
  result = applyLoadingPolicy(result);
  result = applyReducedMotionPolicy(result);
  return result;
}

export function validateFudCompliance<S>(
  logic: ComponentLogicWithAccessibility<S>,
): PolicyResult {
  const violations: PolicyViolation[] = [];
  const policies = [
    applyAccessibilityPolicy,
    applyTouchTargetPolicy,
    applyFocusPolicy,
    applyLoadingPolicy,
    applyReducedMotionPolicy,
  ];

  let current = logic;
  for (const policy of policies) {
    try {
      current = policy(current);
    } catch (err) {
      if (err instanceof PolicyViolationError) {
        violations.push({
          policy: err.policy,
          message: err.message,
          severity: 'error',
        });
      }
    }
  }

  const valid = violations.length === 0;
  return { valid, compliant: valid, violations, warnings: [] };
}
