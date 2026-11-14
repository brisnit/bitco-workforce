"use client";

import { useState } from "react";
import { Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Datum {
  key: string;
  label: string;
  value: number;
  /** Optional formatted value for labels/tooltips. */
  display?: string;
  /** Extra tooltip line. */
  detail?: string;
  /** Leading marker (e.g. a status dot) — identity carried by text, not bar color. */
  marker?: React.ReactNode;
  highlight?: boolean;
}

/** Toggle between chart and an accessible table of the same rows. */
function TableToggle({ rows, valueLabel, children }: { rows: Datum[]; valueLabel: string; children: React.ReactNode }) {
  const [table, setTable] = useState(false);
  return (
    <div>
      {table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-medium">Item</th>
              <th className="py-1.5 text-right font-medium">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="py-1.5">{r.label}</td>
                <td className="tabular py-1.5 text-right font-mono">{r.display ?? r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
      <button
        onClick={() => setTable((t) => !t)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-steel-500 hover:text-navy"
      >
        <Table2 className="size-3.5" /> {table ? "Show chart" : "View as table"}
      </button>
    </div>
  );
}

/** Vertical single-series column chart (e.g. per-week counts). */
export function ColumnChart({ rows, valueLabel, height = 180 }: { rows: Datum[]; valueLabel: string; height?: number }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const [hover, setHover] = useState<string | null>(null);
  return (
    <TableToggle rows={rows} valueLabel={valueLabel}>
      <div className="flex gap-2">
        <div className="relative w-6 shrink-0 text-right font-mono text-[0.65rem] text-muted-foreground" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((t) => (
              <div key={t} className={cn("absolute inset-x-0 border-t", t === 0 ? "border-steel-300" : "border-dashed border-steel-100")} style={{ bottom: `${(t / top) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {rows.map((r) => (
                <div
                  key={r.key}
                  className="group relative h-full flex-1 cursor-default"
                  onMouseEnter={() => setHover(r.key)}
                  onMouseLeave={() => setHover(null)}
                  tabIndex={0}
                  onFocus={() => setHover(r.key)}
                  onBlur={() => setHover(null)}
                  aria-label={`${r.label}: ${r.display ?? r.value} ${valueLabel}`}
                >
                  <div
                    className={cn(
                      "absolute inset-x-[14%] bottom-0 mx-auto max-w-12 rounded-t-[4px] transition-colors",
                      r.highlight ? "bg-orange" : "bg-navy",
                      hover && hover !== r.key && "opacity-50",
                    )}
                    style={{ height: `${(r.value / top) * 100}%`, minHeight: r.value ? 2 : 0 }}
                  />
                  {hover === r.key && (
                    <div className="pointer-events-none absolute left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg" style={{ bottom: `${(r.value / top) * 100}%` }}>
                      <span className="font-semibold">{r.display ?? r.value}</span> {valueLabel}
                      <span className="block text-white/70">{r.detail ?? r.label}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1.5 flex gap-[2px]">
            {rows.map((r) => (
              <span key={r.key} className={cn("flex-1 truncate text-center text-[0.68rem]", r.highlight ? "font-semibold text-ink" : "text-muted-foreground")}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </TableToggle>
  );
}

/** Horizontal single-series bar list (categories). */
export function BarList({ rows, valueLabel, max: maxProp }: { rows: Datum[]; valueLabel: string; max?: number }) {
  const max = maxProp ?? Math.max(1, ...rows.map((r) => r.value));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <TableToggle rows={rows} valueLabel={valueLabel}>
      <ul className="space-y-[2px]">
        {rows.map((r) => (
          <li
            key={r.key}
            className="grid grid-cols-[minmax(7rem,10rem)_1fr_3.5rem] items-center gap-3 rounded-md py-1.5"
            onMouseEnter={() => setHover(r.key)}
            onMouseLeave={() => setHover(null)}
            title={r.detail}
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-steel-700">
              {r.marker}
              <span className="truncate">{r.label}</span>
            </span>
            <span className="relative h-5">
              <span className="absolute inset-y-0 left-0 w-px bg-steel-300" />
              <span
                className={cn("absolute inset-y-[3px] left-0 rounded-r-[4px] bg-navy transition-opacity", hover && hover !== r.key && "opacity-50")}
                style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 2 : 0 }}
              />
            </span>
            <span className="tabular text-right font-mono text-sm font-semibold text-ink">{r.display ?? r.value}</span>
          </li>
        ))}
      </ul>
    </TableToggle>
  );
}

function niceTicks(max: number): number[] {
  const step = max <= 4 ? 1 : max <= 10 ? 2 : Math.ceil(max / 5);
  const out: number[] = [];
  for (let t = 0; t <= max + step - 1; t += step) {
    out.push(t);
    if (t >= max) break;
  }
  return out;
}
