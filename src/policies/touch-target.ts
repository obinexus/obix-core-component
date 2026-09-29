import type { ComponentLogicWithAccessibility } from '../types/base.js';
import { DEFAULT_TOUCH_TARGET, OBIX_MIN_TARGET_PX } from '../types/base.js';
import { PolicyViolationError } from './violation.js';

const NON_INTERACTIVE_ROLES = new Set(['img', 'figure', 'region', 'article', 'main', 'complementary', 'contentinfo', 'banner', 'navigation', 'none', 'presentation', 'separator', 'status', 'alert', 'log', 'marquee', 'timer', 'tooltip', 'caption', 'table', 'row', 'cell', 'columnheader', 'rowheader', 'grid', 'gridcell', 'rowgroup', 'group', 'list', 'listitem', 'definition', 'term', 'note', 'progressbar']);

export function applyTouchTargetPolicy<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ComponentLogicWithAccessibility<S> {
  const role = logic.aria.role ?? '';

  if (NON_INTERACTIVE_ROLES.has(role)) {
    return logic;
  }

  if (!logic.touchTarget) {
    return { ...logic, touchTarget: DEFAULT_TOUCH_TARGET };
  }

  const { minWidth, minHeight } = logic.touchTarget;
  if (minWidth < OBIX_MIN_TARGET_PX || minHeight < OBIX_MIN_TARGET_PX) {
    throw new PolicyViolationError(
      'TouchTargetPolicy',
      `Component "${logic.name}" touch target ${minWidth}x${minHeight}px is below the OBIX design policy of ${OBIX_MIN_TARGET_PX}x${OBIX_MIN_TARGET_PX}px (WCAG 2.2 SC 2.5.8 AA asks for 24x24px, SC 2.5.5 AAA for 44x44px).`,
    );
  }

  return logic;
}
