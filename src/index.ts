// obix — OBIX Heart/Soul UI/UX SDK
// 30 WCAG 2.1 AA accessible components with FUD policy enforcement and jfix.scss design system
// Author: OBINexus <okpalan@protonmail.com>

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  AriaAttributes,
  TouchTarget,
  FocusConfig,
  LoadingState,
  ReducedMotionConfig,
  ValidationState,
  DimensionConfig,
  ComponentLogicWithAccessibility,
  BaseComponentDef,
} from './types/base.js';

export {
  DEFAULT_TOUCH_TARGET,
  DEFAULT_FOCUS_CONFIG,
  DEFAULT_REDUCED_MOTION,
} from './types/base.js';

export type { JfixStrategy, JfixHoverConfig } from './types/jfix.js';
export { JFIX_STRATEGIES, DEFAULT_JFIX_STRATEGY } from './types/jfix.js';

// ── Policies ─────────────────────────────────────────────────────────────────
export { PolicyViolationError } from './policies/violation.js';
export type { PolicyViolation, PolicyResult } from './policies/violation.js';
export { applyAccessibilityPolicy } from './policies/accessibility.js';
export { applyTouchTargetPolicy } from './policies/touch-target.js';
export { applyReducedMotionPolicy } from './policies/reduced-motion.js';
export { applyFocusPolicy } from './policies/focus.js';
export { applyLoadingPolicy } from './policies/loading.js';
export { applyAllFudPolicies, validateFudCompliance } from './policies/compose.js';

// ── Style Utilities ───────────────────────────────────────────────────────────
export { jfixApplyStrategy, jfixRemoveStrategy, jfixGetStrategy, prefersReducedMotion } from './styles/jfix-utils.js';
export { TOKENS, JFIX_CLASS_MAP } from './styles/tokens.js';
export type { TokenName } from './styles/tokens.js';

// ── Adapter ───────────────────────────────────────────────────────────────────
export { createObixAdapter, toFunctional, toOOP, toReactive } from './adapter/create-obix-adapter.js';
export type { ObixParadigm, FunctionalComponent, OOPComponent, ReactiveComponent } from './adapter/create-obix-adapter.js';

// ── Component kit (Stage 5): escaping, deterministic ids, the component assembler ───────────
export { defineComponent, esc, createId, resetObixIds, renderWith } from './kit/index.js';
export type { ComponentSpec, ObixComponent } from './kit/index.js';
export { OBIX_MIN_TARGET_PX } from './types/base.js';

// ── Primitives ────────────────────────────────────────────────────────────────
export { createButton } from './primitives/button.js';
export type { ButtonState, ButtonConfig, ButtonVariant, ButtonSize, ButtonType } from './primitives/button.js';

export { createLink } from './primitives/link.js';
export type { LinkState, LinkConfig, LinkTarget } from './primitives/link.js';

export { createCard } from './primitives/card.js';
export type { CardState, CardConfig, CardImage } from './primitives/card.js';

export { createImage } from './primitives/image.js';
export type { ImageState, ImageConfig, ImageLoading, ImageDecoding, ImageFit } from './primitives/image.js';

export { createVideo } from './primitives/video.js';
export type { VideoState, VideoConfig, VideoTrack } from './primitives/video.js';

// ── Forms ─────────────────────────────────────────────────────────────────────
export { createInput } from './forms/input.js';
export type { InputState, InputConfig, InputType, ValidationTiming, AutocompleteValue } from './forms/input.js';

export { createCheckbox } from './forms/checkbox.js';
export type { CheckboxState, CheckboxConfig, CheckedState } from './forms/checkbox.js';

export { createRadioGroup } from './forms/radio-group.js';
export type { RadioGroupState, RadioGroupConfig, RadioOption } from './forms/radio-group.js';

export { createSelect } from './forms/select.js';
export type { SelectState, SelectConfig, SelectOption, SelectOptGroup, SelectItem } from './forms/select.js';

export { createTextarea } from './forms/textarea.js';
export type { TextareaState, TextareaConfig, ResizeMode } from './forms/textarea.js';

export { createForm } from './forms/form.js';
export type { FormState, FormConfig, FieldState } from './forms/form.js';

export { createDatePicker } from './forms/date-picker.js';
export type { DatePickerState, DatePickerConfig } from './forms/date-picker.js';

export { createFileUpload } from './forms/file-upload.js';
export type { FileUploadState, FileUploadConfig, UploadedFile } from './forms/file-upload.js';

// ── Navigation ────────────────────────────────────────────────────────────────
export { createNavigation } from './navigation/navigation.js';
export type { NavigationState, NavigationConfig, NavItem } from './navigation/navigation.js';

export { createBreadcrumb } from './navigation/breadcrumb.js';
export type { BreadcrumbState, BreadcrumbConfig, Crumb } from './navigation/breadcrumb.js';

export { createPagination } from './navigation/pagination.js';
export type { PaginationState, PaginationConfig } from './navigation/pagination.js';

export { createTabs } from './navigation/tabs.js';
export type { TabsState, TabsConfig, TabItem } from './navigation/tabs.js';

export { createStepper } from './navigation/stepper.js';
export type { StepperState, StepperConfig, StepItem } from './navigation/stepper.js';

// ── Overlays ──────────────────────────────────────────────────────────────────
export { createModal, getFocusableElements, createFocusTrap } from './overlays/modal.js';
export type { ModalState, ModalConfig } from './overlays/modal.js';

export { createDropdown } from './overlays/dropdown.js';
export type { DropdownState, DropdownConfig, DropdownItem } from './overlays/dropdown.js';

export { createTooltip } from './overlays/tooltip.js';
export type { TooltipState, TooltipConfig, TooltipPlacement, TooltipTriggerMode } from './overlays/tooltip.js';

// ── Feedback ──────────────────────────────────────────────────────────────────
export { createAlert } from './feedback/alert.js';
export type { AlertState, AlertConfig, AlertType } from './feedback/alert.js';

export { createToast } from './feedback/toast.js';
export type { ToastState, ToastConfig, ToastType, ToastPosition } from './feedback/toast.js';

export { createProgress } from './feedback/progress.js';
export type { ProgressState, ProgressConfig } from './feedback/progress.js';

export { createLoading } from './feedback/loading.js';
export type { LoadingState as ObixLoadingState, LoadingConfig } from './feedback/loading.js';

// ── Controls ──────────────────────────────────────────────────────────────────
export { createSlider } from './controls/slider.js';
export type { SliderState, SliderConfig, SliderOrientation } from './controls/slider.js';

export { createSwitch } from './controls/switch.js';
export type { SwitchState, SwitchConfig } from './controls/switch.js';

// ── Data ──────────────────────────────────────────────────────────────────────
export { createTable, sortedRows } from './data/table.js';
export type { TableState, TableConfig, ColumnDef, RowData, SortDirection } from './data/table.js';

export { createAccordion } from './data/accordion.js';
export type { AccordionState, AccordionConfig, AccordionItem } from './data/accordion.js';

// ── Search ────────────────────────────────────────────────────────────────────
export { createSearch, resultsMessage } from './search/search.js';
export type { SearchState, SearchConfig, ObixSearch } from './search/search.js';

export { createAutocomplete, visibleSuggestions } from './search/autocomplete.js';
export type { AutocompleteState, AutocompleteConfig, AutocompleteSuggestion, ObixAutocomplete } from './search/autocomplete.js';
