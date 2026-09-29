import { describe, it, expect } from 'vitest';
import { createTable, createAccordion } from '../src/data/index.js';
import { validateFudCompliance } from '../src/policies/index.js';

const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'age', label: 'Age', sortable: true },
];
const rows = [{ name: 'Alice', age: 30 }, { name: 'Bob', age: 25 }];

describe('ObixTable', () => {
  it('has role=table and caption', () => {
    const table = createTable({ caption: 'Users', columns, rows });
    expect(table.aria.role).toBe('table');
    expect(table.aria['aria-label']).toBe('Users');
  });

  it('sortBy action sets sortColumn and ascending direction', () => {
    const table = createTable({ caption: 'Users', columns, rows });
    const next = table.actions['sortBy']!(table.state, 'name');
    expect(next.sortColumn).toBe('name');
    expect(next.sortDirection).toBe('ascending');
  });

  it('sortBy same column toggles direction to descending', () => {
    const table = createTable({ caption: 'Users', columns, rows });
    const asc = { ...table.state, sortColumn: 'name', sortDirection: 'ascending' as const };
    const desc = table.actions['sortBy']!(asc, 'name');
    expect(desc.sortDirection).toBe('descending');
  });

  it('render includes caption element', () => {
    const table = createTable({ caption: 'Users', columns, rows });
    const html = table.render(table.state);
    expect(html).toContain('<caption');
    expect(html).toContain('Users');
  });

  it('sortable columns get aria-sort attribute', () => {
    const table = createTable({ caption: 'Users', columns, rows });
    const html = table.render(table.state);
    expect(html).toContain('aria-sort="none"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createTable({ caption: 'Users', columns })).valid).toBe(true);
  });
});

describe('ObixAccordion', () => {
  const items = [
    { id: 'faq1', heading: 'What is OBIX?', content: 'OBIX is an accessible SDK.' },
    { id: 'faq2', heading: 'Is it WCAG compliant?', content: 'Yes, WCAG 2.1 AA.' },
  ];

  it('toggle action opens item', () => {
    const acc = createAccordion({ label: 'FAQ', items });
    const next = acc.actions['toggle']!(acc.state, 'faq1');
    expect(next.openIds).toContain('faq1');
  });

  it('toggle action closes already-open item', () => {
    const acc = createAccordion({ label: 'FAQ', items, defaultOpenIds: ['faq1'] });
    const next = acc.actions['toggle']!(acc.state, 'faq1');
    expect(next.openIds).not.toContain('faq1');
  });

  it('allowMultiple=false closes other items when opening', () => {
    const acc = createAccordion({ label: 'FAQ', items, defaultOpenIds: ['faq1'] });
    const next = acc.actions['toggle']!(acc.state, 'faq2');
    expect(next.openIds).toContain('faq2');
    expect(next.openIds).not.toContain('faq1');
  });

  it('allowMultiple=true keeps multiple open', () => {
    const acc = createAccordion({ label: 'FAQ', items, allowMultiple: true, defaultOpenIds: ['faq1'] });
    const next = acc.actions['toggle']!(acc.state, 'faq2');
    expect(next.openIds).toContain('faq1');
    expect(next.openIds).toContain('faq2');
  });

  it('render includes aria-expanded on trigger buttons', () => {
    const acc = createAccordion({ label: 'FAQ', items, defaultOpenIds: ['faq1'] });
    const html = acc.render(acc.state);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('passes validateFudCompliance', () => {
    expect(validateFudCompliance(createAccordion({ label: 'FAQ', items })).valid).toBe(true);
  });
});
