// SMS SENDER — Twilio outbound
import twilio from 'twilio';
import { storage, agency, logActivity, verifyWebhook } from './_lib.js';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TEMPLATES = {
  confirmation: (i) =>
    `Hi ${i.ownerName.split(' ')[0]} — got your audit request for ${i.intake.businessName}. ` +
    `Generating your report now (24hr max). Quick Q: what's your single biggest growth ` +
    `blocker right now? — ${agency.ownerFirstName}`,

  audit_ready: (i) =>
    `${i.ownerName.split(' ')[0]} — your AI audit for ${i.intake.businessName} just dropped in your inbox. ` +
    `Score: ${i.readiness}/100. Top finding is costly. Want to walk through it together? ` +
    `${agency.calendarUrl}`,

  call_reminder_24h: (i) =>
    `Reminder: strategy call tomorrow at ${i.callTime} with ${agency.ownerFirstName} for ${i.intake.businessName}. ` +
    `Bring your top 3 competitors and current monthly revenue. Reschedule: ${agency.calendarUrl}`,

  call_reminder_1h: (i) =>
    `Hour heads up — strategy call at ${i.callTime}. Zoom link in your calendar invite. ` +
    `See you soon. — ${agency.ownerFirstName}`,

  followup_day_3: (i) =>
    `${i.ownerName.split(' ')[0]} — saw you haven't booked the strategy call yet. Quick one: ` +
    `what's your biggest hesitation? No pressure, just curious. — ${agency.ownerFirstName}`,

  reactivation_30: (i) =>
    `Hey ${i.ownerName.split(' ')[0]} — saw a competitor of yours just launched something ` +
    `interesting. Quick coffee chat to share? ${agency.calendarUrl}`,

  proposal_sent: (i) =>
    `Your proposal for ${i.intake.businessName} is in your inbox. Walk through it tonight — ` +
    `happy to answer questions tomorrow. — ${agency.ownerFirstName}`,

  custom: (i) => i.customMessage
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { auditId, to, type, customMessage, callTime } = req.body;
    if (!to || !type) return res.status(400).json({ error: 'Missing to or type' });

    let audit = null;
    if (auditId) {
      audit = await storage.get('audit:' + auditId);
      if (!audit) return res.status(404).json({ error: 'Audit not found' });
    }

    const template = TEMPLATES[type];
    if (!template) return res.status(400).json({ error: 'Unknown template type' });

    const context = {
      ...audit,
      ownerName: audit?.intake?.ownerName || 'there',
      readiness: audit?.readiness || '?',
      customMessage,
      callTime
    };

    const body = template(context);

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      statusCallback: `https://${req.headers.host}/api/twilio-status`
    });

    if (audit && type === 'confirmation') {
      audit.automationStatus.confirmationSmsSent = true;
      audit.updatedAt = new Date().toISOString();
      await storage.set('audit:' + auditId, audit);
    }

    await logActivity(auditId, 'sms_sent', {
      type, to, body: body.slice(0, 80),
      messageSid: message.sid, status: message.status
    });

    return res.status(200).json({ success: true, sid: message.sid, status: message.status });
  } catch (error) {
    console.error('SMS send error', error);
    if (req.body.auditId) {
      await logActivity(req.body.auditId, 'sms_failed', { error: error.message }).catch(() => {});
    }
    return res.status(500).json({ error: error.message });
  }
}
