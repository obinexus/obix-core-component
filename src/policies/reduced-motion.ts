import type { ComponentLogicWithAccessibility } from '../types/base.js';
import { DEFAULT_REDUCED_MOTION } from '../types/base.js';

export function applyReducedMotionPolicy<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ComponentLogicWithAccessibility<S> {
  if (!logic.reducedMotionConfig) {
    return { ...logic, reducedMotionConfig: DEFAULT_REDUCED_MOTION };
  }
  return logic;
}
