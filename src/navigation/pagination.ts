import type { AriaAttributes } from '../types/base.js';
import { attrs, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  disabled: boolean;
  label: string;
  showPrevNext: boolean;
  showFirstLast: boolean;
  showPageNumbers: boolean;
  /** Most page buttons shown at once (a window around the current page). */
  maxVisible: number;
}

export interface PaginationConfig {
  /** `totalPages`/`currentPage` are the implemented names, `total`/`current` the documented ones. */
  totalPages?: number;
  currentPage?: number;
  total?: number;
  current?: number;
  pageSize?: number;
  disabled?: boolean;
  /** `label` is the implemented name, `ariaLabel` the documented one. Default "Pagination". */
  label?: string;
  ariaLabel?: string;
  showPrevNext?: boolean;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisible?: number;
  /** Called by the application when the page changes (see `onPageChange` on the returned component). */
  onPageChange?: (page: number) => void;
}

const ariaOf = (s: PaginationState): AriaAttributes => ({ role: 'navigation', 'aria-label': s.label });

/** The page numbers shown: a window of `maxVisible` pages that contains the current page. */
export function visiblePages(current: number, total: number, maxVisible: number): number[] {
  const size = Math.max(1, Math.min(maxVisible, total));
  const start = Math.min(Math.max(1, current - Math.floor(size / 2)), total - size + 1);
  return Array.from({ length: size }, (_, i) => start + i);
}

function renderPagination(s: PaginationState): string {
  const atStart = s.currentPage <= 1 || s.disabled;
  const atEnd = s.currentPage >= s.totalPages || s.disabled;
  const button = (label: string, text: string, action: string, disabled: boolean, extra: Record<string, string | undefined> = {}): string =>
    `<button${attrs({ class: 'obix-pagination__button', type: 'button', 'data-jfix-strategy': 'fixed-size', 'aria-label': label, 'aria-disabled': disabled ? 'true' : undefined, 'data-obix-on': `click=${action}`, ...extra })}>${text}</button>`;
  const pages = s.showPageNumbers
    ? visiblePages(s.currentPage, s.totalPages, s.maxVisible)
        .map((page) => button(`Page ${page}`, String(page), 'goToPage(@attr:data-page)', s.disabled, { 'data-page': String(page), 'aria-current': page === s.currentPage ? 'page' : undefined, 'data-obix-key': `page-${page}` }))
        .join('')
    : '';
  return `<nav aria-label="${esc(s.label)}" class="obix-pagination">` +
    `${s.showFirstLast ? button('First page', '« First', 'firstPage', atStart) : ''}` +
    `${s.showPrevNext ? button('Previous page', '‹ Prev', 'prevPage', atStart) : ''}${pages}` +
    `${s.showPrevNext ? button('Next page', 'Next ›', 'nextPage', atEnd) : ''}` +
    `${s.showFirstLast ? button('Last page', 'Last »', 'lastPage', atEnd) : ''}</nav>`;
}

export function createPagination(config: PaginationConfig): ObixComponent<PaginationState> & { onPageChange?: (page: number) => void } {
  const total = Math.max(1, Math.floor(config.total ?? config.totalPages ?? 1));
  const go = (state: PaginationState, page: number): Partial<PaginationState> | PaginationState => {
    const target = Math.min(state.totalPages, Math.max(1, Math.floor(page)));
    return state.disabled || target === state.currentPage || Number.isNaN(target) ? state : { currentPage: target };
  };
  const component = defineComponent<PaginationState>({
    name: 'ObixPagination',
    state: {
      currentPage: Math.min(total, Math.max(1, config.current ?? config.currentPage ?? 1)),
      totalPages: total,
      pageSize: config.pageSize ?? 10,
      disabled: config.disabled ?? false,
      label: config.ariaLabel ?? config.label ?? 'Pagination',
      showPrevNext: config.showPrevNext ?? true,
      showFirstLast: config.showFirstLast ?? true,
      showPageNumbers: config.showPageNumbers ?? true,
      maxVisible: Math.max(1, config.maxVisible ?? 5),
    },
    actions: {
      // an out-of-range page is refused (state unchanged), never clamped silently into a different page
      goToPage: (state, page: unknown) => {
        const p = Number(page);
        return Number.isInteger(p) && p >= 1 && p <= state.totalPages ? go(state, p) : state;
      },
      next: (state) => go(state, state.currentPage + 1),
      prev: (state) => go(state, state.currentPage - 1),
      first: (state) => go(state, 1),
      last: (state) => go(state, state.totalPages),
    },
    aliases: { nextPage: 'next', prevPage: 'prev', firstPage: 'first', lastPage: 'last' },
    render: renderPagination,
    aria: ariaOf,
  });
  return Object.assign(component, config.onPageChange ? { onPageChange: config.onPageChange } : {});
}
