import type { ComponentLogicWithAccessibility } from '../types/base.js';

/**
 * Paradigm types supported by the ObixAdapter.
 * Maps to the DOPAdapter paradigm enum from obix-binding-adapter.
 */
export type ObixParadigm = 'functional' | 'oop' | 'reactive' | 'data';

export interface FunctionalComponent<S> {
  getState: () => S;
  dispatch: (action: string, ...args: unknown[]) => void;
  render: () => string;
}

export interface OOPComponent<S> {
  state: S;
  [key: string]: unknown;
  render(): string;
}

export interface ReactiveComponent<S> {
  subscribe: (listener: (state: S) => void) => () => void;
  dispatch: (action: string, ...args: unknown[]) => void;
  render: () => string;
}

/**
 * Converts a ComponentLogicWithAccessibility to a functional paradigm.
 * State is held in a closure; actions return new state.
 */
export function toFunctional<S>(
  logic: ComponentLogicWithAccessibility<S>,
): FunctionalComponent<S> {
  let currentState = { ...logic.state };

  return {
    getState: () => ({ ...currentState }),
    dispatch: (action: string, ...args: unknown[]) => {
      const actionFn = logic.actions[action];
      if (!actionFn) return;
      const patch = actionFn(currentState, ...args);
      currentState = { ...currentState, ...patch };
    },
    render: () => logic.render(currentState),
  };
}

/**
 * Converts a ComponentLogicWithAccessibility to an OOP paradigm.
 * Returns a plain object with bound methods acting as "class instance".
 */
export function toOOP<S>(
  logic: ComponentLogicWithAccessibility<S>,
): OOPComponent<S> {
  const instance: OOPComponent<S> = {
    state: { ...logic.state },
    render() {
      return logic.render(this.state as S);
    },
  };

  for (const [name, actionFn] of Object.entries(logic.actions)) {
    instance[name] = (...args: unknown[]) => {
      const patch = actionFn(instance.state as S, ...args);
      instance.state = { ...instance.state as object, ...patch } as S;
    };
  }

  return instance;
}

/**
 * Converts a ComponentLogicWithAccessibility to a reactive paradigm.
 * Returns an object with subscribe/dispatch similar to a minimal observable store.
 */
export function toReactive<S>(
  logic: ComponentLogicWithAccessibility<S>,
): ReactiveComponent<S> {
  let currentState = { ...logic.state };
  const listeners = new Set<(state: S) => void>();

  return {
    subscribe: (listener: (state: S) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch: (action: string, ...args: unknown[]) => {
      const actionFn = logic.actions[action];
      if (!actionFn) return;
      const patch = actionFn(currentState, ...args);
      currentState = { ...currentState, ...patch };
      listeners.forEach((l) => l({ ...currentState }));
    },
    render: () => logic.render(currentState),
  };
}

/**
 * createObixAdapter — factory that wraps a ComponentLogicWithAccessibility
 * and exposes all four paradigm transforms.
 */
export function createObixAdapter<S>(logic: ComponentLogicWithAccessibility<S>) {
  return {
    toFunctional: () => toFunctional(logic),
    toOOP: () => toOOP(logic),
    toReactive: () => toReactive(logic),
    toData: () => ({ ...logic }),
  };
}
