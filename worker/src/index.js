// TRT Guy — onboarding intake worker.
// Receives the onboarding form (text + file uploads), stores files in R2, and:
//   1. writes every answer + file links onto the buyer's GoHighLevel contact (custom fields)
//   2. saves the full Q&A transcript as a Note on that contact
//   3. emails the answers to the internal notify address (julian@trt-guy.com)
//
// Secrets/vars (set with wrangler, NOT hardcoded — this repo is public):
//   GHL_TOKEN    (secret)  -> GHL Private Integration token (pit-...)
//   LOCATION_ID  (var)     -> WmcafLXT7njeQOu3fqlP
//   NOTIFY_EMAIL (var)     -> julian@trt-guy.com
//   EMAIL_FROM   (var)     -> "TRT Guy <admin@jackedvegans.com>"  (authenticated sender on the location)
// Binding: BUCKET -> R2 bucket for uploaded photos/bloodwork

const GHL_API = 'https://services.leadconnectorhq.com';

// form field name -> GHL custom field id
const FIELD_IDS = {
  onboarding_age: 'XQpxKbX71PSLaOUvVsaq',
  onboarding_location_timezone: 'YdrdAKiVBhS06tiBjsLc',
  onboarding_height: 'UOgnoZPVZQtoY4kJ1nLf',
  onboarding_current_weight: '0wCYHhIHw2GTUHA7Klb4',
  onboarding_goal_weight: 'cHZjBhmOPcbe4XjTVlgH',
  onboarding_body_fat_pct: 'Fe6eK87v6eBGUz1IHK8q',
  onboarding_primary_goal: 'auhQQcsSIUZ4byw7Esc9',
  onboarding_short_term_goals: 'pWoA3fY8kJcuZibYQ43n',
  onboarding_long_term_goals: 'CnfDcPRNsW0BLYZPyyRt',
  onboarding_past_attempts: 'aZNy2GCyaBQavYUIIWTl',
  onboarding_why_now: 'aPtqCOb8WCET2oH33bKF',
  onboarding_target_timeline: 'yRcwJajQ6gnUuw4LJQe5',
  onboarding_on_trt_now: 'xxhb7HMca5Okk3gCbwOs',
  onboarding_trt_protocol_dose: 'raLhVxY6usleSyymNj0p',
  onboarding_trt_duration: 'BDR0GDgIqG5SlCqptRui',
  onboarding_trt_prescriber: 'QoQaT168ePRAMQU3bOiS',
  onboarding_previous_ped_use: 'jXUAqYTM6kruz27Bse3x',
  onboarding_previous_ped_details: '0SVfyEHwaGJsAaUiNAMY',
  onboarding_enhancement_preference: 'aHHMMupMTy4f4nNano5R',
  onboarding_risk_tolerance_1_to_10: 'OH4db6kgEXQTWA7Gb7jV',
  onboarding_medical_conditions: 'y0Dgz4vwa5jNyi0MWtgL',
  onboarding_medications_supplements: '2EzDRdpCoYCwvMvHcIKQ',
  onboarding_injuries_limitations: 'lZbnSDrwzJPPxtO96k9S',
  onboarding_allergies: 'rzpVziFklNbRJNDsbGnc',
  onboarding_training_experience: 'zz7AbqS1z6ZEYkXVDnd7',
  onboarding_current_routine: 'm7FlXOsOox0IOstG7eqo',
  onboarding_days_per_week: 'rb5lJcz3NzXdi0iIFhpK',
  onboarding_gym_equipment: 'BgUsy6C3EX948e0NC5VP',
  onboarding_tracks_macros: 'X6eJBZbEcKdJe5MgURiQ',
  onboarding_current_calories: 'DHl3nD8OM70IYAqC9juH',
  onboarding_typical_day_of_eating: 'e4jjFs5Ozv04K575ZgEj',
  onboarding_dietary_restrictions: '0qHRZXuE1LJJKtngKwCo',
  onboarding_alcohol_per_week: 'hdSjUNq1I8QfN1GLswlL',
  onboarding_avg_sleep: 'Ie9SQPKlxLNkWUuaWFcY',
  onboarding_stress_level: '3kfTAPTMVuJqBiplUqo5',
  onboarding_job_activity: 'yyFyAZ7cMLz4D5LCvHQN',
  onboarding_photo_social_consent: '3KUszwuDAtNmdaOh5y97',
  onboarding_anything_else: 'omtl1MwKiEidJJ4Hu35F',
  onboarding_bloodwork_link: 'LEET16pP2xTKga6F9Wzy',
  onboarding_best_contact_method: 'g4fYT4guQ7DTafhK2sRS',
  onboarding_photo_front: 'Tr6vTGvfjIGMLAiOFMcs',
  onboarding_photo_side: 'tStH9wehxV8iJPtYAnaI',
  onboarding_photo_back: 'qt8lZQPToUT3KFShx43L',
};

// human question labels + order, for the transcript (note + email)
const LABELS = [
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['onboarding_age', 'Age'],
  ['onboarding_location_timezone', 'City / timezone'],
  ['units', 'Units'],
  ['onboarding_height', 'Height'],
  ['onboarding_current_weight', 'Current weight'],
  ['onboarding_goal_weight', 'Goal weight'],
  ['onboarding_body_fat_pct', 'Body fat %'],
  ['onboarding_primary_goal', 'Primary goal'],
  ['onboarding_short_term_goals', 'Short-term goal'],
  ['onboarding_long_term_goals', 'Long-term goal'],
  ['onboarding_past_attempts', 'What they tried before'],
  ['onboarding_why_now', 'Why now'],
  ['onboarding_target_timeline', 'Target timeline'],
  ['onboarding_on_trt_now', 'On TRT now'],
  ['onboarding_trt_protocol_dose', 'TRT protocol & dose'],
  ['onboarding_trt_duration', 'TRT duration'],
  ['onboarding_trt_prescriber', 'TRT prescriber'],
  ['onboarding_previous_ped_use', 'Previous PED use'],
  ['onboarding_previous_ped_details', 'Previous PED details'],
  ['onboarding_enhancement_preference', 'Direction'],
  ['onboarding_risk_tolerance_1_to_10', 'Risk tolerance (1-10)'],
  ['onboarding_medical_conditions', 'Medical conditions'],
  ['onboarding_medications_supplements', 'Medications & supplements'],
  ['onboarding_injuries_limitations', 'Injuries / limitations'],
  ['onboarding_allergies', 'Allergies'],
  ['onboarding_training_experience', 'Training experience'],
  ['onboarding_current_routine', 'Current routine'],
  ['onboarding_days_per_week', 'Days per week'],
  ['onboarding_gym_equipment', 'Gym / equipment'],
  ['onboarding_tracks_macros', 'Knows how to track macros'],
  ['onboarding_current_calories', 'Current calories/day'],
  ['onboarding_typical_day_of_eating', 'Typical day of eating'],
  ['onboarding_dietary_restrictions', 'Dietary restrictions'],
  ['onboarding_alcohol_per_week', 'Alcohol per week'],
  ['onboarding_avg_sleep', 'Average sleep'],
  ['onboarding_stress_level', 'Stress level'],
  ['onboarding_job_activity', 'Job / activity'],
  ['onboarding_photo_social_consent', 'Photo social consent'],
  ['onboarding_anything_else', 'Anything else'],
  ['onboarding_bloodwork_link', 'Bloodwork link'],
  ['onboarding_instagram', 'Instagram'],
  ['onboarding_best_contact_method', 'Best contact method'],
];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeName = n => (n || 'file').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-60);

function ghl(env, method, path, body) {
  return fetch(`${GHL_API}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${env.GHL_TOKEN}`,
      'Version': '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Uploads to Supabase Storage (bucket "trt-onboarding") and returns a public URL.
// The key stays server-side (worker secret); browsers only ever POST to this worker.
async function storeFile(env, origin, prefix, file) {
  const key = `${prefix}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = await file.arrayBuffer();
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/trt-onboarding/${key}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SUPABASE_KEY}`,
      'apikey': env.SUPABASE_KEY,
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error('storage upload failed ' + res.status + ': ' + (await res.text()).slice(0, 160));
  return `${env.SUPABASE_URL}/storage/v1/object/public/trt-onboarding/${key}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // Editable-text store: GET returns overrides JSON; POST (passcode) saves it.
    if (url.pathname === '/content') {
      if (!env.BUCKET) {
        if (request.method === 'GET') return new Response('{}', { headers: { ...CORS, 'Content-Type': 'application/json' } });
        return json({ error: 'Editing storage not enabled yet (R2 off)' }, 503);
      }
      if (request.method === 'GET') {
        const obj = await env.BUCKET.get('content.json');
        const text = obj ? await obj.text() : '{}';
        return new Response(text, { headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        if ((request.headers.get('X-Edit-Key') || '') !== (env.EDIT_KEY || 'Hierro2026')) return json({ error: 'unauthorized' }, 401);
        const txt = await request.text();
        try { JSON.parse(txt); } catch (e) { return json({ error: 'invalid json' }, 400); }
        await env.BUCKET.put('content.json', txt, { httpMetadata: { contentType: 'application/json' } });
        return json({ ok: true });
      }
    }

    // Serve an uploaded file back (capability URL — unguessable key).
    if (request.method === 'GET' && url.pathname.startsWith('/f/')) {
      if (!env.BUCKET) return new Response('Not found', { status: 404 });
      const key = decodeURIComponent(url.pathname.slice(3));
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set('Cache-Control', 'private, max-age=31536000');
      h.set('Content-Disposition', 'inline');
      return new Response(obj.body, { headers: h });
    }

    // Simple opt-in capture for the TRT-101 and coaching-waitlist pages.
    if (url.pathname === '/optin') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const d = await request.json().catch(() => ({}));
      const email = (d.email || '').toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);
      const LISTS = {
        'trt-101': { tag: 'trt-101', source: 'TRT 101 Opt-in' },
        'coaching-waitlist': { tag: 'coaching-waitlist', source: 'Coaching Waitlist' },
      };
      const cfg = LISTS[d.list] || { tag: 'lead', source: 'TRT Guy' };
      const up = await ghl(env, 'POST', '/contacts/upsert', {
        locationId: env.LOCATION_ID,
        email,
        firstName: (d.firstName || d.name || '').toString().trim(),
        phone: (d.phone || '').toString().trim(),
        source: cfg.source,
        tags: ['trt-guy', cfg.tag],
      });
      const o = await up.json();
      const cid = o && o.contact && o.contact.id;
      if (!cid) return json({ error: 'GHL upsert failed', details: o }, 502);
      return json({ success: true, contactId: cid });
    }

    // Coaching application (step 2 after the waitlist opt-in).
    if (url.pathname === '/application') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const d = await request.json().catch(() => ({}));
      const email = (d.email || '').toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);
      const APP = [
        ['instagram', 'Instagram handle', 'gsyco9x3jwYCEgCJMvY1'],
        ['based', 'Where are you based', 'PknI0vXROFIeWfCdux1x'],
        ['short_term_goals', 'Short-term goals', 'pWoA3fY8kJcuZibYQ43n'],
        ['long_term_goals', 'Long-term goals', 'CnfDcPRNsW0BLYZPyyRt'],
        ['on_trt', 'On TRT / thinking about it', 'xxhb7HMca5Okk3gCbwOs'],
        ['trt_protocol', 'Current TRT protocol', '4lLXxSHJqWbXyCVgf7MM'],
        ['ever_used_steroids', 'Ever used steroids', 'QkKJ8nc32jVC0jzZ7t6S'],
        ['on_cycle_now', 'Currently on a cycle', 'qUAfgqODKeM9VQ5wn5Fy'],
        ['cycle_describe', 'Current cycle (described)', 'M0iNIa5TEZ7ev3MN5ntS'],
        ['investment_ready', 'Willing to invest significantly', 'ZDOG2Rfb8e7Ynwhwyomb'],
        ['ready_to_start', 'When would you start', 'HVGtf4eRQRATvalN4Yfb'],
        ['decision_maker', 'Financial decision maker', 'QrCNqO0fAoGZNd8e9x7D'],
        ['why_now_vs_wait', 'Why now vs waiting 1-2 months', '1rOd8pBztwro2hiklQEp'],
        ['biggest_struggle', 'Biggest struggle', 'zAgPdBVxY72yreuTI286'],
        ['wants_from_coaching', 'What they want from coaching', 'ydPPsiNnJ4H95JG12nlt'],
        ['help_accomplish', 'Anything else I should know', 'gLMxGi5wAVAca0J78lGc'],
      ];
      const customFields = [];
      for (const [k, , id] of APP) { const v = d[k]; if (v != null && v.toString().trim() !== '') customFields.push({ id, value: v.toString() }); }
      const up = await ghl(env, 'POST', '/contacts/upsert', {
        locationId: env.LOCATION_ID, email,
        firstName: (d.firstName || '').toString().trim(), phone: (d.phone || '').toString().trim(),
        source: 'Coaching Application', tags: ['trt-guy', 'coaching-waitlist', 'coaching-application'], customFields,
      });
      const o = await up.json(); const cid = o && o.contact && o.contact.id;
      if (!cid) return json({ error: 'GHL upsert failed', details: o }, 502);
      const clientName = (d.firstName || email);
      // Prefer the live question wording the page sends (so edited questions transcribe as edited);
      // fall back to the built-in labels. Custom-field values above always map by id regardless.
      const lines = (Array.isArray(d.qa) && d.qa.length)
        ? d.qa.filter(x => x && x.a != null && x.a.toString().trim() !== '').map(x => `${(x.q || '').toString().trim()}: ${x.a}`)
        : APP.map(([k, label]) => { const v = d[k]; return (v && v.toString().trim()) ? `${label}: ${v}` : null; }).filter(Boolean);
      const transcript = `TRT GUY — COACHING APPLICATION\nName: ${clientName}\nEmail: ${email}\nPhone: ${(d.phone || '').toString()}\n\n` + lines.join('\n');
      try { await ghl(env, 'POST', `/contacts/${cid}/notes`, { body: transcript }); } catch (e) {}
      // Slack notification (Incoming Webhook) — no-op until the SLACK_WEBHOOK secret is set.
      if (env.SLACK_WEBHOOK) {
        try {
          const ig = (d.instagram || '').toString().trim();
          const body = lines.join('\n');
          const blk = body.length > 2800 ? body.slice(0, 2800) + '\n…(truncated — full answers in email/GHL)' : body;
          await fetch(env.SLACK_WEBHOOK, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Money Bot',
              icon_emoji: ':moneybag:',
              text: `${env.SLACK_MENTION || '<@U0BTQAGV85A>'} New coaching application: ${clientName}`,
              blocks: [
                { type: 'header', text: { type: 'plain_text', text: '💰 New coaching application' } },
                { type: 'section', fields: [
                  { type: 'mrkdwn', text: `*Name:*\n${clientName}` },
                  { type: 'mrkdwn', text: `*Email:*\n${email}` },
                  { type: 'mrkdwn', text: `*Phone:*\n${(d.phone || '—').toString()}` },
                  { type: 'mrkdwn', text: `*Instagram:*\n${ig || '—'}` },
                ] },
                { type: 'section', text: { type: 'mrkdwn', text: '```' + blk + '```' } },
              ],
            }),
          });
        } catch (e) {}
      }
      try {
        const notify = env.NOTIFY_EMAIL || 'julian@trt-guy.com';
        const ir = await ghl(env, 'POST', '/contacts/upsert', { locationId: env.LOCATION_ID, email: notify, firstName: 'TRT Guy', lastName: 'Onboarding Notifications', tags: ['internal-notify'] });
        const ij = await ir.json(); const nid = ij && ij.contact && ij.contact.id;
        if (nid) await ghl(env, 'POST', '/conversations/messages', { type: 'Email', contactId: nid, subject: `New coaching application: ${clientName}`, html: `<h2>New coaching application — ${esc(clientName)}</h2><pre style="white-space:pre-wrap;font-family:Arial">${esc(transcript)}</pre>`, emailFrom: (env.EMAIL_FROM || 'TRT Guy <julian@trt-guy.com>') });
      } catch (e) {}
      return json({ success: true, contactId: cid });
    }

    // ── /assessment ── "Initial Client Consultation" (onboarding questionnaire v2).
    // Free-form: the page sends a live qa:[{q,a}] array built from its own (editable)
    // labels, so there are no per-question GHL custom fields to keep in sync. Every
    // answer lands in the contact Note, the notify email and Slack.
    if (url.pathname === '/assessment') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      try {
        const form = await request.formData();
        const origin = url.origin;

        const email = (form.get('email') || '').toString().trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);

        const fullName = (form.get('name') || form.get('firstName') || '').toString().trim();
        const parts = fullName ? fullName.split(/\s+/) : [];
        const nameFirst = parts.length ? parts.shift() : '';
        const nameLast = parts.join(' ');
        const clientName = fullName || email;

        // Uploads: three pose photos, bloodwork, and the four lift videos.
        const poseUrls = {}; const bloodUrls = []; const videoUrls = []; const uploadErrors = [];
        if (env.SUPABASE_URL && env.SUPABASE_KEY) {
          for (const pose of ['front', 'side', 'back']) {
            const f = form.get('photo_' + pose);
            if (f && typeof f === 'object' && f.size > 0) {
              try { poseUrls[pose] = await storeFile(env, origin, 'v2/photos/' + pose, f); }
              catch (e) { uploadErrors.push(pose + ': ' + e.message); }
            }
          }
          for (const f of form.getAll('bloodwork')) {
            if (f && typeof f === 'object' && f.size > 0) {
              try { bloodUrls.push(await storeFile(env, origin, 'v2/bloodwork', f)); }
              catch (e) { uploadErrors.push('bloodwork: ' + e.message); }
            }
          }
          for (const f of form.getAll('videos')) {
            if (f && typeof f === 'object' && f.size > 0) {
              try { videoUrls.push(await storeFile(env, origin, 'v2/videos', f)); }
              catch (e) { uploadErrors.push('video: ' + e.message); }
            }
          }
        }

        let qa = [];
        try { qa = JSON.parse((form.get('qa') || '[]').toString()); } catch (e) {}
        if (!Array.isArray(qa)) qa = [];
        const lines = qa
          .filter(x => x && x.a != null && x.a.toString().trim() !== '')
          .map(x => `${(x.q || '').toString().trim()}\n  ${x.a.toString().trim().replace(/\n/g, '\n  ')}`);

        const media = [];
        if (poseUrls.front) media.push('Front photo: ' + poseUrls.front);
        if (poseUrls.side) media.push('Side photo: ' + poseUrls.side);
        if (poseUrls.back) media.push('Back photo: ' + poseUrls.back);
        if (bloodUrls.length) media.push('Bloodwork: ' + bloodUrls.join('  |  '));
        if (videoUrls.length) media.push('Lift videos: ' + videoUrls.join('  |  '));

        const transcript =
          `TRT GUY — INITIAL CLIENT CONSULTATION\nName: ${clientName}\nEmail: ${email}\nPhone: ${(form.get('phone') || '').toString()}\n\n` +
          lines.join('\n\n') +
          (media.length ? '\n\nMEDIA:\n' + media.join('\n') : '');

        // 1) Upsert the contact. Photo/bloodwork links reuse the existing onboarding fields.
        const customFields = [];
        if (poseUrls.front) customFields.push({ id: FIELD_IDS.onboarding_photo_front, value: poseUrls.front });
        if (poseUrls.side) customFields.push({ id: FIELD_IDS.onboarding_photo_side, value: poseUrls.side });
        if (poseUrls.back) customFields.push({ id: FIELD_IDS.onboarding_photo_back, value: poseUrls.back });
        if (bloodUrls.length) customFields.push({ id: FIELD_IDS.onboarding_bloodwork_link, value: bloodUrls.join(' | ') });

        const upsert = await ghl(env, 'POST', '/contacts/upsert', {
          locationId: env.LOCATION_ID, email,
          firstName: nameFirst, lastName: nameLast,
          phone: (form.get('phone') || '').toString().trim(),
          source: 'TRT Guy Initial Consultation',
          tags: ['trt-guy', 'client-onboarded', 'assessment-v2'],
          customFields,
        });
        const out = await upsert.json();
        const contactId = out && out.contact && out.contact.id;
        if (!contactId) return json({ error: 'GHL upsert failed', details: out }, 502);

        // 2) Full transcript as a Note (GHL notes cap out, so split into chunks).
        let noteOk = false;
        try {
          const CHUNK = 7000;
          if (transcript.length <= CHUNK) {
            const nr = await ghl(env, 'POST', `/contacts/${contactId}/notes`, { body: transcript });
            noteOk = nr.ok;
          } else {
            const total = Math.ceil(transcript.length / CHUNK);
            noteOk = true;
            for (let i = 0; i < total; i++) {
              const nr = await ghl(env, 'POST', `/contacts/${contactId}/notes`, {
                body: `[Consultation ${i + 1}/${total}]\n` + transcript.slice(i * CHUNK, (i + 1) * CHUNK),
              });
              if (!nr.ok) noteOk = false;
            }
          }
        } catch (e) {}

        // 3) Slack → #onboarding-forms.
        const HOOK = env.SLACK_WEBHOOK_ONBOARDING || env.SLACK_WEBHOOK;
        if (HOOK) {
          try {
            const body = lines.join('\n\n') + (media.length ? '\n\nMEDIA:\n' + media.join('\n') : '');
            const blk = body.length > 2800 ? body.slice(0, 2800) + '\n…(truncated — full answers in email/GHL)' : body;
            await fetch(HOOK, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username: 'Money Bot', icon_emoji: ':clipboard:',
                text: `${env.SLACK_MENTION || '<@U0BTQAGV85A>'} New client consultation: ${clientName}`,
                blocks: [
                  { type: 'header', text: { type: 'plain_text', text: '📋 New client consultation' } },
                  { type: 'section', fields: [
                    { type: 'mrkdwn', text: `*Name:*\n${clientName}` },
                    { type: 'mrkdwn', text: `*Email:*\n${email}` },
                  ] },
                  { type: 'section', text: { type: 'mrkdwn', text: '```' + blk + '```' } },
                ],
              }),
            });
          } catch (e) {}
        }

        // 4) Email the answers to the internal notify address.
        let emailOk = false;
        try {
          const notify = (env.NOTIFY_EMAIL || 'julian@trt-guy.com');
          const ir = await ghl(env, 'POST', '/contacts/upsert', {
            locationId: env.LOCATION_ID, email: notify, firstName: 'TRT Guy', lastName: 'Onboarding Notifications',
            tags: ['internal-notify'], source: 'TRT Guy Initial Consultation',
          });
          const ij = await ir.json();
          const notifyId = ij && ij.contact && ij.contact.id;
          if (notifyId) {
            const er = await ghl(env, 'POST', '/conversations/messages', {
              type: 'Email', contactId: notifyId,
              subject: `New TRT Guy consultation: ${clientName}`,
              html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><h2>New consultation — ${esc(clientName)}</h2><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px">${esc(transcript)}</pre></div>`,
              emailFrom: (env.EMAIL_FROM || 'TRT Guy <julian@trt-guy.com>'),
            });
            emailOk = er.ok;
          }
        } catch (e) {}

        return json({ success: true, contactId, note: noteOk, emailed: emailOk, answers: lines.length, photos: Object.keys(poseUrls).length, bloodwork: bloodUrls.length, videos: videoUrls.length, uploadErrors });
      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    try {
      const form = await request.formData();
      const origin = url.origin;

      const email = (form.get('email') || '').toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'A valid email is required' }, 400);
      }
      const firstName = (form.get('firstName') || '').toString().trim();
      // Prefer the full name they typed; split into first/last for the contact record.
      const fullName = (form.get('onboarding_full_name') || '').toString().trim();
      const _np = fullName ? fullName.split(/\s+/) : [];
      const nameFirst = _np.length ? _np.shift() : firstName;
      const nameLast = _np.join(' ');
      const clientName = fullName || firstName || email;

      // Upload the three pose photos + bloodwork to Supabase Storage.
      const poseUrls = {};
      const bloodUrls = [];
      const uploadErrors = [];
      if (env.SUPABASE_URL && env.SUPABASE_KEY) {
        for (const pose of ['front', 'side', 'back']) {
          const f = form.get('photo_' + pose);
          if (f && typeof f === 'object' && f.size > 0) {
            try { poseUrls[pose] = await storeFile(env, origin, 'photos/' + pose, f); }
            catch (e) { uploadErrors.push(pose + ': ' + e.message); }
          }
        }
        for (const f of form.getAll('bloodwork')) {
          if (f && typeof f === 'object' && f.size > 0) {
            try { bloodUrls.push(await storeFile(env, origin, 'bloodwork', f)); }
            catch (e) { uploadErrors.push('bloodwork: ' + e.message); }
          }
        }
      }

      // Custom fields from every onboarding_* answer present.
      const customFields = [];
      for (const [name, id] of Object.entries(FIELD_IDS)) {
        if (name.startsWith('onboarding_photo_')) continue; // set explicitly below
        const v = form.get(name);
        if (v != null && v.toString().trim() !== '') customFields.push({ id, value: v.toString() });
      }
      if (poseUrls.front) customFields.push({ id: FIELD_IDS.onboarding_photo_front, value: poseUrls.front });
      if (poseUrls.side) customFields.push({ id: FIELD_IDS.onboarding_photo_side, value: poseUrls.side });
      if (poseUrls.back) customFields.push({ id: FIELD_IDS.onboarding_photo_back, value: poseUrls.back });

      // Upsert the client contact.
      const upsert = await ghl(env, 'POST', '/contacts/upsert', {
        locationId: env.LOCATION_ID,
        email,
        firstName: nameFirst,
        lastName: nameLast,
        phone: (form.get('phone') || '').toString().trim(),
        source: 'TRT Guy Onboarding',
        tags: ['trt-guy', 'client-onboarded'],
        customFields,
      });
      const out = await upsert.json();
      const contactId = out && out.contact && out.contact.id;
      if (!contactId) return json({ error: 'GHL upsert failed', details: out }, 502);

      // Build the full Q&A transcript from EVERY submitted field, so questions
      // added later in the editor flow through to email + Slack automatically.
      // Known fields use their nice label; anything new is humanized from its name.
      const labelMap = Object.fromEntries(LABELS);
      const skipKeys = new Set(['firstName', 'units', 'bloodwork']);
      const lines = [];
      for (const [k, v] of form) {
        if (skipKeys.has(k) || k.indexOf('photo_') === 0) continue;
        if (typeof v !== 'string' || v.trim() === '') continue;
        const label = labelMap[k] || k.replace(/^onboarding_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        lines.push(`${label}: ${v.trim()}`);
      }
      const media = [];
      if (poseUrls.front) media.push('Front photo: ' + poseUrls.front);
      if (poseUrls.side) media.push('Side photo: ' + poseUrls.side);
      if (poseUrls.back) media.push('Back photo: ' + poseUrls.back);
      if (bloodUrls.length) media.push('Bloodwork: ' + bloodUrls.join('  |  '));
      const transcript =
        `TRT GUY — CLIENT ONBOARDING\nName: ${clientName}\n\n` +
        lines.join('\n') +
        (media.length ? '\n\nMEDIA:\n' + media.join('\n') : '');

      // 2) Save transcript as a Note on the contact.
      let noteOk = false;
      try {
        const nr = await ghl(env, 'POST', `/contacts/${contactId}/notes`, { body: transcript });
        noteOk = nr.ok;
      } catch (e) {}

      // Slack notification → #onboarding-forms (its own webhook; falls back to the applications one).
      const ONBOARD_HOOK = env.SLACK_WEBHOOK_ONBOARDING || env.SLACK_WEBHOOK;
      if (ONBOARD_HOOK) {
        try {
          const oemail = (form.get('email') || '').toString().trim();
          const body = lines.join('\n') + (media.length ? '\n\nMEDIA:\n' + media.join('\n') : '');
          const blk = body.length > 2800 ? body.slice(0, 2800) + '\n…(truncated — full answers in email/GHL)' : body;
          await fetch(ONBOARD_HOOK, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Money Bot',
              icon_emoji: ':moneybag:',
              text: `${env.SLACK_MENTION || '<@U0BTQAGV85A>'} New client onboarding: ${clientName}`,
              blocks: [
                { type: 'header', text: { type: 'plain_text', text: '💰 New client onboarding' } },
                { type: 'section', fields: [
                  { type: 'mrkdwn', text: `*Name:*\n${clientName}` },
                  { type: 'mrkdwn', text: `*Email:*\n${oemail || '—'}` },
                ] },
                { type: 'section', text: { type: 'mrkdwn', text: '```' + blk + '```' } },
              ],
            }),
          });
        } catch (e) {}
      }

      // 3) Email the answers to the internal notify address (via a dedicated internal contact).
      let emailOk = false;
      try {
        const notify = (env.NOTIFY_EMAIL || 'julian@trt-guy.com');
        const ir = await ghl(env, 'POST', '/contacts/upsert', {
          locationId: env.LOCATION_ID, email: notify, firstName: 'TRT Guy', lastName: 'Onboarding Notifications',
          tags: ['internal-notify'], source: 'TRT Guy Onboarding',
        });
        const ij = await ir.json();
        const notifyId = ij && ij.contact && ij.contact.id;
        if (notifyId) {
          const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
            <h2 style="font-family:Arial">New onboarding — ${esc(clientName)}</h2>
            <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px">${esc(transcript)}</pre>
          </div>`;
          const er = await ghl(env, 'POST', '/conversations/messages', {
            type: 'Email', contactId: notifyId,
            subject: `New TRT Guy onboarding: ${clientName}`,
            html, emailFrom: (env.EMAIL_FROM || 'TRT Guy <julian@trt-guy.com>'),
          });
          emailOk = er.ok;
        }
      } catch (e) {}

      return json({ success: true, contactId, note: noteOk, emailed: emailOk, photos: Object.keys(poseUrls).length, bloodwork: bloodUrls.length, uploadErrors });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
