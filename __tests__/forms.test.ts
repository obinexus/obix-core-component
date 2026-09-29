import { describe, it, expect } from 'vitest';
import {
  createInput, createCheckbox, createRadioGroup, createSelect,
  createTextarea, createForm, createDatePicker, createFileUpload,
} from '../src/forms/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixInput', () => {
  it('has aria-label and role=textbox', () => {
    const input = createInput({ label: 'Email', type: 'email' });
    expect(input.aria.role).toBe('textbox');
    expect(input.aria['aria-label']).toBe('Email');
  });

  it('blur action triggers validation and sets touched', () => {
    const input = createInput({ label: 'Email', type: 'email', required: true });
    const afterBlur = input.actions['blur']!(input.state);
    expect(afterBlur.validation?.touched).toBe(true);
    expect(afterBlur.validation?.valid).toBe(false);
  });

  it('change action sets value', () => {
    const input = createInput({ label: 'Name' });
    const next = input.actions['change']!(input.state, 'Alice');
    expect(next.value).toBe('Alice');
  });

  it('clear action resets value and validation', () => {
    const input = createInput({ label: 'Name' });
    const next = input.actions['clear']!(input.state);
    expect(next.value).toBe('');
    expect(next.validation?.touched).toBe(false);
  });

  it('render includes autocomplete attribute', () => {
    const input = createInput({ label: 'Email', type: 'email', autocomplete: 'email' });
    const html = input.render(input.state);
    expect(html).toContain('autocomplete="email"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createInput({ label: 'Name' })).valid).toBe(true);
  });
});

describe('ObixCheckbox', () => {
  it('has role=checkbox and aria-checked', () => {
    const cb = createCheckbox({ label: 'Accept terms' });
    expect(cb.aria.role).toBe('checkbox');
    expect(cb.aria['aria-checked']).toBe(false);
  });

  it('toggle action flips checked', () => {
    const cb = createCheckbox({ label: 'Accept' });
    const next = cb.actions['toggle']!(cb.state);
    expect(next.checked).toBe(true);
  });

  it('setIndeterminate action sets mixed state', () => {
    const cb = createCheckbox({ label: 'Accept' });
    const next = cb.actions['setIndeterminate']!(cb.state);
    expect(next.checked).toBe('mixed');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createCheckbox({ label: 'Accept' })).valid).toBe(true);
  });
});

describe('ObixRadioGroup', () => {
  const opts = [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }];

  it('has role=radiogroup', () => {
    const rg = createRadioGroup({ groupLabel: 'Options', options: opts });
    expect(rg.aria.role).toBe('radiogroup');
  });

  it('select action sets selectedValue', () => {
    const rg = createRadioGroup({ groupLabel: 'Options', options: opts });
    const next = rg.actions['select']!(rg.state, 'b');
    expect(next.selectedValue).toBe('b');
  });

  it('navigateNext cycles through options', () => {
    const rg = createRadioGroup({ groupLabel: 'Options', options: opts, selectedValue: 'a' });
    const next = rg.actions['navigateNext']!(rg.state);
    expect(next.selectedValue).toBe('b');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createRadioGroup({ groupLabel: 'Options', options: opts })).valid).toBe(true);
  });
});

describe('ObixSelect', () => {
  const opts = [{ label: 'One', value: '1' }, { label: 'Two', value: '2' }];

  it('selectOption action updates selectedValues', () => {
    const sel = createSelect({ label: 'Choose', options: opts });
    const next = sel.actions['selectOption']!(sel.state, '1');
    expect(next.selectedValues).toContain('1');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createSelect({ label: 'Choose', options: opts })).valid).toBe(true);
  });
});

describe('ObixTextarea', () => {
  it('has aria-multiline=true', () => {
    const ta = createTextarea({ label: 'Comment' });
    expect(ta.aria['aria-multiline']).toBe(true);
  });

  it('character counter rendered when maxLength set', () => {
    const ta = createTextarea({ label: 'Bio', maxLength: 100 });
    const html = ta.render(ta.state);
    expect(html).toContain('100 characters remaining');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createTextarea({ label: 'Comment' })).valid).toBe(true);
  });
});

describe('ObixForm', () => {
  it('has role=form and aria-label', () => {
    const form = createForm({ label: 'Contact form' });
    expect(form.aria.role).toBe('form');
    expect(form.aria['aria-label']).toBe('Contact form');
  });

  it('submit action sets submitting=true', () => {
    const form = createForm({ label: 'Form' });
    const next = form.actions['submit']!(form.state);
    expect(next.submitting).toBe(true);
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createForm({ label: 'Form' })).valid).toBe(true);
  });
});

describe('ObixDatePicker', () => {
  it('open action sets open=true', () => {
    const dp = createDatePicker({ label: 'Birthday' });
    const next = dp.actions['open']!(dp.state);
    expect(next.open).toBe(true);
  });

  it('selectDate action sets value and closes', () => {
    const dp = createDatePicker({ label: 'Birthday' });
    const next = dp.actions['selectDate']!(dp.state, '2024-01-01');
    expect(next.value).toBe('2024-01-01');
    expect(next.open).toBe(false);
  });

  it('render includes native date input fallback', () => {
    const dp = createDatePicker({ label: 'Birthday' });
    const html = dp.render(dp.state);
    expect(html).toContain('type="date"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createDatePicker({ label: 'Birthday' })).valid).toBe(true);
  });
});

describe('ObixFileUpload', () => {
  it('has role=button and aria-label', () => {
    const fu = createFileUpload({ label: 'Upload files' });
    expect(fu.aria.role).toBe('button');
    expect(fu.aria['aria-label']).toBe('Upload files');
  });

  it('setDragging action updates dragging state', () => {
    const fu = createFileUpload({ label: 'Upload' });
    const next = fu.actions['setDragging']!(fu.state, true);
    expect(next.dragging).toBe(true);
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createFileUpload({ label: 'Upload files' })).valid).toBe(true);
  });
});
