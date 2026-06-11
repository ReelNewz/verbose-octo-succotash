import { useState, type FormEvent } from "react";
import { Loader2, Mail, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY } from "@/lib/constants";
import { toast } from "sonner";

const initialState = { name: "", email: "", phone: "", company: "", message: "" };

export function ContactSection() {
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("contact_submissions").insert({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      company: form.company || null,
      message: form.message,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Something went wrong", { description: error.message });
      return;
    }

    toast.success("Message sent! We'll be in touch within one business day.");
    setForm(initialState);
  };

  return (
    <section id="contact" className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get your free strategy session</h2>
          <p className="mt-4 text-muted-foreground">
            Tell us about your business and goals — we'll follow up with a custom growth plan.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>We typically respond within one business day.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input
                      id="contact-name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-company">Business Name</Label>
                    <Input
                      id="contact-company"
                      value={form.company}
                      onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">How can we help?</Label>
                  <Textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{COMPANY.fullAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{COMPANY.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{COMPANY.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Hours</p>
                <p className="text-sm text-muted-foreground">{COMPANY.hoursWeekday}</p>
                <p className="text-sm text-muted-foreground">{COMPANY.hoursSaturday}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
