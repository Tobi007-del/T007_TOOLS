import React from "react";
import { HighlightOptions, useHighlight } from "../../hooks/react/useHighlight";

export interface HighlightTextProps extends HighlightOptions {
  /** The text to be processed and displayed. */
  children?: string;
  /** The string or array of strings to match and highlight within the children text. */
  query?: string | string[];
  /** The CSS class to apply to the highlighted parts of the text. Defaults to `"highlight"`. */
  className?: string;
  /** Whether the matching should be case-insensitive. Defaults to `true`. */
  ignoreCase?: boolean;
}

/** Component to highlight parts of text that match a query. It splits the text into chunks based on the query and wraps matching parts in a span with the specified className. */
export const HighlightText: React.FC<HighlightTextProps> = ({ children = "", query = "", className = "highlight", ignoreCase = true, trimQuery = true, wholeWord = false }) => {
  const chunks = useHighlight(children, query, ignoreCase, { trimQuery, wholeWord });
  
  return (
    <>
      {chunks.map(({ text, match }, i) =>
        match ? (
          <span key={i} className={className}>
            {text}
          </span>
        ) : (
          text
        )
      )}
    </>
  );
};

export default HighlightText;
