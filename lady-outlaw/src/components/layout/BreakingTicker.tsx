const ITEMS = [
  "BREAKING — Illinois DCFS contractor capture investigation expands",
  "FILED — New FOIA request: Title IV-E funding diversions",
  "DEVELOPING — Family court bias log: 47 hearings reviewed this month",
  "EXCLUSIVE — Whistleblower transcript drops Friday on Reel News With Nuzzo",
  "JUST IN — Emergency motion templates added to the Resource Library",
];

export const BreakingTicker = () => (
  <div className="fixed top-16 md:top-20 inset-x-0 z-40 bg-primary text-primary-foreground border-y border-ink/40">
    <div className="container flex items-center h-8">
      <span className="font-stencil text-xs px-3 py-0.5 bg-ink text-primary mr-4 shrink-0 animate-flicker">● LIVE WIRE</span>
      <div className="ticker-wrap flex-1">
        <div className="ticker font-stencil text-xs">
          {ITEMS.concat(ITEMS).map((t, i) => (
            <span key={i} className="mx-8">{t}</span>
          ))}
        </div>
      </div>
    </div>
  </div>
);
