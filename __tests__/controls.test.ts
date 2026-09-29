import { describe, it, expect } from 'vitest';
import { createSlider, createSwitch } from '../src/controls/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixSlider', () => {
  it('has role=slider with aria-value attributes', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50 });
    expect(slider.aria.role).toBe('slider');
    expect(slider.aria['aria-valuenow']).toBe(50);
    expect(slider.aria['aria-valuemin']).toBe(0);
    expect(slider.aria['aria-valuemax']).toBe(100);
  });

  it('increment action increases value by step', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50, step: 5 });
    const next = slider.actions['increment']!(slider.state);
    expect(next.value).toBe(55);
  });

  it('decrement action decreases value by step', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50, step: 5 });
    const next = slider.actions['decrement']!(slider.state);
    expect(next.value).toBe(45);
  });

  it('home action sets value to min', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50 });
    const next = slider.actions['home']!(slider.state);
    expect(next.value).toBe(0);
  });

  it('end action sets value to max', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50 });
    const next = slider.actions['end']!(slider.state);
    expect(next.value).toBe(100);
  });

  it('setValue clamps to min/max', () => {
    const slider = createSlider({ label: 'Volume', min: 0, max: 100, value: 50 });
    const nextHigh = slider.actions['setValue']!(slider.state, 150);
    expect(nextHigh.value).toBe(100);
    const nextLow = slider.actions['setValue']!(slider.state, -10);
    expect(nextLow.value).toBe(0);
  });

  it('enforces the 48x48 OBIX touch target on the control', () => {
    const slider = createSlider({ label: 'Volume' });
    expect(slider.touchTarget?.minWidth).toBe(48);
    expect(slider.touchTarget?.minHeight).toBe(48);
  });

  it('renders a native range input (implicit role=slider: keyboard and pointer handled by the browser) with data-jfix-strategy', () => {
    const slider = createSlider({ label: 'Volume', value: 50 });
    const html = slider.render(slider.state);
    expect(slider.aria.role).toBe('slider');
    expect(html).toContain('type="range"');
    expect(html).toContain('value="50"');
    expect(html).toContain('data-jfix-strategy="transform-scale"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createSlider({ label: 'Volume' })).valid).toBe(true);
  });
});

describe('ObixSwitch', () => {
  it('has role=switch and aria-checked', () => {
    const sw = createSwitch({ label: 'Dark mode' });
    expect(sw.aria.role).toBe('switch');
    expect(sw.aria['aria-checked']).toBe(false);
  });

  it('toggle action flips checked', () => {
    const sw = createSwitch({ label: 'Dark mode' });
    const next = sw.actions['toggle']!(sw.state);
    expect(next.checked).toBe(true);
  });

  it('on action sets checked=true', () => {
    const sw = createSwitch({ label: 'Dark mode' });
    const next = sw.actions['on']!(sw.state);
    expect(next.checked).toBe(true);
  });

  it('off action sets checked=false', () => {
    const sw = createSwitch({ label: 'Dark mode', checked: true });
    const next = sw.actions['off']!(sw.state);
    expect(next.checked).toBe(false);
  });

  it('disabled switch cannot be toggled', () => {
    const sw = createSwitch({ label: 'Dark mode', disabled: true });
    const result = sw.actions['toggle']!(sw.state);
    // disabled toggle returns state unchanged
    expect(result.checked).toBe(sw.state.checked);
  });

  it('render includes role=switch and aria-checked', () => {
    const sw = createSwitch({ label: 'Dark mode', checked: true });
    const html = sw.render(sw.state);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createSwitch({ label: 'Dark mode' })).valid).toBe(true);
  });
});
