import { PROCESS_STEPS } from "@/lib/constants";

export function ProcessTimeline() {
  return (
    <section id="process" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How we work</h2>
        <p className="mt-4 text-muted-foreground">
          A simple, transparent process from first conversation to ongoing growth.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {PROCESS_STEPS.map((step, index) => (
          <div key={step.title} className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {index + 1}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
