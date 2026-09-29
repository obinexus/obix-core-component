/**
 * defineComponent — the one place a component object is assembled.
 *
 * What it guarantees for every component built with it (the recovered contract; docs Part 1 "Data-oriented model"):
 *  - **Actions are `(state, ...args) ⇒ nextState`**: whatever an action returns (a full state, a partial delta, or nothing) is merged into
 *    the state it was given, so a call always yields the FULL next state. Upstream returned partial deltas, which corrupted the state in any
 *    caller that trusted the documented signature (baseline P8). An action that changes nothing returns the very same state object, so callers
 *    can detect "nothing happened" with `===`.
 *  - **Actions never mutate their input**; the result is a new object.
 *  - **Policies hold at every transition, not only at creation**: `aria` is DERIVED from state (`ariaOf(state)`), and after every action the
 *    FUD policies are re-run on the next state. An action that would leave the component inaccessible (e.g. clear the only accessible name)
 *    throws `PolicyViolationError` and the previous state stays valid. The `aria` property is the initial snapshot; `ariaOf` is the live view.
 *  - **Documented action names** that differ from the implemented ones are aliases declared next to the implementation (`aliases`).
 */
import type { AriaAttributes, ComponentLogicWithAccessibility, FocusConfig, LoadingState, ReducedMotionConfig, TouchTarget } from '../types/base.js';
import { DEFAULT_FOCUS_CONFIG, DEFAULT_REDUCED_MOTION, DEFAULT_TOUCH_TARGET } from '../types/base.js';
import { applyAllFudPolicies } from '../policies/compose.js';

type ActionResult<S> = Partial<S> | S | void;
type Action<S> = (state: S, ...args: any[]) => ActionResult<S>;

export interface ComponentSpec<S extends object> {
  name: string;
  state: S;
  actions: Record<string, Action<S>>;
  /** Documented action name → implemented action name, or a function implementing it. */
  aliases?: Record<string, string | Action<S>>;
  render: (state: S) => string;
  /** The ARIA attributes of the component in `state`. Also what the markup renders. */
  aria: (state: S) => AriaAttributes;
  touchTarget?: TouchTarget;
  focusConfig?: FocusConfig;
  reducedMotionConfig?: ReducedMotionConfig;
  /** Static, or derived from the state so the LoadingPolicy is re-checked at every transition. */
  loadingState?: LoadingState | ((state: S) => LoadingState | undefined);
}

/** The component object returned by every factory: the documented `{ name, state, actions, render, aria }` plus `ariaOf`. */
// `actions` are typed as what they are — `(state, ...args) => next state` (Part 2) — not the `Partial<S>` of the runtime's delta contract, which a full state satisfies:
// `const pressed: ButtonState = button.actions.toggle(button.state)` type-checks, and the component is still accepted wherever a ComponentLogicWithAccessibility is.
export type ObixComponent<S extends object> = Omit<ComponentLogicWithAccessibility<S>, 'actions'> & {
  actions: Record<string, (state: S, ...args: unknown[]) => S>;
  ariaOf: (state: S) => AriaAttributes;
};

function sameState<S extends object>(a: S, b: S): boolean {
  if (a === b) return true;
  const ka = Object.keys(a);
  if (ka.length !== Object.keys(b).length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

export function defineComponent<S extends object>(spec: ComponentSpec<S>): ObixComponent<S> {
  const touchTarget = spec.touchTarget ?? DEFAULT_TOUCH_TARGET;
  const focusConfig = spec.focusConfig ?? DEFAULT_FOCUS_CONFIG;
  const reducedMotionConfig = spec.reducedMotionConfig ?? DEFAULT_REDUCED_MOTION;

  const loadingFor = (state: S): { loadingState?: LoadingState } => {
    const loading = typeof spec.loadingState === 'function' ? spec.loadingState(state) : spec.loadingState;
    return loading ? { loadingState: loading } : {};
  };

  const snapshot = (state: S): ComponentLogicWithAccessibility<S> => ({
    name: spec.name,
    state,
    actions: {},
    render: spec.render,
    aria: spec.aria(state),
    touchTarget,
    focusConfig,
    reducedMotionConfig,
    ...loadingFor(state)
  });

  const all: Record<string, Action<S>> = { ...spec.actions };
  for (const [documented, target] of Object.entries(spec.aliases ?? {})) {
    if (all[documented]) continue; // a real action of that name wins
    const fn = typeof target === 'string' ? spec.actions[target] : target;
    if (!fn) throw new Error(`${spec.name}: alias "${documented}" points at unknown action "${String(target)}"`);
    all[documented] = fn;
  }

  const actions: Record<string, (state: S, ...args: unknown[]) => S> = {};
  for (const [actionName, action] of Object.entries(all)) {
    actions[actionName] = (state: S, ...args: unknown[]): S => {
      const result = action(state, ...args);
      const next = result === undefined || result === null ? state : ({ ...state, ...(result as object) } as S);
      if (sameState(state, next)) return state;
      applyAllFudPolicies(snapshot(next)); // throws PolicyViolationError: the transition is refused, `state` stays valid
      return next;
    };
  }

  const logic: ObixComponent<S> = {
    name: spec.name,
    state: spec.state,
    actions,
    render: spec.render,
    aria: spec.aria(spec.state),
    ariaOf: spec.aria,
    touchTarget,
    focusConfig,
    reducedMotionConfig,
    ...loadingFor(spec.state)
  };
  // Creation-time check (throws PolicyViolationError, exactly as the factories always did) and normalisation of defaults.
  const checked = applyAllFudPolicies(logic);
  return { ...checked, ariaOf: spec.aria } as ObixComponent<S>;
}
