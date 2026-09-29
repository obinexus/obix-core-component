import type { JfixStrategy } from '../types/jfix.js';
import { JFIX_CLASS_MAP } from './tokens.js';

/**
 * Applies a jfix hover strategy to a DOM element by setting
 * the data-jfix-strategy attribute and corresponding CSS class.
 * The SCSS [data-jfix-strategy] attribute selectors handle the actual styles.
 */
export function jfixApplyStrategy(element: Element, strategy: JfixStrategy): void {
  element.setAttribute('data-jfix-strategy', strategy);

  // Remove all strategy classes first
  Object.values(JFIX_CLASS_MAP).forEach((cls) => element.classList.remove(cls));

  // Apply the matching class
  const cls = JFIX_CLASS_MAP[strategy];
  if (cls) {
    element.classList.add(cls);
  }
}

/**
 * Removes any jfix strategy from the element,
 * resetting it to the default CSS-defined hover behaviour.
 */
export function jfixRemoveStrategy(element: Element): void {
  element.removeAttribute('data-jfix-strategy');
  Object.values(JFIX_CLASS_MAP).forEach((cls) => element.classList.remove(cls));
}

/**
 * Returns the current jfix strategy applied to an element, or null if none.
 */
export function jfixGetStrategy(element: Element): JfixStrategy | null {
  const val = element.getAttribute('data-jfix-strategy');
  if (val === 'transform-scale' || val === 'box-shadow' || val === 'fixed-size') {
    return val;
  }
  return null;
}

/**
 * Checks the user's prefers-reduced-motion media query.
 * Returns true if motion should be reduced.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
