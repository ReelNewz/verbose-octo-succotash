// SCHEDULED FOLLOW-UP CRON — daily at 14:00 UTC
// Dispatches D+1, D+3, D+7 follow-up emails
import { storage, verifyWebhook } from './_lib.js';

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
      if (audit.pipelineStage === 'call_booked' ||
          audit.pipelineStage === 'proposal_sent') continue;

      for (const day of ['day1', 'day3', 'day7']) {
        const followupKey = 'followup:' + auditId + ':' + day;
        const followup = await storage.get(followupKey);

        if (followup && !followup.sent && followup.runAt <= now) {
          const response = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
            body: JSON.stringify({
              auditId,
              to: audit.intake.email,
              type: followup.type
            })
          });

          if (response.ok) {
            followup.sent = true;
            followup.sentAt = new Date().toISOString();
            await storage.set(followupKey, followup);
            fired.push({ auditId, type: followup.type });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      fired: fired.length,
      details: fired
    });
  } catch (error) {
    console.error('Cron followups error', error);
    return res.status(500).json({ error: error.message });
  }
}
