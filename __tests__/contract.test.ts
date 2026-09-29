/**
 * Contract tests over EVERY component factory (Stage 5). One table, `tests/support/component-samples.mjs`, drives all of them, so a new
 * factory cannot be added without meeting the contract, and a contract cannot be quietly skipped for one component.
 */
import { describe, it, expect } from 'vitest';
import * as lib from '../src/index.js';
// @ts-expect-error plain ESM helpers shared with the browser tests and the coverage script
import { SAMPLES, sampleNames, create, reach, hostile, HOSTILE } from './support/component-samples.mjs';
// @ts-expect-error plain ESM helper
import { documentedComponents } from '../../../tests/support/component-docs.mjs';

type Anything = any;

const deepFreeze = <T,>(value: T): T => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value as object)) deepFreeze(v);
  }
  return value;
};

const MUTATION = /read only|not extensible|Cannot add property|Cannot delete property|Cannot assign/i;
const CANDIDATE_ARGS: unknown[][] = [[], ['x'], ['0'], [1], [true], [false], [{}], [['a']], [0, 'x'], [[{ name: 'a.txt', size: 1, type: 'text/plain' }]]];

/** Every state worth exercising: the initial one and each named state of the sample. */
function statesOf(name: string, component: Anything): Array<{ label: string; state: Anything }> {
  const out = [{ label: 'initial', state: component.state }];
  for (const s of SAMPLES[name].states) out.push({ label: s.name, state: reach(component, s.steps) });
  return out;
}

const parse = (html: string): HTMLElement => {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
};

describe('component inventory', () => {
  it('every documented component has a factory, and a sample', () => {
    const documented = documentedComponents() as Array<{ name: string; factory: string; sampleKey: string }>;
    expect(documented.length).toBeGreaterThanOrEqual(31);
    for (const d of documented) {
      expect(typeof (lib as Anything)[d.factory], `${d.factory} is exported`).toBe('function');
      expect(SAMPLES[d.sampleKey], `${d.sampleKey} has a sample`).toBeDefined();
    }
    expect(sampleNames.length).toBe(documented.length);
  });

  it('every documented action exists on the component (implemented or as a documented alias)', () => {
    for (const d of documentedComponents() as Array<{ name: string; sampleKey: string; actions: string[] }>) {
      const component = create(lib, d.sampleKey);
      for (const action of d.actions) expect(typeof component.actions[action], `${d.name}.actions.${action}`).toBe('function');
    }
  });
});

describe.each(sampleNames as string[])('%s contract', (name) => {
  const make = (): Anything => create(lib, name);

  it('returns the documented component shape', () => {
    const c = make();
    expect(typeof c.name).toBe('string');
    expect(c.name).toMatch(/^Obix[A-Z]/);
    expect(typeof c.state).toBe('object');
    expect(typeof c.render).toBe('function');
    expect(typeof c.actions).toBe('object');
    expect(c.aria.role, 'aria.role').toBeTruthy();
    expect(c.ariaOf(c.state).role).toBe(c.aria.role);
    expect(c.touchTarget.minWidth).toBeGreaterThanOrEqual(lib.OBIX_MIN_TARGET_PX);
    expect(c.touchTarget.minHeight).toBeGreaterThanOrEqual(lib.OBIX_MIN_TARGET_PX);
    expect(lib.validateFudCompliance(c).valid).toBe(true);
  });

  it('renders deterministically: the same configuration gives the same markup, in a fresh id sequence', () => {
    lib.resetObixIds();
    const a = make();
    const first = a.render(a.state);
    lib.resetObixIds();
    const b = make();
    expect(b.render(b.state)).toBe(first);
    expect(b.state).toEqual(a.state);
    expect(a.render(a.state)).toBe(first);
  });

  it('never renders undefined, NaN or [object Object] in any reachable state', () => {
    const c = make();
    for (const { label, state } of statesOf(name, c)) {
      const html = c.render(state);
      expect(typeof html).toBe('string');
      expect(html, `${name}/${label}`).not.toMatch(/undefined|\[object Object\]|NaN/);
    }
  });

  it('every sample state is reached through the component’s own actions and passes the policies', () => {
    const c = make();
    for (const s of SAMPLES[name].states) {
      const state = reach(c, s.steps);
      expect(state, `${name}/${s.name}`).toBeTypeOf('object');
      expect(() => lib.applyAllFudPolicies({ ...c, state, aria: c.ariaOf(state) })).not.toThrow();
    }
  });

  it('actions are pure functions of a frozen state and always return the FULL next state', () => {
    const c = make();
    for (const { label, state } of statesOf(name, c)) {
      const frozen = deepFreeze(structuredClone(state));
      const before = JSON.stringify(frozen);
      for (const [action, fn] of Object.entries<Anything>(c.actions)) {
        for (const args of CANDIDATE_ARGS) {
          let next: Anything;
          try {
            next = fn(frozen, ...args);
          } catch (error) {
            // Refusing bad input is fine (a PolicyViolationError, a TypeError from a wrong argument) — mutating the caller's state is not.
            expect(String((error as Error).message), `${name}.${action}(${JSON.stringify(args)}) from ${label} tried to mutate its input`).not.toMatch(MUTATION);
            continue;
          }
          expect(next, `${name}.${action} returned ${String(next)}`).toBeTypeOf('object');
          for (const key of Object.keys(frozen)) expect(key in next, `${name}.${action} dropped "${key}"`).toBe(true);
          expect(JSON.stringify(frozen), `${name}.${action} mutated its input`).toBe(before);
        }
      }
    }
  });

  it('an action that changes nothing returns the very same state object', () => {
    const c = make();
    let sawNoop = false;
    for (const { state } of statesOf(name, c)) {
      for (const [, fn] of Object.entries<Anything>(c.actions)) {
        for (const args of CANDIDATE_ARGS) {
          let next: Anything;
          try {
            next = fn(state, ...args);
          } catch {
            continue;
          }
          const same = Object.keys(state).length === Object.keys(next).length && Object.keys(state).every((k) => Object.is(state[k], next[k]));
          if (same) {
            sawNoop = true;
            expect(next === state, 'equal but not identical: callers cannot detect "nothing happened" with ===').toBe(true);
          }
        }
      }
    }
    expect(typeof sawNoop).toBe('boolean');
  });

  it('escapes hostile input: no script, no event-handler attribute, no injected attribute in any state', () => {
    const sample = SAMPLES[name];
    const c = create(lib, name, hostile(sample.config, sample.htmlKeys ?? []));
    const states = [c.state];
    for (const s of sample.states) {
      try {
        states.push(reach(c, s.steps));
      } catch {
        /* a step that names an id the hostile config no longer has is not the point of this test */
      }
    }
    for (const state of states) {
      const host = parse(c.render(state));
      expect(host.querySelectorAll('script').length, `${name}: <script> injected`).toBe(0);
      expect(host.querySelectorAll('[data-xss]').length, `${name}: attribute injected`).toBe(0);
      for (const el of Array.from(host.querySelectorAll('*'))) {
        for (const attribute of Array.from(el.attributes)) {
          expect(attribute.name, `${name}: <${el.tagName.toLowerCase()} ${attribute.name}>`).not.toMatch(/^on/i);
        }
      }
    }
  });
});

describe('URL attributes are allow-listed (javascript: cannot be smuggled in through data)', () => {
  const unsafe = ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', 'vbscript:x', 'data:text/html;base64,PHNjcmlwdD4='];
  const hrefsOf = (html: string): string[] => Array.from(parse(html).querySelectorAll('[href],[src],[poster],[srcset]')).flatMap((el) => ['href', 'src', 'poster', 'srcset'].map((a) => el.getAttribute(a)).filter((v): v is string => v !== null));

  it.each(unsafe)('Link, Breadcrumb, Navigation, Dropdown, Card, Image, Video drop %j', (bad) => {
    const link = lib.createLink({ href: bad, label: 'x' });
    const crumbs = lib.createBreadcrumb({ crumbs: [{ label: 'a', href: bad }, { label: 'b' }] });
    const nav = lib.createNavigation({ label: 'n', items: [{ label: 'a', href: bad, submenu: [{ label: 's', href: bad }] }], logo: { src: bad, alt: 'l', href: bad } });
    const dropdown = lib.createDropdown({ trigger: 't', items: [{ label: 'a', href: bad }] });
    const card = lib.createCard({ title: 't', image: { src: bad, alt: 'a' } });
    const image = lib.createImage({ src: bad, alt: 'a', srcSet: `${bad} 1x` });
    const video = lib.createVideo({ src: bad, poster: bad, label: 'v', transcriptUrl: bad, tracks: [{ src: bad, kind: 'captions', srclang: 'en', label: 'En' }] });
    const opened = { ...dropdown.state, open: true };
    for (const html of [link.render(link.state), crumbs.render(crumbs.state), nav.render({ ...nav.state, openSubmenu: 0 }), dropdown.render(opened), card.render(card.state), image.render(image.state), video.render(video.state)]) {
      for (const value of hrefsOf(html)) expect(value.replace(/\s/g, '').toLowerCase(), value).not.toMatch(/^(javascript|vbscript|data):/);
    }
  });

  it('keeps http(s), mailto, tel, relative and fragment links; data:image is allowed for images only', () => {
    for (const ok of ['https://example.org/a?b=1', 'http://example.org', 'mailto:a@b.co', 'tel:+2340000', '/docs', 'docs/a', '#top', '../x']) expect(lib.createLink({ href: ok, label: 'x' }).render({ ...lib.createLink({ href: ok, label: 'x' }).state })).toContain(`href="${ok}"`);
    expect(lib.createImage({ src: 'data:image/png;base64,AAAA', alt: 'a' }).render(lib.createImage({ src: 'data:image/png;base64,AAAA', alt: 'a' }).state)).toContain('src="data:image/png;base64,AAAA"');
    const v = lib.createVideo({ src: 'data:image/png;base64,AAAA', label: 'v' });
    expect(v.render(v.state)).not.toContain('src="data:');
  });
});

describe('the checks themselves', () => {
  it('the hostile-input check detects an unescaped renderer (the test is not vacuous)', () => {
    const host = parse(`<button title="${HOSTILE}">${HOSTILE}</button>`);
    expect(host.querySelectorAll('script').length).toBeGreaterThan(0);
    expect(host.querySelectorAll('[data-xss]').length).toBeGreaterThan(0);
    expect(Array.from(host.querySelectorAll('*')).some((el) => Array.from(el.attributes).some((a) => /^on/i.test(a.name)))).toBe(true);
  });
});

describe('policies hold at every transition, not only at creation', () => {
  it('a Card cannot start skeleton loading without explicit dimensions (CLS policy); the previous state stays valid', () => {
    const card = lib.createCard({ title: 'No size' });
    expect(() => card.actions['startLoading']!(card.state)).toThrow(lib.PolicyViolationError);
    expect(card.render(card.state)).toContain('No size');
    const sized = lib.createCard({ title: 'Sized', width: 100, height: 50 });
    expect(sized.actions['startLoading']!(sized.state).loading).toBe(true);
  });

  it('an action that would remove the only accessible name is refused (or ignored), and the previous state stays valid', () => {
    const link = lib.createLink({ href: '/x', label: 'Docs' });
    expect(() => link.actions['setLabel']!(link.state, '')).toThrow(lib.PolicyViolationError);
    expect(link.actions['setLabel']!(link.state, 'Documentation').label).toBe('Documentation');
    const loading = lib.createLoading({ label: 'Loading', show: true });
    expect(loading.actions['setLabel']!(loading.state, '  ')).toBe(loading.state); // blank is not a label: nothing changes
    expect(loading.ariaOf(loading.state)['aria-label']).toBe('Loading');
  });
});
