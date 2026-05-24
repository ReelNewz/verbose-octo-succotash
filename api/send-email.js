// EMAIL SENDER — SendGrid outbound
// Templates: confirmation, audit_delivery, proposal, followup_day_1/3/7, custom
import sgMail from '@sendgrid/mail';
import { storage, agency, logActivity, verifyWebhook,
         calculateReadiness, getTier, estimateImpact, DIMENSIONS, fmt } from './_lib.js';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL,
  name: process.env.SENDGRID_FROM_NAME || agency.name
};

const TEMPLATES = {
  confirmation: (audit) => ({
    subject: `Your AI Audit is being generated — ${audit.intake.businessName}`,
    html: htmlWrap(`
      <h1>Welcome, ${audit.intake.ownerName.split(' ')[0]}.</h1>
      <p>Your AI Business Audit for <strong>${audit.intake.businessName}</strong> is in production.</p>
      <p>Here's what's happening behind the scenes right now:</p>
      <ul>
        <li>Scanning ${audit.intake.websiteUrl} for Core Web Vitals + mobile performance</li>
        <li>Testing 15 queries across ChatGPT, Gemini, Claude, Perplexity, and Copilot to measure your AI search visibility</li>
        <li>Probing voice-assistant responses (Alexa, Siri, Google) for "near me" queries</li>
        <li>Auditing your top 3 competitors across 12 factors</li>
        <li>Mapping every automation gap costing you revenue</li>
      </ul>
      <p><strong>Your full 25-page report arrives within 24 hours.</strong></p>
      <p>In the meantime, the highest-leverage thing you can do is book your 30-minute strategy call:</p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${agency.calendarUrl}" style="background:#0B1F3A;color:#C9A961;padding:16px 32px;text-decoration:none;border:1px solid #C9A961;font-family:Georgia,serif;letter-spacing:2px;display:inline-block;">SCHEDULE STRATEGY CALL →</a>
      </p>
      <p>Talk soon,<br/>${agency.ownerFirstName}<br/>${agency.name}</p>
    `),
    text: `Welcome ${audit.intake.ownerName.split(' ')[0]} — your AI Business Audit for ${audit.intake.businessName} is in production. Full 25-page report arrives within 24 hours. Book your strategy call: ${agency.calendarUrl}\n\n— ${agency.ownerFirstName}, ${agency.name}`
  }),

  audit_delivery: (audit) => {
    const readiness = calculateReadiness(audit.scores);
    const tier = getTier(readiness);
    const impact = estimateImpact(audit.intake, readiness);
    const top3 = [...DIMENSIONS].sort((a, b) => audit.scores[a.id] - audit.scores[b.id]).slice(0, 3);
    const reportUrl = `https://${process.env.VERCEL_URL || 'youragency.com'}/#/audit/results/${audit.id}`;

    return {
      subject: `Your AI Business Audit is ready — ${audit.intake.businessName}`,
      html: htmlWrap(`
        <h1>Your audit is ready, ${audit.intake.ownerName.split(' ')[0]}.</h1>
        <p style="font-size:18px;color:#666;">Here's the snapshot. The full report is linked below.</p>

        <div style="background:#F5EFE0;border:2px solid #C9A961;padding:32px;margin:24px 0;text-align:center;">
          <div style="font-size:11px;letter-spacing:3px;color:#C9A961;margin-bottom:8px;">OVERALL AI READINESS</div>
          <div style="font-family:Georgia,serif;font-size:72px;font-weight:bold;color:#0B1F3A;line-height:1;">${readiness}<span style="font-size:24px;color:#999;">/100</span></div>
          <div style="font-family:Georgia,serif;font-size:20px;color:#C9A961;margin-top:8px;">Tier: ${tier}</div>
        </div>

        <h2 style="color:#0B1F3A;border-bottom:2px solid #C9A961;padding-bottom:8px;">Top 3 revenue-bleeding gaps</h2>
        <ol style="font-size:16px;line-height:1.8;">
          <li><strong>${top3[0].name}</strong> — scored ${audit.scores[top3[0].id]}/100</li>
          <li><strong>${top3[1].name}</strong> — scored ${audit.scores[top3[1].id]}/100</li>
          <li><strong>${top3[2].name}</strong> — scored ${audit.scores[top3[2].id]}/100</li>
        </ol>

        <div style="background:#0B1F3A;color:white;padding:24px;margin:24px 0;">
          <div style="font-size:11px;letter-spacing:3px;color:#C9A961;margin-bottom:8px;">12-MONTH UPLIFT POTENTIAL</div>
          <div style="font-family:Georgia,serif;font-size:36px;color:#C9A961;font-weight:bold;">${fmt(impact.annualUpliftLow)}–${fmt(impact.annualUpliftHigh)}</div>
          <div style="font-size:13px;color:#aaa;margin-top:8px;">Based on your stated lead volume and value, applied to the gaps identified in this audit</div>
        </div>

        <p style="text-align:center;margin:40px 0;">
          <a href="${reportUrl}" style="background:#0B1F3A;color:#C9A961;padding:18px 36px;text-decoration:none;border:1px solid #C9A961;font-family:Georgia,serif;letter-spacing:2px;font-size:14px;display:inline-block;">VIEW FULL 25-PAGE REPORT →</a>
        </p>

        <p>I recorded a personalized 5-minute Loom walking through the audit. Watch it before our call — it'll make the conversation 10x more productive.</p>

        <p style="text-align:center;margin:32px 0;">
          <a href="${agency.calendarUrl}" style="background:#C9A961;color:#0B1F3A;padding:16px 32px;text-decoration:none;font-family:Georgia,serif;letter-spacing:2px;font-weight:bold;display:inline-block;">BOOK 30-MIN STRATEGY CALL →</a>
        </p>

        <p>Reply to this email with any questions — I read every one.</p>
        <p>— ${agency.ownerFirstName}<br/>${agency.name}</p>
      `),
      text: `Your AI Business Audit for ${audit.intake.businessName} is ready.\n\nOverall AI Readiness: ${readiness}/100 (${tier})\n\nTop 3 revenue gaps:\n1. ${top3[0].name} — ${audit.scores[top3[0].id]}/100\n2. ${top3[1].name} — ${audit.scores[top3[1].id]}/100\n3. ${top3[2].name} — ${audit.scores[top3[2].id]}/100\n\n12-month uplift potential: ${fmt(impact.annualUpliftLow)}–${fmt(impact.annualUpliftHigh)}\n\nFull report: ${reportUrl}\nBook strategy call: ${agency.calendarUrl}\n\n— ${agency.ownerFirstName}`
    };
  },

  proposal: (audit) => {
    const readiness = calculateReadiness(audit.scores);
    const impact = estimateImpact(audit.intake, readiness);
    const roi = Math.round(impact.annualUpliftLow / 22961 * 100);
    const payback = Math.max(1, Math.round(22961 / impact.monthlyRecoveryLow));

    return {
      subject: `Proposal: ${audit.intake.businessName} — GROWTH tier`,
      html: htmlWrap(`
        <h1>Proposal — ${audit.intake.businessName}</h1>
        <p>Based on the audit findings, here's the recommended path forward.</p>

        <div style="background:#F5EFE0;border:2px solid #C9A961;padding:24px;margin:24px 0;">
          <div style="font-size:11px;letter-spacing:3px;color:#C9A961;">RECOMMENDED PACKAGE</div>
          <div style="font-family:Georgia,serif;font-size:36px;color:#0B1F3A;font-weight:bold;margin:8px 0;">GROWTH TIER</div>
          <div style="font-size:18px;color:#0B1F3A;"><strong>$4,997</strong> setup · <strong>$1,497/month</strong></div>
        </div>

        <h2 style="color:#0B1F3A;border-bottom:2px solid #C9A961;padding-bottom:8px;">What's included</h2>
        <ul style="line-height:1.8;">
          <li>Full website rebuild (Framer/Webflow) with Core Web Vitals optimization</li>
          <li>Schema.org structured data + llms.txt deployment</li>
          <li>Google Business Profile + Apple + Bing optimization</li>
          <li>NAP cleanup across 50+ citation directories</li>
          <li>Full GoHighLevel CRM build-out with 5 pipelines + 7 workflows</li>
          <li>24/7 AI chatbot trained on your services + FAQ</li>
          <li>AI phone receptionist for after-hours + overflow calls</li>
          <li>Automated 7-day email + SMS nurture sequences</li>
          <li>Automated review request system (15+ reviews/month target)</li>
          <li>4 blog posts + 12 social posts per month (AEO-optimized)</li>
          <li>Monthly LLM citation tracking across ChatGPT/Gemini/Claude/Perplexity</li>
          <li>Competitor monitoring system</li>
          <li>Monthly strategy call</li>
        </ul>

        <h2 style="color:#0B1F3A;border-bottom:2px solid #C9A961;padding-bottom:8px;">ROI math</h2>
        <table style="width:100%;border-collapse:collapse;font-size:16px;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;">Setup investment</td><td style="text-align:right;font-weight:bold;color:#C9A961;">$4,997</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #eee;">Monthly retainer × 12</td><td style="text-align:right;font-weight:bold;color:#C9A961;">$17,964</td></tr>
          <tr><td style="padding:8px 0;border-bottom:2px solid #C9A961;font-weight:bold;">12-month total</td><td style="text-align:right;font-family:Georgia,serif;font-size:24px;font-weight:bold;color:#C9A961;border-bottom:2px solid #C9A961;">$22,961</td></tr>
          <tr><td style="padding:16px 0 8px;">Estimated 12-month uplift</td><td style="text-align:right;font-weight:bold;color:#0B1F3A;">${fmt(impact.annualUpliftLow)}–${fmt(impact.annualUpliftHigh)}</td></tr>
          <tr><td style="padding:8px 0;">Year-one ROI</td><td style="text-align:right;font-weight:bold;color:#0B1F3A;">${roi}%</td></tr>
          <tr><td style="padding:8px 0;">Payback period</td><td style="text-align:right;font-weight:bold;color:#0B1F3A;">~${payback} months</td></tr>
        </table>

        <h2 style="color:#0B1F3A;border-bottom:2px solid #C9A961;padding-bottom:8px;">Next step</h2>
        <p>Reply to this email with "yes" or "let's talk" and I'll send the signature link. Build starts within 5 business days of contract.</p>

        <p style="text-align:center;margin:32px 0;">
          <a href="${agency.calendarUrl}" style="background:#0B1F3A;color:#C9A961;padding:18px 36px;text-decoration:none;border:1px solid #C9A961;font-family:Georgia,serif;letter-spacing:2px;display:inline-block;">QUESTIONS? BOOK 15-MIN CALL →</a>
        </p>

        <p>— ${agency.ownerFirstName}<br/>${agency.name}</p>
      `),
      text: `Proposal for ${audit.intake.businessName}\n\nRecommended: GROWTH TIER\n$4,997 setup + $1,497/month\n12-month total: $22,961\n\nEstimated uplift: ${fmt(impact.annualUpliftLow)}–${fmt(impact.annualUpliftHigh)}\nROI: ${roi}% · Payback: ${payback} months\n\nReply with "yes" or "let's talk" to move forward.\n\n— ${agency.ownerFirstName}`
    };
  },

  followup_day_1: (audit) => ({
    subject: `The 3 numbers that scared me in your audit`,
    html: htmlWrap(`
      <p>${audit.intake.ownerName.split(' ')[0]},</p>
      <p>I've been thinking about your audit. Three findings stand out.</p>
      ${[...DIMENSIONS].sort((a, b) => audit.scores[a.id] - audit.scores[b.id]).slice(0, 3).map((d, i) =>
        `<p><strong>${i+1}. ${d.name}: ${audit.scores[d.id]}/100</strong></p>`
      ).join('')}
      <p>The third one — that one's the most expensive. Want to walk through it on a 15-minute call?</p>
      <p><a href="${agency.calendarUrl}">${agency.calendarUrl}</a></p>
      <p>— ${agency.ownerFirstName}</p>
    `)
  }),

  followup_day_3: (audit) => ({
    subject: `Quick question about ${audit.intake.businessName}`,
    html: htmlWrap(`
      <p>${audit.intake.ownerName.split(' ')[0]},</p>
      <p>What's the biggest reason you haven't booked the strategy call yet?</p>
      <p>Genuinely curious. Reply directly and I'll respond — no script.</p>
      <p>— ${agency.ownerFirstName}</p>
    `)
  }),

  followup_day_7: (audit) => ({
    subject: `Closing your file — last note`,
    html: htmlWrap(`
      <p>${audit.intake.ownerName.split(' ')[0]},</p>
      <p>I'll stop emailing after this one.</p>
      <p>If the timing isn't right, no problem. Your audit is yours — review it whenever it's useful.</p>
      <p>If you ever want to revisit, calendar is always open: <a href="${agency.calendarUrl}">${agency.calendarUrl}</a></p>
      <p>Wishing you well,<br/>${agency.ownerFirstName}</p>
    `)
  }),

  custom: ({ customSubject, customBody, audit }) => ({
    subject: customSubject || 'A note from ' + agency.name,
    html: htmlWrap(`<p>${audit?.intake?.ownerName?.split(' ')[0] || 'Hi'},</p>${customBody}<p>— ${agency.ownerFirstName}</p>`),
    text: customBody?.replace(/<[^>]*>/g, '') || ''
  })
};

function htmlWrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background: #F8F6F1; color: #1A1A1A; line-height: 1.6; }
    h1 { color: #0B1F3A; font-size: 32px; margin-bottom: 16px; }
    h2 { color: #0B1F3A; font-size: 22px; margin-top: 32px; }
    p { margin: 16px 0; }
    a { color: #C9A961; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #C9A961; font-size: 11px; color: #888; text-align: center; }
  </style></head><body>
    ${content}
    <div class="footer">${agency.name} · ${agency.email} · ${agency.phone}</div>
  </body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { auditId, to, type, customSubject, customBody } = req.body;
    if (!to || !type) return res.status(400).json({ error: 'Missing to or type' });

    let audit = null;
    if (auditId) {
      audit = await storage.get('audit:' + auditId);
      if (!audit && type !== 'custom') return res.status(404).json({ error: 'Audit not found' });
    }

    const template = TEMPLATES[type];
    if (!template) return res.status(400).json({ error: 'Unknown template type' });

    const msg = type === 'custom'
      ? template({ customSubject, customBody, audit })
      : template(audit);

    await sgMail.send({
      from: FROM,
      to,
      subject: msg.subject,
      text: msg.text || msg.html.replace(/<[^>]*>/g, ''),
      html: msg.html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      }
    });

    if (audit) {
      if (type === 'confirmation') audit.automationStatus.confirmationEmailSent = true;
      if (type === 'audit_delivery') audit.automationStatus.auditEmailSent = true;
      if (type === 'proposal') audit.automationStatus.proposalSent = true;
      audit.updatedAt = new Date().toISOString();
      await storage.set('audit:' + auditId, audit);
    }

    await logActivity(auditId, 'email_sent', {
      type, to, subject: msg.subject
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Email send error', error);
    if (req.body.auditId) {
      await logActivity(req.body.auditId, 'email_failed', { error: error.message }).catch(() => {});
    }
    return res.status(500).json({ error: error.message });
  }
}
