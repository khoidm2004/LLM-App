import { parseFormattedText } from "../../lib/parseFormattedText";

const parseRow = (row: string): string[] =>
  row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

// Renders a markdown table block (header row + separator row + body rows)
// as a real HTML table. The original markdown is left untouched elsewhere
// so Copy still grabs the raw table syntax, not this rendered view.
const MarkdownTable = ({ markdown }: { markdown: string }) => {
  const rows = markdown.split("\n").filter((line) => line.trim() !== "");
  if (rows.length < 2) return null;

  const headerCells = parseRow(rows[0]);
  const bodyRows = rows.slice(2).map(parseRow);

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {headerCells.map((cell, i) => (
              <th
                key={i}
                className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left font-semibold dark:text-gray-100"
              >
                {parseFormattedText(cell, `th-${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, r) => (
            <tr
              key={r}
              className={
                r % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800/60"
              }
            >
              {cells.map((cell, c) => (
                <td
                  key={c}
                  className="border border-gray-200 dark:border-gray-700 px-3 py-2 align-top dark:text-gray-200"
                >
                  {parseFormattedText(cell, `td-${r}-${c}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MarkdownTable;
