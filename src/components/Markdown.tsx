import type { ReactNode } from "react";

/** Инлайн-разметка: **жирный**, `код`, ссылки не нужны. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      out.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-white">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <code
          key={`${keyPrefix}-c${i}`}
          className="rounded bg-slate-800/90 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-300 ring-1 ring-white/10"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    }
    last = m.index + tok.length;
    i += 1;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Table({ rows, keyPrefix }: { rows: string[]; keyPrefix: string }) {
  const cells = rows.map((r) =>
    r
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
  const [head, , ...body] = cells;
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead className="bg-white/[0.06]">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-semibold text-slate-200 whitespace-nowrap">
                {inline(h, `${keyPrefix}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className="border-t border-white/[0.07]">
              {row.map((c, ci) => (
                <td key={ci} className="px-3 py-2 align-top text-slate-300">
                  {inline(c, `${keyPrefix}-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let listOrdered = false;
  let table: string[] = [];
  let quote: string[] = [];
  let para: string[] = [];
  let code: string[] | null = null;

  const key = (n: string) => `${n}`;

  const flushList = () => {
    if (!list.length) return;
    const Tag = listOrdered ? "ol" : "ul";
    blocks.push(
      <Tag
        key={key(`l${blocks.length}`)}
        className={`my-3 space-y-1.5 pl-5 text-slate-300 ${listOrdered ? "list-decimal" : "list-disc"} marker:text-indigo-400`}
      >
        {list.map((item, i) => (
          <li key={i} className="leading-relaxed">
            {inline(item, key(`li${blocks.length}-${i}`))}
          </li>
        ))}
      </Tag>,
    );
    list = [];
  };
  const flushTable = () => {
    if (!table.length) return;
    blocks.push(<Table key={key(`t${blocks.length}`)} rows={table} keyPrefix={key(`tk${blocks.length}`)} />);
    table = [];
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote
        key={key(`q${blocks.length}`)}
        className="my-4 rounded-r-lg border-l-2 border-indigo-400/60 bg-indigo-500/[0.07] py-3 pl-4 pr-3 text-slate-300"
      >
        {quote.map((q, i) => (
          <p key={i} className="leading-relaxed">
            {inline(q, key(`q${blocks.length}-${i}`))}
          </p>
        ))}
      </blockquote>,
    );
    quote = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    blocks.push(
      <p key={key(`p${blocks.length}`)} className="my-3 leading-relaxed text-slate-300">
        {inline(para.join(" "), key(`pk${blocks.length}`))}
      </p>,
    );
    para = [];
  };
  const flushCode = () => {
    if (!code) return;
    blocks.push(
      <pre
        key={key(`code${blocks.length}`)}
        className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/80 p-3 font-mono text-[12px] leading-relaxed text-sky-200"
      >
        <code>{code.join("\n")}</code>
      </pre>,
    );
    code = null;
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushTable();
    flushQuote();
    flushCode();
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (code) {
      if (line.trim().startsWith("```")) {
        flushCode();
      } else {
        code.push(raw.replace(/\s+$/, ""));
      }
      continue;
    }
    if (line.trim().startsWith("```")) {
      flushAll();
      code = [];
      continue;
    }

    if (/^\|/.test(line.trim())) {
      flushPara();
      flushList();
      flushQuote();
      table.push(line.trim());
      continue;
    }
    flushTable();

    if (!line.trim()) {
      flushAll();
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = h[1].length;
      const text = inline(h[2], key(`hk${blocks.length}`));
      const cls =
        level === 1
          ? "mt-2 mb-4 text-2xl font-bold tracking-tight text-white"
          : level === 2
            ? "mt-8 mb-3 border-t border-white/10 pt-5 text-lg font-bold tracking-tight text-white"
            : level === 3
              ? "mt-6 mb-2 text-base font-semibold text-indigo-200"
              : "mt-4 mb-2 text-sm font-semibold text-slate-200";
      blocks.push(
        <div key={key(`hh${blocks.length}`)} className={cls}>
          {text}
        </div>,
      );
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={key(`hr${blocks.length}`)} className="my-6 border-white/10" />);
      continue;
    }

    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      flushPara();
      flushList();
      quote.push(q[1]);
      continue;
    }
    flushQuote();

    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      flushPara();
      if (!listOrdered || !list.length) {
        flushList();
        listOrdered = true;
      }
      list.push(ol[1]);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      flushPara();
      if (listOrdered || !list.length) {
        flushList();
        listOrdered = false;
      }
      list.push(ul[1]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flushAll();

  return <div className="text-[14.5px]">{blocks}</div>;
}
