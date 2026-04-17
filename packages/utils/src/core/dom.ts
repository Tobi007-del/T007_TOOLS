import { isSym, isSameURL } from "..";
import { createEl, assignEl } from "sia-reactor/utils";

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
export { createEl, assignEl };

// Resource Loading
export const VIRTUAL_RESOURCE: symbol = Symbol.for("T007_VIRTUAL_RESOURCE");
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
