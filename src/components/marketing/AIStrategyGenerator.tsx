import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateStrategy } from "@/lib/strategyGenerator";
import { toast } from "sonner";

const BUSINESS_TYPES = ["Restaurant", "Retail Store", "Healthcare Practice", "Home Services", "Real Estate", "Fitness Studio", "Professional Services", "Other"];
const GOALS = ["Brand Awareness", "Lead Generation", "Sales", "Retention"];
const CHANNEL_OPTIONS = ["Meta Ads", "Google Ads", "Local SEO", "Email Marketing"];

export function AIStrategyGenerator() {
  const { user } = useAuth();
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState("1500");
  const [targetAudience, setTargetAudience] = useState("");
  const [channels, setChannels] = useState<string[]>(["Meta Ads", "Local SEO"]);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleChannel = (channel: string) => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  };

  const handleGenerate = () => {
    const strategy = generateStrategy({
      businessType,
      goal,
      monthlyBudget: Number(monthlyBudget) || 0,
      targetAudience,
      channels,
    });
    setResult(strategy);
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setSaving(true);
    const { error } = await supabase.from("ai_strategies").insert({
      user_id: user.id,
      business_type: businessType,
      goals: goal,
      target_audience: targetAudience || null,
      monthly_budget: Number(monthlyBudget) || null,
      preferred_channels: channels,
      generated_strategy: result,
    });
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your strategy", { description: error.message });
    } else {
      toast.success("Strategy saved to your dashboard");
    }
  };

  return (
    <section id="ai-strategy" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Strategy Generator</h2>
          <p className="mt-4 text-muted-foreground">
            Answer a few questions and get an instant, custom marketing strategy for your business.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>We'll generate a tailored strategy in seconds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
                <Input
                  id="monthly-budget"
                  type="number"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-audience">Target Audience</Label>
                <Textarea
                  id="target-audience"
                  placeholder="e.g. Homeowners aged 30-55 in Schaumburg and surrounding suburbs"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {CHANNEL_OPTIONS.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        channels.includes(channel)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleGenerate} className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Strategy
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Custom Strategy</CardTitle>
              <CardDescription>
                {result ? "Here's a starting point — schedule a session to put it into action." : "Fill out the form and click Generate to see your strategy here."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{result}</pre>
                  {user ? (
                    <Button onClick={handleSave} disabled={saving} variant="outline" className="w-full">
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save to my dashboard
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                        Sign in
                      </Link>{" "}
                      to save this strategy to your dashboard.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No strategy generated yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
