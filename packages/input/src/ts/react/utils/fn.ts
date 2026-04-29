import type { t007InputElement } from "../types";

export const fireInput = (el?: t007InputElement | null) => el?.dispatchEvent?.(new Event("input", { bubbles: true }));

export const hasValue = (el: t007InputElement) => !!(el.type === "file" ? (el as HTMLInputElement).files?.length : el.type === "radio" || el.type === "checkbox" ? (el as HTMLInputElement).checked : el.value.trim() !== "");

export const formatWordsHelperText = (template: string = "", count: number, maxCount: number) =>
  template
    .replace(/%left%/g, String(Math.max(0, maxCount - count)))
    .replace(/%max%/g, String(maxCount))
    .replace(/%count%/g, String(count))
    .replace(/%excess%/g, String(Math.max(0, count - maxCount)));

export function rExclude<T extends object>(obj: T, keys: any[]): Partial<T> {
  const copy = { ...obj };
  keys.forEach((k) => delete (copy as any)[k]);
  return copy;
}
