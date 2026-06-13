import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export interface EvidenceItem {
  id?: string;
  label: string;
  url: string;
}

interface Props {
  value: EvidenceItem[];
  onChange: (next: EvidenceItem[]) => void;
}

export function EvidenceLinksEditor({ value, onChange }: Props) {
  const update = (i: number, patch: Partial<EvidenceItem>) =>
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input
            placeholder="Label (e.g. FOIA Response #4)"
            value={it.label}
            onChange={(e) => update(i, { label: e.target.value })}
            className="bg-input border-border"
          />
          <Input
            placeholder="https://…"
            value={it.url}
            onChange={(e) => update(i, { url: e.target.value })}
            className="bg-input border-border"
          />
          <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { label: "", url: "" }])}>
        <Plus className="h-4 w-4 mr-1" /> Add evidence link
      </Button>
    </div>
  );
}
