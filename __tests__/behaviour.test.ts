/** Behaviour that the reconciled (documented) API adds beyond the contract matrix: what each component actually does with its actions. */
import { describe, it, expect } from 'vitest';
import * as lib from '../src/index.js';

const host = (html: string): HTMLElement => {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
};

describe('Table', () => {
  const cfg = { caption: 'People', columns: [{ id: 'name', label: 'Name', sortable: true }, { id: 'age', label: 'Age', sortable: true }, { id: 'city', label: 'City' }], rows: [{ name: 'Cleo', age: 31, city: 'Lagos' }, { name: 'Ada', age: 36, city: 'Enugu' }, { name: 'Bo', age: 9, city: 'Abuja' }] };
  const order = (html: string): string[] => Array.from(host(html).querySelectorAll('tbody tr')).map((tr) => tr.querySelector('td')!.textContent!);

  it('renders rows in the given order until a sort is chosen, then sorts a copy (the rows in state are untouched)', () => {
    const t = lib.createTable(cfg);
    expect(order(t.render(t.state))).toEqual(['Cleo', 'Ada', 'Bo']);
    const byName = t.actions['sortBy']!(t.state, 'name');
    expect(order(t.render(byName))).toEqual(['Ada', 'Bo', 'Cleo']);
    expect(byName.rows).toBe(t.state.rows);
    expect(byName.rows.map((r: any) => r.name)).toEqual(['Cleo', 'Ada', 'Bo']);
  });

  it('sorts numbers numerically (9 before 31), reverses on the second choice, and toggleSort cycles asc → desc → unsorted', () => {
    const t = lib.createTable(cfg);
    const asc = t.actions['sortBy']!(t.state, 'age');
    expect(order(t.render(asc))).toEqual(['Bo', 'Cleo', 'Ada']);
    const desc = t.actions['sortBy']!(asc, 'age');
    expect(order(t.render(desc))).toEqual(['Ada', 'Cleo', 'Bo']);
    const a = t.actions['toggleSort']!(t.state, 'age');
    const d = t.actions['toggleSort']!(a, 'age');
    const none = t.actions['toggleSort']!(d, 'age');
    expect([a.sortDirection, d.sortDirection, none.sortDirection]).toEqual(['ascending', 'descending', 'none']);
    expect(order(t.render(none))).toEqual(['Cleo', 'Ada', 'Bo']);
  });

  it('marks only the sorted column with aria-sort and gives every sortable header a keyboard-operable button', () => {
    const t = lib.createTable(cfg);
    const html = t.render(t.actions['sortBy']!(t.state, 'name'));
    const dom = host(html);
    const sorted = Array.from(dom.querySelectorAll('th[aria-sort]')).map((th) => [th.querySelector('button')!.getAttribute('data-col'), th.getAttribute('aria-sort')]);
    expect(sorted).toEqual([['name', 'ascending'], ['age', 'none']]);
    expect(dom.querySelectorAll('th button').length).toBe(2);
    expect(dom.querySelector('th:not([aria-sort]) button')).toBeNull();
    expect(dom.querySelector('caption')!.textContent).toBe('People');
  });

  it('accepts the documented `headers: [{ key, label }]` form and gives the scroll region a name and a tab stop', () => {
    const t = lib.createTable({ caption: 'Docs', headers: [{ key: 'a', label: 'A' }], rows: [{ a: 1 }] });
    expect(t.state.columns[0]!.id).toBe('a');
    const region = host(t.render(t.state)).querySelector('[role="region"]')!;
    expect(region.getAttribute('tabindex')).toBe('0');
    expect(region.getAttribute('aria-label')).toBe('Docs');
  });

  it('escapes cell text', () => {
    const t = lib.createTable({ caption: 'x', columns: [{ id: 'a', label: 'A' }], rows: [{ a: '<b>bold</b>' }] });
    expect(host(t.render(t.state)).querySelector('td')!.textContent).toBe('<b>bold</b>');
  });
});

describe('Accordion', () => {
  const items = [{ id: 'a', heading: 'A', content: '<p>alpha</p>' }, { id: 'b', heading: 'B', content: '<p>beta</p>' }];

  it('single-open by default: opening one closes the other; the documented expand/collapse aliases behave like open/close', () => {
    const acc = lib.createAccordion({ label: 'FAQ', items });
    let s = acc.actions['expand']!(acc.state, 'a');
    s = acc.actions['expand']!(s, 'b');
    expect(s.openIds).toEqual(['b']);
    expect(acc.actions['collapse']!(s, 'b').openIds).toEqual([]);
    expect(acc.actions['toggle']!(acc.state, 'nope')).toBe(acc.state);
  });

  it('allowMultiple opens several; expandAll / collapseAll', () => {
    const acc = lib.createAccordion({ label: 'FAQ', items, allowMultiple: true });
    expect(acc.actions['expandAll']!(acc.state).openIds).toEqual(['a', 'b']);
    expect(acc.actions['collapseAll']!(acc.actions['expandAll']!(acc.state)).openIds).toEqual([]);
  });

  it('only an open panel has content and is visible; each trigger controls its own panel', () => {
    const acc = lib.createAccordion({ label: 'FAQ', items, defaultOpenIds: ['a'] });
    const dom = host(acc.render(acc.state));
    const triggers = Array.from(dom.querySelectorAll('button'));
    expect(triggers.map((b) => b.getAttribute('aria-expanded'))).toEqual(['true', 'false']);
    for (const b of triggers) expect(dom.querySelector(`#${CSS.escape(b.getAttribute('aria-controls')!)}`)).not.toBeNull();
    expect(dom.querySelectorAll('[role="region"]:not([hidden])').length).toBe(1);
    expect(dom.textContent).toContain('alpha');
    expect(dom.textContent).not.toContain('beta');
  });
});

describe('Slider and Switch', () => {
  it('Slider snaps to the step grid anchored at min and clamps; a disabled slider ignores actions', () => {
    const s = lib.createSlider({ label: 'v', min: 5, max: 50, step: 10, value: 12 });
    expect(s.state.value).toBe(15);
    expect(s.actions['setValue']!(s.state, 1000).value).toBe(45);
    expect(s.actions['setValue']!(s.state, -3).value).toBe(5);
    expect(s.actions['increment']!(s.state).value).toBe(25);
    expect(s.actions['decrement']!(s.state, 10).value).toBe(5);
    expect(s.actions['end']!(s.state).value).toBe(45);
    const d = lib.createSlider({ label: 'v', disabled: true });
    expect(d.actions['increment']!(d.state)).toBe(d.state);
  });

  it('Slider accepts the documented vertical / ariaValueText spellings', () => {
    const s = lib.createSlider({ label: 'v', vertical: true, ariaValueText: 'half' });
    expect(s.state.orientation).toBe('vertical');
    expect(host(s.render(s.state)).querySelector('input')!.getAttribute('aria-valuetext')).toBe('half');
  });

  it('Switch is a labelled <button role=switch> whose aria-checked follows the state', () => {
    const w = lib.createSwitch({ label: 'Sound' });
    const off = host(w.render(w.state)).querySelector('button')!;
    expect(off.getAttribute('role')).toBe('switch');
    expect(off.getAttribute('aria-checked')).toBe('false');
    const on = host(w.render(w.actions['toggle']!(w.state))).querySelector('button')!;
    expect(on.getAttribute('aria-checked')).toBe('true');
    expect(host(w.render(w.state)).querySelector('label')!.getAttribute('for')).toBe(off.id);
  });
});

describe('Search', () => {
  it('always renders the results status region (so announcements have a live region to land in) and words counts correctly', () => {
    const s = lib.createSearch({ label: 'Find' });
    const status = (state: any): string => host(s.render(state)).querySelector('[role="status"]')!.textContent!;
    expect(status(s.state)).toBe('');
    expect(status({ ...s.state, resultsCount: 0 })).toBe('No results found');
    expect(status({ ...s.state, resultsCount: 1 })).toBe('1 result found');
    expect(status({ ...s.state, resultsCount: 3 })).toBe('3 results found');
  });

  it('submit needs a query, records it, and typing again clears the old announcement; the documented setValue is an alias of setQuery', () => {
    const s = lib.createSearch({ label: 'Find', onSearch: () => undefined });
    expect(s.actions['submit']!(s.state)).toBe(s.state);
    const typed = s.actions['setValue']!(s.state, 'obix');
    const submitted = s.actions['submit']!(typed);
    expect(submitted).toMatchObject({ loading: true, submittedQuery: 'obix', resultsCount: null });
    const done = s.actions['setResults']!(submitted, 4);
    expect(done).toMatchObject({ loading: false, resultsCount: 4 });
    expect(s.actions['setValue']!(done, 'obix2').resultsCount).toBeNull();
    expect(typeof s.onSearch).toBe('function');
  });

  it('clear button only while there is text (and the field can be edited); Escape clears; the submit button is opt-in', () => {
    const s = lib.createSearch({ label: 'Find' });
    expect(host(s.render(s.state)).querySelector('.obix-search__clear')).toBeNull();
    const typed = { ...s.state, query: 'abc' };
    const dom = host(s.render(typed));
    expect(dom.querySelector('.obix-search__clear')!.getAttribute('aria-label')).toBe('Clear search');
    expect(dom.querySelector('input')!.getAttribute('data-obix-on')).toContain('keydown:Escape=clear');
    expect(dom.querySelector('button[type="submit"]')).toBeNull();
    const withSubmit = lib.createSearch({ label: 'Find', submitButton: true });
    expect(host(withSubmit.render({ ...withSubmit.state, query: 'abc' })).querySelector('button[type="submit"]')).not.toBeNull();
    const noClear = lib.createSearch({ label: 'Find', clearButton: false });
    expect(host(noClear.render({ ...noClear.state, query: 'abc' })).querySelector('.obix-search__clear')).toBeNull();
  });
});

describe('Autocomplete', () => {
  const suggestions = [{ label: 'United States', value: 'us' }, { label: 'United Kingdom', value: 'gb' }, { label: 'Canada', value: 'ca' }, { label: 'Australia', value: 'au' }, { label: 'Ukraine', value: 'ua' }];
  const ac = (extra = {}) => lib.createAutocomplete({ label: 'Country', suggestions, ...extra });
  const labels = (c: any, state: any): string[] => Array.from(host(c.render(state)).querySelectorAll('[role="option"]')).map((o) => o.textContent!);

  it('filters by the query: prefix matches first, then other matches, case-insensitively', () => {
    const c = ac();
    expect(lib.visibleSuggestions({ ...c.state, query: 'un' }).map((o) => o.label)).toEqual(['United States', 'United Kingdom']);
    expect(lib.visibleSuggestions({ ...c.state, query: 'AN' }).map((o) => o.label)).toEqual(['Canada']);
    expect(lib.visibleSuggestions({ ...c.state, query: 'u' }).map((o) => o.label)).toEqual(['United States', 'United Kingdom', 'Ukraine', 'Australia']);
    expect(lib.visibleSuggestions({ ...c.state, query: 'zzz' })).toEqual([]);
  });

  it('honours minChars and maxSuggestions; filter:false shows the list as given', () => {
    const c = ac({ minChars: 3, maxSuggestions: 1 });
    expect(lib.visibleSuggestions({ ...c.state, query: 'un' })).toEqual([]);
    expect(lib.visibleSuggestions({ ...c.state, query: 'uni' }).length).toBe(1);
    const server = ac({ filter: false });
    expect(lib.visibleSuggestions({ ...server.state, query: 'zzz' }).length).toBe(5);
  });

  it('accepts strings or { label, value }; selecting stores the value and shows the label', () => {
    const c = lib.createAutocomplete({ label: 'City', suggestions: ['Lagos', 'London'] });
    const typed = c.actions['setQuery']!(c.state, 'lo');
    expect(labels(c, typed)).toEqual(['London']);
    expect(c.actions['select']!(typed, 0)).toMatchObject({ selectedValue: 'London', query: 'London', open: false });
    const d = ac();
    const picked = d.actions['select']!(d.actions['setQuery']!(d.state, 'un'), 1);
    expect(picked).toMatchObject({ selectedValue: 'gb', query: 'United Kingdom' });
  });

  it('keyboard: Down opens a closed menu, moves through the options without wrapping; Enter is bound only while an option is active (so Enter still submits a form)', () => {
    const c = ac();
    const typed = c.actions['setQuery']!(c.state, 'un');
    const closed = c.actions['close']!(typed);
    const opened = c.actions['navigateNext']!(closed);
    expect(opened).toMatchObject({ open: true, activeIndex: 0 });
    expect(c.actions['navigateNext']!(c.actions['navigateNext']!(opened))).toMatchObject({ activeIndex: 1 });
    expect(c.actions['navigatePrev']!(opened).activeIndex).toBe(0);
    const inputOn = (state: any): string => host(c.render(state)).querySelector('input')!.getAttribute('data-obix-on')!;
    expect(inputOn(typed)).not.toContain('Enter');
    expect(inputOn(opened)).toContain('keydown:Enter=selectActive!');
    const dom = host(c.render(opened));
    const input = dom.querySelector('input')!;
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-activedescendant')).toBe(dom.querySelector('[role="option"]')!.id);
    expect(dom.querySelector('[role="option"]')!.getAttribute('aria-selected')).toBe('true');
  });

  it('the listbox exists (hidden) when closed so aria-controls always resolves; the status region announces the count', () => {
    const c = ac();
    const dom = host(c.render(c.state));
    const input = dom.querySelector('input')!;
    expect(input.getAttribute('aria-expanded')).toBe('false');
    const list = dom.querySelector(`#${CSS.escape(input.getAttribute('aria-controls')!)}`)!;
    expect(list.hasAttribute('hidden')).toBe(true);
    expect(list.hasAttribute('data-obix-keep-focus')).toBe(true);
    const typed = c.actions['setQuery']!(c.state, 'un');
    expect(host(c.render(typed)).querySelector('[role="status"]')!.textContent).toBe('2 suggestions available');
    expect(host(c.render(c.actions['setQuery']!(c.state, 'zzz'))).querySelector('[role="status"]')!.textContent).toBe('No suggestions');
  });

  it('documented action names (selectSuggestion, nextSuggestion, prevSuggestion, openMenu, closeMenu, setValue) are aliases of the implemented ones', () => {
    const c = ac();
    for (const a of ['selectSuggestion', 'nextSuggestion', 'prevSuggestion', 'openMenu', 'closeMenu', 'setValue', 'focusSuggestion']) expect(typeof c.actions[a]).toBe('function');
  });
});

describe('Navigation, Tabs and the rest of the family follow the documented state model', () => {
  it('Navigation: only an explicit current page gets aria-current; submenu toggles are buttons wired to the state', () => {
    const nav = lib.createNavigation({ label: 'Main', items: [{ label: 'A', href: '/a', submenu: [{ label: 'A1', href: '/a1' }] }, { label: 'B', href: '/b' }] });
    expect(nav.render(nav.state)).not.toContain('aria-current');
    const dom = host(nav.render(nav.actions['openSubmenu']!(nav.state, 0)));
    const toggle = dom.querySelector('[aria-haspopup]')!;
    expect(toggle.tagName).toBe('BUTTON');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('Tabs: exactly one tab is in the tab order (roving tabindex) and panels are labelled by their tab', () => {
    const tabs = lib.createTabs({ label: 'T', tabs: [{ id: 'a', label: 'A', content: 'a' }, { id: 'b', label: 'B', content: 'b' }] });
    const dom = host(tabs.render(tabs.actions['selectTab']!(tabs.state, 'b')));
    expect(Array.from(dom.querySelectorAll('[role="tab"]')).map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0']);
    const panel = dom.querySelector('[role="tabpanel"]:not([hidden])')!;
    expect(dom.querySelector(`#${CSS.escape(panel.getAttribute('aria-labelledby')!)}`)!.textContent).toBe('B');
  });

  it('Toast: the auto-dismiss timer is declared in the markup and pauses with the state', () => {
    const toast = lib.createToast({ message: 'Saved', duration: 4000 });
    const shown = toast.actions['show']!(toast.state);
    expect(host(toast.render(shown)).querySelector('[data-obix-after]')!.getAttribute('data-obix-after')).toBe('hide:4000');
    const paused = toast.actions['pause']!(shown);
    expect(host(toast.render(paused)).querySelector('[data-obix-after-paused]')).not.toBeNull();
    const forever = lib.createToast({ message: 'Stay', duration: 0 });
    expect(host(forever.render(forever.actions['show']!(forever.state))).querySelector('[data-obix-after]')).toBeNull();
  });

  it('Alert: role follows the type (assertive for errors), dismissing empties the render and asks for focus to return', () => {
    const alert = lib.createAlert({ message: 'Oops', type: 'error', dismissible: true, returnFocusId: 'retry' });
    const dom = host(alert.render(alert.state));
    expect(dom.querySelector('[role="alert"]')).not.toBeNull();
    expect(dom.querySelector('[data-obix-then-focus]')!.getAttribute('data-obix-then-focus')).toBe('#retry');
    expect(alert.render(alert.actions['dismiss']!(alert.state))).toBe('');
  });

  it('Pagination: current page is aria-current and first/prev are disabled on page 1', () => {
    const p = lib.createPagination({ totalPages: 5, currentPage: 1 });
    const dom = host(p.render(p.state));
    expect(dom.querySelectorAll('[aria-current="page"]').length).toBe(1);
    expect(p.actions['prevPage']!(p.state)).toBe(p.state);
    expect(p.actions['goToPage']!(p.state, 99)).toBe(p.state); // out of range: ignored
    expect(p.actions['goToPage']!(p.state, 3).currentPage).toBe(3);
  });
});

describe('Tooltip delays (KD-10 resolved: the timers are declared in the markup and run by the driver)', () => {
  it('show / hide stay immediate; requestShow / requestHide honour delay and closeDelay and cancel each other', () => {
    const tip = lib.createTooltip({ content: 'Help', triggerText: '?', delay: 300, closeDelay: 500 });
    expect(tip.actions['show']!(tip.state)).toMatchObject({ visible: true, pending: null });
    expect(tip.actions['hide']!({ ...tip.state, visible: true })).toMatchObject({ visible: false, pending: null });

    const waiting = tip.actions['requestShow']!(tip.state);
    expect(waiting).toMatchObject({ visible: false, pending: 'show' });
    expect(host(tip.render(waiting)).querySelector('.obix-tooltip')!.getAttribute('data-obix-after')).toBe('reveal:300');
    expect(tip.actions['reveal']!(waiting)).toMatchObject({ visible: true, pending: null });
    expect(tip.actions['requestHide']!(waiting)).toMatchObject({ visible: false, pending: null }); // left before the delay elapsed: never shown

    const shown = { ...tip.state, visible: true };
    const closing = tip.actions['requestHide']!(shown);
    expect(closing).toMatchObject({ visible: true, pending: 'hide' });
    expect(host(tip.render(closing)).querySelector('.obix-tooltip')!.getAttribute('data-obix-after')).toBe('conceal:500');
    expect(tip.actions['requestShow']!(closing)).toMatchObject({ visible: true, pending: null }); // came back within the grace
    expect(tip.actions['conceal']!(closing)).toMatchObject({ visible: false, pending: null });
    expect(tip.actions['hide']!(closing)).toMatchObject({ visible: false, pending: null }); // Escape / blur: no waiting
  });

  it('with no delay the pointer shows at once; with closeDelay 0 it hides at once', () => {
    const tip = lib.createTooltip({ content: 'Help', triggerText: '?', closeDelay: 0 });
    expect(tip.actions['requestShow']!(tip.state)).toMatchObject({ visible: true, pending: null });
    expect(tip.actions['requestHide']!({ ...tip.state, visible: true })).toMatchObject({ visible: false, pending: null });
  });

  it('the documented `trigger` mode is honoured; an element or selector is accepted but cannot be attached to', () => {
    expect(lib.createTooltip({ content: 'x', trigger: 'focus' }).state.mode).toBe('focus');
    expect(lib.createTooltip({ content: 'x', trigger: 'click', triggerText: 'Info' }).render(lib.createTooltip({ content: 'x', trigger: 'click', triggerText: 'Info' }).state)).toContain('<button');
    expect(lib.createTooltip({ content: 'x', trigger: '.help-icon' }).state.mode).toBe('hover');
    expect(host(lib.createTooltip({ content: 'x', trigger: 'focus', triggerText: 't' }).render(lib.createTooltip({ content: 'x', trigger: 'focus', triggerText: 't' }).state)).querySelector('.obix-tooltip')!.getAttribute('data-obix-on')).not.toContain('mouseenter');
  });
});

describe('DatePicker follows the APG date-picker dialog', () => {
  const picker = () => lib.createDatePicker({ label: 'Date', today: '2026-03-18', minDate: '2020-01-01', maxDate: '2030-12-31' }); // 18 March 2026 is a Wednesday

  it('Home / End go to the first / last day of the week the focused day is in (week starts on Sunday by default, or on weekStartsOn)', () => {
    const p = picker();
    expect(p.actions['weekStart']!(p.state).focusedDate).toBe('2026-03-15');
    expect(p.actions['weekEnd']!(p.state).focusedDate).toBe('2026-03-21');
    const monday = lib.createDatePicker({ label: 'Date', today: '2026-03-18', weekStartsOn: 1 });
    expect(monday.actions['weekStart']!(monday.state).focusedDate).toBe('2026-03-16');
    expect(monday.actions['weekEnd']!(monday.state).focusedDate).toBe('2026-03-22');
  });

  it('Shift+Page Up/Down move a year, keeping the day (or the last day of a shorter month)', () => {
    const p = lib.createDatePicker({ label: 'Date', today: '2028-02-29' });
    const next = p.actions['nextYear']!(p.state);
    expect(next).toMatchObject({ focusedDate: '2029-02-28', viewYear: 2029, viewMonth: 1 });
    expect(p.actions['prevYear']!(p.state).focusedDate).toBe('2027-02-28');
  });

  it('opening focuses the selected date, else today, whatever was browsed before', () => {
    const p = picker();
    const browsed = p.actions['nextYear']!(p.actions['moveFocus']!(p.state, 40));
    expect(p.actions['open']!(browsed)).toMatchObject({ open: true, focusedDate: '2026-03-18' });
    const chosen = p.actions['selectDate']!(p.state, '2026-03-05');
    const browsedAgain = p.actions['nextYear']!(chosen);
    expect(p.actions['toggle']!({ ...browsedAgain, open: false })).toMatchObject({ open: true, focusedDate: '2026-03-05' });
  });

  it('the calendar grid declares the APG keys, with exact Shift bindings for the year', () => {
    const p = picker();
    const grid = host(p.render(p.actions['open']!(p.state))).querySelector('[role="grid"]')!;
    const on = grid.getAttribute('data-obix-on')!;
    for (const binding of ['keydown:Home=weekStart!', 'keydown:End=weekEnd!', 'keydown:PageUp=prevMonth!', 'keydown:PageDown=nextMonth!', 'keydown:Shift+PageUp=prevYear!', 'keydown:Shift+PageDown=nextYear!']) expect(on).toContain(binding);
  });
});
