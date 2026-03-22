import "@t007/utils";
import type { FieldOptions } from "@t007/input";

export interface DialogOptions extends FieldOptions {
  confirmText?: string;
  cancelText?: string;
  value?: string;
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS
export function Alert(message: string, options?: DialogOptions): Promise<boolean>;
export function Confirm(question: string, options?: DialogOptions): Promise<boolean>;
export function Prompt(
  question: string,
  defaultValue?: string,
  options?: DialogOptions,
): Promise<string | null>;

declare global {
  interface T007Namespace {
    alert: typeof Alert;
    confirm: typeof Confirm;
    prompt: typeof Prompt;
  }

  interface Window {
    Alert?: T007Namespace["alert"];
    Confirm?: T007Namespace["confirm"];
    Prompt?: T007Namespace["prompt"];
  }
}
