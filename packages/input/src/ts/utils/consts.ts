/** Built-in validity keys used to map helper messages and validation states. */
export const violationKeys = ["valueMissing", "typeMismatch", "patternMismatch", "stepMismatch", "tooShort", "tooLong", "rangeUnderflow", "rangeOverflow", "badInput", "customError"];

/** Browser date-like input types supported by input field helpers. */
export const dateTypes = ["date", "time", "datetime-local", "month"] as const;

/** Union of all supported native date-like input types. */
export type DateType = (typeof dateTypes)[number];

/** Has native icon browser input types supported by input field helpers. */
export const nativeIconTypes = [...dateTypes];

/** Union of all supported inputs with native icons types. */
export type NativeIconType = (typeof nativeIconTypes)[number];

/** Type guard for checking whether an input `type` is one of `NativeIconType`. */
export const isNativeIconType = (t: string): t is NativeIconType => (nativeIconTypes as readonly string[]).includes(t);
