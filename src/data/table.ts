import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export type SortDirection = 'ascending' | 'descending' | 'none';

export interface ColumnDef {
  id: string;
  label: string;
  sortable?: boolean;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  width?: string;
}

export type RowData = Record<string, string | number | boolean>;

export interface TableState {
  caption: string;
  columns: ColumnDef[];
  rows: RowData[];
  sortColumn: string | null;
  sortDirection: SortDirection;
  /** Indices (into `rows`) of the selected rows. */
  selectedRows: string[];
  striped: boolean;
  hoverable: boolean;
  responsive: boolean;
  tableId: string;
}

export interface TableConfig {
  caption: string;
  /** `columns` (`{ id }`) is the implemented form; the documented `headers` (`{ key }`) is accepted too. */
  columns?: ColumnDef[];
  headers?: Array<Omit<ColumnDef, 'id'> & { key: string }>;
  rows?: RowData[];
  striped?: boolean;
  hoverable?: boolean;
  responsive?: boolean;
  sortBy?: string;
  /** `'asc' | 'desc'` (documented) or the ARIA words. */
  sortDir?: 'asc' | 'desc' | 'ascending' | 'descending';
  id?: string;
}

const ariaOf = (s: TableState): AriaAttributes => ({ role: 'table', 'aria-label': s.caption });

const compare = (a: unknown, b: unknown): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
};

/** The rows in display order: `rows` untouched, sorted stably by the sort column (a pure view of the state). */
export function sortedRows(s: Pick<TableState, 'rows' | 'sortColumn' | 'sortDirection'>): Array<{ row: RowData; index: number }> {
  const indexed = s.rows.map((row, index) => ({ row, index }));
  if (!s.sortColumn || s.sortDirection === 'none') return indexed;
  const column = s.sortColumn;
  const sign = s.sortDirection === 'descending' ? -1 : 1;
  return indexed.sort((a, b) => sign * compare(a.row[column], b.row[column]) || a.index - b.index);
}

function renderTable(s: TableState): string {
  const headers = s.columns.map((col) => {
    const sort: SortDirection = col.id === s.sortColumn ? s.sortDirection : 'none';
    const style = col.width ? `width:${col.width}` : undefined;
    const label = esc(col.label);
    if (!col.sortable) return `<th${attrs({ scope: col.scope ?? 'col', class: 'obix-table__th', style })}>${label}</th>`;
    const next = sort === 'ascending' ? 'descending' : 'ascending';
    return `<th${attrs({ scope: col.scope ?? 'col', class: 'obix-table__th obix-table__th--sortable', 'aria-sort': sort, style })}>` +
      `<button${attrs({ type: 'button', class: 'obix-table__sort', 'data-jfix-strategy': 'fixed-size', 'aria-label': `Sort by ${col.label}, ${next}`, 'data-col': col.id, 'data-obix-on': 'click=sortBy(@attr:data-col)' })}>${label}` +
      `<span aria-hidden="true"> ${sort === 'ascending' ? '↑' : sort === 'descending' ? '↓' : '↕'}</span></button></th>`;
  }).join('');
  const body = sortedRows(s).map(({ row, index }) => {
    const cells = s.columns.map((col) => `<td class="obix-table__td">${esc(row[col.id] ?? '')}</td>`).join('');
    return `<tr${attrs({ class: cx('obix-table__tr', s.selectedRows.includes(String(index)) && 'is-selected'), 'aria-selected': s.selectedRows.includes(String(index)) ? 'true' : undefined, 'data-obix-key': `row-${index}` })}>${cells}</tr>`;
  }).join('');
  const table = `<table${attrs({ id: s.tableId, class: cx('obix-table', s.striped && 'obix-table--striped', s.hoverable && 'obix-table--hoverable') })}>` +
    `<caption class="obix-table__caption">${esc(s.caption)}</caption><thead class="obix-table__thead"><tr>${headers}</tr></thead><tbody class="obix-table__tbody">${body}</tbody></table>`;
  // a horizontally scrollable region must be reachable from the keyboard
  return s.responsive
    ? `<div${attrs({ class: 'obix-table-wrapper', style: 'overflow-x:auto', role: 'region', 'aria-label': s.caption, tabindex: '0' })}>${table}</div>`
    : table;
}

export function createTable(config: TableConfig): ObixComponent<TableState> {
  const columns: ColumnDef[] = config.columns ?? (config.headers ?? []).map(({ key, ...rest }) => ({ id: key, ...rest }));
  const direction = (d: TableConfig['sortDir']): SortDirection => (d === 'desc' || d === 'descending' ? 'descending' : 'ascending');
  return defineComponent<TableState>({
    name: 'ObixTable',
    state: {
      caption: config.caption,
      columns,
      rows: config.rows ?? [],
      sortColumn: config.sortBy ?? null,
      sortDirection: config.sortBy ? direction(config.sortDir) : 'none',
      selectedRows: [],
      striped: config.striped ?? true,
      hoverable: config.hoverable ?? true,
      responsive: config.responsive ?? true,
      tableId: createId('obix-table', config.id),
    },
    actions: {
      // choosing the column that is already sorted reverses the direction; a new column starts ascending
      sortBy: (state, columnId: unknown, dir?: unknown) => {
        const col = String(columnId);
        if (dir !== undefined) return { sortColumn: col, sortDirection: direction(dir as TableConfig['sortDir']) };
        if (state.sortColumn === col) return { sortDirection: state.sortDirection === 'ascending' ? 'descending' as const : 'ascending' as const };
        return { sortColumn: col, sortDirection: 'ascending' as const };
      },
      // ascending → descending → unsorted
      toggleSort: (state, columnId: unknown) => {
        const col = String(columnId);
        if (state.sortColumn !== col) return { sortColumn: col, sortDirection: 'ascending' as const };
        if (state.sortDirection === 'ascending') return { sortDirection: 'descending' as const };
        return { sortColumn: null, sortDirection: 'none' as const };
      },
      setRows: (_state, rows: unknown) => ({ rows: rows as RowData[], selectedRows: [] }),
      selectRow: (state, id: unknown) => (state.selectedRows.includes(String(id)) ? state : { selectedRows: [...state.selectedRows, String(id)] }),
      deselectRow: (state, id: unknown) => ({ selectedRows: state.selectedRows.filter((r) => r !== String(id)) }),
      selectAll: (state) => ({ selectedRows: state.rows.map((_, i) => String(i)) }),
      deselectAll: () => ({ selectedRows: [] }),
    },
    render: renderTable,
    aria: ariaOf,
  });
}
