import { isSym, isSameURL } from "..";

// Types
export type Dataset = Record<string, string | number>;
export type Style = Partial<CSSStyleDeclaration>;

export type ResourceType = "style" | "script" | string;
export type LoadResourceOptions = Partial<{
  module: boolean;
  media: string;
  crossOrigin: "anonymous" | "use-credentials" | string | null;
  integrity: string;
  referrerPolicy: "no-referrer" | "origin" | "strict-origin-when-cross-origin" | string;
  nonce: string;
  fetchPriority: "high" | "low" | "auto";
  attempts: number;
  retryKey: boolean | string; // retry token
}>;

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

// Resource Loading
export const VIRTUAL_RESOURCE: unique symbol = Symbol.for("T007_VIRTUAL_RESOURCE");
export function loadResource(req: string | symbol, type: ResourceType = "style", { module, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, attempts = 3, retryKey = false }: LoadResourceOptions = {}, w = window): Promise<HTMLElement | void> {
  (w.t007 ??= {} as any), (w.t007._resourceCache ??= {});
  if (req === VIRTUAL_RESOURCE || isSym(req)) return Promise.resolve();
  const src = req as string;
  if (w.t007._resourceCache[src]) return w.t007._resourceCache[src]; // set crossorigin on (links|scripts) if provided due to document.(styleSheets|scripts)
  const existing = type === "script" ? Array.prototype.find.call(w.document.scripts, (s) => isSameURL(s.src, src)) : type === "style" ? Array.prototype.find.call(w.document.styleSheets, (s) => isSameURL((s as CSSStyleSheet).href, src)) : null;
  if (existing) return (w.t007._resourceCache[src] = Promise.resolve(existing));
  w.t007._resourceCache[src] = new Promise<HTMLElement | void>((resolve, reject) => {
    (function tryLoad(remaining: number, el?: HTMLElement) {
      const onerror = () => {
        el?.remove?.(); // Remove failed element before retrying
        if (remaining > 1) {
          setTimeout(tryLoad, 1000, remaining - 1);
          console.warn(`Retrying ${type} load (${attempts - remaining + 1}): ${src}...`);
        } else {
          delete w.t007._resourceCache[src]; // Final fail: clear cache so user can manually retry
          reject(new Error(`${type} load failed after ${attempts} attempts: ${src}`));
        }
      };
      const url = retryKey && remaining < attempts ? `${src}${src.includes("?") ? "&" : "?"}_${retryKey}=${Date.now()}` : src;
      if (type === "script") w.document.body.append((el = createEl("script", { src: url, type: module ? "module" : "text/javascript", crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else if (type === "style") w.document.head.append((el = createEl("link", { rel: "stylesheet", href: url, media, crossOrigin, integrity, referrerPolicy, nonce, fetchPriority, onload: () => resolve(el), onerror }) || ""));
      else reject(new Error(`Unsupported resource type: ${type}`));
    })(attempts);
  });
  return w.t007._resourceCache[src];
}
