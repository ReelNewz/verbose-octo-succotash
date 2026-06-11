import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { calculateRoi } from "@/lib/roiCalculator";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export default function RoiCalculatorPage() {
  const [monthlySpend, setMonthlySpend] = useState(1500);
  const [avgDealValue, setAvgDealValue] = useState(500);
  const [conversionRate, setConversionRate] = useState(5);
  const [closeRate, setCloseRate] = useState(20);

  const results = useMemo(
    () => calculateRoi({ monthlySpend, avgDealValue, conversionRate, closeRate }),
    [monthlySpend, avgDealValue, conversionRate, closeRate],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ROI Calculator</h1>
        <p className="text-muted-foreground">Estimate leads, customers, and revenue from your marketing spend.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Numbers</CardTitle>
            <CardDescription>Adjust the sliders to match your business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Monthly Ad Spend</Label>
                <span className="text-sm font-medium">{formatCurrency(monthlySpend)}</span>
              </div>
              <Slider min={100} max={10000} step={100} value={[monthlySpend]} onValueChange={([v]) => setMonthlySpend(v)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Average Deal Value</Label>
                <span className="text-sm font-medium">{formatCurrency(avgDealValue)}</span>
              </div>
              <Slider min={50} max={5000} step={50} value={[avgDealValue]} onValueChange={([v]) => setAvgDealValue(v)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Click-to-Lead Conversion Rate</Label>
                <span className="text-sm font-medium">{formatPercent(conversionRate)}</span>
              </div>
              <Slider min={1} max={20} step={0.5} value={[conversionRate]} onValueChange={([v]) => setConversionRate(v)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lead-to-Customer Close Rate</Label>
                <span className="text-sm font-medium">{formatPercent(closeRate)}</span>
              </div>
              <Slider min={1} max={100} step={1} value={[closeRate]} onValueChange={([v]) => setCloseRate(v)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Projected Results</CardTitle>
            <CardDescription>Based on a typical $2.50 cost-per-click estimate.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Leads / mo</p>
              <p className="text-2xl font-bold">{formatNumber(results.estimatedLeads)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Customers / mo</p>
              <p className="text-2xl font-bold">{formatNumber(results.estimatedCustomers)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Revenue / mo</p>
              <p className="text-2xl font-bold">{formatCurrency(results.estimatedRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated ROI</p>
              <p className={`text-2xl font-bold ${results.roiPercent >= 0 ? "text-success" : "text-destructive"}`}>
                {formatPercent(results.roiPercent, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
