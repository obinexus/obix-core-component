import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';
import { MONTHS, WEEKDAYS, addDays, clampISO, daysInMonth, localToday, longName, parseISO } from '../kit/dates.js';

export interface DatePickerState {
  /** Selected ISO date (`YYYY-MM-DD`) or null. */
  value: string | null;
  open: boolean;
  minDate: string;
  maxDate: string;
  disabled: boolean;
  required: boolean;
  label: string;
  ariaLabel: string;
  name: string;
  /** Show the calendar button and grid in addition to the native date input. */
  showCalendar: boolean;
  highlightToday: boolean;
  /** Today's ISO date, read ONCE at creation (or given), so rendering is a pure function of state. */
  today: string;
  weekStartsOn: 0 | 1;
  /** The date that has keyboard focus inside the calendar. */
  focusedDate: string;
  inputId: string;
  viewYear: number;
  viewMonth: number;
}

export interface DatePickerConfig {
  label: string;
  name?: string;
  value?: string;
  /** `minDate`/`maxDate` are the implemented names, `min`/`max` the documented ones. */
  minDate?: string;
  maxDate?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  required?: boolean;
  showCalendar?: boolean;
  highlightToday?: boolean;
  today?: string;
  weekStartsOn?: 0 | 1;
  ariaLabel?: string;
  id?: string;
}

const ariaOf = (s: DatePickerState): AriaAttributes => ({
  role: 'textbox',
  'aria-label': s.ariaLabel || s.label,
  'aria-required': s.required,
  'aria-disabled': s.disabled,
});

const disabledDay = (s: DatePickerState, iso: string): boolean => (!!s.minDate && iso < s.minDate) || (!!s.maxDate && iso > s.maxDate);

function calendar(s: DatePickerState): string {
  const first = `${String(s.viewYear).padStart(4, '0')}-${String(s.viewMonth + 1).padStart(2, '0')}-01`;
  const lead = (((parseISO(first) === null ? 0 : new Date(parseISO(first) as number).getUTCDay()) - s.weekStartsOn) + 7) % 7;
  const total = daysInMonth(s.viewYear, s.viewMonth);
  const cells: string[] = [];
  for (let i = 0; i < lead; i++) cells.push('<td role="gridcell"></td>');
  for (let day = 1; day <= total; day++) {
    const iso = `${first.slice(0, 8)}${String(day).padStart(2, '0')}`;
    const isFocus = iso === s.focusedDate;
    cells.push(`<td role="gridcell"${attrs({ 'aria-selected': s.value === iso ? 'true' : undefined })}><button${attrs({
      type: 'button',
      class: 'obix-date-picker__day',
      'data-date': iso,
      'aria-label': longName(iso),
      'aria-current': s.highlightToday && iso === s.today ? 'date' : undefined,
      'aria-disabled': disabledDay(s, iso) ? 'true' : undefined,
      tabindex: isFocus ? '0' : '-1',
      'data-obix-focus': isFocus ? '' : undefined,
      'data-obix-autofocus': isFocus ? '' : undefined, // where focus lands when the dialog opens
      'data-obix-on': 'click=selectDate(@attr:data-date)',
    })}>${day}</button></td>`);
  }
  while (cells.length % 7 !== 0) cells.push('<td role="gridcell"></td>');
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(`<tr role="row">${cells.slice(i, i + 7).join('')}</tr>`);
  const headers = Array.from({ length: 7 }, (_, i) => WEEKDAYS[(i + s.weekStartsOn) % 7] as string)
    .map((name) => `<th role="columnheader" scope="col" abbr="${esc(name)}">${esc(name.slice(0, 2))}</th>`).join('');
  const titleId = `${s.inputId}-title`;
  return `<div${attrs({ class: 'obix-date-picker__calendar', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Choose date', tabindex: '-1', 'data-obix-trap': '', 'data-obix-dismiss': 'close' })}>` +
    `<div class="obix-date-picker__calendar-header">` +
    `<button class="obix-button obix-date-picker__calendar-nav" type="button" aria-label="Previous month" data-obix-on="click=prevMonth">‹</button>` +
    `<span id="${esc(titleId)}" aria-live="polite">${MONTHS[s.viewMonth]} ${s.viewYear}</span>` +
    `<button class="obix-button obix-date-picker__calendar-nav" type="button" aria-label="Next month" data-obix-on="click=nextMonth">›</button></div>` +
    `<table${attrs({ class: 'obix-date-picker__calendar-grid', role: 'grid', 'aria-labelledby': titleId, 'data-obix-focus-scope': '',
      'data-obix-on': 'keydown:ArrowLeft=moveFocus(-1)!; keydown:ArrowRight=moveFocus(1)!; keydown:ArrowUp=moveFocus(-7)!; keydown:ArrowDown=moveFocus(7)!; keydown:PageUp=prevMonth!; keydown:PageDown=nextMonth!; keydown:Shift+PageUp=prevYear!; keydown:Shift+PageDown=nextYear!; keydown:Home=weekStart!; keydown:End=weekEnd!' })}>` +
    `<thead><tr role="row">${headers}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function renderDatePicker(s: DatePickerState): string {
  const input = `<input${attrs({
    type: 'date',
    id: s.inputId,
    name: s.name || undefined,
    class: 'obix-date-picker',
    value: s.value ?? '',
    min: s.minDate || undefined,
    max: s.maxDate || undefined,
    required: s.required,
    disabled: s.disabled,
    'aria-label': s.ariaLabel || undefined,
    'data-jfix-strategy': 'fixed-size',
    'data-obix-on': 'change=selectDate(@value)',
  })}>`;
  const toggle = s.showCalendar
    ? `<button${attrs({ type: 'button', class: 'obix-button obix-date-picker__toggle', 'aria-haspopup': 'dialog', 'aria-expanded': String(s.open), disabled: s.disabled, 'data-obix-on': 'click=toggle' })}>Choose date</button>`
    : '';
  return `<div class="obix-field obix-date-picker__wrapper"><label for="${esc(s.inputId)}" class="obix-field__label">${esc(s.label)}${s.required ? ' <span aria-hidden="true">*</span>' : ''}</label>${input}${toggle}${s.showCalendar && s.open ? calendar(s) : ''}</div>`;
}

export function createDatePicker(config: DatePickerConfig): ObixComponent<DatePickerState> {
  const minDate = config.minDate ?? config.min ?? '';
  const maxDate = config.maxDate ?? config.max ?? '';
  const today = config.today ?? localToday();
  const start = clampISO(config.value && parseISO(config.value) !== null ? config.value : today, minDate, maxDate);
  const view = (iso: string): Pick<DatePickerState, 'viewYear' | 'viewMonth' | 'focusedDate'> => ({ viewYear: Number(iso.slice(0, 4)), viewMonth: Number(iso.slice(5, 7)) - 1, focusedDate: iso });
  const weekOffset = (s: DatePickerState): number => (((parseISO(s.focusedDate) === null ? 0 : new Date(parseISO(s.focusedDate) as number).getUTCDay()) - s.weekStartsOn) + 7) % 7;
  const shiftMonth = (s: DatePickerState, by: number): Partial<DatePickerState> => {
    const index = s.viewYear * 12 + s.viewMonth + by;
    const y = Math.floor(index / 12);
    const m = index - y * 12;
    const day = Math.min(Number(s.focusedDate.slice(8, 10)), daysInMonth(y, m));
    const iso = clampISO(`${String(y).padStart(4, '0')}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, s.minDate, s.maxDate);
    return view(iso);
  };
  return defineComponent<DatePickerState>({
    name: 'ObixDatePicker',
    state: {
      value: config.value && parseISO(config.value) !== null ? config.value : null,
      open: false,
      minDate,
      maxDate,
      disabled: config.disabled ?? false,
      required: config.required ?? false,
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      name: config.name ?? '',
      showCalendar: config.showCalendar ?? true,
      highlightToday: config.highlightToday ?? true,
      today,
      weekStartsOn: config.weekStartsOn ?? 0,
      inputId: createId('obix-datepicker', config.id),
      ...view(start),
    },
    actions: {
      // opening puts the focus on the selected date, else today (APG date picker dialog), whatever was browsed before
      open: (state) => (state.disabled ? state : { open: true, ...view(clampISO(state.value ?? state.today, state.minDate, state.maxDate)) }),
      close: () => ({ open: false }),
      toggle: (state) => (state.disabled ? state : state.open ? { open: false } : { open: true, ...view(clampISO(state.value ?? state.today, state.minDate, state.maxDate)) }),
      // a date outside [min, max], or text that is not a calendar date, is refused (state unchanged)
      selectDate: (state, date: unknown) => {
        const iso = String(date ?? '');
        if (iso === '') return { value: null };
        if (parseISO(iso) === null || disabledDay(state, iso)) return state;
        return { value: iso, open: false, ...view(iso) };
      },
      clear: () => ({ value: null }),
      prevMonth: (state) => shiftMonth(state, -1),
      nextMonth: (state) => shiftMonth(state, 1),
      moveFocus: (state, days: unknown) => view(clampISO(addDays(state.focusedDate, Number(days) || 0), state.minDate, state.maxDate)),
      prevYear: (state) => shiftMonth(state, -12),
      nextYear: (state) => shiftMonth(state, 12),
      // Home / End: the first / last day of the week the focused day is in (the week starts on `weekStartsOn`)
      weekStart: (state) => view(clampISO(addDays(state.focusedDate, -weekOffset(state)), state.minDate, state.maxDate)),
      weekEnd: (state) => view(clampISO(addDays(state.focusedDate, 6 - weekOffset(state)), state.minDate, state.maxDate)),
      goToToday: (state) => view(clampISO(state.today, state.minDate, state.maxDate)),
    },
    aliases: { openCalendar: 'open', closeCalendar: 'close' },
    render: renderDatePicker,
    aria: ariaOf,
  });
}
