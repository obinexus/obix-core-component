import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface ProgressState {
  value: number;
  min: number;
  max: number;
  /** Unknown total. (`determinate` is the documented, inverted, name.) */
  indeterminate: boolean;
  showLabel: boolean;
  size: 'sm' | 'md' | 'lg';
  color: 'primary' | 'success' | 'warning' | 'danger';
  /** Accessible name. */
  label: string;
  valueText: string | null;
}

export interface ProgressConfig {
  /** `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  value?: number;
  min?: number;
  max?: number;
  indeterminate?: boolean;
  determinate?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  /** `valueText` is the implemented name, `ariaValueText` the documented one. */
  valueText?: string;
  ariaValueText?: string;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, Number.isFinite(v) ? v : min));
const percent = (s: ProgressState): number => (s.max === s.min ? 0 : ((s.value - s.min) / (s.max - s.min)) * 100);

const ariaOf = (s: ProgressState): AriaAttributes => ({
  role: 'progressbar',
  'aria-label': s.label,
  'aria-valuemin': s.min,
  'aria-valuemax': s.max,
  // an indeterminate bar has NO value: a missing aria-valuenow is what tells assistive technology "unknown"
  'aria-valuenow': s.indeterminate ? undefined : s.value,
  'aria-valuetext': s.valueText ?? undefined,
  'aria-busy': s.indeterminate ? true : undefined,
});

function renderProgress(s: ProgressState): string {
  const pct = Math.round(percent(s) * 10) / 10;
  const open = attrs({
    class: cx('obix-progress', `obix-progress--${s.size}`, `obix-progress--${s.color}`, s.indeterminate && 'obix-progress--indeterminate'),
    role: 'progressbar',
    'aria-valuemin': String(s.min),
    'aria-valuemax': String(s.max),
    'aria-valuenow': s.indeterminate ? undefined : String(s.value),
    'aria-valuetext': s.valueText ?? undefined,
    'aria-label': s.label,
    'aria-busy': s.indeterminate ? 'true' : undefined,
  });
  const bar = `<div${open}><div class="${cx('obix-progress__fill', s.indeterminate && 'obix-progress-bar--animated')}"${s.indeterminate ? '' : ` style="width:${pct}%"`}></div></div>`;
  // The visible percentage sits BESIDE the bar, not on it: text laid over a partly filled bar is unreadable against one of its two
  // backgrounds (axe measured 3.57:1). It is redundant with aria-valuenow, so it is hidden from assistive technology.
  return s.showLabel && !s.indeterminate
    ? `<div class="obix-progress-wrapper">${bar}<span class="obix-progress-label" aria-hidden="true">${esc(String(Math.round(pct)))}%</span></div>`
    : bar;
}

export function createProgress(config: ProgressConfig): ObixComponent<ProgressState> {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  return defineComponent<ProgressState>({
    name: 'ObixProgress',
    state: {
      value: clamp(config.value ?? min, min, max),
      min,
      max,
      indeterminate: config.indeterminate ?? (config.determinate === undefined ? false : !config.determinate),
      showLabel: config.showLabel ?? true,
      size: config.size ?? 'md',
      color: config.color ?? 'primary',
      label: config.ariaLabel ?? config.label ?? 'Progress',
      valueText: config.ariaValueText ?? config.valueText ?? null,
    },
    actions: {
      setValue: (state, value: unknown) => ({ value: clamp(Number(value), state.min, state.max), indeterminate: false }),
      increment: (state, amount?: unknown) => ({ value: clamp(state.value + (amount === undefined ? 1 : Number(amount) || 0), state.min, state.max), indeterminate: false }),
      setIndeterminate: (_state, indeterminate: unknown) => ({ indeterminate: Boolean(indeterminate) }),
      complete: (state) => ({ value: state.max, indeterminate: false }),
      reset: (state) => ({ value: state.min }),
      setValueText: (_state, text: unknown) => ({ valueText: String(text) }),
    },
    render: renderProgress,
    aria: ariaOf,
  });
}
