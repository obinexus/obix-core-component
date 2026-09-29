import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type SliderOrientation = 'horizontal' | 'vertical';

export interface SliderState {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  label: string;
  ariaLabel: string;
  name: string;
  orientation: SliderOrientation;
  showValue: boolean;
  valueText: string | null;
  focused: boolean;
  sliderId: string;
}

export interface SliderConfig {
  label: string;
  name?: string;
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
  /** `orientation` is the implemented form, `vertical` the documented one. */
  orientation?: SliderOrientation;
  vertical?: boolean;
  showValue?: boolean;
  ariaLabel?: string;
  /** `valueText` is the implemented name, `ariaValueText` the documented one. */
  valueText?: string;
  ariaValueText?: string;
  id?: string;
}

const clamp = (v: number, min: number, max: number): number => Math.min(Math.max(Number.isFinite(v) ? v : min, min), max);

/** Snap to the step grid anchored at `min`, then clamp (a native range input does the same). */
function snap(value: number, min: number, max: number, step: number): number {
  const inRange = clamp(value, min, max);
  if (!(step > 0)) return inRange;
  let stepped = min + Math.round((inRange - min) / step) * step;
  if (stepped > max) stepped -= step; // the last grid point at or below max, as a native range input does
  const decimals = (String(step).split('.')[1] ?? '').length;
  return clamp(Number(stepped.toFixed(decimals)), min, max);
}

const ariaOf = (s: SliderState): AriaAttributes => ({
  role: 'slider',
  'aria-label': s.ariaLabel || s.label,
  'aria-valuenow': s.value,
  'aria-valuemin': s.min,
  'aria-valuemax': s.max,
  'aria-valuetext': s.valueText ?? undefined,
  'aria-orientation': s.orientation,
  'aria-disabled': s.disabled,
});

function renderSlider(s: SliderState): string {
  // A native range input carries the whole interaction for free: arrow keys, Page Up/Down, Home/End, touch and pointer dragging, and the
  // implicit role=slider with aria-valuenow/min/max. (The old div[role=slider] had no keyboard or pointer handling at all.)
  const input = `<input${attrs({
    type: 'range',
    id: s.sliderId,
    name: s.name || undefined,
    class: cx('obix-slider__input', s.orientation === 'vertical' && 'obix-slider__input--vertical'),
    min: String(s.min),
    max: String(s.max),
    step: String(s.step),
    value: String(s.value),
    disabled: s.disabled,
    'aria-label': s.ariaLabel || undefined,
    'aria-valuetext': s.valueText ?? undefined,
    'aria-orientation': s.orientation,
    'data-jfix-strategy': 'transform-scale',
    style: `--obix-slider-fill:${s.max === s.min ? 0 : ((s.value - s.min) / (s.max - s.min)) * 100}%`,
    'data-obix-on': 'input=setValue(@value); focus=focus; blur=blur',
  })}>`;
  return `<div class="${cx('obix-slider', s.orientation === 'vertical' && 'obix-slider--vertical')}"><label for="${esc(s.sliderId)}" class="obix-field__label">${esc(s.label)}</label>` +
    `${input}${s.showValue ? `<output class="obix-slider__value" for="${esc(s.sliderId)}" aria-hidden="true">${esc(s.valueText ?? String(s.value))}</output>` : ''}</div>`;
}

export function createSlider(config: SliderConfig): ObixComponent<SliderState> {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;
  return defineComponent<SliderState>({
    name: 'ObixSlider',
    state: {
      value: snap(config.value ?? min, min, max, step),
      min,
      max,
      step,
      disabled: config.disabled ?? false,
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      name: config.name ?? '',
      orientation: config.orientation ?? (config.vertical ? 'vertical' : 'horizontal'),
      showValue: config.showValue ?? true,
      valueText: config.ariaValueText ?? config.valueText ?? null,
      focused: false,
      sliderId: createId('obix-slider', config.id),
    },
    actions: {
      setValue: (state, value: unknown) => (state.disabled ? state : { value: snap(Number(value), state.min, state.max, state.step) }),
      increment: (state, amount?: unknown) => (state.disabled ? state : { value: snap(state.value + (amount === undefined ? state.step : Number(amount) || 0), state.min, state.max, state.step) }),
      decrement: (state, amount?: unknown) => (state.disabled ? state : { value: snap(state.value - (amount === undefined ? state.step : Number(amount) || 0), state.min, state.max, state.step) }),
      home: (state) => (state.disabled ? state : { value: state.min }),
      end: (state) => (state.disabled ? state : { value: snap(state.max, state.min, state.max, state.step) }),
      setValueText: (_state, text: unknown) => ({ valueText: String(text) }),
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false }),
    },
    render: renderSlider,
    aria: ariaOf,
  });
}
