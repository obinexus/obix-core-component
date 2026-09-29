import type { AriaAttributes } from '../types/base.js';
import type { JfixStrategy } from '../types/jfix.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent, safeUrl } from '../kit/index.js';

export interface DropdownItem {
  id: string;
  label: string;
  href?: string;
  disabled?: boolean;
  /** A visual separator instead of an option. */
  divider?: boolean;
}

export interface DropdownState {
  open: boolean;
  items: DropdownItem[];
  activeIndex: number;
  selectedId: string | null;
  trigger: string;
  triggerIcon: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  /** Close after an item is chosen (documented, default true). */
  closeOnClick: boolean;
  listboxId: string;
  triggerId: string;
  jfixStrategy: JfixStrategy;
  label: string;
}

export interface DropdownConfig {
  /** The trigger text, or the documented `{ label, icon }`. */
  trigger: string | { label: string; icon?: string };
  items: Array<Omit<DropdownItem, 'id'> & { id?: string }>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  closeOnClick?: boolean;
  label?: string;
  ariaLabel?: string;
  jfixStrategy?: JfixStrategy;
  id?: string;
}

const isOption = (item: DropdownItem): boolean => !item.divider && !item.disabled;

const ariaOf = (s: DropdownState): AriaAttributes => ({
  role: 'listbox',
  'aria-label': s.label,
  'aria-expanded': s.open,
  'aria-haspopup': 'listbox',
});

const optionId = (s: DropdownState, item: DropdownItem): string => `${s.listboxId}-item-${item.id}`;

function renderDropdown(s: DropdownState): string {
  const active = s.items[s.activeIndex];
  const options = s.items.map((item, i) => {
    if (item.divider) return '<div class="obix-dropdown__divider" aria-hidden="true"></div>';
    return `<div${attrs({
      id: optionId(s, item),
      role: 'option',
      class: cx('obix-dropdown__item', i === s.activeIndex && 'obix-dropdown__item--active'),
      'data-jfix-strategy': s.jfixStrategy,
      'aria-selected': String(item.id === s.selectedId),
      'aria-disabled': item.disabled ? 'true' : undefined,
      'data-index': String(i),
      'data-obix-on': item.disabled ? undefined : 'click=selectItem(@attr:data-index)',
    })}>${item.href ? `<a${attrs({ href: safeUrl(item.href) ?? '#' })} tabindex="-1">${esc(item.label)}</a>` : esc(item.label)}</div>`;
  }).join('');
  // Select-only combobox pattern (WAI-ARIA APG): focus stays on the trigger, `aria-activedescendant` names the active option.
  const keys = 'keydown:ArrowDown=next!; keydown:ArrowUp=prev!; keydown:Home=first!; keydown:End=last!; keydown:Enter=commit!; keydown:Space=commit!; keydown:Escape=close!; click=toggle';
  return `<div${attrs({ class: cx('obix-dropdown', 'jfix-dropdown', `obix-dropdown--${s.placement}`), 'data-jfix-strategy': s.jfixStrategy })}>` +
    `<button${attrs({ id: s.triggerId, class: 'obix-dropdown__trigger', type: 'button', role: 'combobox', 'aria-haspopup': 'listbox', 'aria-expanded': String(s.open), 'aria-controls': s.listboxId, 'aria-label': s.label,
      'aria-activedescendant': s.open && active && isOption(active) ? optionId(s, active) : undefined, 'data-obix-on': keys })}>${esc(s.trigger)}${s.triggerIcon ? ` <span aria-hidden="true">${esc(s.triggerIcon)}</span>` : ''} <span aria-hidden="true">${s.open ? '▲' : '▼'}</span></button>` +
    `<div${attrs({ id: s.listboxId, role: 'listbox', class: 'obix-dropdown__list jfix-dropdown-content', 'aria-labelledby': s.triggerId, hidden: !s.open, 'data-obix-keep-focus': '', 'data-obix-dismiss': s.open ? 'close' : undefined })}>${options}</div></div>`;
}

export function createDropdown(config: DropdownConfig): ObixComponent<DropdownState> {
  const id = createId('obix-dropdown', config.id);
  const trigger = typeof config.trigger === 'string' ? { label: config.trigger, icon: '' } : { label: config.trigger.label, icon: config.trigger.icon ?? '' };
  const items: DropdownItem[] = config.items.map((item, i) => ({ ...item, id: item.id ?? `${item.divider ? 'divider' : 'item'}-${i}` }));
  const options = (s: DropdownState): number[] => s.items.map((item, i) => (isOption(item) ? i : -1)).filter((i) => i >= 0);
  const move = (s: DropdownState, delta: 1 | -1): Partial<DropdownState> => {
    const ok = options(s);
    if (!ok.length) return {};
    const at = ok.indexOf(s.activeIndex);
    return { open: true, activeIndex: ok[Math.min(ok.length - 1, Math.max(0, at < 0 ? (delta === 1 ? 0 : ok.length - 1) : at + delta))] as number };
  };
  return defineComponent<DropdownState>({
    name: 'ObixDropdown',
    state: {
      open: false,
      items,
      activeIndex: -1,
      selectedId: null,
      trigger: trigger.label,
      triggerIcon: trigger.icon,
      placement: config.placement ?? 'bottom',
      closeOnClick: config.closeOnClick ?? true,
      listboxId: `${id}-listbox`,
      triggerId: `${id}-trigger`,
      jfixStrategy: config.jfixStrategy ?? 'transform-scale',
      label: config.ariaLabel ?? config.label ?? trigger.label,
    },
    actions: {
      open: (s) => ({ open: true, activeIndex: options(s)[0] ?? -1 }),
      close: () => ({ open: false, activeIndex: -1 }),
      toggle: (s) => (s.open ? { open: false, activeIndex: -1 } : { open: true, activeIndex: options(s)[0] ?? -1 }),
      selectItem: (s, index: unknown) => {
        const item = s.items[Number(index)];
        if (!item || !isOption(item)) return s;
        return { selectedId: item.id, ...(s.closeOnClick ? { open: false, activeIndex: -1 } : {}) };
      },
      // the keyboard: ArrowDown/ArrowUp open the list and move the active option
      next: (s) => {
        if (s.open) return move(s, 1);
        const selected = s.items.findIndex((it) => it.id === s.selectedId && isOption(it));
        return { open: true, activeIndex: selected >= 0 ? selected : options(s)[0] ?? -1 };
      },
      prev: (s) => (s.open ? move(s, -1) : { open: true, activeIndex: options(s).at(-1) ?? -1 }),
      first: (s) => ({ open: true, activeIndex: options(s)[0] ?? -1 }),
      last: (s) => ({ open: true, activeIndex: options(s).at(-1) ?? -1 }),
      // Enter / Space: open, or choose the active option
      commit: (s) => {
        if (!s.open) return { open: true, activeIndex: options(s)[0] ?? -1 };
        const item = s.items[s.activeIndex];
        return item && isOption(item) ? { selectedId: item.id, ...(s.closeOnClick ? { open: false, activeIndex: -1 } : {}) } : { open: false, activeIndex: -1 };
      },
      navigateNext: (s) => move(s, 1),
      navigatePrev: (s) => move(s, -1),
      navigateFirst: (s) => ({ activeIndex: options(s)[0] ?? -1 }),
      navigateLast: (s) => ({ activeIndex: options(s).at(-1) ?? -1 }),
      focusItem: (s, index: unknown) => {
        const item = s.items[Number(index)];
        return item && isOption(item) ? { activeIndex: Number(index) } : s;
      },
      setJfixStrategy: (_s, strategy: unknown) => ({ jfixStrategy: strategy as JfixStrategy }),
    },
    aliases: { focusNext: 'navigateNext', focusPrev: 'navigatePrev' },
    render: renderDropdown,
    aria: ariaOf,
    focusConfig: { trapFocus: false, restoreFocus: true, focusVisible: true },
  });
}
