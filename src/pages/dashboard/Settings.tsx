import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/constants";
import { toast } from "sonner";

interface ProfileForm {
  company_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  email: string;
  hours_weekday: string;
  hours_saturday: string;
}

const defaultForm: ProfileForm = {
  company_name: COMPANY.name,
  address_line1: COMPANY.addressLine1,
  city: COMPANY.city,
  state: COMPANY.state,
  postal_code: COMPANY.postalCode,
  phone: COMPANY.phone,
  email: COMPANY.email,
  hours_weekday: COMPANY.hoursWeekday,
  hours_saturday: COMPANY.hoursSaturday,
};

export default function Settings() {
  const { user } = useAuth();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (cancelled) return;
      if (data) {
        setForm({
          company_name: data.company_name,
          address_line1: data.address_line1,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          phone: data.phone,
          email: data.email,
          hours_weekday: data.hours_weekday,
          hours_saturday: data.hours_saturday,
        });
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        ...form,
      },
      { onConflict: "user_id" },
    );

    setSaving(false);

    if (error) {
      toast.error("Couldn't save settings", { description: error.message });
      return;
    }

    toast.success("Business profile saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your business profile information.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>This information is used across your dashboard and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-company">Company Name</Label>
            <Input id="settings-company" value={form.company_name} onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-address">Address</Label>
            <Input id="settings-address" value={form.address_line1} onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="settings-city">City</Label>
              <Input id="settings-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-state">State</Label>
              <Input id="settings-state" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-postal">Postal Code</Label>
              <Input id="settings-postal" value={form.postal_code} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-phone">Phone</Label>
              <Input id="settings-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input id="settings-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-hours-weekday">Weekday Hours</Label>
              <Input id="settings-hours-weekday" value={form.hours_weekday} onChange={(e) => setForm((f) => ({ ...f, hours_weekday: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-hours-saturday">Saturday Hours</Label>
              <Input id="settings-hours-saturday" value={form.hours_saturday} onChange={(e) => setForm((f) => ({ ...f, hours_saturday: e.target.value }))} />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
