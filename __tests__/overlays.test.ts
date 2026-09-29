import { describe, it, expect } from 'vitest';
import { createModal, createDropdown, createTooltip } from '../src/overlays/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixModal', () => {
  it('has role=dialog and aria-modal', () => {
    const modal = createModal({ title: 'Confirm' });
    expect(modal.aria.role).toBe('dialog');
    expect(modal.aria['aria-modal']).toBe(true);
  });

  it('focus trap is enabled', () => {
    const modal = createModal({ title: 'Confirm' });
    expect(modal.focusConfig?.trapFocus).toBe(true);
    expect(modal.focusConfig?.restoreFocus).toBe(true);
  });

  it('open action sets open=true', () => {
    const modal = createModal({ title: 'Confirm' });
    const next = modal.actions['open']!(modal.state);
    expect(next.open).toBe(true);
  });

  it('close action sets open=false', () => {
    const modal = createModal({ title: 'Confirm' });
    const open = { ...modal.state, open: true };
    const next = modal.actions['close']!(open);
    expect(next.open).toBe(false);
  });

  it('render returns empty string when closed', () => {
    const modal = createModal({ title: 'Confirm' });
    expect(modal.render(modal.state)).toBe('');
  });

  it('render includes role=dialog when open', () => {
    const modal = createModal({ title: 'Confirm' });
    const html = modal.render({ ...modal.state, open: true });
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createModal({ title: 'Confirm' })).valid).toBe(true);
  });
});

describe('ObixDropdown (jfix showcase)', () => {
  const items = [{ id: 'a', label: 'Option A' }, { id: 'b', label: 'Option B' }];

  it('has aria-haspopup=listbox on trigger', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    expect(dd.aria['aria-haspopup']).toBe('listbox');
  });

  it('defaults jfixStrategy to transform-scale', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    expect(dd.state.jfixStrategy).toBe('transform-scale');
  });

  it('render includes data-jfix-strategy attribute', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const html = dd.render(dd.state);
    expect(html).toContain('data-jfix-strategy="transform-scale"');
  });

  it('open action sets open=true and activeIndex=0', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const next = dd.actions['open']!(dd.state);
    expect(next.open).toBe(true);
    expect(next.activeIndex).toBe(0);
  });

  it('close action restores activeIndex=-1', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const opened = { ...dd.state, open: true, activeIndex: 1 };
    const next = dd.actions['close']!(opened);
    expect(next.open).toBe(false);
    expect(next.activeIndex).toBe(-1);
  });

  it('setJfixStrategy action switches strategy', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const next = dd.actions['setJfixStrategy']!(dd.state, 'box-shadow');
    expect(next.jfixStrategy).toBe('box-shadow');
  });

  it('selectItem action closes and sets selectedId', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const next = dd.actions['selectItem']!({ ...dd.state, open: true }, 0);
    expect(next.selectedId).toBe('a');
    expect(next.open).toBe(false);
  });

  it('render includes aria-haspopup on trigger button', () => {
    const dd = createDropdown({ trigger: 'Menu', items });
    const html = dd.render(dd.state);
    expect(html).toContain('aria-haspopup="listbox"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createDropdown({ trigger: 'Menu', items })).valid).toBe(true);
  });
});

describe('ObixTooltip', () => {
  it('has role=tooltip', () => {
    const tt = createTooltip({ content: 'Helpful tip', triggerId: 'btn-1' });
    expect(tt.aria.role).toBe('tooltip');
  });

  it('show/hide actions toggle visible', () => {
    const tt = createTooltip({ content: 'Tip', triggerId: 'btn' });
    const shown = tt.actions['show']!(tt.state);
    expect(shown.visible).toBe(true);
    const hidden = tt.actions['hide']!({ ...tt.state, visible: true });
    expect(hidden.visible).toBe(false);
  });

  it('render includes data-jfix-strategy=box-shadow', () => {
    const tt = createTooltip({ content: 'Tip', triggerId: 'btn' });
    const html = tt.render({ ...tt.state, visible: true });
    expect(html).toContain('data-jfix-strategy="box-shadow"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createTooltip({ content: 'Tip', triggerId: 'btn' })).valid).toBe(true);
  });
});
