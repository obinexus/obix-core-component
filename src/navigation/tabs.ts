import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface TabItem {
  id: string;
  label: string;
  /** HTML shown in the panel of the selected tab. */
  content: string;
  disabled?: boolean;
}

export interface TabsState {
  tabs: TabItem[];
  activeId: string;
  /** Index of `activeId` (documented). */
  selectedIndex: number;
  /** Index of the tab that holds keyboard focus (documented). */
  focusedIndex: number;
  orientation: 'horizontal' | 'vertical';
  tablistId: string;
  label: string;
}

export interface TabsConfig {
  /** `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  tabs: TabItem[];
  /** `activeId` is the implemented name, `selected` the documented one. */
  activeId?: string;
  selected?: string;
  orientation?: 'horizontal' | 'vertical';
  vertical?: boolean;
  id?: string;
}

const ariaOf = (s: TabsState): AriaAttributes => ({ role: 'tablist', 'aria-label': s.label, 'aria-orientation': s.orientation });

function renderTabs(s: TabsState): string {
  const buttons = s.tabs.map((tab) => {
    const selected = tab.id === s.activeId;
    return `<button${attrs({
      id: `${s.tablistId}-tab-${tab.id}`,
      type: 'button',
      role: 'tab',
      class: 'obix-tabs__tab',
      'data-jfix-strategy': 'fixed-size',
      'aria-selected': String(selected),
      'aria-controls': `${s.tablistId}-panel-${tab.id}`,
      'aria-disabled': tab.disabled ? 'true' : undefined,
      tabindex: selected ? '0' : '-1',
      'data-tab': tab.id,
      'data-obix-on': 'click=selectTab(@attr:data-tab)',
    })}>${esc(tab.label)}</button>`;
  }).join('');
  const panels = s.tabs.map((tab) => {
    const selected = tab.id === s.activeId;
    return `<div${attrs({ id: `${s.tablistId}-panel-${tab.id}`, role: 'tabpanel', class: 'obix-tabs__panel', 'aria-labelledby': `${s.tablistId}-tab-${tab.id}`, tabindex: '0', hidden: !selected })}>${selected ? tab.content : ''}</div>`;
  }).join('');
  // Arrow keys, Home and End move focus between tabs and select as they go (automatic activation), all through the driver's roving behaviour.
  return `<div class="obix-tabs"><div${attrs({ id: s.tablistId, role: 'tablist', 'aria-label': s.label, 'aria-orientation': s.orientation, class: 'obix-tabs__tablist', 'data-obix-roving': s.orientation, 'data-obix-follow-focus': '' })}>${buttons}</div>` +
    `<div class="obix-tabs__panels">${panels}</div></div>`;
}

export function createTabs(config: TabsConfig): ObixComponent<TabsState> {
  const usable = (state: TabsState): number[] => state.tabs.map((t, i) => (t.disabled ? -1 : i)).filter((i) => i >= 0);
  const choose = (state: TabsState, index: number, select: boolean): Partial<TabsState> => {
    const tab = state.tabs[index];
    if (!tab || tab.disabled) return {};
    return select ? { activeId: tab.id, selectedIndex: index, focusedIndex: index } : { focusedIndex: index };
  };
  const step = (state: TabsState, delta: 1 | -1): number => {
    const ok = usable(state);
    if (!ok.length) return state.selectedIndex;
    const at = ok.indexOf(state.selectedIndex);
    return ok[(at < 0 ? (delta === 1 ? 0 : ok.length - 1) : (at + delta + ok.length) % ok.length)] as number;
  };
  const firstUsable = config.tabs.findIndex((t) => !t.disabled);
  const wanted = config.activeId ?? config.selected;
  const initial = Math.max(0, wanted !== undefined ? config.tabs.findIndex((t) => t.id === wanted) : firstUsable);
  return defineComponent<TabsState>({
    name: 'ObixTabs',
    state: {
      tabs: config.tabs,
      activeId: config.tabs[initial]?.id ?? '',
      selectedIndex: initial,
      focusedIndex: initial,
      orientation: config.orientation ?? (config.vertical ? 'vertical' : 'horizontal'),
      tablistId: createId('obix-tabs', config.id),
      label: config.label ?? config.ariaLabel ?? 'Tabs',
    },
    actions: {
      selectTab: (state, id: unknown) => {
        const index = state.tabs.findIndex((t) => t.id === String(id));
        return index < 0 ? state : choose(state, index, true);
      },
      // documented: move focus to a tab without selecting it
      focusTab: (state, id: unknown) => {
        const index = state.tabs.findIndex((t) => t.id === String(id));
        return index < 0 ? state : choose(state, index, false);
      },
      navigateNext: (state) => choose(state, step(state, 1), true),
      navigatePrev: (state) => choose(state, step(state, -1), true),
      navigateFirst: (state) => choose(state, usable(state)[0] ?? 0, true),
      navigateLast: (state) => choose(state, usable(state).at(-1) ?? 0, true),
    },
    aliases: { nextTab: 'navigateNext', prevTab: 'navigatePrev' },
    render: renderTabs,
    aria: ariaOf,
  });
}
