// CSS custom property token name constants for type-safe token references.
// These mirror the SCSS variables in jfix.scss for use in TypeScript components.

export const TOKENS = {
  // Focus
  FOCUS_RING_COLOR: '--obix-focus-ring-color',
  FOCUS_RING_WIDTH: '--obix-focus-ring-width',

  // Touch target
  MIN_TOUCH: '--obix-min-touch',

  // Button
  BUTTON_BG: '--obix-button-bg',
  BUTTON_HOVER_BG: '--obix-button-hover-bg',
  BUTTON_TEXT: '--obix-button-text',

  // Card
  CARD_BG: '--obix-card-bg',
  CARD_BORDER: '--obix-card-border',

  // Input
  INPUT_BG: '--obix-input-bg',
  INPUT_BORDER: '--obix-input-border',
  INPUT_FOCUS_BORDER: '--obix-input-focus-border',
  INPUT_ERROR_BORDER: '--obix-input-error-border',

  // Dropdown
  DROPDOWN_BG: '--obix-dropdown-bg',
  DROPDOWN_HOVER_BG: '--obix-dropdown-hover-bg',

  // Navigation
  NAV_BG: '--obix-nav-bg',
  NAV_HOVER_BG: '--obix-nav-hover-bg',
  NAV_ACTIVE_BG: '--obix-nav-active-bg',
  NAV_ACTIVE_TEXT: '--obix-nav-active-text',
} as const;

export type TokenName = typeof TOKENS[keyof typeof TOKENS];

// Jfix strategy class names for programmatic class application
export const JFIX_CLASS_MAP = {
  'transform-scale': 'jfix-transform-scale',
  'box-shadow': 'jfix-box-shadow-hover',
  'fixed-size': 'jfix-fixed-size',
} as const;
