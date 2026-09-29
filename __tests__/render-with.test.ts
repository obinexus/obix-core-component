import { describe, expect, it } from 'vitest';
import { createAlert, createButton, createCard, renderWith } from '../src/index.js';

describe('renderWith — the one-call render helper behind the renderX names of the per-component packages', () => {
  it('renders the initial state of the component built from the configuration', () => {
    const renderButton = renderWith(createButton);
    const button = createButton({ label: 'Save' });
    expect(renderButton({ label: 'Save' })).toBe(button.render(button.state));
  });

  it('applies state overrides on top of the initial state (and does not touch the component)', () => {
    const renderButton = renderWith(createButton);
    const button = createButton({ label: 'Save' });
    const loading = renderButton({ label: 'Save' }, { loading: true });
    expect(loading).toBe(button.render({ ...button.state, loading: true }));
    expect(loading).not.toBe(renderButton({ label: 'Save' }));
    expect(loading).toMatch(/aria-busy="true"/);
  });

  it('a configuration is optional for components whose every field is optional (renderCard())', () => {
    const renderCard = renderWith(createCard);
    const card = createCard({});
    expect(renderCard()).toBe(card.render(card.state));
  });

  it('works for every factory alike (alert): the helper adds no behaviour of its own', () => {
    const renderAlert = renderWith(createAlert);
    const alert = createAlert({ message: 'Saved' });
    expect(renderAlert({ message: 'Saved' })).toBe(alert.render(alert.state));
  });
});
