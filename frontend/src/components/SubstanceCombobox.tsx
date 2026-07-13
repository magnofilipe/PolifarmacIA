import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { SUBSTANCES } from "@/lib/substances";
import { normalize } from "@/lib/interactions";

interface Props {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}

export function SubstanceCombobox({ value, onChange, required, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return SUBSTANCES;
    return SUBSTANCES.filter((s) => normalize(s).includes(q));
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm outline-none transition-colors hover:border-primary/40 focus:border-primary"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value || placeholder || "Selecione uma substância"}
        </span>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </button>
      {/* hidden input to preserve required semantics */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => {}}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-elegant">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar substância…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma substância encontrada.
              </li>
            ) : (
              filtered.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <span>{s}</span>
                    {value === s && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
