import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface StepItem {
  id: string;
  label: string;
  description?: string;
  /** HTML shown while this step is the current one. */
  content?: string;
  /** Initially completed. */
  completed?: boolean;
  /** Initial error message for this step. */
  error?: string;
}

export interface StepperState {
  steps: StepItem[];
  currentStep: number;
  completedSteps: number[];
  /** Error message per step index. */
  stepErrors: Record<number, string>;
  /** Completed steps can be revisited (default true). */
  clickableCompleted: boolean;
  /** Steps must be completed in order: only the current, completed and the next-after-completed steps can be entered. */
  linearFlow: boolean;
  label: string;
}

export interface StepperConfig {
  /** `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  steps: StepItem[];
  /** `currentStep` is the implemented name, `current` the documented one (a step index). */
  currentStep?: number;
  current?: number;
  clickableCompleted?: boolean;
  linearFlow?: boolean;
}

const ariaOf = (s: StepperState): AriaAttributes => ({ role: 'navigation', 'aria-label': s.label });

/** May the user move from the current step to `index`? Back: when completed steps are clickable. Forward: freely, or — with `linearFlow` — only over completed steps. */
function canEnter(s: StepperState, index: number): boolean {
  if (index < 0 || index >= s.steps.length || index === s.currentStep) return false;
  if (index < s.currentStep) return s.clickableCompleted;
  if (!s.linearFlow) return true;
  for (let j = s.currentStep; j < index; j++) if (!s.completedSteps.includes(j)) return false;
  return true;
}

function renderStepper(s: StepperState): string {
  const items = s.steps.map((step, i) => {
    const current = i === s.currentStep;
    const done = s.completedSteps.includes(i);
    const error = s.stepErrors[i];
    const enterable = canEnter(s, i);
    const indicator = `<span class="obix-stepper__step-indicator" aria-hidden="true">${error ? '!' : done ? '✓' : i + 1}</span>`;
    const text = `<span class="obix-stepper__step-label">${esc(step.label)}</span>${step.description ? `<span class="obix-stepper__step-desc">${esc(step.description)}</span>` : ''}`;
    const status = `<span class="obix-visually-hidden">${error ? ', error' : done ? ', completed' : current ? ', current step' : ''}</span>`;
    const inner = enterable
      ? `<button${attrs({ type: 'button', class: 'obix-stepper__step-button', 'data-step': String(i), 'data-obix-on': 'click=goToStep(@attr:data-step)' })}>${indicator}${text}${status}</button>`
      : `${indicator}${text}${status}`;
    return `<li${attrs({ class: cx('obix-stepper__step', current && 'obix-stepper__step--current', done && 'obix-stepper__step--completed', error && 'obix-stepper__step--error'), 'data-jfix-strategy': 'fixed-size', 'aria-current': current ? 'step' : undefined, 'data-obix-key': `step-${esc(step.id)}` })}>${inner}` +
      `${error ? `<span class="obix-stepper__error" role="alert">${esc(error)}</span>` : ''}</li>`;
  }).join('');
  const content = s.steps[s.currentStep]?.content;
  return `<nav aria-label="${esc(s.label)}" class="obix-stepper"><ol class="obix-stepper__list">${items}</ol>` +
    `<progress class="obix-stepper__progress" max="${s.steps.length}" value="${s.currentStep + 1}" aria-label="Step ${s.currentStep + 1} of ${s.steps.length}"></progress>` +
    `${content ? `<div class="obix-stepper__content" aria-live="polite">${content}</div>` : ''}</nav>`;
}

export function createStepper(config: StepperConfig): ObixComponent<StepperState> {
  const completedSteps = config.steps.flatMap((step, i) => (step.completed ? [i] : []));
  const stepErrors: Record<number, string> = {};
  config.steps.forEach((step, i) => { if (step.error) stepErrors[i] = step.error; });
  return defineComponent<StepperState>({
    name: 'ObixStepper',
    state: {
      steps: config.steps,
      currentStep: Math.min(Math.max(0, config.current ?? config.currentStep ?? 0), Math.max(0, config.steps.length - 1)),
      completedSteps,
      stepErrors,
      clickableCompleted: config.clickableCompleted ?? true,
      linearFlow: config.linearFlow ?? false,
      label: config.ariaLabel ?? config.label ?? 'Progress',
    },
    actions: {
      nextStep: (state) => {
        if (state.currentStep >= state.steps.length - 1) return state;
        return { currentStep: state.currentStep + 1, completedSteps: [...new Set([...state.completedSteps, state.currentStep])] };
      },
      prevStep: (state) => (state.currentStep > 0 ? { currentStep: state.currentStep - 1 } : state),
      goToStep: (state, step: unknown) => {
        const index = Number(step);
        return Number.isInteger(index) && canEnter(state, index) ? { currentStep: index } : state;
      },
      completeStep: (state, step: unknown) => {
        const index = Number(step);
        return index >= 0 && index < state.steps.length ? { completedSteps: [...new Set([...state.completedSteps, index])], stepErrors: omit(state.stepErrors, index) } : state;
      },
      setError: (state, step: unknown, error: unknown) => {
        const index = Number(step);
        if (!(index >= 0 && index < state.steps.length)) return state;
        return error ? { stepErrors: { ...state.stepErrors, [index]: String(error) }, completedSteps: state.completedSteps.filter((i) => i !== index) } : { stepErrors: omit(state.stepErrors, index) };
      },
    },
    aliases: { markCompleted: 'completeStep' },
    render: renderStepper,
    aria: ariaOf,
  });
}

function omit(record: Record<number, string>, key: number): Record<number, string> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}
