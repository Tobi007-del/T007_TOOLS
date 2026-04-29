import React, { useState } from "react";
import type { t007InputElement, WordsInputProps, CE, WordsInputLenientModeProps as LMP } from "../types";
import { Input } from "./Input";
import { formatWordsHelperText as formatText } from "../utils/fn";

export const WordsInput = React.forwardRef<t007InputElement, WordsInputProps>(({ maxCount = 10000, showCount = "You have used %count% of the maximum %max% words. %left% words remaining.", allowOverflow = false, emitEventOnChange = false, onChange, ...props }, ref) => {
  const [value, setValue] = useState(`${props.defaultValue ?? props.value ?? ""}`);
  const count = value.trim().split(/\s+/).filter(Boolean).length;
  const overLimit = count > maxCount;
  const info = showCount ? formatText(showCount, count, maxCount) : "";
  const error = allowOverflow && overLimit ? formatText((props as LMP).errorHelperText ?? "Please shorten this text to %max% or less words. (You are currently using %count% words).", count, maxCount) : "";
  const handleChange = (e: CE<t007InputElement>) => {
    let v = e.target.value;
    if (!allowOverflow && overLimit) {
      const words = v.match(/\S+/g) || [];
      v = words.slice(0, maxCount).join(" ") + (v.endsWith(" ") ? " " : "");
      e.target.value = v;
    }
    if (allowOverflow) e.target.setCustomValidity(error);
    setValue(v), onChange?.((emitEventOnChange ? e : v) as any);
  };

  return <Input {...props} ref={ref} value={value} defaultValue={undefined} onChange={handleChange} helperText={{ info }} />;
});

WordsInput.displayName = "WordsInput";
