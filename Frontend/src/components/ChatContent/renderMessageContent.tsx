import type { ReactNode } from "react";
import { parseFormattedText } from "../../lib/parseFormattedText";
import MarkdownTable from "./MarkdownTable";

const TABLE_ROW_RE = /^\s*\|(.+)\|\s*$/;
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

type ContentBlock = { type: "text" | "table"; content: string };

// Splits the raw response into alternating text/table blocks so a markdown
// table can be rendered as a real <table> while the surrounding text keeps
// going through the normal bold/underline parser.
const splitIntoBlocks = (text: string): ContentBlock[] => {
  const lines = text.split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const startsTable =
      TABLE_ROW_RE.test(lines[i]) &&
      lines[i + 1] !== undefined &&
      TABLE_SEPARATOR_RE.test(lines[i + 1]);

    if (startsTable) {
      const tableLines = [lines[i], lines[i + 1]];
      let j = i + 2;
      while (j < lines.length && TABLE_ROW_RE.test(lines[j])) {
        tableLines.push(lines[j]);
        j++;
      }
      blocks.push({ type: "table", content: tableLines.join("\n") });
      i = j;
    } else {
      const textLines = [lines[i]];
      let j = i + 1;
      while (
        j < lines.length &&
        !(
          TABLE_ROW_RE.test(lines[j]) &&
          lines[j + 1] !== undefined &&
          TABLE_SEPARATOR_RE.test(lines[j + 1])
        )
      ) {
        textLines.push(lines[j]);
        j++;
      }
      blocks.push({ type: "text", content: textLines.join("\n") });
      i = j;
    }
  }

  return blocks;
};

// Renders an assistant response: markdown table blocks become real <table>
// elements, everything else goes through the bold/underline marker parser.
export const renderMessageContent = (text: string): ReactNode[] =>
  splitIntoBlocks(text).map((block, idx) =>
    block.type === "table" ? (
      <MarkdownTable key={`block-${idx}`} markdown={block.content} />
    ) : (
      <span key={`block-${idx}`}>
        {parseFormattedText(block.content, `block-${idx}`)}
      </span>
    ),
  );
