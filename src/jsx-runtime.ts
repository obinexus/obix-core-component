/**
 * OBIX JSX Runtime — Heart/Soul UI/UX SDK
 *
 * Provides a hyperscript-style JSX factory for the OBIX data-oriented
 * component system. Components are NOT virtual DOM nodes; they are
 * ComponentLogicWithAccessibility objects that carry state, actions,
 * render functions, and ARIA attributes.
 *
 * Usage (tsconfig.json):
 *   "jsx": "react",
 *   "jsxFactory": "h",
 *   "jsxFragmentFactory": "Fragment"
 *
 * Usage (tsx file):
 *   /** @jsxRuntime classic * /
 *   /** @jsx h * /
 *   /** @jsxFrag Fragment * /
 *   import { h, Fragment } from 'obix-core-component/jsx-runtime';
 *   import { createButton } from 'obix-core-component';
 *
 *   const btn = <createButton label="Save" variant="primary" />;
 *   document.body.innerHTML = btn.render(btn.state);
 */

import type { ComponentLogicWithAccessibility } from './types/base.js';

// ── Types ────────────────────────────────────────────────────────────────────

/** A factory function that produces an OBIX component from a config object */
export type ObixFactory<S extends object> = (
  config: S
) => ComponentLogicWithAccessibility<S>;

/** The rendered OBIX element — same as ComponentLogicWithAccessibility */
export type ObixElement<S extends object = object> = ComponentLogicWithAccessibility<S>;

/** Props accepted by the OBIX JSX transform */
export type ObixProps<S extends object> = S & {
  children?: (ObixElement<object> | string)[];
};

// ── Fragment sentinel ────────────────────────────────────────────────────────

/**
 * Fragment sentinel — used for <></> or <Fragment> grouping.
 * OBIX fragments return an array of rendered HTML strings joined together.
 */
export const Fragment = Symbol.for('ObixFragment');

// ── h (hyperscript) ──────────────────────────────────────────────────────────

/**
 * OBIX hyperscript factory — the JSX transform target.
 *
 * Maps JSX syntax to OBIX factory function calls:
 *   <createButton label="Save" />
 *   → h(createButton, { label: "Save" })
 *   → createButton({ label: "Save" })   // with FUD policies applied
 */
export function h<S extends object>(
  factory: ObixFactory<S> | typeof Fragment,
  props: ObixProps<S> | null,
  ...children: (ObixElement<object> | string)[]
): ObixElement<S> | ObixElement<object>[] {
  // Fragment: return children array directly
  if (factory === Fragment) {
    return children.flat() as ObixElement<object>[];
  }

  const normalizedProps: ObixProps<S> = {
    ...(props ?? ({} as S)),
    ...(children.length > 0 ? { children } : {}),
  };

  // Remove JSX internal keys that don't belong in component configs
  const { children: _children, ...componentProps } = normalizedProps as Record<string, unknown>;
  void _children;

  return (factory as ObixFactory<S>)(componentProps as S);
}

// Aliases for automatic JSX transform compatibility
export { h as jsx, h as jsxs };
