/**
 * The one-call render helper of the per-component packages (`renderButton(config, overrides?)` in the published
 * `obix-component-button` package, and its nineteen siblings): build the component, render its initial state with
 * optional overrides.
 *
 *   renderWith(createButton)({ label: 'Save' }, { loading: true })
 *     === createButton({ label: 'Save' }).render({ ...button.state, loading: true })
 *
 * One generic helper instead of twenty copies: the compat packages that carry the old `renderX` names are one line each.
 */
export function renderWith<C, S extends object>(
  create: (config: C) => { readonly state: S; render(state: S): string },
): (config?: C, overrides?: Partial<S>) => string {
  return (config = {} as C, overrides = {}) => {
    const component = create(config);
    return component.render({ ...component.state, ...overrides });
  };
}
