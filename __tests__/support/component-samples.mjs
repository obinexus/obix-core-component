// A copy of the OBIX monorepo's tests/support/component-samples.mjs, kept identical to it by scripts/release/prepare.mjs (so that these tests ship and run on their own).
/**
 * One representative, valid configuration per `obix-core-component` factory, plus named states reached through the component's
 * own actions. It is the shared input of the per-component contract tests (`core/obix-core-component/__tests__/contract.test.ts`), the
 * accessibility scan and keyboard tests in a real browser (`tests/browser`), and the coverage probe (`scripts/recovery/component-coverage.mjs`).
 *
 * `samples(lib)` takes the library namespace so the same table runs against the sources (vitest) and against the built/bundled package.
 * `htmlKeys` are the documented trusted-HTML slots (`content`), the only string values a hostile-input test may leave alone.
 */
export const HOSTILE = `"><script data-xss>1</script><img src=x onerror=1 data-xss> ' onmouseover='x`;

// an inline image so the logo has a real size (a missing file would render as a 0 x 0 broken image)
const LOGO = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2240%22%3E%3Crect width=%2280%22 height=%2240%22 fill=%22%231558b0%22/%3E%3C/svg%3E';

const nav = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'docs', label: 'Docs', href: '/docs', submenu: [{ id: 'guide', label: 'Guide', href: '/docs/guide' }, { id: 'api', label: 'API', href: '/docs/api' }] },
  { id: 'about', label: 'About', href: '/about' }
];

/** name → { factory, config, htmlKeys?, states: [{ name, steps: [[action, ...args], …] }] } */
export const SAMPLES = {
  Button: { factory: 'createButton', config: { label: 'Save', variant: 'primary', toggle: true }, states: [{ name: 'pressed', steps: [['toggle']] }, { name: 'loading', steps: [['setLoading', true]] }, { name: 'disabled', steps: [['setDisabled', true]] }] },
  Card: { factory: 'createCard', config: { title: 'Release notes', content: '<p>What changed.</p>', image: { src: 'card.png', alt: 'A diagram' }, interactive: true, width: 320, height: 240 }, htmlKeys: ['content'], states: [{ name: 'loading', steps: [['startLoading']] }] },
  Image: { factory: 'createImage', config: { src: 'photo.png', alt: 'A photograph', width: 200, height: 100, useFigure: true, caption: 'Figure 1' }, states: [{ name: 'error', steps: [['onError']] }] },
  Video: { factory: 'createVideo', config: { src: 'clip.mp4', label: 'Product tour', tracks: [{ src: 'en.vtt', kind: 'captions', srclang: 'en', label: 'English' }], transcript: 'Full transcript.' }, states: [{ name: 'playing', steps: [['play']] }, { name: 'captions', steps: [['enableCaptions', 'en']] }] },
  Link: { factory: 'createLink', config: { href: 'https://example.org', label: 'Example', external: true }, states: [{ name: 'internal', steps: [['setExternal', false]] }] },

  Input: { factory: 'createInput', config: { label: 'Email', name: 'email', type: 'email', required: true, hintText: 'We never share it.' }, states: [{ name: 'invalid', steps: [['change', 'nope'], ['validate']] }, { name: 'valid', steps: [['change', 'ada@example.org'], ['validate']] }] },
  Checkbox: { factory: 'createCheckbox', config: { label: 'Accept terms', name: 'terms' }, states: [{ name: 'checked', steps: [['toggle']] }, { name: 'mixed', steps: [['setIndeterminate', true]] }] },
  RadioGroup: { factory: 'createRadioGroup', config: { groupLabel: 'Plan', name: 'plan', options: [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }, { label: 'Team', value: 'team', disabled: true }] }, states: [{ name: 'selected', steps: [['select', 'pro']] }] },
  Select: { factory: 'createSelect', config: { label: 'Country', name: 'country', placeholder: 'Choose…', options: [{ label: 'Nigeria', value: 'ng' }, { label: 'Canada', value: 'ca' }, { label: 'Europe', options: [{ label: 'France', value: 'fr' }] }] }, states: [{ name: 'chosen', steps: [['change', 'ca']] }] },
  Textarea: { factory: 'createTextarea', config: { label: 'Message', name: 'message', maxLength: 200, showCharCount: true, autoExpand: true }, states: [{ name: 'typed', steps: [['change', 'Hello there']] }] },
  Form: { factory: 'createForm', config: { label: 'Contact', fields: { email: { label: 'Email', required: true }, name: { label: 'Name' } } }, states: [{ name: 'errors', steps: [['validateAll']] }, { name: 'submitted', steps: [['submitForm']] }] },
  DatePicker: { factory: 'createDatePicker', config: { label: 'Departure', name: 'departure', today: '2026-03-15', minDate: '2026-03-01', maxDate: '2026-04-30' }, states: [{ name: 'open', steps: [['openCalendar']] }, { name: 'next-month', steps: [['openCalendar'], ['nextMonth']] }, { name: 'picked', steps: [['openCalendar'], ['selectDate', '2026-03-20']] }] },
  FileUpload: { factory: 'createFileUpload', config: { label: 'Attachments', name: 'files', multiple: true, accept: '.png,.pdf', maxSize: 1_000_000 }, states: [{ name: 'with-files', steps: [['addFiles', [{ name: 'a.png', size: 1200, type: 'image/png' }]]] }, { name: 'dragging', steps: [['startDragDrop']] }] },

  Navigation: { factory: 'createNavigation', config: { label: 'Main', items: nav, activeId: 'home', showSkipLink: true, logo: { src: LOGO, alt: 'OBIX', href: '/' } }, states: [{ name: 'mobile-open', steps: [['openMobileMenu']] }, { name: 'submenu-open', steps: [['openSubmenu', 1]] }] },
  Breadcrumb: { factory: 'createBreadcrumb', config: { crumbs: [{ label: 'Home', href: '/' }, { label: 'Docs', href: '/docs' }, { label: 'API' }] }, states: [] },
  Pagination: { factory: 'createPagination', config: { totalPages: 12, currentPage: 5, label: 'Results pages' }, states: [{ name: 'last', steps: [['lastPage']] }, { name: 'first', steps: [['firstPage']] }] },
  Tabs: { factory: 'createTabs', config: { label: 'Settings', tabs: [{ id: 'a', label: 'General', content: '<p>General</p>' }, { id: 'b', label: 'Privacy', content: '<p>Privacy</p>' }, { id: 'c', label: 'Billing', content: '<p>Billing</p>', disabled: true }], activeId: 'a' }, htmlKeys: ['content'], states: [{ name: 'second', steps: [['selectTab', 'b']] }] },
  Stepper: { factory: 'createStepper', config: { label: 'Checkout', steps: [{ id: 's1', label: 'Cart' }, { id: 's2', label: 'Address', description: 'Where to?' }, { id: 's3', label: 'Pay' }], currentStep: 0 }, htmlKeys: ['content'], states: [{ name: 'middle', steps: [['markCompleted', 0], ['nextStep']] }, { name: 'error', steps: [['setError', 0, 'Missing address']] }] },

  Modal: { factory: 'createModal', config: { title: 'Delete item?', content: '<p>This cannot be undone.</p>', actions: [{ label: 'Cancel' }, { label: 'Delete', variant: 'danger' }] }, htmlKeys: ['content'], states: [{ name: 'open', steps: [['open']] }] },
  Dropdown: { factory: 'createDropdown', config: { trigger: 'Actions', items: [{ label: 'Edit' }, { label: 'Duplicate' }, { divider: true, label: '—' }, { label: 'Delete', disabled: true }] }, states: [{ name: 'open', steps: [['open']] }, { name: 'focused', steps: [['open'], ['focusNext']] }] },
  Tooltip: { factory: 'createTooltip', config: { content: 'Copies the link', triggerText: 'Copy' }, states: [{ name: 'shown', steps: [['show']] }] },

  Alert: { factory: 'createAlert', config: { message: 'Saved successfully', type: 'success', dismissible: true }, states: [{ name: 'dismissed', steps: [['dismiss']] }] },
  Toast: { factory: 'createToast', config: { message: 'Message sent', type: 'info', duration: 5000 }, states: [{ name: 'shown', steps: [['show']] }, { name: 'paused', steps: [['show'], ['pause']] }] },
  Progress: { factory: 'createProgress', config: { label: 'Upload', value: 40 }, states: [{ name: 'done', steps: [['setValue', 100]] }, { name: 'indeterminate', steps: [['reset']] }] },
  Loading: { factory: 'createLoading', config: { label: 'Loading results', show: true }, states: [{ name: 'hidden', steps: [['hide']] }] },

  Slider: { factory: 'createSlider', config: { label: 'Volume', value: 30, min: 0, max: 100, step: 10 }, states: [{ name: 'louder', steps: [['increment']] }] },
  Switch: { factory: 'createSwitch', config: { label: 'Notifications' }, states: [{ name: 'on', steps: [['toggle']] }] },

  Table: { factory: 'createTable', config: { caption: 'Team', columns: [{ id: 'name', label: 'Name', sortable: true }, { id: 'age', label: 'Age', sortable: true }], rows: [{ name: 'Cleo', age: 31 }, { name: 'Ada', age: 36 }, { name: 'Bo', age: 28 }] }, states: [{ name: 'sorted', steps: [['sortBy', 'name']] }, { name: 'sorted-desc', steps: [['sortBy', 'age'], ['sortBy', 'age']] }] },
  Accordion: { factory: 'createAccordion', config: { label: 'FAQ', items: [{ id: 'q1', heading: 'What is OBIX?', content: '<p>An interface experience.</p>' }, { id: 'q2', heading: 'Is it accessible?', content: '<p>That is the goal.</p>' }] }, htmlKeys: ['content'], states: [{ name: 'open', steps: [['toggle', 'q1']] }] },

  Search: { factory: 'createSearch', config: { label: 'Search the site', name: 'q', submitButton: true }, states: [{ name: 'typed', steps: [['setValue', 'obix']] }, { name: 'results', steps: [['setValue', 'obix'], ['submit'], ['setResults', 3]] }] },
  Autocomplete: { factory: 'createAutocomplete', config: { label: 'Country', name: 'country', suggestions: [{ label: 'United States', value: 'us' }, { label: 'United Kingdom', value: 'gb' }, { label: 'Canada', value: 'ca' }] }, states: [{ name: 'suggesting', steps: [['setValue', 'un']] }, { name: 'active', steps: [['setValue', 'un'], ['navigateNext']] }, { name: 'chosen', steps: [['setValue', 'un'], ['navigateNext'], ['selectActive']] }] }
};

export const sampleNames = Object.keys(SAMPLES);

/** Instantiate a sample; `lib` is the library namespace (`import * as lib …`). */
export function create(lib, name, overrides) {
  const sample = SAMPLES[name];
  const factory = lib[sample.factory];
  if (typeof factory !== 'function') throw new Error(`${sample.factory} is not exported`);
  return factory(overrides ?? sample.config);
}

/** Run `steps` (`[[action, ...args], …]`) from the component's initial state; every step must go through the component's own actions. */
export function reach(component, steps, from = component.state) {
  let state = from;
  for (const [action, ...args] of steps) {
    const fn = component.actions[action];
    if (typeof fn !== 'function') throw new Error(`${component.name} has no action "${action}"`);
    state = fn(state, ...args);
  }
  return state;
}

/** A copy of `config` with every string replaced by the hostile payload, except enum-like keys and the trusted-HTML slots. */
export function hostile(config, htmlKeys = []) {
  const ENUM = new Set(['type', 'variant', 'size', 'position', 'placement', 'orientation', 'kind', 'color', 'backdrop', 'resize', 'autocomplete', 'loading', 'decoding', 'objectFit', 'target', 'ariaLive', 'errorSummaryPosition', 'validationTiming', 'validation', 'jfixStrategy', 'today', 'minDate', 'maxDate', 'min', 'max']);
  const walk = (value, key) => {
    if (typeof value === 'string') return ENUM.has(key) || htmlKeys.includes(key) ? value : HOSTILE;
    if (Array.isArray(value)) return value.map((v) => walk(v, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, k)]));
    return value;
  };
  return walk(config, '');
}
