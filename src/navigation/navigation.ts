import type { AriaAttributes } from '../types/base.js';
import { attrs, cx, createId, defineComponent, esc, type ObixComponent, safeUrl } from '../kit/index.js';

export interface NavSubItem {
  id: string;
  label: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  disabled?: boolean;
  /** Marks the current page (documented). Only items marked so (or `activeId`) get `aria-current="page"`: there is no default. */
  current?: boolean;
  submenu?: NavSubItem[];
}

export interface NavLogo {
  src: string;
  alt: string;
  href: string;
}

export interface NavigationState {
  items: NavItem[];
  /** Id of the current item, or null when none is marked current. */
  activeId: string | null;
  orientation: 'horizontal' | 'vertical';
  mobileOpen: boolean;
  /** Index of the open submenu, or null. */
  openSubmenu: number | null;
  /** The submenu was opened from the keyboard: its first item takes the focus. */
  submenuFocus: boolean;
  mobileMenuId: string;
  navId: string;
  label: string;
  logo: NavLogo | undefined;
  showSkipLink: boolean;
  /** Id (no `#`) of the main content the skip link jumps to. */
  skipLinkTarget: string;
  mobileMenu: boolean;
}

export interface NavigationConfig {
  /** Accessible name of the landmark. `label` is the implemented name, `ariaLabel` the documented one. */
  label?: string;
  ariaLabel?: string;
  items: Array<Omit<NavItem, 'id' | 'submenu'> & { id?: string; submenu?: Array<Omit<NavSubItem, 'id'> & { id?: string }> }>;
  activeId?: string;
  orientation?: 'horizontal' | 'vertical';
  logo?: NavLogo;
  showSkipLink?: boolean;
  skipLinkTarget?: string;
  mobileMenu?: boolean;
  id?: string;
}

const slug = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';

const ariaOf = (s: NavigationState): AriaAttributes => ({ role: 'navigation', 'aria-label': s.label });

function renderNavigation(s: NavigationState): string {
  const items = s.items.map((item, index) => {
    const current = item.id === s.activeId;
    if (item.submenu?.length) {
      const submenuId = `${s.navId}-sub-${index}`;
      const buttonId = `${s.navId}-sub-${index}-button`;
      const open = s.openSubmenu === index;
      return `<li class="obix-navigation__has-submenu" data-obix-key="item-${esc(item.id)}" data-obix-focus-scope>` +
        `<button${attrs({ id: buttonId, type: 'button', class: 'obix-navigation__item obix-navigation__submenu-toggle', 'aria-expanded': String(open), 'aria-haspopup': 'true', 'aria-controls': submenuId,
          'data-jfix-strategy': 'fixed-size', 'data-obix-on': `click=toggleSubmenu(${index}); keydown:ArrowDown=openSubmenu(${index})!` })}>${esc(item.label)}</button>` +
        `<ul${attrs({ id: submenuId, role: 'menu', 'aria-label': item.label, class: 'obix-navigation__submenu', hidden: !open, 'data-obix-roving': 'vertical', 'data-obix-dismiss': `closeSubmenu(${index})`, 'data-obix-dismiss-focus': `#${buttonId}` })}>` +
        item.submenu.map((sub, k) => `<li role="none"><a${attrs({ role: 'menuitem', href: safeUrl(sub.href) ?? '#', class: 'obix-navigation__item obix-navigation__subitem', tabindex: '-1', 'data-jfix-strategy': 'fixed-size', 'data-obix-focus': open && s.submenuFocus && k === 0 ? '' : undefined })}>${esc(sub.label)}</a></li>`).join('') +
        `</ul></li>`;
    }
    return `<li data-obix-key="item-${esc(item.id)}"><a${attrs({
      href: safeUrl(item.href) ?? '#',
      class: 'obix-navigation__item',
      'data-jfix-strategy': 'fixed-size',
      'aria-current': current ? 'page' : undefined,
      'aria-disabled': item.disabled ? 'true' : undefined,
      tabindex: item.disabled ? '-1' : undefined,
    })}>${esc(item.label)}</a></li>`;
  }).join('');

  const logo = s.logo
    ? `<a${attrs({ href: safeUrl(s.logo.href) ?? '#' })} class="obix-logo"><img${attrs({ src: safeUrl(s.logo.src, 'image') })} alt="${esc(s.logo.alt)}"></a>`
    : '';
  const skip = s.showSkipLink ? `<a href="#${esc(s.skipLinkTarget)}" class="obix-skip-link obix-navigation__skip-link">Skip to main content</a>` : '';
  const hamburger = s.mobileMenu
    ? `<button${attrs({ type: 'button', class: 'obix-hamburger obix-navigation__hamburger', id: `${s.navId}-hamburger`, 'aria-label': 'Menu', 'aria-expanded': String(s.mobileOpen), 'aria-controls': s.mobileMenuId, 'data-obix-on': 'click=toggleMobileMenu' })}><span aria-hidden="true">☰</span></button>`
    : '';
  return `<nav${attrs({ 'aria-label': s.label, class: cx('obix-navigation', `obix-navigation--${s.orientation}`), 'data-mobile-open': s.mobileMenu ? String(s.mobileOpen) : undefined,
    // Escape anywhere in the open mobile menu (including on the hamburger itself) closes it and returns to the hamburger; an open submenu is nearer and closes first
    'data-obix-dismiss': s.mobileMenu && s.mobileOpen ? 'closeMobileMenu' : undefined, 'data-obix-dismiss-focus': s.mobileMenu && s.mobileOpen ? `#${s.navId}-hamburger` : undefined })}>` +
    `${skip}${logo}${hamburger}<ul${attrs({ id: s.mobileMenuId, class: 'obix-nav-list obix-navigation__menu' })}>${items}</ul></nav>`;
}

export function createNavigation(config: NavigationConfig): ObixComponent<NavigationState> {
  const navId = createId('obix-nav', config.id);
  const items: NavItem[] = config.items.map((item) => ({
    ...item,
    id: item.id ?? slug(item.href || item.label),
    submenu: item.submenu?.map((sub) => ({ ...sub, id: sub.id ?? slug(sub.href || sub.label) })),
  }));
  const marked = items.find((i) => i.current)?.id;
  const step = (state: NavigationState, delta: 1 | -1): Partial<NavigationState> => {
    const usable = state.items.filter((i) => !i.disabled);
    if (!usable.length) return {};
    const at = usable.findIndex((i) => i.id === state.activeId);
    return { activeId: (usable[(at + delta + usable.length) % usable.length] as NavItem).id };
  };
  return defineComponent<NavigationState>({
    name: 'ObixNavigation',
    state: {
      items,
      activeId: config.activeId ?? marked ?? null,
      orientation: config.orientation ?? 'horizontal',
      mobileOpen: false,
      openSubmenu: null,
      submenuFocus: false,
      mobileMenuId: `${navId}-menu`,
      navId,
      label: config.label ?? config.ariaLabel ?? 'Main navigation',
      logo: config.logo,
      showSkipLink: config.showSkipLink ?? true,
      skipLinkTarget: (config.skipLinkTarget ?? 'main').replace(/^#/, ''),
      mobileMenu: config.mobileMenu ?? true,
    },
    actions: {
      // documented: by href; implemented: by id — either identifies the item
      setActive: (state, key: unknown) => {
        const match = state.items.find((i) => i.id === key || i.href === key);
        return match ? { activeId: match.id } : state;
      },
      openMobileMenu: () => ({ mobileOpen: true }),
      closeMobileMenu: () => ({ mobileOpen: false, openSubmenu: null, submenuFocus: false }),
      toggleMobileMenu: (state) => ({ mobileOpen: !state.mobileOpen }),
      // ArrowDown on the toggle, like a click or Enter/Space (toggleSubmenu): open AND move focus to the first item (APG menu button)
      openSubmenu: (state, index: unknown) => (state.items[Number(index)]?.submenu?.length ? { openSubmenu: Number(index), submenuFocus: true } : state),
      closeSubmenu: (state, index?: unknown) => (index === undefined || state.openSubmenu === Number(index) ? { openSubmenu: null, submenuFocus: false } : state),
      toggleSubmenu: (state, index: unknown) => (state.items[Number(index)]?.submenu?.length ? { openSubmenu: state.openSubmenu === Number(index) ? null : Number(index), submenuFocus: state.openSubmenu !== Number(index) } : state),
      navigateNext: (state) => step(state, 1),
      navigatePrev: (state) => step(state, -1),
    },
    aliases: { toggleMobile: 'toggleMobileMenu', openMobile: 'openMobileMenu', closeMobile: 'closeMobileMenu' },
    render: renderNavigation,
    aria: ariaOf,
  });
}
