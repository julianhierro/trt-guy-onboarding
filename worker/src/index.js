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

async function storeFile(env, origin, prefix, file) {
  const key = `${prefix}/${crypto.randomUUID()}-${safeName(file.name)}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'application/octet-stream' } });
  return `${origin}/f/${key}`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // Editable-text store: GET returns overrides JSON; POST (passcode) saves it.
    if (url.pathname === '/content') {
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
      const key = decodeURIComponent(url.pathname.slice(3));
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response('Not found', { status: 404 });
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set('Cache-Control', 'private, max-age=31536000');
      h.set('Content-Disposition', 'inline');
      return new Response(obj.body, { headers: h });
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
      const clientName = firstName || email;

      // Upload the three pose photos + bloodwork to R2.
      const poseUrls = {};
      for (const pose of ['front', 'side', 'back']) {
        const f = form.get('photo_' + pose);
        if (f && typeof f === 'object' && f.size > 0) poseUrls[pose] = await storeFile(env, origin, 'photos/' + pose, f);
      }
      const bloodUrls = [];
      for (const f of form.getAll('bloodwork')) {
        if (f && typeof f === 'object' && f.size > 0) bloodUrls.push(await storeFile(env, origin, 'bloodwork', f));
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
        firstName,
        phone: (form.get('phone') || '').toString().trim(),
        source: 'TRT Guy Onboarding',
        tags: ['trt-guy', 'client-onboarded'],
        customFields,
      });
      const out = await upsert.json();
      const contactId = out && out.contact && out.contact.id;
      if (!contactId) return json({ error: 'GHL upsert failed', details: out }, 502);

      // Build the full Q&A transcript.
      const lines = [];
      for (const [k, label] of LABELS) {
        const v = form.get(k);
        if (v != null && v.toString().trim() !== '') lines.push(`${label}: ${v.toString().trim()}`);
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
            html, emailFrom: (env.EMAIL_FROM || 'TRT Guy <admin@jackedvegans.com>'),
          });
          emailOk = er.ok;
        }
      } catch (e) {}

      return json({ success: true, contactId, note: noteOk, emailed: emailOk, photos: Object.keys(poseUrls).length, bloodwork: bloodUrls.length });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};
