import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface SearchState {
  query: string;
  placeholder: string;
  disabled: boolean;
  loading: boolean;
  resultsCount: number | null;
  label: string;
  ariaLabel: string;
  name: string;
  clearButton: boolean;
  submitButton: boolean;
  focused: boolean;
  /** The query of the last accepted `submit` (what `onSearch` is called with). */
  submittedQuery: string | null;
  searchId: string;
}

export interface SearchConfig {
  label?: string;
  name?: string;
  placeholder?: string;
  /** Initial query. */
  value?: string;
  disabled?: boolean;
  /** Default true (documented): show a clear button while the field has text. */
  clearButton?: boolean;
  /** Default false (documented): show a visible submit button (Enter always submits). */
  submitButton?: boolean;
  ariaLabel?: string;
  /** Called by the host with `state.submittedQuery` after a `submit`; actions themselves stay pure. */
  onSearch?: (query: string) => void;
  id?: string;
}

export type ObixSearch = ObixComponent<SearchState> & { onSearch?: (query: string) => void };

const ariaOf = (s: SearchState): AriaAttributes => ({ role: 'search', 'aria-label': s.ariaLabel || s.label });

/** The announcement for a result count ("No results found", "1 result found", "3 results found"). */
export function resultsMessage(count: number): string {
  return count === 0 ? 'No results found' : `${count} result${count === 1 ? '' : 's'} found`;
}

function renderSearch(s: SearchState): string {
  const input = `<input${attrs({
    id: s.searchId,
    type: 'search',
    name: s.name || undefined,
    class: 'obix-search__input',
    placeholder: s.placeholder,
    value: s.query,
    'aria-label': s.ariaLabel || s.label,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-busy': s.loading ? 'true' : undefined,
    disabled: s.disabled,
    autocomplete: 'off',
    'data-jfix-strategy': 'transform-scale',
    'data-obix-key': 'search-input',
    'data-obix-on': 'input=setValue(@value); focus=focus; blur=blur; keydown:Escape=clear',
  })}>`;
  // Cleared with the mouse, focus would fall onto <body> as the button disappears: send it back to the field.
  const clear = s.clearButton && s.query && !s.disabled
    ? `<button${attrs({ class: 'obix-search__clear', type: 'button', 'data-jfix-strategy': 'fixed-size', 'aria-label': 'Clear search', 'data-obix-key': 'search-clear', 'data-obix-on': 'click=clear', 'data-obix-then-focus': `#${s.searchId}` })}><span aria-hidden="true">×</span></button>`
    : '';
  const submit = s.submitButton
    ? `<button${attrs({ class: 'obix-search__submit', type: 'submit', 'data-jfix-strategy': 'fixed-size', 'data-obix-key': 'search-submit', disabled: s.disabled })}>Search</button>`
    : '';
  // Always present, so a screen reader has a live region to watch before the first result arrives.
  const status = `<div role="status" aria-live="polite" aria-atomic="true" class="obix-search__results-count">${s.resultsCount === null ? '' : esc(resultsMessage(s.resultsCount))}</div>`;
  return `<form${attrs({ class: 'obix-search', role: 'search', 'aria-label': s.ariaLabel || s.label, 'data-obix-on': 'submit=submit!' })}>` +
    `<div class="obix-search__form">${input}${clear}${submit}</div>${status}</form>`;
}

export function createSearch(config: SearchConfig): ObixSearch {
  const component = defineComponent<SearchState>({
    name: 'ObixSearch',
    state: {
      query: config.value ?? '',
      placeholder: config.placeholder ?? 'Search…',
      disabled: config.disabled ?? false,
      loading: false,
      resultsCount: null,
      label: config.label ?? 'Search',
      ariaLabel: config.ariaLabel ?? '',
      name: config.name ?? '',
      clearButton: config.clearButton ?? true,
      submitButton: config.submitButton ?? false,
      focused: false,
      submittedQuery: null,
      searchId: createId('obix-search', config.id ?? config.name),
    },
    actions: {
      // typing invalidates the previous result announcement
      setQuery: (state, query: unknown) => (state.disabled ? state : { query: String(query ?? ''), resultsCount: null }),
      // an empty query is not a search: nothing to submit, nothing left loading forever
      submit: (state) => (state.disabled || state.query.trim() === '' ? state : { loading: true, resultsCount: null, submittedQuery: state.query }),
      clear: (state) => (state.disabled ? state : { query: '', resultsCount: null, loading: false, submittedQuery: null }),
      setLoading: (_state, loading: unknown) => ({ loading: Boolean(loading) }),
      setResults: (_state, count: unknown) => ({ resultsCount: Math.max(0, Math.trunc(Number(count)) || 0), loading: false }),
      focus: () => ({ focused: true }),
      blur: () => ({ focused: false }),
    },
    aliases: { setValue: 'setQuery' },
    render: renderSearch,
    aria: ariaOf,
  }) as ObixSearch;
  if (config.onSearch) component.onSearch = config.onSearch;
  return component;
}
