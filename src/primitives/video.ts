import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, esc, defineComponent, type ObixComponent, safeUrl } from '../kit/index.js';

export interface VideoTrack {
  src: string;
  kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
  /** BCP 47 language tag. Also accepted as `srcLang` (the documented spelling). */
  srclang: string;
  label: string;
  default?: boolean;
}

export interface VideoState {
  src: string;
  poster: string;
  playing: boolean;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  controls: boolean;
  captionsEnabled: boolean;
  /** Language of the caption track showing when captions are enabled ('' = the first captions track). */
  captionLang: string;
  controlsVisible: boolean;
  /** URL of the transcript (kept for compatibility). */
  transcriptUrl: string;
  /** Inline transcript text, shown in a disclosure. */
  transcriptText: string;
  tracks: VideoTrack[];
  width: number | string;
  height: number | string;
  label: string;
}

export interface VideoConfig {
  src: string;
  poster?: string;
  width?: number | string;
  height?: number | string;
  tracks?: Array<Omit<VideoTrack, 'srclang'> & { srclang?: string; srcLang?: string }>;
  /** A URL (link is rendered) or the transcript text itself (a disclosure is rendered). */
  transcript?: string;
  transcriptUrl?: string;
  /** Accessible name. `ariaLabel` is the documented name; `label` the implemented one. */
  label?: string;
  ariaLabel?: string;
  /** Native controls (keyboard operable: Space, arrows, …). Default true. */
  controls?: boolean;
  autoplay?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
}

const ariaOf = (state: VideoState): AriaAttributes => ({ role: 'region', 'aria-label': state.label });

const looksLikeUrl = (s: string): boolean => /^(https?:)?\/\//.test(s) || /^\.{0,2}\//.test(s) || /^[\w./-]+\.(txt|vtt|html?|md|pdf)$/i.test(s);

function mediaDeclaration(state: VideoState): string {
  const captionTracks = state.tracks.filter((t) => t.kind === 'captions' || t.kind === 'subtitles');
  const lang = !state.captionsEnabled ? 'off' : state.captionLang || captionTracks[0]?.srclang || 'off';
  return `playing=${state.playing};volume=${state.volume};muted=${state.muted};time=${state.currentTime};captions=${lang}`;
}

function renderVideo(state: VideoState): string {
  const tracks = state.tracks
    .map((t) => `<track${attrs({ src: safeUrl(t.src, 'media'), kind: t.kind, srclang: t.srclang, label: t.label, default: !!t.default })}>`)
    .join('');
  const video = `<video${attrs({
    src: safeUrl(state.src, 'media'),
    poster: safeUrl(state.poster, 'image'),
    width: state.width === '' ? undefined : String(state.width),
    height: state.height === '' ? undefined : String(state.height),
    controls: state.controls,
    autoplay: state.autoplay,
    loop: state.loop,
    muted: state.muted,
    playsinline: true,
    preload: 'metadata',
    class: 'obix-video__player',
    'aria-label': state.label,
    'data-obix-media': mediaDeclaration(state),
    'data-obix-on': 'play=play; pause=pause; volumechange=setVolume(@prop:volume); volumechange=setMuted(@prop:muted); seeked=seek(@prop:currentTime)',
  })}>${tracks}<p>Your browser does not support the video element. <a${attrs({ href: safeUrl(state.src, 'media') })}>Download the video</a>.</p></video>`;
  const transcript = state.transcriptUrl
    ? `<p class="obix-video__transcript"><a${attrs({ href: safeUrl(state.transcriptUrl) })}>Read transcript</a></p>`
    : state.transcriptText
      ? `<details class="obix-video__transcript"><summary>Transcript</summary><p>${esc(state.transcriptText)}</p></details>`
      : '';
  return `<div${attrs({ class: cx('obix-video'), role: 'region', 'aria-label': state.label })}>${video}${transcript}</div>`;
}

export function createVideo(config: VideoConfig): ObixComponent<VideoState> {
  const label = config.label ?? config.ariaLabel ?? 'Video';
  const transcript = config.transcript ?? '';
  const autoplay = config.autoplay ?? config.autoPlay ?? false;
  return defineComponent<VideoState>({
    name: 'ObixVideo',
    state: {
      src: config.src,
      poster: config.poster ?? '',
      playing: autoplay,
      autoplay,
      loop: config.loop ?? false,
      // browsers only allow autoplay for muted media, which is why the documentation says muted is required with autoplay
      muted: config.muted ?? autoplay,
      volume: 1,
      currentTime: 0,
      controls: config.controls ?? true,
      captionsEnabled: true, // captions on by default for accessibility
      captionLang: '',
      controlsVisible: config.controls ?? true,
      transcriptUrl: config.transcriptUrl ?? (looksLikeUrl(transcript) ? transcript : ''),
      transcriptText: looksLikeUrl(transcript) ? '' : transcript,
      tracks: (config.tracks ?? []).map((t) => ({ src: t.src, kind: t.kind, srclang: t.srclang ?? t.srcLang ?? '', label: t.label, ...(t.default ? { default: true } : {}) })),
      width: config.width ?? 640,
      height: config.height ?? 360,
      label,
    },
    actions: {
      play: () => ({ playing: true }),
      pause: () => ({ playing: false }),
      toggleMute: (state) => ({ muted: !state.muted }),
      setMuted: (_state, muted: unknown) => ({ muted: Boolean(muted) }),
      setVolume: (_state, volume: unknown) => ({ volume: Math.min(1, Math.max(0, Number(volume) || 0)) }),
      seek: (_state, time: unknown) => ({ currentTime: Math.max(0, Number(time) || 0) }),
      enableCaptions: (_state, lang?: unknown) => ({ captionsEnabled: true, captionLang: lang === undefined ? '' : String(lang) }),
      toggleCaptions: (state) => ({ captionsEnabled: !state.captionsEnabled }),
      toggleControls: (state) => ({ controlsVisible: !state.controlsVisible, controls: !state.controls }),
      setSrc: (_state, src: unknown) => ({ src: String(src), playing: false, currentTime: 0 }),
    },
    render: renderVideo,
    aria: ariaOf,
  });
}
