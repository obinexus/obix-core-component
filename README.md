# obix-core-component

> Previous name: `@obinexusltd/obix-core-component` — OBIX packages are named without an npm scope since decision D-102 (2026-09-29); the package, its version and its exports are unchanged.

**The OBIX component library: 31 accessible UI components as plain data (`state`, `actions`, `render`), FUD policy enforcement, and the jfix stylesheet.** No framework, no virtual DOM, no runtime dependencies. Components render to HTML strings, so the same code serves a server response, an HTMX partial, or a browser mount through [`obix-driver-dom`](https://github.com/obinexus/obix-driver-dom/blob/main/README.md).

> Recovered package. What changed against the upstream sources, and why, is recorded in `docs/recovery/api-deltas.md` (OBIX monorepo record) (rows 24–43) and `docs/recovery/source-decisions.md` (OBIX monorepo record) (D-29 … D-32). The historical "30 components", "WCAG 2.1 AA compliant by default" and byte-budget claims are **not** repeated here: this file states only what the tests in this repository check.

```bash
npm install obix-core-component
```

## Quick start

```ts
import { createButton } from 'obix-core-component';

const button = createButton({ label: 'Mute', toggle: true });

let state = button.state;                       // { label: 'Mute', pressed: false, … }
state = button.actions.toggle(state);           // the FULL next state; `state` before is untouched
button.render(state);                           // '<button type="button" class="obix-button …" … aria-pressed="true">Mute</button>'
```

On a server, send the string. In a browser, let the driver own the DOM (focus, caret and scroll survive renders; behaviour the component declares — keys, focus, timers — just works):

```ts
import { createTabs } from 'obix-core-component';
import { mount } from 'obix-driver-dom';
import 'obix-core-component/styles';

const tabs = createTabs({ label: 'Settings', tabs: [
  { id: 'general', label: 'General', content: '<p>…</p>' },
  { id: 'privacy', label: 'Privacy', content: '<p>…</p>' },
] });
const view = mount(document.getElementById('app'), tabs);   // arrows, Home/End, roving tabindex: declared by the tabs' markup
view.unmount();
```

## The component contract

Every factory returns `{ name, state, actions, render, aria, ariaOf, touchTarget, focusConfig, reducedMotionConfig }` (`loadingState` when the component has one) and is built by one assembler, `defineComponent` (`src/kit/component.ts`), which guarantees for **all 31** — checked by `__tests__/contract.test.ts`:

- **Actions are `(state, ...args) ⇒ full next state`.** The result contains every key of the state; the input object is never mutated; an action that changes nothing returns the very same object (`next === state`), so "nothing happened" is detectable.
- **Policies hold at every transition, not only at creation.** After each action the FUD policies run on the next state; a transition that would leave the component inaccessible (e.g. blanking the only accessible name of a `Link`) throws `PolicyViolationError` and the previous state stays valid. `aria` is the snapshot for the initial state; `ariaOf(state)` is the live view.
- **Rendering is a pure, deterministic function of state.** Element ids come from per-prefix counters (`createId`; restart with `resetObixIds()`, or pin one with the config `id`), never `Math.random()` or a clock. `today`-style inputs are read once at creation.
- **Documented names are honoured.** The configuration keys and actions Part 2 of the documentation lists are all accepted (245 / 245 keys, 138 / 138 actions — computed by `npm run check:components`, see `component-coverage.md` (OBIX monorepo record: `docs/recovery/component-coverage.md`)); where the implemented name differs, the documented one is a declared alias (`Table` `headers`↔`columns`, `Accordion` `expand`↔`open`, `Search` `setValue`↔`setQuery`, …).
- **Actions are named by the caller, never guessed from arity.** The driver dispatches `component.actions[name](state, ...args)`.

`validateFudCompliance(component)` returns `{ valid, compliant, violations, warnings }` (both name sets: the documented and the published Gen‑2 ones). `BaseComponentDef` is exported as the name of the definition the policies accept.

## The components

| Family | Factories |
|---|---|
| Primitives | `createButton`, `createCard`, `createImage`, `createVideo`, `createLink` |
| Forms | `createInput`, `createCheckbox`, `createRadioGroup`, `createSelect`, `createTextarea`, `createForm`, `createDatePicker`, `createFileUpload` |
| Navigation | `createNavigation`, `createBreadcrumb`, `createPagination`, `createTabs`, `createStepper` |
| Overlays | `createModal`, `createDropdown`, `createTooltip` |
| Feedback | `createAlert`, `createToast`, `createProgress`, `createLoading` |
| Controls | `createSlider`, `createSwitch` |
| Data | `createTable`, `createAccordion` |
| Search | `createSearch`, `createAutocomplete` |

Each family is also an entry point (`/primitives`, `/forms`, `/navigation`, `/overlays`, `/feedback`, `/controls`, `/data`, `/search`); the root re-exports everything. The package is `sideEffects: false`, so an application that imports two components bundles two.

Choices worth knowing (each follows the WAI-ARIA Authoring Practices pattern of its role, or is the native element, and is exercised with real key presses in Edge — see *Verification*; the APG text consulted is in `docs/recovery/research.md` R-09…R-16): `Slider` is a native `<input type="range">`, `Switch` a `<button role="switch">`, `Dropdown` a select-only combobox (DOM focus stays on the trigger, `aria-activedescendant` points at the option), `Autocomplete` an ARIA 1.2 editable combobox (Enter is bound only while an option is highlighted, so a surrounding form still submits), `Modal` and the `DatePicker` calendar are dialogs with a focus trap, Escape and focus return, `Tabs` use roving `tabindex` with automatic activation, `Accordion` is a disclosure, `Toast` and `Tooltip` timers are declared in markup and run by the driver (`Tooltip` supports `delay` and `closeDelay`; a Toast pauses while hovered or focused).

## Styling

```ts
import 'obix-core-component/styles';        // compiled CSS  (36 KB, 5.9 KB gzip)
// or, in a Sass build, the one self-contained source file (tokens are Sass variables):
//   node_modules/obix-core-component/src/styles/jfix.scss   (also exported as ./styles/scss)
```

`jfix.scss` styles the markup of all 31 components (`npm run check:styles` renders every component in every sample state and fails on a rendered class that has neither a rule nor a documented reason), keeps a visible 3 px focus ring on every interactive element, honours `prefers-reduced-motion`, makes the `hidden` attribute always win, and provides `.obix-visually-hidden` (alias `.obix-sr-only`). Every foreground/background pair was checked against WCAG 1.4.3 (text 4.5 : 1) and 1.4.11 (controls 3 : 1); six pairs that failed upstream were darkened and are named in the file header. Hover behaviour follows the jfix strategies, selectable per element with `data-jfix-strategy` (`transform-scale`, `box-shadow`, `fixed-size`) — the point of jfix is that hovering never shifts layout.

## FUD policies

`applyAllFudPolicies(component)` runs the five policies; `validateFudCompliance` reports instead of throwing.

| Policy | Enforces |
|---|---|
| `applyAccessibilityPolicy` | an ARIA `role`; an accessible name (`aria-label` or `aria-labelledby`) for roles that need one |
| `applyTouchTargetPolicy` | interactive targets ≥ **48 × 48 CSS px** — the **OBIX design policy** (`OBIX_MIN_TARGET_PX`). It is stricter than the standards it is often confused with: WCAG 2.2 SC 2.5.8 Target Size (Minimum) asks 24 px at level AA, and SC 2.5.5 Target Size (Enhanced) asks 44 px at level AAA. 44 px is refused. |
| `applyFocusPolicy` | a visible focus indicator and focus management configuration |
| `applyLoadingPolicy` | a skeleton state must carry explicit dimensions (layout-shift prevention): `createCard({ title })` without `width`/`height` cannot `startLoading` |
| `applyReducedMotionPolicy` | motion configuration respects `prefers-reduced-motion` |

## What may reach the markup

Every dynamic value is escaped (`esc`, `attrs`). URL attributes (`href`, `src`, `poster`, `srcset`, `<track src>`) are allow-listed by `safeUrl`/`safeSrcSet`: relative references, `#`, `http:`, `https:`, `mailto:`, `tel:` for links; relative, `http:`, `https:`, `blob:` for media; `data:image/*` for images only. `javascript:` (however it is spelled, tabs and newlines inside the scheme included) is dropped. The one deliberate exception is the documented **HTML slot** — the `content` of `Card`, `Modal`, `Tabs`, `Stepper` and `Accordion`, and the `Form` body: it is trusted markup, so escape untrusted text before it gets there.

## Verification

| What | How | Result (this repository, Node 26.7, Edge 153) |
|---|---|---|
| Contract over every component | `__tests__/contract.test.ts` — shape, determinism, no `undefined`/`NaN` in any reachable state, frozen-input purity with hostile arguments, identity on no-op, hostile-input escaping (parsed with a DOM parser; the probe itself is checked against an unescaped renderer), URL allow-list | 31 components, all pass |
| Behaviour | `__tests__/*.test.ts` (unit) | 433 tests |
| Real keyboard and pointer | `tests/browser/components-interaction.browser.test.mjs` — Playwright drives Edge: tabs, dialog, combobox, menu button, disclosure, switch, slider, date picker, table sort, tooltip and toast timers, touch targets ≥ 48 px in the rendered page | 29 tests, all pass |
| Automated accessibility scan | `tests/browser/components-a11y.browser.test.mjs` — axe-core 4.13.0 (WCAG 2 A/AA, 2.1, 2.2 AA and best-practice rules) over 31 components in 77 states at 1280 × 800 and 375 × 812 | 0 violations; axe reports 41 "needs review" nodes (glyph-only icons for contrast, `aria-controls` to hidden popups, a fallback link inside `<video>`), listed in `a11y-automated.json` (OBIX monorepo record: `docs/recovery/a11y-automated.json`) |

**Not performed, and not claimed:** manual keyboard walk-throughs and screen-reader testing (NVDA, JAWS, VoiceOver, TalkBack); Chrome, Firefox and WebKit (only Edge/Chromium was available); automated tools find a minority of accessibility problems, so a clean scan is not a conformance statement.

## Known limitations

- `Dropdown` has no hover-to-open mode (documented `trigger: 'hover'`): a menu that opens on hover cannot be operated from a keyboard or a touch screen. `Tooltip` accepts a documented element/selector `trigger` but a string renderer cannot attach to elements it does not own — use `triggerText` or `triggerId`.
- Components render **strings**. There is no hydration and no streaming server renderer.
- The upstream Gen‑2 event-descriptor call shapes of `createButton`/`createInput`/`createCard`/`createModal` (`actions.click()` → `{ type: 'CLICKED' }`) are not preserved (D-29; they could not be mounted).

## Measured size

Whole barrel bundled and minified with esbuild: 82 KB, 23.8 KB gzip (all 31 components, the policies and the adapter — a real application imports far less). Driver: 17.0 KB, 6.7 KB gzip. Stylesheet: 36.2 KB, 5.9 KB gzip. (Measured with `tests/support/browser.mjs` `bundle(..., { minify: true })` on this build; no historical budget is claimed.)

## JSX and paradigm adapters

`obix-core-component/jsx-runtime` provides the classic `h`/`Fragment` hyperscript factory over these components (JSX stays optional; there is no React). `createObixAdapter`, `toFunctional`, `toOOP` and `toReactive` project a component into the functional, object-oriented and reactive paradigms; the full-state actions make them plain merges.

## License

MIT — OBINexus <okpalan@protonmail.com>

<!-- obix-release:begin — generated by scripts/release/prepare.mjs; edit the text above this line -->

## Installation

```bash
npm install obix-core-component
```

## API surface

- `obix-core-component` — 65 value exports: `DEFAULT_FOCUS_CONFIG`, `DEFAULT_JFIX_STRATEGY`, `DEFAULT_REDUCED_MOTION`, `DEFAULT_TOUCH_TARGET`, `JFIX_CLASS_MAP`, `JFIX_STRATEGIES`, `OBIX_MIN_TARGET_PX`, `PolicyViolationError`, `TOKENS`, `applyAccessibilityPolicy`, `applyAllFudPolicies`, `applyFocusPolicy`, `applyLoadingPolicy`, `applyReducedMotionPolicy`, `applyTouchTargetPolicy`, `createAccordion`, `createAlert`, `createAutocomplete`, `createBreadcrumb`, `createButton`, `createCard`, `createCheckbox`, `createDatePicker`, `createDropdown`, `createFileUpload`, `createFocusTrap`, `createForm`, `createId`, `createImage`, `createInput`, `createLink`, `createLoading`, `createModal`, `createNavigation`, `createObixAdapter`, `createPagination`, `createProgress`, `createRadioGroup`, `createSearch`, `createSelect`, … (25 more)
- `obix-core-component/styles` — asset `./dist/styles/jfix.css`
- `obix-core-component/styles/scss` — asset `./src/styles/jfix.scss`
- `obix-core-component/primitives` — 5 value exports: `createButton`, `createCard`, `createImage`, `createLink`, `createVideo`
- `obix-core-component/forms` — 8 value exports: `createCheckbox`, `createDatePicker`, `createFileUpload`, `createForm`, `createInput`, `createRadioGroup`, `createSelect`, `createTextarea`
- `obix-core-component/navigation` — 5 value exports: `createBreadcrumb`, `createNavigation`, `createPagination`, `createStepper`, `createTabs`
- `obix-core-component/overlays` — 5 value exports: `createDropdown`, `createFocusTrap`, `createModal`, `createTooltip`, `getFocusableElements`
- `obix-core-component/feedback` — 4 value exports: `createAlert`, `createLoading`, `createProgress`, `createToast`
- `obix-core-component/controls` — 2 value exports: `createSlider`, `createSwitch`
- `obix-core-component/data` — 3 value exports: `createAccordion`, `createTable`, `sortedRows`
- `obix-core-component/search` — 4 value exports: `createAutocomplete`, `createSearch`, `resultsMessage`, `visibleSuggestions`
- `obix-core-component/jsx-runtime` — 4 value exports: `Fragment`, `h`, `jsx`, `jsxs`
- `obix-core-component/jsx-dev-runtime` — 2 value exports: `Fragment`, `jsxDEV`
- Type declarations: `./dist/index.d.ts` (and a declaration next to every JS entry point).

## Architecture role

`obix-core-component` is a **public building block**: the umbrella `obix` depends on it and re-exports its stable API, so applications normally reach it through `obix`; it can also be installed on its own.

The architecture of OBIX — the package families and which packages are public API — is indexed in the umbrella: [docs/architecture.md](https://github.com/obinexus/obix/blob/main/docs/architecture.md).

## Package relationships

- Depends on (OBIX): no other OBIX package.
- Used by (OBIX): [`obix-binding-jsx`](https://github.com/obinexus/obix-binding-jsx), [`obix-component-alert`](https://github.com/obinexus/obix-component-alert), [`obix-component-button`](https://github.com/obinexus/obix-component-button), [`obix-component-card`](https://github.com/obinexus/obix-component-card), [`obix-component-checkbox`](https://github.com/obinexus/obix-component-checkbox), [`obix-component-datepicker`](https://github.com/obinexus/obix-component-datepicker), [`obix-component-dropdown`](https://github.com/obinexus/obix-component-dropdown), [`obix-component-fileupload`](https://github.com/obinexus/obix-component-fileupload), [`obix-component-form`](https://github.com/obinexus/obix-component-form), [`obix-component-image`](https://github.com/obinexus/obix-component-image), [`obix-component-input`](https://github.com/obinexus/obix-component-input), [`obix-component-link`](https://github.com/obinexus/obix-component-link), [`obix-component-loading`](https://github.com/obinexus/obix-component-loading), [`obix-component-modal`](https://github.com/obinexus/obix-component-modal), [`obix-component-progress`](https://github.com/obinexus/obix-component-progress), [`obix-component-radiogroup`](https://github.com/obinexus/obix-component-radiogroup), [`obix-component-runtime`](https://github.com/obinexus/obix-component-runtime), [`obix-component-select`](https://github.com/obinexus/obix-component-select), [`obix-component-textarea`](https://github.com/obinexus/obix-component-textarea), [`obix-component-toast`](https://github.com/obinexus/obix-component-toast), [`obix-component-tooltip`](https://github.com/obinexus/obix-component-tooltip), [`obix-component-video`](https://github.com/obinexus/obix-component-video), [`obix`](https://github.com/obinexus/obix).

## Testing

- 14 test files ship in the npm package (`__tests__/`): the evidence of the package's contract, published so that its verification can be inspected — not runtime code (no entry point reaches them).
- **Standalone**: 13 of 14 — they read nothing outside the package.
- **Need the OBIX development / test harness**: 1 — it reads the OBIX monorepo's shared harness, oracles or fixtures, so it does **not** run from an npm install or from this package's repository alone; it is shipped for inspection and provenance:
  - `__tests__/contract.test.ts` — reads ../../../tests/support/component-docs.mjs, outside the package
- Run them with `npm test` (`vitest run`) in the OBIX monorepo, which provides the test tooling (Node's test runner, Vitest, TypeScript) and the harness.

## Documentation

- [docs/OBIX_COMPONENT_DOCUMENTATION_PART1.md](docs/OBIX_COMPONENT_DOCUMENTATION_PART1.md)
- [docs/OBIX_COMPONENT_DOCUMENTATION_PART2.md](docs/OBIX_COMPONENT_DOCUMENTATION_PART2.md)
- [docs/OBIX_COMPONENT_DOCUMENTATION_PART3.md](docs/OBIX_COMPONENT_DOCUMENTATION_PART3.md)
- [docs/OBIX_COMPONENT_DOCUMENTATION_PART4.md](docs/OBIX_COMPONENT_DOCUMENTATION_PART4.md)
- [CHANGELOG.md](CHANGELOG.md)
- The OBIX architecture index: [obix/docs/architecture.md](https://github.com/obinexus/obix/blob/main/docs/architecture.md)

## Repository

- https://github.com/obinexus/obix-core-component — `git@github.com:obinexus/obix-core-component.git`
- Issues: https://github.com/obinexus/obix-core-component/issues
- The repository is a clean export of the package from the OBIX monorepo. Its lineage — the sources it was recovered from and its earlier names — is `PROVENANCE.json`, shipped in this package; the repository's copy also records the monorepo commit it was exported from.

## License

MIT — see [LICENSE](LICENSE).

<!-- obix-release:end -->
