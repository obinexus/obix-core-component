import type { JfixStrategy } from './jfix.js';

export interface AriaAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-busy'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-pressed'?: boolean | 'mixed';
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-modal'?: boolean;
  'aria-required'?: boolean;
  'aria-readonly'?: boolean;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-owns'?: string;
  'aria-activedescendant'?: string;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-multiselectable'?: boolean;
  'aria-multiline'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-atomic'?: boolean;
  'aria-relevant'?: string;
}

export interface TouchTarget {
  minWidth: number;
  minHeight: number;
  padding: number;
}

export interface FocusConfig {
  trapFocus: boolean;
  restoreFocus: boolean;
  focusVisible: boolean;
}

export interface LoadingState {
  loading: boolean;
  skeleton: boolean;
  interactive: boolean;
}

export interface ReducedMotionConfig {
  respectPreference: boolean;
  fallback: 'none' | 'fade' | 'instant';
}

export interface ValidationState {
  valid: boolean;
  errors: string[];
  touched: boolean;
}

export interface DimensionConfig {
  width: string | number;
  height: string | number;
}

export interface ComponentLogicWithAccessibility<S> {
  name: string;
  state: S;
  actions: Record<string, (state: S, ...args: unknown[]) => Partial<S>>;
  render: (state: S) => string;
  aria: AriaAttributes;
  /** The ARIA attributes for a given state (what `render` emits). `aria` is the snapshot for the initial state; this is the live view. */
  ariaOf?: (state: S) => AriaAttributes;
  touchTarget?: TouchTarget;
  focusConfig?: FocusConfig;
  loadingState?: LoadingState;
  reducedMotionConfig?: ReducedMotionConfig;
  jfixStrategy?: JfixStrategy;
}

/**
 * The name the Gen-2 SDK and the umbrella barrel used for "a component definition the FUD policies accept". The recovered components are
 * exactly that: `{ name, state, actions, render, aria, touchTarget, focusConfig, loadingState, reducedMotionConfig }`.
 */
export type BaseComponentDef<S = Record<string, unknown>> = ComponentLogicWithAccessibility<S>;

/**
 * OBIX design policy: interactive targets are at least 48 x 48 CSS px. This is stricter than the standards it is often confused with:
 * WCAG 2.2 SC 2.5.8 Target Size (Minimum), level AA, asks for 24 x 24 px; WCAG 2.1 SC 2.5.5 Target Size, level AAA, asks for 44 x 44 px.
 * (The upstream documentation and error text attributed 48 px / 44 px to "WCAG 2.1 AA"; both are wrong.)
 */
export const OBIX_MIN_TARGET_PX = 48;

export const DEFAULT_TOUCH_TARGET: TouchTarget = {
  minWidth: OBIX_MIN_TARGET_PX,
  minHeight: OBIX_MIN_TARGET_PX,
  padding: 8,
};

export const DEFAULT_FOCUS_CONFIG: FocusConfig = {
  trapFocus: false,
  restoreFocus: true,
  focusVisible: true,
};

export const DEFAULT_REDUCED_MOTION: ReducedMotionConfig = {
  respectPreference: true,
  fallback: 'instant',
};
