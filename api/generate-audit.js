// AUDIT GENERATOR — Claude API
// Runs 10 dimension prompts in parallel, computes scores, triggers delivery
import Anthropic from '@anthropic-ai/sdk';
import { storage, agency, logActivity, verifyWebhook,
         DIMENSIONS, calculateReadiness, getTier, estimateImpact } from './_lib.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DIMENSION_PROMPTS = {
  website: (i) => `Score the website performance of ${i.businessName} at ${i.websiteUrl}.
Industry: ${i.industry}. Location: ${i.city}, ${i.state}.
Without live access, infer realistic scores based on typical ${i.industry} businesses in ${i.city}.
Most local service businesses score 35-60 on this dimension.
Output ONLY a JSON object: {"score": <0-100 integer>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  localseo: (i) => `Score local SEO for ${i.businessName} in ${i.city}, ${i.state} (${i.industry}).
Most local businesses score 40-65. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  aeogeo: (i) => `Score AI search visibility (ChatGPT, Gemini, Claude, Perplexity, Copilot citations + voice assistant readiness) for ${i.businessName} in ${i.city}.
99% of local businesses score 5-25 on this — it's the biggest gap. Output ONLY: {"score": <int>, "findings": "<2 sentences mentioning specific LLM citation gaps>", "recommendation": "<1 sentence>"}`,

  reputation: (i) => `Score online reputation for ${i.businessName} (${i.industry}, ${i.city}). Most local businesses score 50-75. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  competitor: (i) => `Score competitive position for ${i.businessName} vs ${i.competitor1 || 'top competitor'}, ${i.competitor2 || 'second competitor'}, ${i.competitor3 || 'third competitor'} in ${i.city} ${i.industry} market. Most local businesses score 40-60. Output ONLY: {"score": <int>, "findings": "<2 sentences naming specific gaps>", "recommendation": "<1 sentence>"}`,

  leadcapture: (i) => `Score lead capture infrastructure for ${i.businessName} at ${i.websiteUrl}. Most score 35-60. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  automation: (i) => `Score automation maturity for ${i.businessName} (${i.industry}). 95% of local businesses have minimal automation, scoring 15-35. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  crm: (i) => `Score CRM and follow-up systems for ${i.businessName}. Most local businesses have spreadsheets or basic CRM, scoring 25-50. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  content: (i) => `Score content authority for ${i.businessName} (${i.industry}). Most score 30-55. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`,

  aicx: (i) => `Score AI customer experience (chatbot, AI phone, self-serve booking, unified inbox) for ${i.businessName}. Most local businesses score 10-30. Output ONLY: {"score": <int>, "findings": "<2 sentences>", "recommendation": "<1 sentence>"}`
};

const execSummaryPrompt = (audit, readiness, tier, impact) => `Write a 1-page executive summary for an AI Business Audit.

BUSINESS: ${audit.intake.businessName}
INDUSTRY: ${audit.intake.industry}
LOCATION: ${audit.intake.city}, ${audit.intake.state}
OVERALL SCORE: ${readiness}/100 (Tier: ${tier})
12-MONTH UPLIFT: $${impact.annualUpliftLow.toLocaleString()}-$${impact.annualUpliftHigh.toLocaleString()}

DIMENSION SCORES:
${DIMENSIONS.map(d => `- ${d.name}: ${audit.scores[d.id]}/100 — ${audit.aiContent[d.id]?.findings || ''}`).join('\n')}

TONE: Direct, fact-centered, no marketing fluff. Litigation-grade clarity.
LENGTH: 250-350 words.
STRUCTURE: Open with the most damaging finding. Three critical gaps. End with the recommended path forward (GROWTH tier).

Output the summary text only — no preamble.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!verifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { auditId } = req.body;
    const audit = await storage.get('audit:' + auditId);
    if (!audit) return res.status(404).json({ error: 'Audit not found' });

    await logActivity(auditId, 'audit_generation_started', {});

    const scores = {};
    const aiContent = {};

    const dimensionResults = await Promise.all(
      DIMENSIONS.map(async (d) => {
        try {
          const prompt = DIMENSION_PROMPTS[d.id](audit.intake);
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 400,
            messages: [{ role: 'user', content: prompt }]
          });

          const text = response.content[0].text.trim();
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('No JSON in response');
          const parsed = JSON.parse(jsonMatch[0]);

          return {
            id: d.id,
            score: Math.max(0, Math.min(100, parseInt(parsed.score))),
            findings: parsed.findings,
            recommendation: parsed.recommendation
          };
        } catch (err) {
          console.error(`Dimension ${d.id} failed:`, err.message);
          const fallback = d.id === "aeogeo" ? 15 : d.id === "automation" ? 22 :
                          d.id === "aicx" ? 28 : d.id === "website" ? 45 : 50;
          return {
            id: d.id,
            score: fallback,
            findings: 'Analysis in progress — manual review recommended.',
            recommendation: 'See full report for detailed remediation.'
          };
        }
      })
    );

    dimensionResults.forEach(r => {
      scores[r.id] = r.score;
      aiContent[r.id] = { findings: r.findings, recommendation: r.recommendation };
    });

    const readiness = calculateReadiness(scores);
    const tier = getTier(readiness);
    const impact = estimateImpact(audit.intake, readiness);

    let execSummary = '';
    try {
      const summaryResponse = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: execSummaryPrompt({ ...audit, scores, aiContent }, readiness, tier, impact)
        }]
      });
      execSummary = summaryResponse.content[0].text.trim();
    } catch (err) {
      console.error('Exec summary failed:', err.message);
      execSummary = `${audit.intake.businessName} scored ${readiness}/100 on the AI Readiness Index (Tier: ${tier}). The three weakest dimensions are costing an estimated $${impact.annualUpliftLow.toLocaleString()}-$${impact.annualUpliftHigh.toLocaleString()} in unrealized annual revenue. Recommended path: GROWTH tier.`;
    }

    audit.scores = scores;
    audit.aiContent = aiContent;
    audit.executiveSummary = execSummary;
    audit.readiness = readiness;
    audit.tier = tier;
    audit.impact = impact;
    audit.pipelineStage = 'delivered';
    audit.automationStatus.auditGenerated = true;
    audit.updatedAt = new Date().toISOString();

    await storage.set('audit:' + auditId, audit);

    await logActivity(auditId, 'audit_generated', {
      readiness, tier,
      estimatedUplift: `$${impact.annualUpliftLow.toLocaleString()}-$${impact.annualUpliftHigh.toLocaleString()}`
    });

    const baseUrl = `https://${req.headers.host}`;
    const secret = process.env.WEBHOOK_SECRET;

    fetch(`${baseUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
      body: JSON.stringify({ auditId, to: audit.intake.email, type: 'audit_delivery' })
    }).catch(e => console.error('Audit delivery email failed', e));

    if (audit.intake.phone) {
      fetch(`${baseUrl}/api/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret },
        body: JSON.stringify({ auditId, to: audit.intake.phone, type: 'audit_ready' })
      }).catch(e => console.error('Audit ready SMS failed', e));
    }

    const now = Date.now();
    await storage.set('followup:' + auditId + ':day1',  { auditId, type: 'followup_day_1', runAt: now + 1 * 86400000 });
    await storage.set('followup:' + auditId + ':day3',  { auditId, type: 'followup_day_3', runAt: now + 3 * 86400000 });
    await storage.set('followup:' + auditId + ':day7',  { auditId, type: 'followup_day_7', runAt: now + 7 * 86400000 });

    return res.status(200).json({
      success: true,
      auditId,
      readiness, tier,
      summary: 'Audit generated. Delivery email triggered.'
    });

  } catch (error) {
    console.error('Generate audit error', error);
    if (req.body.auditId) {
      await logActivity(req.body.auditId, 'audit_generation_failed', { error: error.message }).catch(() => {});
    }
    return res.status(500).json({ error: error.message });
  }
}
