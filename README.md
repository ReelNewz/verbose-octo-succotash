# AI Business Audit System

A production-grade lead-generation tool for AI agencies. Businesses fill out a form, Claude generates a free AI readiness audit, the report is emailed via SendGrid and displayed in-browser, and the admin receives an SMS via Twilio. An admin dashboard (Supabase-auth-protected) lists all audits.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                       │
│   React + Vite + Tailwind                                     │
│   ┌────────────────┐   ┌─────────────────┐                   │
│   │  Audit Form    │   │  Admin Dashboard │                   │
│   │  (public)      │   │  (Supabase auth) │                   │
│   └───────┬────────┘   └────────┬─────────┘                  │
└───────────│────────────────────│─────────────────────────────┘
            │POST /api/submit    │ GET /api/list-audits
            │                    │ GET /api/admin-stats
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Serverless API                      │
│                                                               │
│  submit-audit.js  ──► Anthropic Claude (claude-opus-4-7)     │
│  get-audit.js                                                 │
│  list-audits.js   ──► Vercel KV (Redis)                       │
│  update-status.js                                             │
│  admin-stats.js                                               │
│  export-leads.js                                              │
│  delete-audit.js                                              │
│  send-report-email.js ──► SendGrid                            │
│  send-admin-sms.js    ──► Twilio SMS                          │
│  twilio-webhook.js    ◄── Twilio inbound SMS                  │
│  cron-follow-up.js    ──► SendGrid (scheduled)                │
│  analyze.py           (Python rule-based pre-scorer)          │
│  _auth.js             (Supabase JWT + admin-secret helper)    │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Vercel KV   Supabase Auth  SendGrid / Twilio
```

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd verbose-octo-succotash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Fill in all values — see "Environment Variables" section below
```

### 3. Deploy to Vercel

```bash
npm i -g vercel
vercel           # follow prompts
vercel env pull  # pull KV vars after adding the KV addon
```

### 4. Add the Vercel KV addon

In your Vercel project dashboard: **Storage → Create → KV Database**. This auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

### 5. Local development

```bash
vercel dev       # runs all API routes + Vite dev server
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude. Get from https://console.anthropic.com |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number (E.164 format, e.g. `+15551234567`) |
| `ADMIN_PHONE_NUMBER` | Phone number to receive new-lead SMS alerts |
| `SENDGRID_API_KEY` | SendGrid API key |
| `FROM_EMAIL` | Sender email address (must be verified in SendGrid) |
| `FROM_NAME` | Sender name shown in emails |
| `KV_REST_API_URL` | Auto-set by Vercel KV addon |
| `KV_REST_API_TOKEN` | Auto-set by Vercel KV addon |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only — never expose to client) |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL`, exposed to Vite frontend |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key for frontend auth |
| `ADMIN_SECRET` | Fallback admin secret for API authentication (use a strong random string) |
| `SITE_URL` | Full URL of your deployed app (set after first deployment, e.g. `https://your-app.vercel.app`) |

## Supabase Setup

### Create the project

1. Go to https://app.supabase.com and create a new project.
2. Copy the **Project URL** and **anon key** into your env vars.
3. Copy the **service_role key** (Settings → API → Service role key) into `SUPABASE_SERVICE_ROLE_KEY`.

### Grant admin role to a user

After a user signs up, run this in the Supabase SQL editor to grant admin access:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'admin@yourcompany.com';
```

### Optional: is_current_user_admin RPC (for row-level security)

```sql
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;
```

## Vercel KV Setup

1. In your Vercel dashboard, go to **Storage** and click **Create**.
2. Choose **KV** and follow the setup wizard.
3. Click **Connect** to attach the KV store to your project.
4. Run `vercel env pull` locally to get the auto-generated `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

## Twilio Inbound SMS Setup

1. Buy a Twilio number at https://console.twilio.com.
2. In the number's configuration, set the **Messaging webhook** to:
   `https://your-app.vercel.app/api/twilio-webhook`
3. Set HTTP method to **POST**.

## API Endpoints

All endpoints include CORS headers. Admin endpoints require either:
- `Authorization: Bearer <supabase-jwt>` (user must have `app_metadata.role === 'admin'`)
- `x-admin-secret: <ADMIN_SECRET>` header as fallback

### Public Endpoints

#### `POST /api/submit-audit`

Submit a new audit request. Triggers Claude generation, SendGrid email, and admin SMS.

**Body:**
```json
{
  "businessName": "Acme Corp",
  "ownerName": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+15551234567",
  "industry": "Technology",
  "employeeCount": "11-50",
  "annualRevenue": "$1M-$5M",
  "currentChallenges": "Manual data entry, slow reporting",
  "currentTools": "Salesforce, Excel, Slack",
  "goals": "Automate customer support, improve forecasting"
}
```

**Response:** Full audit object with generated `report`.

---

#### `GET /api/get-audit?id={uuid}`

Fetch a single audit by ID. Returns all fields except `inboundMessages`.

---

#### `POST /api/analyze`

Python rule-based instant score estimator (runs before Claude finishes).

**Body:**
```json
{
  "industry": "Technology",
  "employeeCount": "11-50",
  "annualRevenue": "$1M-$5M",
  "currentChallenges": "Manual processes, data silos",
  "currentTools": "Salesforce, Slack",
  "goals": "Automate reporting"
}
```

**Response:**
```json
{
  "dataMaturity": 70,
  "processMaturity": 68,
  "teamReadiness": 65,
  "technicalInfrastructure": 75,
  "overall": 70
}
```

---

### Admin Endpoints

#### `GET /api/list-audits`

List all audits, sorted newest first.

**Query params:**
- `?status=complete` — filter by status
- `?limit=50` — limit results (default 100, max 500)

---

#### `PATCH /api/update-status`

Update an audit's status and/or notes.

**Body:**
```json
{ "id": "uuid", "status": "contacted", "notes": "Called on 2025-01-15" }
```

Valid statuses: `pending`, `generating`, `complete`, `error`, `contacted`, `converted`

---

#### `POST /api/send-report-email`

Re-send the full audit report email to the lead.

**Body:** `{ "id": "uuid" }`

---

#### `POST /api/send-admin-sms`

Send (or re-send) admin SMS notification for a lead.

**Body:** `{ "id": "uuid" }`

---

#### `GET /api/admin-stats`

Returns aggregate statistics across all audits.

**Response:**
```json
{
  "total": 42,
  "byStatus": { "pending": 2, "generating": 1, "complete": 30, "error": 2, "contacted": 5, "converted": 2 },
  "avgScore": 68,
  "emailsSent": 28,
  "smsSent": 35,
  "conversionRate": "6.7%",
  "last7Days": 8
}
```

---

#### `GET /api/export-leads`

Download all audits as a CSV file.

**Response:** `Content-Type: text/csv` with filename `ai-audit-leads-YYYY-MM-DD.csv`

**CSV columns:** ID, Business Name, Owner, Email, Phone, Industry, Employees, Revenue, Score, Status, Created, Email Sent, SMS Sent, Notes

---

#### `DELETE /api/delete-audit?id={uuid}`

Permanently delete an audit from KV and the sorted index.

**Response:** `{ "deleted": true, "id": "uuid" }`

---

### Webhook / Cron Endpoints

#### `POST /api/twilio-webhook`

Receives inbound SMS from Twilio. Matches the sender's phone number to an audit and appends the message to `inboundMessages`. Responds with TwiML.

#### `GET /api/cron-follow-up`

Runs automatically at 9:00 AM UTC Mon–Fri (configured in `vercel.json`). Sends follow-up emails to leads with `status === 'complete'` that have had fewer than 3 follow-ups and whose last follow-up was more than 3 days ago. Increments `followUpCount` and updates `lastFollowUp`.

---

## Data Model

Each audit is stored in Vercel KV at key `audit:{id}`. A sorted set at `audits:by-date` stores all IDs scored by Unix timestamp for efficient newest-first listing.

An additional index `phone:{e164number} → audit_id` enables inbound SMS matching.

**Audit object shape:**
```json
{
  "id": "uuid",
  "createdAt": "ISO string",
  "status": "pending|generating|complete|error|contacted|converted",
  "businessName": "string",
  "ownerName": "string",
  "email": "string",
  "phone": "string",
  "industry": "string",
  "employeeCount": "string",
  "annualRevenue": "string",
  "currentChallenges": "string",
  "currentTools": "string",
  "goals": "string",
  "report": {
    "executiveSummary": "string",
    "aiReadinessScore": 75,
    "scoreBreakdown": {
      "dataMaturity": 70,
      "processMaturity": 80,
      "teamReadiness": 65,
      "technicalInfrastructure": 75
    },
    "opportunities": [...],
    "quickWins": [...],
    "roadmap": [...],
    "riskFactors": [],
    "recommendedNextStep": "string"
  },
  "emailSent": false,
  "smsSent": false,
  "followUpCount": 0,
  "lastFollowUp": null,
  "notes": "string",
  "inboundMessages": []
}
```

## Cron Schedule

The follow-up cron (`/api/cron-follow-up`) runs at **09:00 UTC Monday–Friday** (`0 9 * * 1-5`).

It sends up to 3 follow-up emails per lead, spaced at least 3 days apart. Each follow-up email is shorter than the original audit email, offers a free consultation, and references the lead's top AI opportunity.

## Local Development

```bash
# Install dependencies
npm install

# Pull env vars from Vercel (after first deployment)
vercel env pull .env.local

# Start local dev server (Vite + Vercel API routes)
vercel dev

# Vite-only (no API routes)
npm run dev
```

The `vercel dev` command starts both the Vite frontend and the serverless API routes locally, making full end-to-end testing possible without deploying.
