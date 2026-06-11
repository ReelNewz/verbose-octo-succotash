export interface AdPerformanceInputs {
  objective: string;
  dailyBudget: number;
  audience: string;
}

export interface AdPerformanceResults {
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
}

const OBJECTIVE_CTR: Record<string, number> = {
  Awareness: 0.6,
  Traffic: 1.2,
  Engagement: 1.8,
  Leads: 1.5,
  Sales: 1.0,
};

const OBJECTIVE_CONVERSION_RATE: Record<string, number> = {
  Awareness: 0.01,
  Traffic: 0.03,
  Engagement: 0.05,
  Leads: 0.12,
  Sales: 0.08,
};

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateAdPerformance({ objective, dailyBudget, audience }: AdPerformanceInputs): AdPerformanceResults {
  const random = mulberry32(hashSeed(`${objective}-${dailyBudget}-${audience}`));
  const cpm = 8 + random() * 7; // $8-$15 cost per 1000 impressions
  const monthlyBudget = dailyBudget * 30;
  const impressions = Math.round((monthlyBudget / cpm) * 1000);

  const baseCtr = OBJECTIVE_CTR[objective] ?? 1.0;
  const ctr = Math.round((baseCtr + (random() - 0.5) * 0.4) * 1000) / 1000;
  const clicks = Math.max(0, Math.round(impressions * (ctr / 100)));

  const cpc = clicks > 0 ? Math.round((monthlyBudget / clicks) * 100) / 100 : 0;

  const conversionRate = OBJECTIVE_CONVERSION_RATE[objective] ?? 0.03;
  const conversions = Math.max(0, Math.round(clicks * conversionRate));

  return { impressions, clicks, ctr, cpc, conversions };
}
