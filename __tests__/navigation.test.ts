import { describe, it, expect } from 'vitest';
import {
  createNavigation, createBreadcrumb, createPagination, createTabs, createStepper,
} from '../src/navigation/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

const navItems = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'about', label: 'About', href: '/about' },
];

describe('ObixNavigation', () => {
  it('has role=navigation and aria-label', () => {
    const nav = createNavigation({ label: 'Main', items: navItems });
    expect(nav.aria.role).toBe('navigation');
    expect(nav.aria['aria-label']).toBe('Main');
  });

  it('setActive action updates activeId', () => {
    const nav = createNavigation({ label: 'Main', items: navItems });
    const next = nav.actions['setActive']!(nav.state, 'about');
    expect(next.activeId).toBe('about');
  });

  it('render includes skip link', () => {
    const nav = createNavigation({ label: 'Main', items: navItems });
    const html = nav.render(nav.state);
    expect(html).toContain('skip-link');
  });

  // KD-01 (docs/recovery/known-defects.md), resolved by decision: upstream asserted that a navigation WITHOUT `activeId` marks a
  // current page. Part 2 documents an item-level `current`, not a default, and claiming a page is current when nothing says so is
  // false information for a screen reader. Only `activeId` or an item's `current` produce aria-current.
  it('has no current page unless one is given (activeId or an item-level `current`)', () => {
    const nav = createNavigation({ label: 'Main', items: navItems });
    expect(nav.render(nav.state)).not.toContain('aria-current');
    const marked = createNavigation({ label: 'Main', items: [{ ...navItems[0]!, current: true }, ...navItems.slice(1)] });
    expect(marked.render(marked.state).match(/aria-current="page"/g)).toHaveLength(1);
  });

  it('active item gets aria-current=page', () => {
    const nav = createNavigation({ label: 'Main', items: navItems, activeId: 'home' });
    const html = nav.render(nav.state);
    expect(html).toContain('aria-current="page"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createNavigation({ label: 'Main', items: navItems })).valid).toBe(true);
  });
});

describe('ObixBreadcrumb', () => {
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'API', href: '/docs/api' }];

  it('last crumb gets aria-current=page', () => {
    const bc = createBreadcrumb({ crumbs });
    const html = bc.render(bc.state);
    expect(html).toContain('aria-current="page"');
  });

  it('nav has aria-label=Breadcrumb', () => {
    const bc = createBreadcrumb({ crumbs });
    const html = bc.render(bc.state);
    expect(html).toContain('aria-label="Breadcrumb"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createBreadcrumb({ crumbs })).valid).toBe(true);
  });
});

describe('ObixPagination', () => {
  it('goToPage action updates currentPage', () => {
    const pg = createPagination({ totalPages: 5 });
    const next = pg.actions['goToPage']!(pg.state, 3);
    expect(next.currentPage).toBe(3);
  });

  it('next action increments page', () => {
    const pg = createPagination({ totalPages: 5, currentPage: 2 });
    const next = pg.actions['next']!(pg.state);
    expect(next.currentPage).toBe(3);
  });

  it('prev action does not go below 1', () => {
    const pg = createPagination({ totalPages: 5, currentPage: 1 });
    const next = pg.actions['prev']!(pg.state);
    expect(next.currentPage).toBe(1);
  });

  it('active page button gets aria-current=page in render', () => {
    const pg = createPagination({ totalPages: 3, currentPage: 2 });
    const html = pg.render(pg.state);
    expect(html).toContain('aria-current="page"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createPagination({ totalPages: 5 })).valid).toBe(true);
  });
});

describe('ObixTabs', () => {
  const tabs = [{ id: 'tab1', label: 'Tab 1', content: 'Content 1' }, { id: 'tab2', label: 'Tab 2', content: 'Content 2' }];

  it('selectTab action updates activeId', () => {
    const t = createTabs({ label: 'My Tabs', tabs });
    const next = t.actions['selectTab']!(t.state, 'tab2');
    expect(next.activeId).toBe('tab2');
  });

  it('render includes role=tablist and role=tab', () => {
    const t = createTabs({ label: 'My Tabs', tabs });
    const html = t.render(t.state);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('role="tabpanel"');
  });

  it('active tab has aria-selected=true', () => {
    const t = createTabs({ label: 'My Tabs', tabs, activeId: 'tab1' });
    const html = t.render(t.state);
    expect(html).toContain('aria-selected="true"');
  });

  it('navigateNext wraps around', () => {
    const t = createTabs({ label: 'My Tabs', tabs, activeId: 'tab2' });
    const next = t.actions['navigateNext']!(t.state);
    expect(next.activeId).toBe('tab1');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createTabs({ label: 'My Tabs', tabs })).valid).toBe(true);
  });
});

describe('ObixStepper', () => {
  const steps = [{ id: 's1', label: 'Step 1' }, { id: 's2', label: 'Step 2' }, { id: 's3', label: 'Step 3' }];

  it('nextStep increments currentStep', () => {
    const st = createStepper({ label: 'Wizard', steps });
    const next = st.actions['nextStep']!(st.state);
    expect(next.currentStep).toBe(1);
  });

  it('nextStep adds current to completedSteps', () => {
    const st = createStepper({ label: 'Wizard', steps });
    const next = st.actions['nextStep']!(st.state);
    expect(next.completedSteps).toContain(0);
  });

  it('current step gets aria-current=step', () => {
    const st = createStepper({ label: 'Wizard', steps, currentStep: 0 });
    const html = st.render(st.state);
    expect(html).toContain('aria-current="step"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createStepper({ label: 'Wizard', steps })).valid).toBe(true);
  });
});
