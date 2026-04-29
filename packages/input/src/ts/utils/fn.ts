import { formatSize } from "@t007/utils";

/**  Returns password strength level from 1-4 using character-class heuristics.*/
export function getStrengthLevel(value: string, minLength = 0) {
  value = value.trim();
  let level = 0;
  if (value.length < minLength) level = 1;
  else {
    if (/[a-z]/.test(value)) level++;
    if (/[A-Z]/.test(value)) level++;
    if (/[0-9]/.test(value)) level++;
    if (/[\W_]/.test(value)) level++;
  }
  return Math.min(level, 4);
}

type FileValidationOptions = {
  /** Accepted MIME types or extensions from input `accept`. */
  accept?: string;
  /** Whether multiple files are allowed. */
  multiple?: boolean;
  /** Per-file maximum size in bytes. */
  maxSize?: number;
  /** Per-file minimum size in bytes. */
  minSize?: number;
  /** Maximum combined size of all selected files in bytes. */
  maxTotalSize?: number;
  /** Minimum combined size of all selected files in bytes. */
  minTotalSize?: number;
  /** Maximum number of selected files. */
  maxLength?: number;
  /** Minimum number of selected files. */
  minLength?: number;
};

/** Validates selected files and returns a validity key + user-facing message. */
export function getFilesHelper(files: File[], opts: FileValidationOptions): { violation: keyof ValidityState | null; message: string } {
  if (!files || !files.length) return { violation: null, message: "" };
  const totalFiles = files.length;
  let totalSize = 0,
    currFiles = 0;
  const setMaxError = (size: number, max: number, n = 0): ReturnType<typeof getFilesHelper> => ({ violation: "rangeOverflow", message: n ? `File ${files.length > 1 ? n : ""} size of ${formatSize(size)} exceeds the per file maximum of ${formatSize(max)}` : `Total files size of ${formatSize(size)} exceeds the total maximum of ${formatSize(max)}` });
  const setMinError = (size: number, min: number, n = 0): ReturnType<typeof getFilesHelper> => ({ violation: "rangeUnderflow", message: n ? `File ${files.length > 1 ? n : ""} size of ${formatSize(size)} is less than the per file minimum of ${formatSize(min)}` : `Total files size of ${formatSize(size)} is less than the total minimum of ${formatSize(min)}` });
  for (const file of files) {
    currFiles++;
    totalSize += file.size;
    if (opts.accept) {
      const acceptedTypes =
        opts.accept
          .split(",")
          .map((type) => type.trim().replace(/^[*\.]+|[*\.]+$/g, ""))
          .filter(Boolean) || [];
      if (!acceptedTypes.some((type) => file.type.includes(type))) return { violation: "typeMismatch", message: `File${currFiles > 1 ? currFiles : ""} type of '${file.type}' is not accepted.` };
    }
    if (opts.maxSize && file.size > opts.maxSize) return setMaxError(file.size, opts.maxSize, currFiles);
    if (opts.minSize && file.size < opts.minSize) return setMinError(file.size, opts.minSize, currFiles);
    if (opts.multiple) {
      if (opts.maxTotalSize && totalSize > opts.maxTotalSize) return setMaxError(totalSize, opts.maxTotalSize);
      if (opts.minTotalSize && totalSize < opts.minTotalSize) return setMinError(totalSize, opts.minTotalSize);
      if (opts.maxLength && totalFiles > opts.maxLength) return { violation: "tooLong", message: `Selected ${totalFiles} files exceeds the maximum of ${opts.maxLength} allowed file${opts.maxLength == 1 ? "" : "s"}` };
      if (opts.minLength && totalFiles < opts.minLength) return { violation: "tooShort", message: `Selected ${totalFiles} files is less than the minimum of ${opts.minLength} allowed file${opts.minLength == 1 ? "" : "s"}` };
    }
  }
  return { violation: null, message: "" };
}
