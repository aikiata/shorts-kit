/**
 * A small Markdown renderer for briefs: headings, paragraphs, lists, tables, code fences, quotes, and inline
 * code, bold, italic and links. It builds React elements (no HTML injection), so a brief cannot run script in
 * the preview. Anything it does not know is shown as plain text.
 */
import type {ReactNode} from "react";

const inline = (s: string, key = "i"): ReactNode[] => {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${n++}`;
    if (m[1]) out.push(<code key={k} className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={k} className="font-semibold text-foreground">{inline(t.slice(2, -2), k)}</strong>);
    else if (m[3]) out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t)!;
      out.push(/^https?:\/\//.test(href) ? <a key={k} href={href} target="_blank" rel="noreferrer" className="text-indigo-300 underline-offset-2 hover:underline">{inline(label, k)}</a> : <span key={k} className="text-indigo-300">{inline(label, k)}</span>);
    }
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
};

const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export const Markdown = ({text}: {text: string}) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${k++}`;
    if (!line.trim()) { i++; continue; }
    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      blocks.push(<pre key={key} className="overflow-auto rounded-xl border bg-muted/30 p-3 font-mono text-[12.5px] leading-relaxed">{body.join("\n")}</pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls = lvl === 1 ? "mt-2 text-2xl font-semibold tracking-tight" : lvl === 2 ? "mt-6 border-b pb-1 text-lg font-semibold tracking-tight" : "mt-4 text-[15px] font-semibold";
      blocks.push(<div key={key} role="heading" aria-level={lvl} className={cls}>{inline(h[2], key)}</div>);
      i++;
      continue;
    }
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={key} className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>{head.map((c, j) => <th key={j} className="px-3 py-2 font-medium">{inline(c, `${key}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-t align-top">{r.map((c, j) => <td key={j} className="px-3 py-2">{inline(c, `${key}r${ri}c${j}`)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={key} className="border-l-2 border-indigo-400/60 pl-3 text-muted-foreground">{inline(body.join(" "), key)}</blockquote>);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        if (/^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
        i++;
      }
      const L = ordered ? "ol" : "ul";
      blocks.push(<L key={key} className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>{items.map((it, j) => <li key={j}>{inline(it.replace(/^\[( |x)\]\s*/, (_, x) => (x === "x" ? "☑ " : "☐ ")), `${key}l${j}`)}</li>)}</L>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|\s*\||\s*>|\s*([-*]|\d+\.)\s+)/.test(lines[i])) para.push(lines[i++].trim());
    blocks.push(<p key={key} className="leading-relaxed">{inline(para.join(" "), key)}</p>);
  }
  return <div className="grid gap-3 text-sm text-foreground/90">{blocks}</div>;
};
