import "@t007/utils";

/** Configuration accepted by the field() helper. */
export interface FieldOptions extends Partial<
  Omit<HTMLInputElement, "type" | "className" | "children">
> {
  /** Wrap the field in its own container. */
  isWrapper?: boolean;
  /** Visible label text. */
  label?: string;
  /** Input type to render. */
  type?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Custom CSS class or class list. */
  custom?: string;
  /** Minimum value length or count. */
  minSize?: number;
  /** Maximum value length or count. */
  maxSize?: number;
  /** Minimum total size allowed across the field value. */
  minTotalSize?: number;
  /** Maximum total size allowed across the field value. */
  maxTotalSize?: number;
  /** Options used by select-like fields. */
  options?: Array<string | { value: string; option: string }>;
  /** Whether the checkbox is partially selected. */
  indeterminate?: boolean;
  /** Show the password visibility toggler. */
  eyeToggler?: boolean;
  /** Enable the password strength meter. */
  passwordMeter?: boolean;
  /** Helper text shown under the field. */
  helperText?: false | Record<string, string>;
  /** Class applied to the root field element. */
  className?: string;
  /** Class applied to the inner field control. */
  fieldClassName?: string;
  /** Optional child element rendered inside the field wrapper. */
  children?: HTMLElement;
  /** End icon rendered inside the field control. */
  endIcon?: string;
  /** Native icon rendered by the browser control. */
  nativeIcon?: string;
  /** Icon shown when the password is visible. */
  passwordVisibleIcon?: string;
  /** Icon shown when the password is hidden. */
  passwordHiddenIcon?: string;
}

/** Form-level manager used to build and validate inputs. */
export interface FormManager {
  /** Live collection of managed forms. */
  forms: HTMLCollectionOf<HTMLFormElement>;
  /** Current validation violation keys. */
  violationKeys: string[];
  /** Initialize DOM observers and field bindings. */
  init(): void;
  /** Observe the DOM for field changes. */
  observeDOMForFields(): void;
  /** Normalize and validate uploaded files.
   * @param files Files selected by the user.
   * @param opts Validation options.
   * @returns Violation information and user-facing message.
   */
  getFilesHelper(
    files: FileList | File[],
    opts: any,
  ): { violation: string | null; message: string };
  /** Format a file size for display.
   * @param size Size in bytes.
   * @param decimals Decimal precision.
   * @param base Size base, usually 1000 or 1024.
   * @returns Human-readable size string.
   */
  formatSize(size: number, decimals?: number, base?: number): string;
  /** Toggle an input between password and text mode.
   * @param input Target password input.
   */
  togglePasswordType(input: HTMLInputElement): void;
  /** Toggle the filled state on a supported field.
   * @param input Supported form control.
   */
  toggleFilled(input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void;
  /** Attach a fallback helper node.
   * @param field Field wrapper element.
   */
  setFallbackHelper(field: HTMLElement): void;
  /** Wire listeners onto a managed field.
   * @param field Field wrapper element.
   */
  setFieldListeners(field: HTMLElement): void;
  /** Normalize field markup before use.
   * @param field Field wrapper element.
   */
  setUpField(field: HTMLElement): void;
  /** Create a field element from options.
   * @param options Field configuration.
   * @returns Created field element.
   */
  field(options: FieldOptions): HTMLElement;
  /** Validate a form and attach the proper hooks.
   * @param form Form element to validate.
   */
  handleFormValidation(form: HTMLFormElement): void;
}

// BUNDLE EXPORTS & GLOBAL DECLARATIONS

/** Shared field manager singleton exposed by the bundle. */
export const formManager: FormManager;
/** Create a field element from field options.
 * @param options Field configuration.
 * @returns Created field element.
 */
export const field = FormManager["field"];
/** Attach validation hooks to a form element.
 * @param form Form element to validate.
 */
export const handleFormValidation = FormManager["handleFormValidation"];

declare global {
  interface T007Namespace {
    /** Form manager singleton attached by the bundle. */
    FM: FormManager;
    /** Public form manager singleton. */
    formManager: FormManager;
    /** Public field factory. */
    field?: FormManager["field"];
    /** Public form validation helper. */
    handleFormValidation?: FormManager["handleFormValidation"];
  }
  interface Window {
    field?: T007Namespace["field"];
    handleFormValidation?: T007Namespace["handleFormValidation"];
  }
  interface HTMLFormElement {
    /** Client-side submit hook. */
    onSubmit?(): void;
    /** Check validation on the client. */
    validateOnClient?(): boolean;
    /** Check validation on the server. */
    validateOnServer?(): Promise<boolean>;
    /** Toggle the global error state. */
    toggleGlobalError?(bool: boolean): void;
  }
}
