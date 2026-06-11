export interface StrategyInputs {
  businessType: string;
  goal: string;
  monthlyBudget: number;
  targetAudience: string;
  channels: string[];
}

const GOAL_TACTICS: Record<string, string[]> = {
  "Brand Awareness": [
    "Run reach-optimized campaigns on Meta and Instagram with eye-catching video creative",
    "Publish weekly local-interest content to build organic visibility in Schaumburg and the NW suburbs",
    "Claim and optimize your Google Business Profile to appear in local map searches",
  ],
  "Lead Generation": [
    "Build a lead-gen funnel with a dedicated landing page and lead magnet offer",
    "Launch conversion-focused Meta and Google Ads campaigns targeting your ideal customer profile",
    "Set up automated email follow-up sequences to nurture new leads",
  ],
  Sales: [
    "Run retargeting campaigns to bring back warm visitors with limited-time offers",
    "Launch shopping or sales-objective campaigns on Meta and Google",
    "Optimize checkout/landing pages to reduce drop-off and increase conversion rate",
  ],
  Retention: [
    "Launch an email and SMS loyalty program for existing customers",
    "Run review-generation campaigns to build social proof",
    "Create a referral program promoted through your existing customer base",
  ],
};

export function generateStrategy({ businessType, goal, monthlyBudget, targetAudience, channels }: StrategyInputs): string {
  const tactics = GOAL_TACTICS[goal] ?? GOAL_TACTICS["Brand Awareness"];
  const channelList = channels.length > 0 ? channels.join(", ") : "Meta Ads, Google Ads, and Local SEO";

  const budgetSplit = monthlyBudget > 0
    ? `With a monthly budget of $${monthlyBudget.toLocaleString()}, we'd recommend allocating roughly 50% to paid advertising, 30% to content and SEO, and 20% to testing and optimization.`
    : "Once you set a monthly budget, we can recommend a precise channel allocation.";

  const lines = [
    `Strategy Overview for a ${businessType || "local"} business`,
    "",
    `Primary Goal: ${goal || "Brand Awareness"}`,
    `Target Audience: ${targetAudience || "Local customers in Schaumburg and the surrounding NW suburbs"}`,
    `Recommended Channels: ${channelList}`,
    "",
    budgetSplit,
    "",
    "Recommended Tactics:",
    ...tactics.map((tactic) => `- ${tactic}`),
    "",
    "Next Step: Schedule a free strategy session with NexaMarketing to turn this plan into a launch-ready campaign.",
  ];

  return lines.join("\n");
}
