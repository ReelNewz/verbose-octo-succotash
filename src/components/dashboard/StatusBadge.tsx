import { Badge, type badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const LEAD_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  New: "secondary",
  Contacted: "default",
  Qualified: "warning",
  Closed: "success",
};

const CAMPAIGN_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  Draft: "secondary",
  Active: "success",
  Paused: "warning",
  Completed: "default",
};

export function LeadStatusBadge({ status }: { status: string }) {
  return <Badge variant={LEAD_STATUS_VARIANTS[status] ?? "secondary"}>{status}</Badge>;
}

export function CampaignStatusBadge({ status }: { status: string }) {
  return <Badge variant={CAMPAIGN_STATUS_VARIANTS[status] ?? "secondary"}>{status}</Badge>;
}
