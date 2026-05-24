// ADMIN DATA API — secured endpoints for admin dashboard
// Auth: Authorization: Bearer <ADMIN_PASSWORD>
import { storage, agency } from './_lib.js';

function authorize(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/, '');
  return token === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (!authorize(req)) return res.status(401).json({ error: 'Unauthorized' });

  const action = req.query.action;
  const baseUrl = `https://${req.headers.host}`;
  const secret = process.env.WEBHOOK_SECRET;

  try {
    if (action === 'list-audits' && req.method === 'GET') {
      const index = (await storage.get('audits:index')) || [];
      const audits = [];
      for (const id of index) {
        const a = await storage.get('audit:' + id);
        if (a) audits.push(a);
      }
      return res.status(200).json({ audits });
    }

    if (action === 'get-audit' && req.method === 'GET') {
      const audit = await storage.get('audit:' + req.query.id);
      if (!audit) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ audit });
    }

    if (action === 'messages' && req.method === 'GET') {
      const msgIndex = (await storage.get('messages:index')) || [];
      const limit = parseInt(req.query.limit || '100');
      const messages = [];
      for (const id of msgIndex.slice(0, limit)) {
        const m = await storage.get('message:' + id);
        if (m) messages.push(m);
      }
      return res.status(200).json({ messages });
    }

    if (action === 'activity' && req.method === 'GET') {
      const idx = (await storage.get('activity:index:' + req.query.id)) || [];
      const events = [];
      for (const evtId of idx) {
        const e = await storage.get('activity:' + evtId);
        if (e) events.push(e);
      }
      return res.status(200).json({ activity: events });
    }

    if (action === 'update-stage' && req.method === 'POST') {
      const { auditId, stage } = req.body;
      const audit = await storage.get('audit:' + auditId);
      if (!audit) return res.status(404).json({ error: 'Not found' });
      audit.pipelineStage = stage;
      audit.updatedAt = new Date().toISOString();
      await storage.set('audit:' + auditId, audit);
      return res.status(200).json({ success: true, audit });
    }

    if (action === 'update-notes' && req.method === 'POST') {
      const { auditId, notes } = req.body;
      const audit = await storage.get('audit:' + auditId);
      if (!audit) return res.status(404).json({ error: 'Not found' });
      audit.notes = notes;
      audit.updatedAt = new Date().toISOString();
      await storage.set('audit:' + auditId, audit);
      return res.status(200).json({ success: true });
    }

    if (action === 'send-manual-email' && req.method === 'POST') {
      const { auditId, to, type, customSubject, customBody } = req.body;
      const response = await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
        body: JSON.stringify({ auditId, to, type, customSubject, customBody })
      });
      const result = await response.json();
      return res.status(response.status).json(result);
    }

    if (action === 'send-manual-sms' && req.method === 'POST') {
      const { auditId, to, type, customMessage } = req.body;
      const response = await fetch(`${baseUrl}/api/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
        body: JSON.stringify({ auditId, to, type, customMessage })
      });
      const result = await response.json();
      return res.status(response.status).json(result);
    }

    if (action === 'send-proposal' && req.method === 'POST') {
      const { auditId } = req.body;
      const audit = await storage.get('audit:' + auditId);
      if (!audit) return res.status(404).json({ error: 'Not found' });

      await fetch(`${baseUrl}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
        body: JSON.stringify({ auditId, to: audit.intake.email, type: 'proposal' })
      });

      if (audit.intake.phone) {
        await fetch(`${baseUrl}/api/send-sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
          body: JSON.stringify({ auditId, to: audit.intake.phone, type: 'proposal_sent' })
        });
      }

      audit.pipelineStage = 'proposal_sent';
      audit.automationStatus.proposalSent = true;
      audit.updatedAt = new Date().toISOString();
      await storage.set('audit:' + auditId, audit);

      return res.status(200).json({ success: true });
    }

    if (action === 'delete-audit' && req.method === 'POST') {
      const { auditId } = req.body;
      await storage.delete('audit:' + auditId);
      const idx = (await storage.get('audits:index')) || [];
      await storage.set('audits:index', idx.filter(x => x !== auditId));
      return res.status(200).json({ success: true });
    }

    if (action === 'health' && req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        agency: { name: agency.name, email: agency.email },
        integrations: {
          claude: !!process.env.ANTHROPIC_API_KEY,
          twilio: !!process.env.TWILIO_ACCOUNT_SID,
          sendgrid: !!process.env.SENDGRID_API_KEY,
          vapi: !!process.env.VAPI_API_KEY,
          kv: !!process.env.KV_REST_API_URL
        }
      });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch (error) {
    console.error('Admin data error', error);
    return res.status(500).json({ error: error.message });
  }
}
