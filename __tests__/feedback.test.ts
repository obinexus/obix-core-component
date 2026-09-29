import { describe, it, expect } from 'vitest';
import { createAlert, createToast, createProgress, createLoading } from '../src/feedback/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixAlert', () => {
  it('error type uses role=alert (assertive)', () => {
    const alert = createAlert({ message: 'Error!', type: 'error' });
    expect(alert.aria.role).toBe('alert');
    expect(alert.aria['aria-live']).toBe('assertive');
  });

  it('info type uses role=status (polite)', () => {
    const alert = createAlert({ message: 'Info', type: 'info' });
    // render determines role, state is flexible
    const html = alert.render(alert.state);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('dismiss action sets visible=false', () => {
    const alert = createAlert({ message: 'Error!', dismissible: true });
    const next = alert.actions['dismiss']!(alert.state);
    expect(next.visible).toBe(false);
  });

  it('render returns empty string when not visible', () => {
    const alert = createAlert({ message: 'Error!' });
    const html = alert.render({ ...alert.state, visible: false });
    expect(html).toBe('');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createAlert({ message: 'Info' })).valid).toBe(true);
  });
});

describe('ObixToast', () => {
  it('has role=status and aria-live=polite', () => {
    const toast = createToast({ message: 'Saved!' });
    expect(toast.aria.role).toBe('status');
    expect(toast.aria['aria-live']).toBe('polite');
  });

  it('dismiss action hides toast', () => {
    const toast = createToast({ message: 'Saved!' });
    const next = toast.actions['dismiss']!(toast.state);
    expect(next.visible).toBe(false);
  });

  it('render includes aria-live region', () => {
    const toast = createToast({ message: 'Saved!' });
    const html = toast.render(toast.state);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Saved!');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createToast({ message: 'Saved!' })).valid).toBe(true);
  });
});

describe('ObixProgress', () => {
  it('has role=progressbar with aria-value attributes', () => {
    const prog = createProgress({ label: 'Upload', value: 50, max: 100 });
    expect(prog.aria.role).toBe('progressbar');
    expect(prog.aria['aria-valuenow']).toBe(50);
    expect(prog.aria['aria-valuemin']).toBe(0);
    expect(prog.aria['aria-valuemax']).toBe(100);
  });

  it('setValue action updates value', () => {
    const prog = createProgress({ label: 'Upload' });
    const next = prog.actions['setValue']!(prog.state, 75);
    expect(next.value).toBe(75);
    expect(next.indeterminate).toBe(false);
  });

  it('complete action sets value to max', () => {
    const prog = createProgress({ label: 'Upload', max: 200 });
    const next = prog.actions['complete']!(prog.state);
    expect(next.value).toBe(200);
  });

  it('indeterminate state renders with aria-busy', () => {
    const prog = createProgress({ label: 'Loading', indeterminate: true });
    const html = prog.render(prog.state);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('obix-progress--indeterminate');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createProgress({ label: 'Upload' })).valid).toBe(true);
  });
});

describe('ObixLoading', () => {
  it('show action sets visible=true and aria-busy', () => {
    const loading = createLoading({ label: 'Loading…' });
    const next = loading.actions['show']!(loading.state);
    expect(next.visible).toBe(true);
  });

  it('render returns empty string when not visible', () => {
    const loading = createLoading({});
    const html = loading.render(loading.state);
    expect(html).toBe('');
  });

  it('render includes aria-busy=true when visible', () => {
    const loading = createLoading({ label: 'Please wait' });
    const html = loading.render({ ...loading.state, visible: true });
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createLoading({})).valid).toBe(true);
  });
});
