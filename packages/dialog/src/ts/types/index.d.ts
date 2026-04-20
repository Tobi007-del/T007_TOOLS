import "@t007/utils";
import type { FieldOptions } from "@t007/input";

/** Shared options for alert, confirm, and prompt dialogs. */
export interface DialogOptions extends FieldOptions {
  /** Text for the confirmation button. */
  confirmText?: string;
  /** Text for the cancel button. */
  cancelText?: string;
  /** Default value used by prompt dialogs. */
  value?: string;
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS

/** Show an alert dialog and resolve when the user confirms.
 * @param message Message shown in the dialog body.
 * @param options Optional dialog configuration.
 * @returns Promise that resolves to the user choice.
 */
export function Alert(message: string, options?: DialogOptions): Promise<boolean>;
/** Show a confirm dialog and resolve with the user choice.
 * @param question Question shown in the dialog body.
 * @param options Optional dialog configuration.
 * @returns Promise that resolves to true when confirmed.
 */
export function Confirm(question: string, options?: DialogOptions): Promise<boolean>;
/** Show a prompt dialog and resolve with the entered value.
 * @param question Question shown in the dialog body.
 * @param defaultValue Initial value for the prompt input.
 * @param options Optional dialog configuration.
 * @returns Promise that resolves to the entered string or null.
 */
export function Prompt(
  question: string,
  defaultValue?: string,
  options?: DialogOptions,
): Promise<string | null>;

declare global {
  interface T007Namespace {
    /** Browser alert helper. */
    alert: typeof Alert;
    /** Browser confirm helper. */
    confirm: typeof Confirm;
    /** Browser prompt helper. */
    prompt: typeof Prompt;
  }
  interface Window {
    Alert?: T007Namespace["alert"];
    Confirm?: T007Namespace["confirm"];
    Prompt?: T007Namespace["prompt"];
  }
}
