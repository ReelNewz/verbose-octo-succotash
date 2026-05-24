// INBOUND EMAIL AUTO-RESPONDER — SendGrid Inbound Parse webhook
// Classifies intent: QUESTION/INTEREST/OBJECTION/NOT_NOW/CONFUSED/URGENT
// Auto-responds or escalates URGENT to operator
import Anthropic from '@anthropic-ai/sdk';
import sgMail from '@sendgrid/mail';
import { storage, agency, logActivity } from './_lib.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL,
  name: process.env.SENDGRID_FROM_NAME || agency.name
};

const CLASSIFICATION_PROMPT = (email, audit) => `You are classifying an inbound email reply from a prospect who recently received an AI Business Audit.

EMAIL FROM: ${email.from}
SUBJECT: ${email.subject}
BODY:
${email.body}

CONTEXT — the audit we sent them:
Business: ${audit?.intake?.businessName || 'unknown'}
Score: ${audit?.readiness || '?'}/100
Tier recommendation: GROWTH ($4,997 setup + $1,497/month)

Classify the intent into ONE category:
- QUESTION: Asking about audit findings, methodology, or specific recommendations
- INTEREST: Ready to move forward / wants pricing / asking how to start
- OBJECTION: Concerns about price, timing, fit, or trust
- NOT_NOW: Politely declining or "not now"
- CONFUSED: Unclear intent — needs clarification
- URGENT: Complaint, problem, frustration, or human-required matter

Output ONLY a JSON object: {"intent": "<CATEGORY>", "confidence": <0-100 int>, "summary": "<1 sentence of what they want>"}`;

const RESPONSE_PROMPT = (email, audit, classification) => `You are ${agency.ownerFirstName} from ${agency.name}, responding to an email about an AI Business Audit.

PROSPECT EMAIL:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

THEIR AUDIT CONTEXT:
Business: ${audit?.intake?.businessName || 'their business'}
Score: ${audit?.readiness}/100
Critical findings: ${audit?.aiContent ? Object.entries(audit.aiContent).slice(0,3).map(([k,v]) => `${k}: ${v.findings}`).join('; ') : 'see audit report'}
Calendar: ${agency.calendarUrl}

INTENT: ${classification.intent}
Summary of what they want: ${classification.summary}

GUIDELINES:
- Write like a senior consultant briefing a CEO — direct, factual, no salesy fluff
- Address their specific concern from the email
- Keep under 150 words
- Always include the calendar link if appropriate
- Sign off as "${agency.ownerFirstName}"
- NO subject line — only the body
- Write in plain text (will be wrapped in HTML)

${classification.intent === 'INTEREST' ? "They're ready. Confirm enthusiasm, set the next concrete step (sign engagement OR strategy call), provide calendar link." : ''}
${classification.intent === 'OBJECTION' ? "Acknowledge the concern directly. Don't argue. Offer a 15-min call to address it specifically." : ''}
${classification.intent === 'NOT_NOW' ? "Be gracious. Make clear the door's always open. Don't push." : ''}
${classification.intent === 'QUESTION' ? "Answer the specific question from the audit context. Be concrete. End with calendar offer." : ''}
${classification.intent === 'CONFUSED' ? "Ask one clarifying question to understand what they need." : ''}

Output the response body only.`;

async function findAuditByEmail(email) {
  const index = (await storage.get('audits:index')) || [];
  for (const id of index) {
    const audit = await storage.get('audit:' + id);
    if (audit?.intake?.email?.toLowerCase() === email.toLowerCase()) {
      return audit;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const email = {
      from: req.body.from || req.body.envelope?.from || '',
      to: req.body.to || '',
      subject: req.body.subject || '',
      body: req.body.text || stripHtml(req.body.html || '') || '',
      receivedAt: new Date().toISOString()
    };

    const fromMatch = email.from.match(/<([^>]+)>/);
    const senderEmail = (fromMatch ? fromMatch[1] : email.from).trim().toLowerCase();

    const audit = await findAuditByEmail(senderEmail);

    const msgId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const message = {
      id: msgId, channel: 'email', direction: 'inbound',
      from: senderEmail, to: email.to,
      subject: email.subject, body: email.body,
      auditId: audit?.id || null,
      receivedAt: email.receivedAt
    };
    await storage.set('message:' + msgId, message);
    const msgIndex = (await storage.get('messages:index')) || [];
    msgIndex.unshift(msgId);
    await storage.set('messages:index', msgIndex.slice(0, 1000));

    if (audit) {
      await logActivity(audit.id, 'email_received', { from: senderEmail, subject: email.subject });
    }

    let classification;
    try {
      const classResp = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 200,
        messages: [{ role: 'user', content: CLASSIFICATION_PROMPT(email, audit) }]
      });
      const text = classResp.content[0].text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      classification = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'CONFUSED', confidence: 0, summary: 'Could not classify' };
    } catch (e) {
      classification = { intent: 'URGENT', confidence: 0, summary: 'Classification failed — human review needed' };
    }

    message.classification = classification;
    await storage.set('message:' + msgId, message);

    if (classification.intent === 'URGENT' || classification.confidence < 50) {
      await sgMail.send({
        from: FROM,
        to: agency.email,
        subject: `[REVIEW NEEDED] ${classification.intent}: ${email.subject}`,
        text: `An inbound email requires manual review.\n\nIntent: ${classification.intent}\nSummary: ${classification.summary}\nFrom: ${senderEmail}\nSubject: ${email.subject}\n\n---\n${email.body}\n\n---\nClient: ${audit?.intake?.businessName || 'unknown'}\nAudit: ${audit?.id || 'no matching audit'}`
      });
      return res.status(200).json({ success: true, action: 'escalated', intent: classification.intent });
    }

    const respResp = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 500,
      messages: [{ role: 'user', content: RESPONSE_PROMPT(email, audit, classification) }]
    });
    const responseBody = respResp.content[0].text.trim();

    const replySubject = email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`;
    const htmlBody = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;line-height:1.6;">
      ${responseBody.split('\n').map(p => `<p>${p}</p>`).join('')}
      <p style="margin-top:32px;color:#888;font-size:11px;border-top:1px solid #C9A961;padding-top:16px;">
        ${agency.name} · ${agency.email} · ${agency.phone}
      </p>
    </body></html>`;

    await sgMail.send({
      from: FROM,
      to: senderEmail,
      subject: replySubject,
      text: responseBody,
      html: htmlBody
    });

    const outboundId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    await storage.set('message:' + outboundId, {
      id: outboundId, channel: 'email', direction: 'outbound',
      from: FROM.email, to: senderEmail,
      subject: replySubject, body: responseBody,
      auditId: audit?.id || null,
      aiGenerated: true, replyTo: msgId,
      sentAt: new Date().toISOString()
    });
    msgIndex.unshift(outboundId);
    await storage.set('messages:index', msgIndex.slice(0, 1000));

    if (audit) {
      await logActivity(audit.id, 'email_auto_replied', {
        intent: classification.intent,
        replyPreview: responseBody.slice(0, 100)
      });

      if (classification.intent === 'INTEREST' && audit.pipelineStage === 'delivered') {
        audit.pipelineStage = 'call_booked';
        audit.updatedAt = new Date().toISOString();
        await storage.set('audit:' + audit.id, audit);
      }
    }

    return res.status(200).json({
      success: true,
      action: 'auto_replied',
      intent: classification.intent
    });

  } catch (error) {
    console.error('Inbound email error', error);
    return res.status(500).json({ error: error.message });
  }
}

function stripHtml(html) {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
             .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
             .replace(/<[^>]+>/g, '')
             .replace(/&nbsp;/g, ' ')
             .replace(/\s+/g, ' ')
             .trim();
}
