// INBOUND SMS AUTO-RESPONDER — Twilio webhook
import Anthropic from '@anthropic-ai/sdk';
import twilio from 'twilio';
import { storage, agency, logActivity } from './_lib.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function findAuditByPhone(phone) {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const index = (await storage.get('audits:index')) || [];
  for (const id of index) {
    const audit = await storage.get('audit:' + id);
    if (audit?.intake?.phone) {
      const auditPhone = audit.intake.phone.replace(/\D/g, '').slice(-10);
      if (auditPhone === normalized) return audit;
    }
  }
  return null;
}

const SMS_RESPONSE_PROMPT = (incoming, audit) => `You are ${agency.ownerFirstName} from ${agency.name}, replying to an SMS from a prospect.

PROSPECT MESSAGE: "${incoming}"

CONTEXT:
${audit ? `Business: ${audit.intake.businessName} · Score: ${audit.readiness}/100 · Calendar: ${agency.calendarUrl}` : 'No matched audit — they may be a new lead'}

WRITE A SINGLE SMS REPLY:
- Max 320 characters (1-2 SMS messages)
- Conversational, not formal
- Direct — address what they said
- If they're asking a question, answer it concretely
- If they want to move forward, send the calendar link
- If they're objecting, acknowledge and offer a quick call
- Sign off with just "${agency.ownerFirstName}" — no agency name in SMS
- No greetings like "Hi!" — go straight to the response

Output the SMS text only — no quotes, no preamble.`;

const URGENT_KEYWORDS = ['urgent', 'emergency', 'now', 'asap', 'today', 'pissed', 'angry', 'refund', 'cancel', 'help'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const from = req.body.From;
    const to = req.body.To;
    const body = (req.body.Body || '').trim();
    const messageSid = req.body.MessageSid;

    const audit = await findAuditByPhone(from);

    const msgId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await storage.set('message:' + msgId, {
      id: msgId, channel: 'sms', direction: 'inbound',
      from, to, body,
      auditId: audit?.id || null,
      twilioSid: messageSid,
      receivedAt: new Date().toISOString()
    });
    const msgIndex = (await storage.get('messages:index')) || [];
    msgIndex.unshift(msgId);
    await storage.set('messages:index', msgIndex.slice(0, 1000));

    if (audit) {
      await logActivity(audit.id, 'sms_received', { from, body: body.slice(0, 80) });
    }

    const lowerBody = body.toLowerCase();
    const isUrgent = URGENT_KEYWORDS.some(kw => lowerBody.includes(kw));

    // STOP/UNSUBSCRIBE
    if (['stop', 'unsubscribe', 'optout', 'opt out'].includes(lowerBody)) {
      if (audit) {
        audit.smsOptedOut = true;
        audit.updatedAt = new Date().toISOString();
        await storage.set('audit:' + audit.id, audit);
        await logActivity(audit.id, 'sms_opted_out', {});
      }
      return res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');
    }

    // URGENT → ESCALATE
    if (isUrgent) {
      await twilioClient.messages.create({
        body: `URGENT inbound SMS from ${from}: "${body.slice(0, 120)}" — Audit: ${audit?.intake?.businessName || 'unknown'}. Reply directly to caller.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: agency.phone
      });
      const holdingMsg = `Got it. ${agency.ownerFirstName} will text you back personally within 15 minutes.`;
      await twilioClient.messages.create({
        body: holdingMsg,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: from
      });
      return res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');
    }

    // AI RESPONSE
    const aiResp = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: SMS_RESPONSE_PROMPT(body, audit) }]
    });

    const replyText = aiResp.content[0].text.trim().slice(0, 320);

    await twilioClient.messages.create({
      body: replyText,
      from: to,
      to: from
    });

    const outboundId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await storage.set('message:' + outboundId, {
      id: outboundId, channel: 'sms', direction: 'outbound',
      from: to, to: from, body: replyText,
      auditId: audit?.id || null,
      aiGenerated: true, replyTo: msgId,
      sentAt: new Date().toISOString()
    });
    msgIndex.unshift(outboundId);
    await storage.set('messages:index', msgIndex.slice(0, 1000));

    if (audit) {
      await logActivity(audit.id, 'sms_auto_replied', {
        incoming: body.slice(0, 80),
        reply: replyText.slice(0, 80)
      });
    }

    return res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');
  } catch (error) {
    console.error('Inbound SMS error', error);
    return res.status(200).set('Content-Type', 'text/xml').send('<Response></Response>');
  }
}
