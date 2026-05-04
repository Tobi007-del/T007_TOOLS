/** Format a file size for display.
 * @param size Size in bytes.
 * @param decimals Decimal precision.
 * @param base Size base, usually 1000 or 1024.
 * @returns Human-readable size string, i.e., "1.234 KB".
 */
export function formatSize(bytes: number, decimals = 3, base = 1e3): string {
  if (bytes < base) return `${bytes} byte${bytes == 1 ? "" : "s"}`;
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  return `${(bytes / Math.pow(base, exponent)).toFixed(decimals).replace(/\.0+$/, "")} ${units[exponent]}`;
}
