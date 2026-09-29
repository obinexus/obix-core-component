import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface AccordionItem {
  id: string;
  heading: string;
  /** HTML (trusted markup). */
  content: string;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export interface AccordionState {
  items: AccordionItem[];
  openIds: string[];
  allowMultiple: boolean;
  accordionId: string;
  label: string;
}

export interface AccordionConfig {
  /** `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpenIds?: string[];
  id?: string;
}

const ariaOf = (s: AccordionState): AriaAttributes => ({ role: 'group', 'aria-label': s.label });

function renderAccordion(s: AccordionState): string {
  const panels = s.items.map((item) => {
    const open = s.openIds.includes(item.id);
    const level = item.headingLevel ?? 3;
    const trigger = `<button${attrs({
      id: `${s.accordionId}-trigger-${item.id}`,
      class: 'obix-accordion__trigger',
      type: 'button',
      'data-jfix-strategy': 'fixed-size',
      'aria-expanded': String(open),
      'aria-controls': `${s.accordionId}-panel-${item.id}`,
      'data-item': item.id,
      'data-obix-on': 'click=toggle(@attr:data-item)',
    })}>${esc(item.heading)}<span aria-hidden="true">${open ? ' ▲' : ' ▼'}</span></button>`;
    const panel = `<div${attrs({ id: `${s.accordionId}-panel-${item.id}`, role: 'region', class: 'obix-accordion__panel', 'aria-labelledby': `${s.accordionId}-trigger-${item.id}`, hidden: !open })}>${open ? item.content : ''}</div>`;
    return `<div class="obix-accordion__item" data-obix-key="item-${esc(item.id)}"><h${level} class="obix-accordion__heading">${trigger}</h${level}>${panel}</div>`;
  }).join('');
  return `<div class="obix-accordion" role="group" aria-label="${esc(s.label)}">${panels}</div>`;
}

export function createAccordion(config: AccordionConfig): ObixComponent<AccordionState> {
  const known = (state: AccordionState, id: string): boolean => state.items.some((i) => i.id === id);
  return defineComponent<AccordionState>({
    name: 'ObixAccordion',
    state: {
      items: config.items,
      openIds: config.defaultOpenIds ?? [],
      allowMultiple: config.allowMultiple ?? false,
      accordionId: createId('obix-accordion', config.id),
      label: config.ariaLabel ?? config.label ?? 'Accordion',
    },
    actions: {
      toggle: (state, itemId: unknown) => {
        const id = String(itemId);
        if (!known(state, id)) return state;
        if (state.openIds.includes(id)) return { openIds: state.openIds.filter((i) => i !== id) };
        return { openIds: state.allowMultiple ? [...state.openIds, id] : [id] };
      },
      open: (state, itemId: unknown) => {
        const id = String(itemId);
        if (!known(state, id) || state.openIds.includes(id)) return state;
        return { openIds: state.allowMultiple ? [...state.openIds, id] : [id] };
      },
      close: (state, itemId: unknown) => ({ openIds: state.openIds.filter((i) => i !== String(itemId)) }),
      openAll: (state) => ({ openIds: state.allowMultiple ? state.items.map((i) => i.id) : state.openIds }),
      closeAll: () => ({ openIds: [] }),
    },
    aliases: { expand: 'open', collapse: 'close', expandAll: 'openAll', collapseAll: 'closeAll' },
    render: renderAccordion,
    aria: ariaOf,
  });
}
