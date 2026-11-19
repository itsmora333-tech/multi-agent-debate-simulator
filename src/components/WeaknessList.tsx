import { useState } from "react";
import { ChevronDown, ChevronRight, ThumbsDown, Sparkles } from "lucide-react";

interface Props {
  title: string;
  items: string[];
  tone: "proponent" | "opponent";
}

export default function WeaknessList({ title, items, tone }: Props) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <ThumbsDown
          className={`h-4 w-4 shrink-0 ${tone === "proponent" ? "text-blue-500" : "text-rose-500"}`}
        />
        <span className="text-sm font-semibold text-slate-800">{title}</span>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          {items.length}
        </span>
      </button>
      {open && (
        <ul className="space-y-2 border-t border-slate-100 px-4 py-3">
          {items.map((w, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
