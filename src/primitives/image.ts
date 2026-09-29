import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, esc, defineComponent, type ObixComponent, safeUrl, safeSrcSet } from '../kit/index.js';

export type ImageLoading = 'lazy' | 'eager' | 'auto';
export type ImageDecoding = 'sync' | 'async' | 'auto';
export type ImageFit = 'contain' | 'cover' | 'fill';

export interface ImageState {
  src: string;
  alt: string;
  width: string | number;
  height: string | number;
  loading: ImageLoading;
  decoding: ImageDecoding;
  aspectRatio: string;
  objectFit: ImageFit;
  sizes: string;
  srcSet: string;
  /** Decorative images carry `alt=""` and `role="presentation"`; everything else must have alt text. */
  decorative: boolean;
  useFigure: boolean;
  caption: string;
  loaded: boolean;
  error: boolean;
}

export interface ImageConfig {
  src: string;
  /** Required unless `decorative`. */
  alt: string;
  width?: string | number;
  height?: string | number;
  loading?: ImageLoading;
  decoding?: ImageDecoding;
  aspectRatio?: string;
  objectFit?: ImageFit;
  sizes?: string;
  srcSet?: string;
  decorative?: boolean;
  useFigure?: boolean;
  caption?: string;
}

const ariaOf = (state: ImageState): AriaAttributes =>
  state.decorative ? { role: 'presentation' } : { role: 'img', 'aria-label': state.alt };

const num = (v: string | number): number => (typeof v === 'number' ? v : Number.parseFloat(v));

function renderImage(state: ImageState): string {
  const ratio = state.aspectRatio || (num(state.width) > 0 && num(state.height) > 0 ? `${num(state.width)} / ${num(state.height)}` : '');
  const img = `<img${attrs({
    src: safeUrl(state.src, 'image'),
    alt: state.decorative ? '' : state.alt,
    role: state.decorative ? 'presentation' : undefined,
    width: state.width === '' ? undefined : String(state.width),
    height: state.height === '' ? undefined : String(state.height),
    loading: state.loading,
    decoding: state.decoding,
    srcset: safeSrcSet(state.srcSet),
    sizes: state.sizes || undefined,
    class: cx('obix-image', state.error && 'obix-image--error'),
    style: [ratio && `aspect-ratio:${ratio}`, `object-fit:${state.objectFit}`].filter(Boolean).join(';'),
    'aria-busy': state.loaded || state.error ? undefined : 'true',
    'data-obix-on': 'load=onLoad; error=onError',
  })}>`;
  return state.useFigure
    ? `<figure class="obix-image-figure">${img}${state.caption ? `<figcaption class="obix-image-caption">${esc(state.caption)}</figcaption>` : ''}</figure>`
    : img;
}

export function createImage(config: ImageConfig): ObixComponent<ImageState> {
  return defineComponent<ImageState>({
    name: 'ObixImage',
    state: {
      src: config.src,
      alt: config.decorative ? '' : config.alt,
      width: config.width ?? '',
      height: config.height ?? '',
      loading: config.loading ?? 'lazy',
      decoding: config.decoding ?? 'auto',
      aspectRatio: config.aspectRatio ?? '',
      objectFit: config.objectFit ?? 'cover',
      sizes: config.sizes ?? '',
      srcSet: config.srcSet ?? '',
      decorative: config.decorative ?? false,
      useFigure: config.useFigure ?? false,
      caption: config.caption ?? '',
      loaded: false,
      error: false,
    },
    actions: {
      setSrc: (_state, src: unknown) => ({ src: String(src), loaded: false, error: false }),
      setLoaded: (_state, loaded: unknown) => ({ loaded: Boolean(loaded), error: false }),
      setCaption: (_state, caption: unknown) => ({ caption: String(caption) }),
      updateAlt: (_state, alt: unknown) => ({ alt: String(alt), decorative: false }),
      setLoading: (_state, eager: unknown) => ({ loading: (eager === true || eager === 'eager' ? 'eager' : 'lazy') as ImageLoading }),
      onLoad: () => ({ loaded: true, error: false }),
      onError: () => ({ loaded: false, error: true }),
    },
    aliases: { updateSrc: 'setSrc' },
    render: renderImage,
    aria: ariaOf,
  });
}
