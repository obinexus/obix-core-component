/** ObixLink (Part 2 "Link"): implemented from the documentation — no source had it. */
import { describe, it, expect } from 'vitest';
import { createLink } from '../src/index.js';

const anchor = (html: string): HTMLAnchorElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.querySelector('a') as HTMLAnchorElement;
};

describe('createLink', () => {
  it('renders a real <a href> with the label as its name', () => {
    const link = createLink({ href: '/docs', label: 'Documentation' });
    const a = anchor(link.render(link.state));
    expect(a.getAttribute('href')).toBe('/docs');
    expect(a.textContent).toBe('Documentation');
    expect(a.hasAttribute('aria-label')).toBe(false); // the visible text already names it: no redundant aria-label
    expect(link.aria.role).toBe('link');
  });

  it('marks absolute URLs external, announces it, and shows the icon as decoration only', () => {
    const link = createLink({ href: 'https://example.org/x', label: 'Example' });
    expect(link.state.external).toBe(true);
    const a = anchor(link.render(link.state));
    expect(a.getAttribute('aria-label')).toBe('Example (external link)');
    expect(a.querySelector('[aria-hidden="true"]')?.textContent).toBe('↗');
    expect(createLink({ href: '/local', label: 'x' }).state.external).toBe(false);
    expect(createLink({ href: '/local', label: 'x', external: true }).state.external).toBe(true);
  });

  it('a new-window link says so and never leaks window.opener (rel defaults to noopener noreferrer)', () => {
    const link = createLink({ href: '/x', label: 'Report', target: '_blank' });
    const a = anchor(link.render(link.state));
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a.getAttribute('aria-label')).toBe('Report (opens in new window)');
    expect(anchor(createLink({ href: '/x', label: 'r', target: '_blank', rel: 'nofollow' }).render(createLink({ href: '/x', label: 'r', target: '_blank', rel: 'nofollow' }).state)).getAttribute('rel')).toBe('nofollow');
  });

  it('a download link says so; an explicit ariaLabel wins over every derived name', () => {
    const dl = createLink({ href: '/a.pdf', label: 'Spec', download: 'spec.pdf' });
    const a = anchor(dl.render(dl.state));
    expect(a.getAttribute('download')).toBe('spec.pdf');
    expect(a.getAttribute('aria-label')).toBe('Spec (download)');
    const named = createLink({ href: 'https://e.org', label: 'x', ariaLabel: 'Go to the example site' });
    expect(anchor(named.render(named.state)).getAttribute('aria-label')).toBe('Go to the example site');
  });

  it('actions: navigate marks visited, setExternal, updateHref, setLabel — each returning the full state', () => {
    const link = createLink({ href: '/a', label: 'A' });
    expect(link.actions['navigate']!(link.state)).toMatchObject({ href: '/a', label: 'A', visited: true });
    expect(link.actions['setExternal']!(link.state, true).external).toBe(true);
    expect(link.actions['updateHref']!(link.state, '/b')).toMatchObject({ href: '/b', label: 'A' });
    expect(link.actions['setLabel']!(link.state, 'B')).toMatchObject({ href: '/a', label: 'B' });
    expect(anchor(link.render(link.actions['updateHref']!(link.state, '/b'))).getAttribute('href')).toBe('/b');
  });

  it('an unsafe href is rendered inert, not as a javascript: link', () => {
    const link = createLink({ href: 'javascript:alert(1)', label: 'x' });
    expect(anchor(link.render(link.state)).getAttribute('href')).toBe('#');
    expect(link.state.href).toBe('javascript:alert(1)'); // the state is data; only the rendering is filtered
  });

  it('the label is escaped', () => {
    const link = createLink({ href: '/x', label: '<img src=x onerror=1>' });
    expect(anchor(link.render(link.state)).querySelector('img')).toBeNull();
  });
});
