export const COMPANY = {
  name: "NexaMarketing Consulting Group",
  addressLine1: "1500 E. Woodfield Road, Suite 200",
  city: "Schaumburg",
  state: "IL",
  postalCode: "60173",
  fullAddress: "1500 E. Woodfield Road, Suite 200, Schaumburg, IL 60173",
  phone: "(847) 392-9200",
  email: "hello@nexamarketing.com",
  hoursWeekday: "Mon-Fri 8am-6pm CST",
  hoursSaturday: "Sat 9am-2pm CST",
  region: "Schaumburg & the Chicago Northwest Suburbs",
} as const;

export const MAP_EMBED_SRC = `https://maps.google.com/maps?q=${encodeURIComponent(
  COMPANY.fullAddress,
)}&output=embed`;

export interface RevenueModel {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

export const REVENUE_MODELS: RevenueModel[] = [
  {
    id: "starter-sprint",
    name: "Starter Sprint",
    price: "$2,500",
    cadence: "one-time project",
    description:
      "A focused sprint to audit, plan, and launch your first marketing campaign — perfect for businesses testing the waters.",
    features: [
      "Marketing audit & competitor snapshot",
      "30-day campaign plan",
      "Landing page or ad creative review",
      "Kickoff + wrap-up strategy session",
    ],
  },
  {
    id: "growth-campaign",
    name: "Growth Campaign",
    price: "$750",
    cadence: "per campaign",
    description:
      "Launch and manage individual campaigns across Meta, Google, or local search — pay only for the campaigns you run.",
    features: [
      "Full campaign setup & creative",
      "Audience targeting & budget management",
      "Weekly performance reporting",
      "A/B testing included",
    ],
    highlight: true,
  },
  {
    id: "pro-retainer",
    name: "Pro Retainer",
    price: "$1,500",
    cadence: "per month",
    description:
      "Ongoing, hands-on management of your marketing across channels with monthly strategy and reporting.",
    features: [
      "Dedicated account strategist",
      "Multi-channel campaign management",
      "Local SEO & Google Business Profile optimization",
      "Monthly competitor intelligence report",
    ],
  },
  {
    id: "affiliate-partner",
    name: "Affiliate Partner",
    price: "Commission",
    cadence: "per qualified lead",
    description:
      "A performance-based partnership — we generate and qualify leads for your business, and you pay only for results.",
    features: [
      "Lead generation funnels",
      "Lead qualification & scoring",
      "CRM-ready lead delivery",
      "Pay-per-lead pricing",
    ],
  },
];

export interface CompetitorIntelTool {
  id: string;
  name: string;
  description: string;
  route: string;
}

export const COMPETITOR_INTEL_TOOLS: CompetitorIntelTool[] = [
  {
    id: "swot",
    name: "SWOT Analyzer",
    description:
      "Map out competitor strengths, weaknesses, opportunities, and threats to find your edge.",
    route: "/dashboard/competitor-intel/swot",
  },
  {
    id: "market-share",
    name: "Market Share Estimator",
    description:
      "Visualize how your business stacks up against local competitors with an interactive breakdown.",
    route: "/dashboard/competitor-intel/market-share",
  },
  {
    id: "keyword-gap",
    name: "Keyword Gap Finder",
    description:
      "Discover keywords your competitors rank for that you don't — and prioritize the biggest opportunities.",
    route: "/dashboard/competitor-intel/keyword-gap",
  },
  {
    id: "social-ad-spy",
    name: "Social Ad Spy Tool",
    description:
      "Track the ads your competitors are running on Facebook, Instagram, and beyond.",
    route: "/dashboard/competitor-intel/social-ad-spy",
  },
];

export const PROCESS_STEPS = [
  {
    title: "Discovery",
    description: "We learn about your business, audience, and goals through a deep-dive consultation.",
  },
  {
    title: "Strategy",
    description: "We build a custom marketing plan and select the right channels and budget mix.",
  },
  {
    title: "Launch",
    description: "We build, design, and launch your campaigns across the chosen platforms.",
  },
  {
    title: "Optimize",
    description: "We monitor performance daily and continuously test creative, audiences, and bids.",
  },
  {
    title: "Report",
    description: "You get clear, jargon-free reporting on results, spend, and ROI every month.",
  },
];

export const TESTIMONIALS = [
  {
    name: "Maria Lopez",
    business: "Schaumburg Smiles Dental",
    quote:
      "NexaMarketing rebuilt our Google Business Profile and local SEO — we went from page 3 to the top 3 results for 'dentist near me' in Schaumburg within two months.",
  },
  {
    name: "Devon Carter",
    business: "Woodfield Fitness Studio",
    quote:
      "The Growth Campaign package paid for itself in the first two weeks. Our Meta ads are finally bringing in real leads, not just likes.",
  },
  {
    name: "Priya Nair",
    business: "Northwest Suburbs Realty Group",
    quote:
      "The competitor intelligence reports are a game changer. We finally know what our competitors are doing and how to beat them.",
  },
];

export const STATS = [
  { label: "Campaigns Launched", value: 240, suffix: "+" },
  { label: "Avg. Lead Increase", value: 68, suffix: "%" },
  { label: "Local Businesses Served", value: 85, suffix: "+" },
  { label: "Years Serving the NW Suburbs", value: 9, suffix: "" },
];
