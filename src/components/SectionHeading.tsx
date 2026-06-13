import { ReactNode } from "react";

export const SectionHeading = ({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) => (
  <div className="mb-10 max-w-3xl">
    {eyebrow && <div className="font-stencil text-xs text-primary mb-3 tracking-[0.2em]">— {eyebrow}</div>}
    <h2 className="font-display text-3xl md:text-5xl font-black text-balance leading-tight">{title}</h2>
    {children && <p className="text-muted-foreground mt-4 text-lg">{children}</p>}
  </div>
);
