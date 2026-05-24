# AI Business Audit System

Production automation platform for AI-powered local-business audits.

## Stack
- Frontend: React SPA (single index.html, no build step)
- Backend: Vercel serverless (Node.js + Python)
- Storage: Vercel KV (Redis)
- AI: Anthropic Claude (Opus 4.5 + Sonnet 4.5)
- SMS/Voice: Twilio
- Email: SendGrid (outbound + Inbound Parse)
- AI Receptionist: Vapi (optional)

## The cascade
1. Form submission → /api/intake
2. /api/intake fires 3 parallel webhooks:
   - /api/send-sms (confirmation, ~5s)
   - /api/send-email (confirmation, ~5s)
   - /api/generate-audit (Claude API, ~60s)
3. /api/generate-audit triggers:
   - /api/send-email (audit_delivery)
   - /api/send-sms (audit_ready)
   - Schedules D+1, D+3, D+7 followups
4. Daily cron at 14:00 UTC fires due followups
5. Weekly cron Mon 15:00 UTC fires D+30/60/90 reactivation
6. Inbound email/SMS/voice get AI-classified and auto-responded

## Pipeline stages
requested → delivered → call_booked → proposal_sent → client | lost

## Deployment
Run `vercel --prod` from this directory. Configure all env vars in Vercel dashboard. Enable Vercel KV. Configure Twilio + SendGrid Inbound Parse webhooks per dashboard instructions.
