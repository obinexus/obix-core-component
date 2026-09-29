import { describe, it, expect } from 'vitest';
import { createSearch, createAutocomplete } from '../src/search/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

describe('ObixSearch', () => {
  it('has role=search and aria-label', () => {
    const search = createSearch({ label: 'Search products' });
    expect(search.aria.role).toBe('search');
    expect(search.aria['aria-label']).toBe('Search products');
  });

  it('setQuery action updates query', () => {
    const search = createSearch({});
    const next = search.actions['setQuery']!(search.state, 'obix');
    expect(next.query).toBe('obix');
  });

  it('clear action resets query', () => {
    const search = createSearch({});
    const withQuery = { ...search.state, query: 'hello' };
    const next = search.actions['clear']!(withQuery);
    expect(next.query).toBe('');
  });

  it('setResults action sets resultsCount and stops loading', () => {
    const search = createSearch({});
    const next = search.actions['setResults']!(search.state, 5);
    expect(next.resultsCount).toBe(5);
    expect(next.loading).toBe(false);
  });

  it('render includes role=search form wrapper', () => {
    const search = createSearch({ label: 'Search' });
    const html = search.render(search.state);
    expect(html).toContain('role="search"');
  });

  it('render shows results count via aria-live region', () => {
    const search = createSearch({ label: 'Search' });
    const html = search.render({ ...search.state, resultsCount: 3 });
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('3 results found');
  });

  it('render shows clear button when query is non-empty', () => {
    const search = createSearch({});
    const html = search.render({ ...search.state, query: 'test' });
    expect(html).toContain('aria-label="Clear search"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createSearch({})).valid).toBe(true);
  });
});

describe('ObixAutocomplete', () => {
  it('has role=combobox and aria-autocomplete=list', () => {
    const ac = createAutocomplete({ label: 'Search cities' });
    expect(ac.aria.role).toBe('combobox');
    expect(ac.aria['aria-autocomplete']).toBe('list');
  });

  it('setQuery action updates query and opens when non-empty', () => {
    const ac = createAutocomplete({ label: 'Cities' });
    const next = ac.actions['setQuery']!(ac.state, 'lon');
    expect(next.query).toBe('lon');
    expect(next.open).toBe(true);
  });

  it('setSuggestions action populates suggestions', () => {
    const ac = createAutocomplete({ label: 'Cities' });
    const next = ac.actions['setSuggestions']!(ac.state, ['London', 'Los Angeles']);
    expect(next.suggestions).toHaveLength(2);
    expect(next.open).toBe(true);
  });

  it('navigateNext increments activeIndex', () => {
    const ac = createAutocomplete({ label: 'Cities', suggestions: ['London', 'Lagos'] });
    const opened = { ...ac.state, open: true, activeIndex: 0 };
    const next = ac.actions['navigateNext']!(opened);
    expect(next.activeIndex).toBe(1);
  });

  it('select action sets selectedValue and closes', () => {
    const ac = createAutocomplete({ label: 'Cities', suggestions: ['London', 'Lagos'] });
    const opened = { ...ac.state, open: true, suggestions: ['London', 'Lagos'] };
    const next = ac.actions['select']!(opened, 0);
    expect(next.selectedValue).toBe('London');
    expect(next.open).toBe(false);
  });

  it('render includes role=combobox on input and role=listbox on list', () => {
    const ac = createAutocomplete({ label: 'Cities' });
    const html = ac.render(ac.state);
    expect(html).toContain('role="combobox"');
    expect(html).toContain('role="listbox"');
  });

  it('render shows aria-activedescendant when item is active', () => {
    const ac = createAutocomplete({ label: 'Cities', suggestions: ['London'] });
    const html = ac.render({ ...ac.state, open: true, activeIndex: 0 });
    expect(html).toContain('aria-activedescendant=');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createAutocomplete({ label: 'Search' })).valid).toBe(true);
  });
});
