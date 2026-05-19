// INTAKE HANDLER — entry point of the automation cascade
import { storage, agency, logActivity } from './_lib.js';

const newId = () => 'aud_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const intake = req.body;
    if (!intake.businessName || !intake.websiteUrl || !intake.email || !intake.ownerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const audit = {
      id: newId(),
      intake,
      scores: null,
      aiContent: null,
      pipelineStage: 'requested',
      notes: '',
      automationStatus: {
        confirmationSmsSent: false,
        confirmationEmailSent: false,
        auditGenerated: false,
        auditEmailSent: false,
        proposalSent: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await storage.set('audit:' + audit.id, audit);
    const index = (await storage.get('audits:index')) || [];
    index.unshift(audit.id);
    await storage.set('audits:index', index);

    await logActivity(audit.id, 'intake_submitted', {
      businessName: intake.businessName,
      ownerName: intake.ownerName,
      source: intake.source || 'website'
    });

    const baseUrl = `https://${req.headers.host}`;
    const secret = process.env.WEBHOOK_SECRET;
    const headers = { 'Content-Type': 'application/json', 'x-webhook-secret': secret };
    const fireAndForget = (url, body) => fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
      .catch(e => console.error('Cascade failure', url, e.message));

    if (intake.phone) {
      fireAndForget(`${baseUrl}/api/send-sms`, { auditId: audit.id, to: intake.phone, type: 'confirmation' });
    }
    fireAndForget(`${baseUrl}/api/send-email`, { auditId: audit.id, to: intake.email, type: 'confirmation' });
    fireAndForget(`${baseUrl}/api/generate-audit`, { auditId: audit.id });

    return res.status(200).json({
      success: true,
      auditId: audit.id,
      message: 'Audit submitted. Generation in progress.'
    });
  } catch (error) {
    console.error('Intake error', error);
    return res.status(500).json({ error: error.message });
  }
}
