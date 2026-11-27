import type { ReactNode } from "react";

// Parses **bold** and <u>underline</u> markers from the AI response into
// real React elements (no HTML injection), supporting nesting like <u>**Name**</u>.
// Matches don't cross a blank line, so a marker left unclosed in one paragraph
// can't swallow unrelated later paragraphs looking for its closing pair.
export const parseFormattedText = (
  text: string,
  keyPrefix = "root",
): ReactNode[] => {
  const boldMatch = text.match(/\*\*((?:(?!\n\n)[\s\S])+?)\*\*/);
  const underlineMatch = text.match(/<u>((?:(?!\n\n)[\s\S])+?)<\/u>/);

  let match: RegExpMatchArray | null = null;
  let isBold = false;

  if (boldMatch && underlineMatch) {
    isBold = boldMatch.index! <= underlineMatch.index!;
    match = isBold ? boldMatch : underlineMatch;
  } else if (boldMatch) {
    match = boldMatch;
    isBold = true;
  } else if (underlineMatch) {
    match = underlineMatch;
    isBold = false;
  }

  if (!match || match.index === undefined) {
    return [text];
  }

  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const innerNodes = parseFormattedText(match[1], `${keyPrefix}-i`);

  const nodes: ReactNode[] = [];
  if (before) nodes.push(before);
  nodes.push(
    isBold ? (
      <strong key={`${keyPrefix}-b`}>{innerNodes}</strong>
    ) : (
      <u key={`${keyPrefix}-u`}>{innerNodes}</u>
    ),
  );
  nodes.push(...parseFormattedText(after, `${keyPrefix}-a`));

  return nodes;
};
