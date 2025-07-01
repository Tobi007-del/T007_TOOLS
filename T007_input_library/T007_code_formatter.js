export function formatHTML(html, indentSize = 4) {
  const voidTags = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
  const indent = (level) => ' '.repeat(level * indentSize);
  const formatted = [];
  const stack = [];
  const tokens = html
  .replace(/>\s+</g, '><') // Remove whitespace between tags
  .replace(/</g, '\n<')
  .replace(/>/g, '>\n')
  .split('\n')
  .map(t => t.trim())
  .filter(Boolean);
  for (const token of tokens) {
    if (token.startsWith('</')) {
      // Closing tag: decrease indent first
      if (stack.length) stack.pop();
      formatted.push(indent(stack.length) + token);
    } else if (token.startsWith('<') && token.endsWith('>')) {
      const tagNameMatch = token.match(/^<\s*([^\s>\/]+)/);
      const tagName = tagNameMatch?.[1]?.toLowerCase();
      formatted.push(indent(stack.length) + token);
      if (tagName && !voidTags.has(tagName) && !token.endsWith('/>')) {
        // Only increase indent for non-void, non-self-closing tags
        stack.push(tagName);
      }
    } else {
      // Text node
      formatted.push(indent(stack.length) + token);
    }
  }
  return formatted.join('\n');
}

export function highlightHTML(html) {
  const escape = str => str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = escape(html);
  html = html.replace(
    /(?<=&lt;style[^&]*&gt;)(?<styleContent>[\s\S]*?)(?=&lt;\/style&gt;)|(?<=&lt;script[^&]*&gt;)(?<scriptContent>[\s\S]*?)(?=&lt;\/script&gt;)|(?<comment>&lt;!--[\s\S]*?--&gt;)|(?<tag>&lt;\/?[^\s&]+)|(?<attr>[\w-:]+)(?<eq>=)(?<val>\"[^\"]*\"|\'[^\']*\')|(?<closetag>\/?&gt;)/g,
    (match,  ...args) => {
      const groups = args.at(-1);
      if (groups.styleContent) {
        return highlightCSS(groups.styleContent);
      } else if (groups.scriptContent) {
        return highlightJS(groups.scriptContent);
      } else if (groups.comment) {
        return `<span class="token comment">${groups.comment}</span>`;
      } else if (groups.tag) {
        return `<span class="token tag">${groups.tag}</span>`;
      } else if (groups.attr && groups.eq && groups.val) {
        return `<span class="token attr">${groups.attr}</span><span class="token eq">${groups.eq}</span><span class="token value">${groups.val}</span>`;
      } else if (groups.closetag) {
        return `<span class="token tag">${groups.closetag}</span>`;
      } 
      return match;
    }
  );
  return html;
}

export function highlightJSON(json) {
  return json.replace(
    /(?<key>"[^"]+")(?=\s*:)|(?<string>"[^"]*")|(?<number>\b\d+(\.\d+)?\b)|(?<boolnull>\btrue\b|\bfalse\b|\bnull\b)|(?<emptyArray>\[\])|(?<emptyObject>\{\})|(?<bracket>[{}\[\]])/g,
    (match, ...args) => {
      const groups = args.at(-1);
      if (groups.key) {
        return `<span class="token key">${groups.key}</span>`;
      } else if (groups.string) {
        return `<span class="token string">${groups.string}</span>`;
      } else if (groups.number) {
        return `<span class="token number">${groups.number}</span>`;
      } else if (groups.boolnull) {
        return `<span class="token boolean">${groups.boolnull}</span>`;
      } else if (groups.emptyArray) {
        return `<span class="token array">${groups.emptyArray}</span>`;
      } else if (groups.emptyObject) {
        return `<span class="token object">${groups.emptyObject}</span>`;
      } else if (groups.bracket) {
        return `<span class="token bracket">${groups.bracket}</span>`;
      }
      return match;
    }
  );
}


