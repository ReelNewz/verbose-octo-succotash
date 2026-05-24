// TWILIO STATUS CALLBACK — receives SMS delivery confirmations
import { storage } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).end();
  try {
    const sid = req.body.MessageSid;
    const status = req.body.MessageStatus;
    const errorCode = req.body.ErrorCode;
    if (sid) {
      await storage.set('sms-status:' + sid, {
        sid, status, errorCode,
        updatedAt: new Date().toISOString()
      });
    }
    return res.status(200).end();
  } catch (error) {
    console.error('Twilio status error', error);
    return res.status(200).end();
  }
}
