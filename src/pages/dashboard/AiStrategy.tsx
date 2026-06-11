import { useEffect, useState } from "react";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateStrategy } from "@/lib/strategyGenerator";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

type AiStrategyRow = Database["public"]["Tables"]["ai_strategies"]["Row"];

const BUSINESS_TYPES = ["Restaurant", "Retail Store", "Healthcare Practice", "Home Services", "Real Estate", "Fitness Studio", "Professional Services", "Other"];
const GOALS = ["Brand Awareness", "Lead Generation", "Sales", "Retention"];
const CHANNEL_OPTIONS = ["Meta Ads", "Google Ads", "Local SEO", "Email Marketing"];
const TOTAL_STEPS = 3;

export default function AiStrategy() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [goal, setGoal] = useState(GOALS[0]);
  const [monthlyBudget, setMonthlyBudget] = useState("1500");
  const [targetAudience, setTargetAudience] = useState("");
  const [channels, setChannels] = useState<string[]>(["Meta Ads", "Local SEO"]);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<AiStrategyRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from("ai_strategies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setHistory(data ?? []);
    setLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const toggleChannel = (channel: string) => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  };

  const handleGenerate = () => {
    setResult(generateStrategy({ businessType, goal, monthlyBudget: Number(monthlyBudget) || 0, targetAudience, channels }));
    setStep(TOTAL_STEPS + 1);
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
      toast.error("Couldn't save strategy", { description: error.message });
      return;
    }
    toast.success("Strategy saved");
    loadHistory();
  };

  const startOver = () => {
    setStep(1);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Strategy Generator</h1>
        <p className="text-muted-foreground">Build a custom marketing strategy in a few quick steps.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategy Wizard</CardTitle>
          <CardDescription>Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}</CardDescription>
          <Progress value={(Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100} />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Primary Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-budget">Monthly Budget ($)</Label>
                <Input id="ai-budget" type="number" min="0" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-audience">Target Audience</Label>
                <Textarea
                  id="ai-audience"
                  rows={3}
                  placeholder="e.g. Homeowners aged 30-55 in Schaumburg and surrounding suburbs"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
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
          )}

          {step > TOTAL_STEPS && result && (
            <div className="space-y-4">
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">{result}</pre>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Strategy
                </Button>
                <Button variant="outline" onClick={startOver}>Start Over</Button>
              </div>
            </div>
          )}

          {step <= TOTAL_STEPS && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleGenerate}>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Strategy
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Strategies</CardTitle>
          <CardDescription>Strategies you've generated and saved</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={Sparkles} title="No saved strategies yet" description="Generate and save a strategy above to see it here." />
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{item.business_type} &middot; {item.goals}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.generated_strategy}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
