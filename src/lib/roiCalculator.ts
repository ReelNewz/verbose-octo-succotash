export interface RoiInputs {
  monthlySpend: number;
  avgDealValue: number;
  conversionRate: number;
  closeRate: number;
}

export interface RoiResults {
  estimatedLeads: number;
  estimatedCustomers: number;
  estimatedRevenue: number;
  roiPercent: number;
}

const ASSUMED_COST_PER_CLICK = 2.5;

export function calculateRoi({ monthlySpend, avgDealValue, conversionRate, closeRate }: RoiInputs): RoiResults {
  const clicks = monthlySpend > 0 ? monthlySpend / ASSUMED_COST_PER_CLICK : 0;
  const estimatedLeads = clicks * (conversionRate / 100);
  const estimatedCustomers = estimatedLeads * (closeRate / 100);
  const estimatedRevenue = estimatedCustomers * avgDealValue;
  const roiPercent = monthlySpend > 0 ? ((estimatedRevenue - monthlySpend) / monthlySpend) * 100 : 0;

  return {
    estimatedLeads: Math.round(estimatedLeads),
    estimatedCustomers: Math.round(estimatedCustomers * 10) / 10,
    estimatedRevenue: Math.round(estimatedRevenue),
    roiPercent: Math.round(roiPercent),
  };
}
