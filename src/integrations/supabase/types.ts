export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "client";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "admin" | "client";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "admin" | "client";
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          address_line1: string;
          city: string;
          state: string;
          postal_code: string;
          phone: string;
          email: string;
          hours_weekday: string;
          hours_saturday: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name?: string;
          address_line1?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          phone?: string;
          email?: string;
          hours_weekday?: string;
          hours_saturday?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          address_line1?: string;
          city?: string;
          state?: string;
          postal_code?: string;
          phone?: string;
          email?: string;
          hours_weekday?: string;
          hours_saturday?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          company?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_requests: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          reason: string | null;
          status: "pending" | "approved" | "denied";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          reason?: string | null;
          status?: "pending" | "approved" | "denied";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          reason?: string | null;
          status?: "pending" | "approved" | "denied";
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          source: string | null;
          status: "New" | "Contacted" | "Qualified" | "Closed";
          notes: string | null;
          estimated_value: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string | null;
          status?: "New" | "Contacted" | "Qualified" | "Closed";
          notes?: string | null;
          estimated_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string | null;
          status?: "New" | "Contacted" | "Qualified" | "Closed";
          notes?: string | null;
          estimated_value?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          channel: "Facebook" | "Instagram" | "Google Ads" | "Email" | "SEO" | "Other";
          status: "Draft" | "Active" | "Paused" | "Completed";
          budget: number;
          spend: number;
          revenue: number;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          channel: "Facebook" | "Instagram" | "Google Ads" | "Email" | "SEO" | "Other";
          status?: "Draft" | "Active" | "Paused" | "Completed";
          budget?: number;
          spend?: number;
          revenue?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          channel?: "Facebook" | "Instagram" | "Google Ads" | "Email" | "SEO" | "Other";
          status?: "Draft" | "Active" | "Paused" | "Completed";
          budget?: number;
          spend?: number;
          revenue?: number;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_strategies: {
        Row: {
          id: string;
          user_id: string;
          business_type: string;
          goals: string;
          target_audience: string | null;
          monthly_budget: number | null;
          preferred_channels: string[] | null;
          generated_strategy: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_type: string;
          goals: string;
          target_audience?: string | null;
          monthly_budget?: number | null;
          preferred_channels?: string[] | null;
          generated_strategy: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_type?: string;
          goals?: string;
          target_audience?: string | null;
          monthly_budget?: number | null;
          preferred_channels?: string[] | null;
          generated_strategy?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      meta_ad_sets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          objective: "Awareness" | "Traffic" | "Engagement" | "Leads" | "Sales";
          audience: string;
          daily_budget: number;
          placement: string;
          impressions: number;
          clicks: number;
          ctr: number;
          cpc: number;
          conversions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          objective: "Awareness" | "Traffic" | "Engagement" | "Leads" | "Sales";
          audience: string;
          daily_budget?: number;
          placement?: string;
          impressions?: number;
          clicks?: number;
          ctr?: number;
          cpc?: number;
          conversions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          objective?: "Awareness" | "Traffic" | "Engagement" | "Leads" | "Sales";
          audience?: string;
          daily_budget?: number;
          placement?: string;
          impressions?: number;
          clicks?: number;
          ctr?: number;
          cpc?: number;
          conversions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      local_rankings: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          current_rank: number | null;
          target_rank: number | null;
          search_volume: number | null;
          location: string;
          last_checked: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          current_rank?: number | null;
          target_rank?: number | null;
          search_volume?: number | null;
          location?: string;
          last_checked?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          current_rank?: number | null;
          target_rank?: number | null;
          search_volume?: number | null;
          location?: string;
          last_checked?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      swot_analyses: {
        Row: {
          id: string;
          user_id: string;
          competitor_name: string;
          strengths: string | null;
          weaknesses: string | null;
          opportunities: string | null;
          threats: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          competitor_name: string;
          strengths?: string | null;
          weaknesses?: string | null;
          opportunities?: string | null;
          threats?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          competitor_name?: string;
          strengths?: string | null;
          weaknesses?: string | null;
          opportunities?: string | null;
          threats?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      market_share_entries: {
        Row: {
          id: string;
          user_id: string;
          competitor_name: string;
          market_share_percent: number;
          color: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          competitor_name: string;
          market_share_percent: number;
          color?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          competitor_name?: string;
          market_share_percent?: number;
          color?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      keyword_gaps: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          our_rank: number | null;
          competitor_name: string;
          competitor_rank: number | null;
          search_volume: number | null;
          opportunity_score: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          our_rank?: number | null;
          competitor_name: string;
          competitor_rank?: number | null;
          search_volume?: number | null;
          opportunity_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          our_rank?: number | null;
          competitor_name?: string;
          competitor_rank?: number | null;
          search_volume?: number | null;
          opportunity_score?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      social_ad_spy: {
        Row: {
          id: string;
          user_id: string;
          competitor_name: string;
          platform: "Facebook" | "Instagram" | "TikTok" | "LinkedIn" | "Google" | "Other";
          ad_copy: string | null;
          image_url: string | null;
          notes: string | null;
          date_observed: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          competitor_name: string;
          platform: "Facebook" | "Instagram" | "TikTok" | "LinkedIn" | "Google" | "Other";
          ad_copy?: string | null;
          image_url?: string | null;
          notes?: string | null;
          date_observed?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          competitor_name?: string;
          platform?: "Facebook" | "Instagram" | "TikTok" | "LinkedIn" | "Google" | "Other";
          ad_copy?: string | null;
          image_url?: string | null;
          notes?: string | null;
          date_observed?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_current_user_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
