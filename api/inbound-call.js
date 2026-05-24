// AI PHONE RECEPTIONIST — Twilio voice webhook
// Mode A: Vapi handoff (if VAPI_API_KEY set)
// Mode B: Built-in TwiML conversation (fallback)
import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import { storage, agency, logActivity } from './_lib.js';

const VoiceResponse = twilio.twiml.VoiceResponse;
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function findAuditByPhone(phone) {
  const normalized = phone.replace(/\D/g, '').slice(-10);
  const index = (await storage.get('audits:index')) || [];
  for (const id of index) {
    const audit = await storage.get('audit:' + id);
    if (audit?.intake?.phone) {
      const ap = audit.intake.phone.replace(/\D/g, '').slice(-10);
      if (ap === normalized) return audit;
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const from = req.body.From || '';
    const callSid = req.body.CallSid;
    const step = req.query.step || 'greet';

    const audit = await findAuditByPhone(from);

    if (step === 'greet') {
      await storage.set('call:' + callSid, {
        id: callSid, from,
        auditId: audit?.id || null,
        startedAt: new Date().toISOString(),
        transcript: []
      });
      if (audit) {
        await logActivity(audit.id, 'call_received', { from, callSid });
      }
    }

    const response = new VoiceResponse();

    // MODE A: VAPI HANDOFF
    if (process.env.VAPI_API_KEY && process.env.VAPI_ASSISTANT_ID && step === 'greet') {
      const connect = response.connect();
      connect.stream({
        url: `wss://api.vapi.ai/twilio/${process.env.VAPI_ASSISTANT_ID}`,
        parameter: [
          { name: 'X-Vapi-Api-Key', value: process.env.VAPI_API_KEY },
          { name: 'X-Audit-Id', value: audit?.id || '' },
          { name: 'X-Business-Name', value: audit?.intake?.businessName || '' }
        ]
      });
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(response.toString());
    }

    // MODE B: BUILT-IN TWIML
    if (step === 'greet') {
      const greeting = audit
        ? `Hi ${audit.intake.ownerName.split(' ')[0]}, thanks for calling ${agency.name}. I'm your AI assistant. ${agency.ownerFirstName} got your audit request for ${audit.intake.businessName}. How can I help?`
        : `Hi, thanks for calling ${agency.name}. I'm the AI assistant. To get started — what's your name and what business you're with?`;

      response.say({ voice: 'Polly.Joanna-Neural' }, greeting);

      response.gather({
        input: 'speech',
        speechTimeout: 'auto',
        speechModel: 'experimental_conversations',
        action: `/api/inbound-call?step=respond&attempt=1`,
        method: 'POST'
      });

      response.say({ voice: 'Polly.Joanna-Neural' }, `I didn't catch that. Let me transfer you to ${agency.ownerFirstName} directly.`);
      response.dial(agency.phone);

    } else if (step === 'respond') {
      const speech = req.body.SpeechResult || '';
      const attempt = parseInt(req.query.attempt || '1');

      const call = await storage.get('call:' + callSid) || { transcript: [] };
      call.transcript.push({ speaker: 'caller', text: speech, at: new Date().toISOString() });

      const conversationContext = call.transcript.map(t => `${t.speaker.toUpperCase()}: ${t.text}`).join('\n');

      const prompt = `You are ${agency.ownerFirstName}'s AI receptionist for ${agency.name}, an AI business audit agency.

CALLER CONTEXT:
${audit ? `- Known prospect: ${audit.intake.ownerName} from ${audit.intake.businessName}\n- Their audit score: ${audit.readiness}/100\n- They received their report on ${audit.createdAt}` : '- Unknown caller'}

CONVERSATION SO FAR:
${conversationContext}

YOUR JOB:
1. Be warm, brief (under 25 words), helpful
2. If they want to book a strategy call -> tell them you'll text them the calendar link right after this call
3. If they have a specific audit question -> answer based on the context
4. If they want to speak to ${agency.ownerFirstName} -> tell them they'll get a callback within 1 hour
5. If they want a refund/are upset -> say "${agency.ownerFirstName} will personally call you back within 30 minutes"
6. After 3 back-and-forths, gently wrap and offer to send a follow-up text

Output ONLY your next spoken response. No stage directions. No "AI:".`;

      const aiResp = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }]
      });

      const reply = aiResp.content[0].text.trim();
      call.transcript.push({ speaker: 'ai', text: reply, at: new Date().toISOString() });
      await storage.set('call:' + callSid, call);

      response.say({ voice: 'Polly.Joanna-Neural' }, reply);

      const wrapKeywords = ['text you', 'call you back', 'follow up', 'send you'];
      const shouldWrap = attempt >= 4 || wrapKeywords.some(k => reply.toLowerCase().includes(k));

      if (shouldWrap) {
        if (from && from.startsWith('+')) {
          try {
            await twilioClient.messages.create({
              body: `Hi — ${agency.ownerFirstName} here (or my AI receptionist). Following up on your call. Calendar to book a strategy call: ${agency.calendarUrl}`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: from
            });
          } catch (e) { console.error('Follow-up SMS failed', e); }
        }
        response.say({ voice: 'Polly.Joanna-Neural' }, `I just sent you a text with the calendar link and ${agency.ownerFirstName}'s contact info. Talk soon.`);
        response.hangup();
      } else {
        response.gather({
          input: 'speech',
          speechTimeout: 'auto',
          speechModel: 'experimental_conversations',
          action: `/api/inbound-call?step=respond&attempt=${attempt + 1}`,
          method: 'POST'
        });
        response.say({ voice: 'Polly.Joanna-Neural' }, `Are you still there?`);
        response.hangup();
      }
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(response.toString());

  } catch (error) {
    console.error('Inbound call error', error);
    const response = new VoiceResponse();
    response.say({ voice: 'Polly.Joanna-Neural' }, `Sorry, I'm having trouble. Let me transfer you.`);
    response.dial(agency.phone);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(response.toString());
  }
}
