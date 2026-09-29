import { describe, it, expect } from 'vitest';
import { createButton, createCard, createImage, createVideo } from '../src/primitives/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixButton', () => {
  it('creates with correct ARIA role', () => {
    const btn = createButton({ label: 'Save' });
    expect(btn.aria.role).toBe('button');
    expect(btn.aria['aria-label']).toBe('Save');
  });

  it('enforces the OBIX 48x48 touch target (design policy: stricter than WCAG 2.2 SC 2.5.8 AA 24px and SC 2.5.5 AAA 44px)', () => {
    const btn = createButton({ label: 'Save' });
    expect(btn.touchTarget?.minWidth).toBe(48);
    expect(btn.touchTarget?.minHeight).toBe(48);
    expect(btn.render(btn.state)).toContain('min-width:48px;min-height:48px');
  });

  it('loading state sets aria-busy', () => {
    const btn = createButton({ label: 'Save', loading: true });
    expect(btn.aria['aria-busy']).toBe(true);
  });

  it('disabled state sets aria-disabled', () => {
    const btn = createButton({ label: 'Save', disabled: true });
    expect(btn.aria['aria-disabled']).toBe(true);
  });

  it('toggle variant initialises pressed state', () => {
    const btn = createButton({ label: 'Toggle', toggle: true });
    expect(btn.state.pressed).toBe(false);
  });

  it('click action toggles pressed when toggle=true', () => {
    const btn = createButton({ label: 'Toggle', toggle: true });
    const next = btn.actions['click']!(btn.state);
    expect(next.pressed).toBe(true);
  });

  it('setLoading action enables loading and disables button', () => {
    const btn = createButton({ label: 'Save' });
    const next = btn.actions['setLoading']!(btn.state, true);
    expect(next.loading).toBe(true);
    expect(next.disabled).toBe(true);
  });

  it('jfixStrategy defaults to transform-scale', () => {
    const btn = createButton({ label: 'Save' });
    expect(btn.state.jfixStrategy).toBe('transform-scale');
  });

  it('render returns HTML string with data-jfix-strategy', () => {
    const btn = createButton({ label: 'Save' });
    const html = btn.render(btn.state);
    expect(html).toContain('data-jfix-strategy="transform-scale"');
    expect(html).toContain('Save');
  });

  it('passes validateFudCompliance', () => {
    const btn = createButton({ label: 'Save' });
    const result = validateFudCompliance(btn);
    expect(result.valid).toBe(true);
  });
});

describe('ObixCard', () => {
  it('creates with explicit dimensions', () => {
    const card = createCard({ title: 'My Card', width: 300, height: 200 });
    expect(card.state.width).toBe(300);
    expect(card.state.height).toBe(200);
  });

  it('startLoading action sets skeleton true', () => {
    const card = createCard({ title: 'Card', width: 300, height: 200 });
    const next = card.actions['startLoading']!(card.state);
    expect(next.skeleton).toBe(true);
    expect(next.loading).toBe(true);
  });

  it('render includes aria-busy when loading', () => {
    const card = createCard({ title: 'Card', width: 300, height: 200, loading: true });
    const html = card.render(card.state);
    expect(html).toContain('aria-busy="true"');
  });

  it('jfixStrategy defaults to box-shadow', () => {
    const card = createCard({ title: 'Card', width: 300, height: 200 });
    expect(card.state.jfixStrategy).toBe('box-shadow');
  });

  it('passes validateFudCompliance', () => {
    const card = createCard({ title: 'Card', width: 300, height: 200 });
    const result = validateFudCompliance(card);
    expect(result.valid).toBe(true);
  });
});

describe('ObixImage', () => {
  it('creates with alt text enforced as aria-label', () => {
    const img = createImage({ src: '/a.png', alt: 'A cat', width: 200, height: 150 });
    expect(img.aria['aria-label']).toBe('A cat');
    expect(img.aria.role).toBe('img');
  });

  it('setSrc action resets loaded state', () => {
    const img = createImage({ src: '/a.png', alt: 'Cat', width: 200, height: 150 });
    const next = img.actions['setSrc']!(img.state, '/b.png');
    expect(next.src).toBe('/b.png');
    expect(next.loaded).toBe(false);
  });

  it('passes validateFudCompliance', () => {
    const img = createImage({ src: '/a.png', alt: 'Cat', width: 200, height: 150 });
    const result = validateFudCompliance(img);
    expect(result.valid).toBe(true);
  });
});

describe('ObixVideo', () => {
  it('creates with captions enabled by default', () => {
    const video = createVideo({ src: '/v.mp4', label: 'Demo video' });
    expect(video.state.captionsEnabled).toBe(true);
  });

  it('toggleCaptions action flips captionsEnabled', () => {
    const video = createVideo({ src: '/v.mp4', label: 'Demo video' });
    const next = video.actions['toggleCaptions']!(video.state);
    expect(next.captionsEnabled).toBe(false);
  });

  it('render includes aria-label on region', () => {
    const video = createVideo({ src: '/v.mp4', label: 'Demo video' });
    const html = video.render(video.state);
    expect(html).toContain('aria-label="Demo video"');
    expect(html).toContain('role="region"');
  });

  it('passes validateFudCompliance', () => {
    const video = createVideo({ src: '/v.mp4', label: 'Demo video' });
    const result = validateFudCompliance(video);
    expect(result.valid).toBe(true);
  });
});
