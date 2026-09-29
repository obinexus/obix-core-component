import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

/** A suggestion is either a plain string (label and value the same) or `{ label, value }`. */
export type AutocompleteSuggestion = string | { label: string; value: string };

export interface AutocompleteState {
  query: string;
  /** Every suggestion on offer. What is shown is {@link visibleSuggestions}: filtered by the query unless `filter` is false. */
  suggestions: AutocompleteSuggestion[];
  open: boolean;
  /** Index into the visible suggestions; -1 = none (DOM focus stays in the input either way). */
  activeIndex: number;
  selectedValue: string | null;
  loading: boolean;
  disabled: boolean;
  label: string;
  ariaLabel: string;
  name: string;
  placeholder: string;
  minChars: number;
  maxSuggestions: number;
  filter: boolean;
  inputId: string;
  listboxId: string;
}

export interface AutocompleteConfig {
  label?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  suggestions?: AutocompleteSuggestion[];
  /** Default 1: a typed query shorter than this offers nothing. */
  minChars?: number;
  /** Default 10. */
  maxSuggestions?: number;
  /** Default true: filter `suggestions` by the query. Pass false when the list is already the server's answer for the query. */
  filter?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  /** Called by the host with the chosen value after a select; actions themselves stay pure. */
  onSelect?: (value: string) => void;
  id?: string;
}

export type ObixAutocomplete = ObixComponent<AutocompleteState> & { onSelect?: (value: string) => void };

const option = (s: AutocompleteSuggestion): { label: string; value: string } => (typeof s === 'string' ? { label: s, value: s } : s);

const fold = (text: string): string => text.toLocaleLowerCase();

/**
 * What the listbox shows. An empty query shows everything (an explicitly opened menu is a browse); a non-empty query needs `minChars`
 * characters, then matches labels case-insensitively (prefix matches first, otherwise in the given order), capped at `maxSuggestions`.
 */
export function visibleSuggestions(s: Pick<AutocompleteState, 'query' | 'suggestions' | 'minChars' | 'maxSuggestions' | 'filter'>): Array<{ label: string; value: string }> {
  const all = s.suggestions.map(option);
  if (!s.filter || s.query === '') return all.slice(0, s.maxSuggestions);
  if (s.query.length < s.minChars) return [];
  const q = fold(s.query);
  const starts: typeof all = [];
  const contains: typeof all = [];
  for (const o of all) {
    const label = fold(o.label);
    if (label.startsWith(q)) starts.push(o);
    else if (label.includes(q)) contains.push(o);
  }
  return [...starts, ...contains].slice(0, s.maxSuggestions);
}

const ariaOf = (s: AutocompleteState): AriaAttributes => {
  const shown = s.open && visibleSuggestions(s).length > 0;
  return { role: 'combobox', 'aria-label': s.ariaLabel || s.label, 'aria-expanded': shown, 'aria-autocomplete': 'list' };
};

function renderAutocomplete(s: AutocompleteState): string {
  const visible = visibleSuggestions(s);
  const shown = s.open && visible.length > 0;
  const active = shown && s.activeIndex >= 0 && s.activeIndex < visible.length ? s.activeIndex : -1;
  // Enter only belongs to the menu while an option is highlighted; otherwise it must keep submitting the enclosing form.
  const keys = ['input=setQuery(@value)', 'keydown:ArrowDown=navigateNext!', 'keydown:ArrowUp=navigatePrev!', 'keydown:Escape=close', 'blur=close', 'keydown:Tab=selectActive', 'keydown:Shift+Tab=selectActive'];
  if (active >= 0) keys.push('keydown:Enter=selectActive!');
  const input = `<input${attrs({
    id: s.inputId,
    type: 'text',
    name: s.name || undefined,
    class: 'obix-autocomplete__input',
    role: 'combobox',
    value: s.query,
    placeholder: s.placeholder || undefined,
    'aria-label': s.ariaLabel || undefined,
    'aria-expanded': String(shown),
    'aria-autocomplete': 'list',
    'aria-controls': s.listboxId,
    'aria-activedescendant': active >= 0 ? `${s.listboxId}-option-${active}` : undefined,
    'aria-busy': s.loading ? 'true' : undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    disabled: s.disabled,
    autocomplete: 'off',
    'data-jfix-strategy': 'transform-scale',
    'data-obix-on': keys.join('; '),
  })}>`;
  const options = visible.map((o, i) => `<li${attrs({
    id: `${s.listboxId}-option-${i}`,
    role: 'option',
    class: cx('obix-autocomplete__option', i === active && 'obix-autocomplete__option--active'),
    'aria-selected': String(i === active),
    'data-jfix-strategy': 'fixed-size',
    'data-index': String(i),
    'data-obix-on': 'click=select(@attr:data-index)',
  })}>${esc(o.label)}</li>`).join('');
  // mousedown on the list would blur the input, close the menu and swallow the click: keep DOM focus where it is
  const list = `<ul${attrs({ id: s.listboxId, role: 'listbox', class: 'obix-autocomplete__listbox', 'aria-label': `${s.ariaLabel || s.label} suggestions`, hidden: !shown, 'data-obix-keep-focus': '' })}>${options}</ul>`;
  const status = `<div role="status" aria-live="polite" aria-atomic="true" class="obix-visually-hidden">${s.open ? (visible.length === 0 ? 'No suggestions' : `${visible.length} suggestion${visible.length === 1 ? '' : 's'} available`) : ''}</div>`;
  return `<div class="obix-autocomplete"><label for="${esc(s.inputId)}" class="obix-field__label">${esc(s.label)}</label>${input}${list}${status}</div>`;
}

export function createAutocomplete(config: AutocompleteConfig): ObixAutocomplete {
  const listId = (id: string): string => `${id}-listbox`;
  const inputId = createId('obix-autocomplete', config.id ?? config.name);
  const choose = (state: AutocompleteState, index: number): Partial<AutocompleteState> | AutocompleteState => {
    const picked = visibleSuggestions(state)[index];
    if (!picked) return state;
    return { selectedValue: picked.value, query: picked.label, open: false, activeIndex: -1 };
  };
  const component = defineComponent<AutocompleteState>({
    name: 'ObixAutocomplete',
    state: {
      query: config.value ?? '',
      suggestions: config.suggestions ?? [],
      open: false,
      activeIndex: -1,
      selectedValue: null,
      loading: false,
      disabled: config.disabled ?? false,
      label: config.label ?? '',
      ariaLabel: config.ariaLabel ?? '',
      name: config.name ?? '',
      placeholder: config.placeholder ?? '',
      minChars: config.minChars ?? 1,
      maxSuggestions: config.maxSuggestions ?? 10,
      filter: config.filter ?? true,
      inputId,
      listboxId: listId(inputId),
    },
    actions: {
      setQuery: (state, query: unknown) => {
        if (state.disabled) return state;
        const q = String(query ?? '');
        // "open" = the user is being offered suggestions (a host may still be fetching them); the list itself only shows when there are some
        return { query: q, open: q.length >= state.minChars && q !== '', activeIndex: -1, selectedValue: null };
      },
      setSuggestions: (state, suggestions: unknown) => ({ suggestions: suggestions as AutocompleteSuggestion[], open: !state.disabled && (suggestions as AutocompleteSuggestion[]).length > 0, activeIndex: -1 }),
      open: (state) => (state.disabled || state.open ? state : { open: true }),
      close: (state) => (state.open || state.activeIndex >= 0 ? { open: false, activeIndex: -1 } : state),
      // Down/Up open a closed menu (APG), then move through the visible options without wrapping
      navigateNext: (state) => {
        const count = visibleSuggestions(state).length;
        if (state.disabled || count === 0) return state;
        if (!state.open) return { open: true, activeIndex: 0 };
        return { activeIndex: Math.min(state.activeIndex + 1, count - 1) };
      },
      navigatePrev: (state) => {
        const count = visibleSuggestions(state).length;
        if (state.disabled || count === 0) return state;
        if (!state.open) return { open: true, activeIndex: count - 1 };
        return { activeIndex: Math.max(state.activeIndex - 1, 0) };
      },
      focusSuggestion: (state, index: unknown) => {
        const i = Number(index);
        return Number.isInteger(i) && i >= 0 && i < visibleSuggestions(state).length ? { open: true, activeIndex: i } : state;
      },
      select: (state, index: unknown) => choose(state, Number(index)),
      selectActive: (state) => (state.activeIndex < 0 ? state : choose(state, state.activeIndex)),
      setLoading: (_state, loading: unknown) => ({ loading: Boolean(loading) }),
    },
    aliases: { setValue: 'setQuery', selectSuggestion: 'select', nextSuggestion: 'navigateNext', prevSuggestion: 'navigatePrev', openMenu: 'open', closeMenu: 'close' },
    render: renderAutocomplete,
    aria: ariaOf,
  }) as ObixAutocomplete;
  if (config.onSelect) component.onSelect = config.onSelect;
  return component;
}
