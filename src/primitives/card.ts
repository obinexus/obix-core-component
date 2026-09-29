import type { AriaAttributes } from '../types/base.js';
import type { JfixStrategy } from '../types/jfix.js';
import { OBIX_MIN_TARGET_PX } from '../types/base.js';
import { attrs, cx, esc, defineComponent, type ObixComponent, safeUrl } from '../kit/index.js';

export interface CardImage {
  src: string;
  alt: string;
}

export interface CardState {
  title: string;
  /** HTML (the documented `content?: string; // HTML content`). Trusted markup: escape untrusted text before it gets here. */
  content: string;
  image: CardImage | undefined;
  width: string | number;
  height: string | number;
  minWidth: string | number | undefined;
  minHeight: string | number | undefined;
  aspectRatio: string;
  loading: boolean;
  skeleton: boolean;
  loadingProgress: number;
  contentReady: boolean;
  interactive: boolean;
  ariaLabel: string;
  jfixStrategy: JfixStrategy;
}

export interface CardConfig {
  title?: string;
  content?: string;
  image?: CardImage;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  aspectRatio?: string;
  loading?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
  jfixStrategy?: JfixStrategy;
}

const px = (v: string | number | undefined): string | undefined => (v === undefined ? undefined : typeof v === 'number' ? `${v}px` : v);

const ariaOf = (state: CardState): AriaAttributes => ({
  role: 'article',
  'aria-label': state.ariaLabel || state.title || 'Card',
  'aria-busy': state.loading,
});

function renderCard(state: CardState): string {
  const w = px(state.width), h = px(state.height), minW = px(state.minWidth), minH = px(state.minHeight);
  const style = [
    w && `width:${w}`,
    minW && `min-width:${minW}`,
    (h ?? minH) && `min-height:${h ?? minH}`,
    state.aspectRatio && `aspect-ratio:${state.aspectRatio}`,
  ].filter(Boolean).join(';');
  const body = state.skeleton
    ? `<div class="obix-card__skeleton" aria-hidden="true" style="width:${esc(w ?? minW ?? '100%')};height:${esc(h ?? minH ?? '100%')}"></div>`
    : `${state.image ? `<figure class="obix-card__figure"><img class="obix-card__image" ${attrs({ src: safeUrl(state.image.src, 'image') })} alt="${esc(state.image.alt)}"></figure>` : ''}<div class="obix-card__content">${state.content}</div>`;
  const open = attrs({
    class: cx('obix-card', state.interactive && 'obix-card--interactive'),
    'data-jfix-strategy': state.jfixStrategy,
    style,
    'aria-label': ariaOf(state)['aria-label'],
    'aria-busy': state.loading ? 'true' : undefined,
    tabindex: state.interactive ? '0' : undefined,
  });
  return `<article${open}>${state.title ? `<h2 class="obix-card__title">${esc(state.title)}</h2>` : ''}${body}</article>`;
}

export function createCard(config: CardConfig): ObixComponent<CardState> {
  return defineComponent<CardState>({
    name: 'ObixCard',
    state: {
      title: config.title ?? '',
      content: config.content ?? '',
      image: config.image,
      width: config.width as string | number,
      height: config.height as string | number,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      aspectRatio: config.aspectRatio ?? '',
      loading: config.loading ?? false,
      skeleton: config.loading ?? false,
      loadingProgress: 0,
      contentReady: !(config.loading ?? false),
      interactive: config.interactive ?? false,
      ariaLabel: config.ariaLabel ?? '',
      jfixStrategy: config.jfixStrategy ?? 'box-shadow',
    },
    actions: {
      startLoading: () => ({ loading: true, skeleton: true, contentReady: false, loadingProgress: 0, interactive: false }),
      finishLoading: (_state, content?: unknown) => ({
        loading: false, skeleton: false, contentReady: true, loadingProgress: 100, interactive: true,
        ...(content === undefined ? {} : { content: String(content) }),
      }),
      setContent: (_state, content: unknown) => ({ content: String(content), loading: false, skeleton: false, contentReady: true }),
      setDimensions: (_state, width: unknown, height: unknown) => ({ width: width as string | number, height: height as string | number }),
      setProgress: (_state, value: unknown) => ({ loadingProgress: Math.min(100, Math.max(0, Number(value) || 0)) }),
      setJfixStrategy: (_state, strategy: unknown) => ({ jfixStrategy: strategy as JfixStrategy }),
    },
    aliases: { updateContent: 'setContent' },
    render: renderCard,
    aria: ariaOf,
    // skeleton loading needs explicit dimensions (LoadingPolicy); an interactive card is a target
    touchTarget: config.interactive ? { minWidth: OBIX_MIN_TARGET_PX, minHeight: OBIX_MIN_TARGET_PX, padding: 8 } : undefined,
    // derived from state, so the LoadingPolicy (explicit dimensions while a skeleton shows) holds at every transition
    loadingState: (state) => ({ loading: state.loading, skeleton: state.skeleton, interactive: state.interactive }),
  });
}
