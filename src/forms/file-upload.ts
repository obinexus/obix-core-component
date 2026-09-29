import type { AriaAttributes } from '../types/base.js';
import { attrs, createId, cx, defineComponent, esc, type ObixComponent } from '../kit/index.js';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  progress: number;
  error: string | null;
}

export interface FileUploadState {
  files: UploadedFile[];
  dragging: boolean;
  /** The documented name of `dragging`. */
  isDragging: boolean;
  uploading: boolean;
  overallProgress: number;
  /** The documented name of `overallProgress`. */
  totalProgress: number;
  /** Bytes; 0 = no limit. */
  maxSize: number;
  /** Maximum number of files; 0 = unlimited. */
  maxFiles: number;
  accept: string;
  multiple: boolean;
  dragDropEnabled: boolean;
  showProgress: boolean;
  label: string;
  ariaLabel: string;
  name: string;
  disabled: boolean;
  inputId: string;
  /** Problems with the last selection (too big, too many). */
  errors: string[];
}

export interface FileUploadConfig {
  label: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Bytes. */
  maxSize?: number;
  maxFiles?: number;
  dragDropEnabled?: boolean;
  showProgress?: boolean;
  ariaLabel?: string;
  id?: string;
}

/** What the state stores about a file. The `File` objects themselves stay in the browser's file input (they are not serialisable). */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const overall = (files: UploadedFile[]): number => (files.length ? files.reduce((sum, f) => sum + f.progress, 0) / files.length : 0);

const ariaOf = (s: FileUploadState): AriaAttributes => ({ role: 'button', 'aria-label': s.ariaLabel || s.label, 'aria-busy': s.uploading });

function renderFileUpload(s: FileUploadState): string {
  const items = s.files.map((f, i) => {
    const done = f.progress >= 100 && !f.error;
    const status = f.error
      ? `<span class="obix-file-upload__error">${esc(f.error)}</span>`
      : s.showProgress && !done
        ? `<progress class="obix-progress" value="${f.progress}" max="100" aria-label="Upload progress for ${esc(f.name)}">${f.progress}%</progress> <span>(${Math.round(f.progress)}%)</span>`
        : done ? '<span role="img" aria-label="Upload complete">✓</span>' : '';
    return `<li class="obix-file-upload__file-item" data-obix-key="file-${i}-${esc(f.name)}"><span>${esc(f.name)} (${formatSize(f.size)})</span> ${status} ` +
      `<button class="obix-button obix-file-upload__file-item-remove" type="button" aria-label="Remove ${esc(f.name)}" data-index="${i}" data-obix-on="click=removeFile(@attr:data-index)">×</button></li>`;
  }).join('');
  const hint = `Drag and drop or click to browse${s.accept && s.accept !== '*/*' ? ` (${esc(s.accept)})` : ''}${s.maxSize ? ` — max ${formatSize(s.maxSize)}` : ''}${s.maxFiles ? `, up to ${s.maxFiles} files` : ''}`;
  const dnd = s.dragDropEnabled && !s.disabled
    ? 'dragenter=startDragDrop!; dragover=startDragDrop!; dragleave=endDragDrop; drop=addFiles(@files)!'
    : '';
  const input = `<input${attrs({
    type: 'file',
    id: s.inputId,
    name: s.name || undefined,
    class: 'obix-file-upload__input obix-visually-hidden', // the label is the visible 48 px target; the native input stays focusable
    accept: s.accept === '*/*' ? undefined : s.accept,
    multiple: s.multiple,
    disabled: s.disabled,
    'aria-label': s.ariaLabel || s.label,
    'data-obix-on': 'change=addFiles(@files)',
  })}>`;
  return `<div${attrs({ class: cx('obix-file-upload', s.dragging && 'obix-file-upload--dragging'), 'data-jfix-strategy': 'fixed-size', 'aria-busy': s.uploading ? 'true' : undefined, 'data-obix-on': dnd || undefined })}>` +
    `${input}<label for="${esc(s.inputId)}" class="obix-file-upload__label"><span aria-hidden="true">📁</span> <span>${esc(s.label)}</span> <span class="obix-file-upload__hint">${hint}</span></label>` +
    // the message and file lists are live regions that exist before their content does, so changes are announced
    `<ul class="obix-file-upload__errors" aria-live="polite">${s.errors.map((e) => `<li class="obix-file-upload__error">${esc(e)}</li>`).join('')}</ul>` +
    `<ul class="obix-file-upload__file-list" aria-live="polite" aria-label="Selected files">${items}</ul></div>`;
}

export function createFileUpload(config: FileUploadConfig): ObixComponent<FileUploadState> {
  return defineComponent<FileUploadState>({
    name: 'ObixFileUpload',
    state: {
      files: [],
      dragging: false,
      isDragging: false,
      uploading: false,
      overallProgress: 0,
      totalProgress: 0,
      maxSize: config.maxSize ?? 10 * 1024 * 1024,
      maxFiles: config.maxFiles ?? 0,
      accept: config.accept ?? '*/*',
      multiple: config.multiple ?? true,
      dragDropEnabled: config.dragDropEnabled ?? true,
      showProgress: config.showProgress ?? true,
      label: config.label,
      ariaLabel: config.ariaLabel ?? '',
      name: config.name ?? '',
      disabled: config.disabled ?? false,
      inputId: createId('obix-fileupload', config.id),
      errors: [],
    },
    actions: {
      addFiles: (state, raw: unknown) => {
        if (state.disabled) return state;
        const incoming = (Array.isArray(raw) ? raw : []) as FileInfo[];
        const errors: string[] = [];
        const accepted: UploadedFile[] = [];
        for (const f of incoming) {
          if (state.maxSize && f.size > state.maxSize) errors.push(`${f.name} exceeds maximum size of ${formatSize(state.maxSize)}.`);
          else accepted.push({ name: f.name, size: f.size, type: f.type, progress: 0, error: null });
        }
        let files = state.multiple ? [...state.files, ...accepted] : accepted.slice(0, 1);
        if (state.maxFiles && files.length > state.maxFiles) {
          errors.push(`Only ${state.maxFiles} file${state.maxFiles === 1 ? '' : 's'} can be added.`);
          files = files.slice(0, state.maxFiles);
        }
        return { files, errors, dragging: false, isDragging: false, overallProgress: overall(files), totalProgress: overall(files) };
      },
      removeFile: (state, index: unknown) => {
        const files = state.files.filter((_, i) => i !== Number(index));
        return { files, errors: [], overallProgress: overall(files), totalProgress: overall(files) };
      },
      setProgress: (state, index: unknown, progress: unknown) => {
        const files = state.files.map((f, i) => (i === Number(index) ? { ...f, progress: Math.min(100, Math.max(0, Number(progress) || 0)) } : f));
        return { files, overallProgress: overall(files), totalProgress: overall(files) };
      },
      setFileError: (state, index: unknown, error: unknown) => ({
        files: state.files.map((f, i) => (i === Number(index) ? { ...f, error: error ? String(error) : null } : f)),
      }),
      startDragDrop: (state) => (state.dragDropEnabled && !state.disabled ? { dragging: true, isDragging: true } : state),
      endDragDrop: () => ({ dragging: false, isDragging: false }),
      setDragging: (_state, dragging: unknown) => ({ dragging: Boolean(dragging), isDragging: Boolean(dragging) }),
      clear: () => ({ files: [], errors: [], overallProgress: 0, totalProgress: 0, uploading: false }),
      startUpload: () => ({ uploading: true }),
      completeUpload: (state) => ({ uploading: false, overallProgress: 100, totalProgress: 100, files: state.files.map((f) => (f.error ? f : { ...f, progress: 100 })) }),
      clearErrors: () => ({ errors: [] }),
    },
    render: renderFileUpload,
    aria: ariaOf,
  });
}
