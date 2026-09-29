/**
 * Markup helpers shared by every component renderer.
 *
 * Every dynamic value that reaches markup goes through `esc()` or `attrs()`. Components used to interpolate labels, values and ids
 * straight into template strings, so a label such as `</button><img src=x onerror=…>` produced live markup (and `"` in a value broke
 * the attribute it sat in). Rendering is a pure function of state, so escaping here is what makes the documented server-side use
 * (`res.send(btn.render(btn.state))`) safe.
 */

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape text for use in element content or a quoted attribute value. `null`/`undefined` become the empty string. */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c] as string);
}

export type AttrValue = string | number | boolean | null | undefined;

/**
 * Attribute string for a map, in insertion order (deterministic).
 *  - `false`, `null`, `undefined` → omitted
 *  - `true`  → the bare attribute (`hidden`, `disabled`)
 *  - string / number → `name="escaped"`
 * ARIA states that must read "true"/"false" are passed as strings: `{ 'aria-pressed': String(state.pressed) }`.
 */
export function attrs(map: Record<string, AttrValue>): string {
  let out = '';
  for (const [name, value] of Object.entries(map)) {
    if (value === false || value === null || value === undefined) continue;
    out += value === true ? ` ${name}` : ` ${name}="${esc(value)}"`;
  }
  return out;
}

/** Open tag + children + close tag. `attributes` go through {@link attrs}; `inner` is inserted as given (build it with `esc`/`tag`). */
export function tag(name: string, attributes: Record<string, AttrValue>, inner = ''): string {
  return `<${name}${attrs(attributes)}>${inner}</${name}>`;
}

/** A void element (`<input …>`). */
export function voidTag(name: string, attributes: Record<string, AttrValue>): string {
  return `<${name}${attrs(attributes)}>`;
}

/** Join class names, skipping falsy entries. */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(' ');
}

/** URL schemes that may appear in a link (`href`) or a media source (`src`, `poster`, `<track src>`). */
const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const MEDIA_SCHEMES = new Set(['http', 'https', 'blob']);

/**
 * A URL that is safe to put in an `href` / `src` attribute, or `undefined` (attribute omitted / link left inert).
 *
 * Escaping keeps a URL inside its attribute, but `javascript:alert(1)` is a perfectly well-formed attribute value that runs when clicked.
 * Components render server-side from data that may be user-supplied, so URL attributes are allow-listed: relative references, `#`
 * fragments, `http:`, `https:`, `mailto:`, `tel:` for links; relative, `http:`, `https:`, `blob:` and `data:image/` (images only) for media.
 * Browsers ignore tabs, newlines and control characters inside a scheme (`java\tscript:`), so those are removed before the scheme is read.
 */
export function safeUrl(url: unknown, kind: 'link' | 'media' | 'image' = 'link'): string | undefined {
  if (url === null || url === undefined) return undefined;
  const text = String(url).trim();
  if (text === '') return undefined;
  const compact = text.replace(/[\u0000- \u007f-\u009f]/g, '');
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(compact)?.[1]?.toLowerCase();
  if (scheme === undefined) return text; // relative reference or fragment
  if ((kind === 'link' ? LINK_SCHEMES : MEDIA_SCHEMES).has(scheme)) return text;
  // SVG is safe as an <img> source (scripts do not run in an image context), so it is allowed for images only
  if (scheme === 'data' && kind === 'image' && /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|svg\+xml)[;,]/i.test(compact)) return text;
  return undefined;
}

/** An `srcset` value with every unsafe candidate URL removed (`"a.png 1x, javascript:x 2x"` → `"a.png 1x"`). */
export function safeSrcSet(value: unknown): string | undefined {
  const kept = String(value ?? '')
    .split(',')
    .map((candidate) => candidate.trim())
    // judged twice: by its first token (what the browser reads as the URL) and with all whitespace removed (what a scheme smuggled past
    // a tab or newline would look like), so nothing that even resembles `javascript:` survives
    .filter((candidate) => candidate !== '' && safeUrl(candidate.split(/\s+/)[0], 'image') !== undefined && safeUrl(candidate.replace(/\s+/g, ''), 'image') !== undefined);
  return kept.length ? kept.join(', ') : undefined;
}

/** `true`/`false` as the ARIA strings, `undefined` stays undefined (attribute omitted). */
export function ariaBool(value: boolean | 'mixed' | undefined): string | undefined {
  return value === undefined ? undefined : String(value);
}
