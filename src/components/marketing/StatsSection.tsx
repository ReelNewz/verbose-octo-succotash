import { useEffect, useRef, useState } from "react";
import { STATS } from "@/lib/constants";

function useCountUp(target: number, active: boolean, durationMs = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, durationMs]);

  return value;
}

function StatItem({ value, label, suffix }: { value: number; label: string; suffix: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(value, active);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-bold text-primary sm:text-5xl">
        {count}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function StatsSection() {
  return (
    <section className="border-y bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((stat) => (
          <StatItem key={stat.label} value={stat.value} label={stat.label} suffix={stat.suffix} />
        ))}
      </div>
    </section>
  );
}
