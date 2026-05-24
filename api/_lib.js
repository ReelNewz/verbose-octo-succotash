// Shared utilities for all serverless functions
import { kv } from '@vercel/kv';

// ===== STORAGE (Vercel KV with fallback) =====
export const storage = {
  async get(key) {
    try { return await kv.get(key); }
    catch (e) { console.error('KV get failed', key, e); return null; }
  },
  async set(key, value) {
    try { return await kv.set(key, value); }
    catch (e) { console.error('KV set failed', key, e); return null; }
  },
  async list(pattern) {
    try {
      const keys = [];
      let cursor = 0;
      do {
        const [next, batch] = await kv.scan(cursor, { match: pattern, count: 100 });
        keys.push(...batch);
        cursor = parseInt(next);
      } while (cursor !== 0);
      return keys;
    } catch (e) { console.error('KV scan failed', e); return []; }
  },
  async delete(key) {
    try { return await kv.del(key); }
    catch (e) { return null; }
  }
};

// ===== AUTH (webhook signature verification) =====
export function verifyWebhook(req) {
  const secret = req.headers['x-webhook-secret'] || req.query.secret;
  return secret === process.env.WEBHOOK_SECRET;
}

// ===== AGENCY CONTEXT =====
export const agency = {
  name: process.env.AGENCY_NAME || 'Your Agency',
  ownerFirstName: process.env.AGENCY_OWNER_FIRST_NAME || 'Agency Owner',
  ownerFullName: process.env.AGENCY_OWNER_FULL_NAME || 'Agency Owner',
  email: process.env.AGENCY_EMAIL || 'hello@youragency.com',
  phone: process.env.AGENCY_PHONE || '+15555551234',
  website: process.env.AGENCY_WEBSITE || 'https://youragency.com',
  calendarUrl: process.env.AGENCY_CALENDAR_URL || 'https://calendly.com/youragency'
};

// ===== AUDIT MATH =====
export const DIMENSIONS = [
  { id: "website", name: "Website Performance", weight: 1.5 },
  { id: "localseo", name: "Local SEO", weight: 1.0 },
  { id: "aeogeo", name: "AEO / GEO (AI Search)", weight: 1.5 },
  { id: "reputation", name: "Online Reputation", weight: 1.0 },
  { id: "competitor", name: "Competitor Gap", weight: 1.0 },
  { id: "leadcapture", name: "Lead Capture", weight: 1.0 },
  { id: "automation", name: "Automation", weight: 1.5 },
  { id: "crm", name: "CRM & Follow-Up", weight: 1.0 },
  { id: "content", name: "Content & Authority", weight: 1.0 },
  { id: "aicx", name: "AI Customer Experience", weight: 1.0 }
];

export function calculateReadiness(scores) {
  let tw = 0, wt = 0;
  DIMENSIONS.forEach(d => { tw += scores[d.id] * d.weight; wt += d.weight; });
  return Math.round(tw / wt);
}

export function getTier(s) {
  if (s <= 40) return "Foundational";
  if (s <= 60) return "Developing";
  if (s <= 75) return "Growing";
  if (s <= 90) return "Optimized";
  return "Dominant";
}

export function estimateImpact(intake, readiness) {
  const leadValue = parseInt(intake.leadValue) || 800;
  const monthlyLeads = parseInt(intake.monthlyLeads) || 40;
  const gap = (100 - readiness) / 100;
  const lostLow = Math.round(monthlyLeads * gap * 0.4);
  const lostHigh = Math.round(lostLow * 1.4);
  const recoveryLow = Math.round(lostLow * leadValue * 0.6);
  const recoveryHigh = Math.round(recoveryLow * 1.4);
  return {
    leadsLostLow: lostLow, leadsLostHigh: lostHigh,
    monthlyRecoveryLow: recoveryLow, monthlyRecoveryHigh: recoveryHigh,
    annualUpliftLow: recoveryLow * 12, annualUpliftHigh: recoveryHigh * 12
  };
}

export const fmt = (n) => "$" + n.toLocaleString();

// ===== ACTIVITY LOG =====
export async function logActivity(auditId, type, details) {
  const entry = {
    id: 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    auditId, type, details,
    timestamp: new Date().toISOString()
  };
  await storage.set('activity:' + entry.id, entry);
  const idx = (await storage.get('activity:index:' + auditId)) || [];
  idx.unshift(entry.id);
  await storage.set('activity:index:' + auditId, idx);
  return entry;
}
