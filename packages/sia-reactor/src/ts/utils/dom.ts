// Types
type Dataset = Record<string, string | number>;
type Style = Partial<CSSStyleDeclaration>;

// Element Factory
export function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): HTMLElementTagNameMap[K];
export function createEl(tag: string, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): HTMLElement | null;
export function createEl(tag: string, props?: Record<string, unknown>, dataset?: Dataset, styles?: Style, el = tag ? document?.createElement(tag) : null): HTMLElement | null {
  return assignEl(el, props, dataset, styles), el;
}

export function assignEl<K extends keyof HTMLElementTagNameMap>(el?: HTMLElementTagNameMap[K], props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): void;
export function assignEl(el?: HTMLElement | null, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): void;
export function assignEl(el?: HTMLElement | null, props?: Record<string, unknown>, dataset?: Dataset, styles?: Style): void {
  if (!el) return;
  if (props) for (const k of Object.keys(props)) if (props[k] !== undefined) (el as unknown as Record<string, unknown>)[k] = props[k];
  if (dataset) for (const k of Object.keys(dataset)) if (dataset[k] !== undefined) (el.dataset as DOMStringMap)[k] = String(dataset[k]);
  if (styles) for (const k of Object.keys(styles)) if (styles[k as keyof Style] !== undefined) (el.style as unknown as Record<string, unknown>)[k] = styles[k as keyof Style];
}
