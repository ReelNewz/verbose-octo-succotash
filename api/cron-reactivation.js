// REACTIVATION CRON — weekly Mondays 15:00 UTC
// Picks up cold leads at D+30/60/90 marks
import { storage, verifyWebhook, agency } from './_lib.js';

export default async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  if (!isVercelCron && !verifyWebhook(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = Date.now();
    const baseUrl = `https://${req.headers.host}`;
    const secret = process.env.WEBHOOK_SECRET;
    const fired = [];

    const index = (await storage.get('audits:index')) || [];

    for (const auditId of index) {
      const audit = await storage.get('audit:' + auditId);
      if (!audit) continue;
      if (audit.pipelineStage === 'client') continue;
      if (audit.pipelineStage === 'lost') continue;
      if (audit.emailOptedOut) continue;
      if (audit.pipelineStage === 'call_booked') continue;
      if (audit.pipelineStage === 'proposal_sent') continue;

      const ageDays = (now - new Date(audit.createdAt).getTime()) / 86400000;

      // DAY 30
      if (ageDays >= 30 && ageDays < 33 && !audit.reactivation30Sent) {
        await fireEmail(baseUrl, secret, auditId, audit.intake.email, 'custom', {
          customSubject: `Quick check — still thinking about ${audit.intake.businessName}?`,
          customBody: `<p>Hey ${audit.intake.ownerName.split(' ')[0]} — wanted to follow up on the audit we sent a few weeks back.</p>
            <p>Anything change since then? Curious whether you've made progress on any of the findings.</p>
            <p>No pressure either way — happy to share what other ${audit.intake.industry} businesses are doing right now if useful.</p>
            <p>Calendar: <a href="${agency.calendarUrl}">${agency.calendarUrl}</a></p>`
        });
        audit.reactivation30Sent = true;
        audit.pipelineStage = 'dormant';
        await storage.set('audit:' + auditId, audit);
        fired.push({ auditId, type: 'reactivation_30' });
      }

      // DAY 60
      if (ageDays >= 60 && ageDays < 63 && !audit.reactivation60Sent) {
        await fireEmail(baseUrl, secret, auditId, audit.intake.email, 'custom', {
          customSubject: `What changed in your market since we talked`,
          customBody: `<p>${audit.intake.ownerName.split(' ')[0]},</p>
            <p>Two months since your audit. The AI-search landscape moves fast — I'd guess your top 3 competitors look different by now.</p>
            <p>If you want a free 10-minute "what's new" check-in (no pitch), just reply with "yes" and I'll send a slot.</p>
            <p>— ${agency.ownerFirstName}</p>`
        });
        if (audit.intake.phone && !audit.smsOptedOut) {
          await fireSms(baseUrl, secret, auditId, audit.intake.phone, 'reactivation_30');
        }
        audit.reactivation60Sent = true;
        await storage.set('audit:' + auditId, audit);
        fired.push({ auditId, type: 'reactivation_60' });
      }

      // DAY 90 — FINAL
      if (ageDays >= 90 && ageDays < 93 && !audit.reactivation90Sent) {
        await fireEmail(baseUrl, secret, auditId, audit.intake.email, 'custom', {
          customSubject: `Closing your file — last opportunity`,
          customBody: `<p>${audit.intake.ownerName.split(' ')[0]},</p>
            <p>I'm cleaning up my pipeline this week. Before I close your file:</p>
            <p>If you ever want to revisit, I'm taking 3 new clients this month at a one-time 10% off setup. Offer expires Friday.</p>
            <p>Reply "interested" and I'll send the slot. Otherwise, thank you for letting me audit your business — I learned a lot from it, and the door's always open in the future.</p>
            <p>— ${agency.ownerFirstName}</p>`
        });
        audit.reactivation90Sent = true;
        audit.pipelineStage = 'lost';
        await storage.set('audit:' + auditId, audit);
        fired.push({ auditId, type: 'reactivation_90' });
      }
    }

    return res.status(200).json({ success: true, fired: fired.length, details: fired });
  } catch (error) {
    console.error('Reactivation cron error', error);
    return res.status(500).json({ error: error.message });
  }
}

async function fireEmail(baseUrl, secret, auditId, to, type, extra = {}) {
  return fetch(`${baseUrl}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify({ auditId, to, type, ...extra })
  });
}

async function fireSms(baseUrl, secret, auditId, to, type) {
  return fetch(`${baseUrl}/api/send-sms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
    body: JSON.stringify({ auditId, to, type })
  });
}
