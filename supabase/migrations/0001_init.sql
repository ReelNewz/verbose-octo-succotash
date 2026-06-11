-- =====================================================================
-- 0001_init.sql
-- NexaMarketing Consulting Group - initial schema
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Helper: updated_at trigger function
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. user_roles  (drives is_current_user_admin())
-- ---------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- ---------------------------------------------------------------------
-- 2. is_current_user_admin() - SECURITY DEFINER to avoid RLS recursion
-- ---------------------------------------------------------------------
create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated, anon;

-- user_roles policies (defined after is_current_user_admin exists)
create policy "user_roles_select_own"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_roles_admin_all"
  on public.user_roles for all
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 3. profiles  (business profile / settings, 1:1 with auth.users)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null default 'NexaMarketing Consulting Group',
  address_line1 text not null default '1500 E. Woodfield Road, Suite 200',
  city text not null default 'Schaumburg',
  state text not null default 'IL',
  postal_code text not null default '60173',
  phone text not null default '(847) 392-9200',
  email text not null default 'hello@nexamarketing.com',
  hours_weekday text not null default 'Mon-Fri 8am-6pm CST',
  hours_saturday text not null default 'Sat 9am-2pm CST',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 4. contact_submissions  (public marketing site contact form)
-- ---------------------------------------------------------------------
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.contact_submissions enable row level security;

create policy "contact_submissions_insert_anyone"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

create policy "contact_submissions_select_admin"
  on public.contact_submissions for select
  to authenticated
  using (public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 5. admin_requests  (request admin access)
-- ---------------------------------------------------------------------
create table public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now()
);

alter table public.admin_requests enable row level security;

create policy "admin_requests_insert_own"
  on public.admin_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "admin_requests_select_own_or_admin"
  on public.admin_requests for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "admin_requests_update_admin"
  on public.admin_requests for update
  to authenticated
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 6. leads  (pipeline CRUD)
-- ---------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  source text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Qualified', 'Closed')),
  notes text,
  estimated_value numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

create policy "leads_select_own_or_admin"
  on public.leads for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "leads_insert_own"
  on public.leads for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "leads_update_own_or_admin"
  on public.leads for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "leads_delete_own_or_admin"
  on public.leads for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 7. campaigns  (CRUD)
-- ---------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('Facebook', 'Instagram', 'Google Ads', 'Email', 'SEO', 'Other')),
  status text not null default 'Draft' check (status in ('Draft', 'Active', 'Paused', 'Completed')),
  budget numeric(12,2) not null default 0,
  spend numeric(12,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.campaigns enable row level security;

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create policy "campaigns_select_own_or_admin"
  on public.campaigns for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "campaigns_insert_own"
  on public.campaigns for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "campaigns_update_own_or_admin"
  on public.campaigns for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "campaigns_delete_own_or_admin"
  on public.campaigns for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 8. ai_strategies  (AI Strategy Generator + wizard saves)
-- ---------------------------------------------------------------------
create table public.ai_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_type text not null,
  goals text not null,
  target_audience text,
  monthly_budget numeric(12,2),
  preferred_channels text[],
  generated_strategy text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_strategies enable row level security;

create policy "ai_strategies_select_own_or_admin"
  on public.ai_strategies for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "ai_strategies_insert_own"
  on public.ai_strategies for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "ai_strategies_update_own_or_admin"
  on public.ai_strategies for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "ai_strategies_delete_own_or_admin"
  on public.ai_strategies for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 9. meta_ad_sets  (Meta Ads ad set builder + simulated performance)
-- ---------------------------------------------------------------------
create table public.meta_ad_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  objective text not null check (objective in ('Awareness', 'Traffic', 'Engagement', 'Leads', 'Sales')),
  audience text not null,
  daily_budget numeric(12,2) not null default 0,
  placement text not null default 'Automatic',
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(6,3) not null default 0,
  cpc numeric(8,2) not null default 0,
  conversions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meta_ad_sets enable row level security;

create trigger meta_ad_sets_set_updated_at
  before update on public.meta_ad_sets
  for each row execute function public.set_updated_at();

create policy "meta_ad_sets_select_own_or_admin"
  on public.meta_ad_sets for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "meta_ad_sets_insert_own"
  on public.meta_ad_sets for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "meta_ad_sets_update_own_or_admin"
  on public.meta_ad_sets for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "meta_ad_sets_delete_own_or_admin"
  on public.meta_ad_sets for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 10. local_rankings  (Local SEO CRUD)
-- ---------------------------------------------------------------------
create table public.local_rankings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  current_rank integer,
  target_rank integer,
  search_volume integer,
  location text not null default 'Schaumburg, IL',
  last_checked date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.local_rankings enable row level security;

create trigger local_rankings_set_updated_at
  before update on public.local_rankings
  for each row execute function public.set_updated_at();

create policy "local_rankings_select_own_or_admin"
  on public.local_rankings for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "local_rankings_insert_own"
  on public.local_rankings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "local_rankings_update_own_or_admin"
  on public.local_rankings for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "local_rankings_delete_own_or_admin"
  on public.local_rankings for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 11. swot_analyses  (Competitor Intel: SWOT builder)
-- ---------------------------------------------------------------------
create table public.swot_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_name text not null,
  strengths text,
  weaknesses text,
  opportunities text,
  threats text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.swot_analyses enable row level security;

create trigger swot_analyses_set_updated_at
  before update on public.swot_analyses
  for each row execute function public.set_updated_at();

create policy "swot_analyses_select_own_or_admin"
  on public.swot_analyses for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "swot_analyses_insert_own"
  on public.swot_analyses for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "swot_analyses_update_own_or_admin"
  on public.swot_analyses for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "swot_analyses_delete_own_or_admin"
  on public.swot_analyses for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 12. market_share_entries  (Competitor Intel: Market Share pie chart)
-- ---------------------------------------------------------------------
create table public.market_share_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_name text not null,
  market_share_percent numeric(5,2) not null check (market_share_percent >= 0 and market_share_percent <= 100),
  color text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_share_entries enable row level security;

create trigger market_share_entries_set_updated_at
  before update on public.market_share_entries
  for each row execute function public.set_updated_at();

create policy "market_share_entries_select_own_or_admin"
  on public.market_share_entries for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "market_share_entries_insert_own"
  on public.market_share_entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "market_share_entries_update_own_or_admin"
  on public.market_share_entries for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "market_share_entries_delete_own_or_admin"
  on public.market_share_entries for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 13. keyword_gaps  (Competitor Intel: Keyword Gap Finder table)
-- ---------------------------------------------------------------------
create table public.keyword_gaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  our_rank integer,
  competitor_name text not null,
  competitor_rank integer,
  search_volume integer,
  opportunity_score integer check (opportunity_score >= 0 and opportunity_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.keyword_gaps enable row level security;

create trigger keyword_gaps_set_updated_at
  before update on public.keyword_gaps
  for each row execute function public.set_updated_at();

create policy "keyword_gaps_select_own_or_admin"
  on public.keyword_gaps for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "keyword_gaps_insert_own"
  on public.keyword_gaps for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "keyword_gaps_update_own_or_admin"
  on public.keyword_gaps for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "keyword_gaps_delete_own_or_admin"
  on public.keyword_gaps for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 14. social_ad_spy  (Competitor Intel: Social Ad Spy card grid)
-- ---------------------------------------------------------------------
create table public.social_ad_spy (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_name text not null,
  platform text not null check (platform in ('Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'Google', 'Other')),
  ad_copy text,
  image_url text,
  notes text,
  date_observed date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_ad_spy enable row level security;

create trigger social_ad_spy_set_updated_at
  before update on public.social_ad_spy
  for each row execute function public.set_updated_at();

create policy "social_ad_spy_select_own_or_admin"
  on public.social_ad_spy for select
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

create policy "social_ad_spy_insert_own"
  on public.social_ad_spy for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "social_ad_spy_update_own_or_admin"
  on public.social_ad_spy for update
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin())
  with check (auth.uid() = user_id or public.is_current_user_admin());

create policy "social_ad_spy_delete_own_or_admin"
  on public.social_ad_spy for delete
  to authenticated
  using (auth.uid() = user_id or public.is_current_user_admin());

-- ---------------------------------------------------------------------
-- 15. Indexes for common lookups
-- ---------------------------------------------------------------------
create index leads_user_id_idx on public.leads(user_id);
create index campaigns_user_id_idx on public.campaigns(user_id);
create index ai_strategies_user_id_idx on public.ai_strategies(user_id);
create index meta_ad_sets_user_id_idx on public.meta_ad_sets(user_id);
create index local_rankings_user_id_idx on public.local_rankings(user_id);
create index swot_analyses_user_id_idx on public.swot_analyses(user_id);
create index market_share_entries_user_id_idx on public.market_share_entries(user_id);
create index keyword_gaps_user_id_idx on public.keyword_gaps(user_id);
create index social_ad_spy_user_id_idx on public.social_ad_spy(user_id);
create index contact_submissions_created_at_idx on public.contact_submissions(created_at desc);
create index admin_requests_user_id_idx on public.admin_requests(user_id);
