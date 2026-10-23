import type { ReactNode } from "react";

// Covers only what the generated snippets contain: strings, line comments, numbers, a few keywords and punctuation.
const TOKEN_SOURCE =
  '("(?:[^"\\\\\\n]|\\\\.)*")|(\\/\\/[^\\n]*)|(\\b\\d+(?:\\.\\d+)?\\b)|(\\b(?:import|from|export|function|return|true|false)\\b)|([{}()[\\]<>=;,.:\\/]+)';

export function highlightCode(code: string): ReactNode[] {
  const pattern = new RegExp(TOKEN_SOURCE, "g");
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    const [text, string, comment, number, keyword] = match;
    if (match.index > last) nodes.push(code.slice(last, match.index));

    const kind = string ? "string" : comment ? "comment" : number ? "number" : keyword ? "keyword" : "punct";
    nodes.push(
      <span key={match.index} className={`ascii-code-token ascii-code-token--${kind}`}>
        {text}
      </span>,
    );
    last = match.index + text.length;
  }

  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}
