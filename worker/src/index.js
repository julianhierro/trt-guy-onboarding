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

// Slack formatting: bold question, plain answer beneath it. A monospace code block
// forced long questions to wrap badly and was hard to scan, so this uses ordinary
// mrkdwn and splits across section blocks (Slack caps a section at 3000 chars).
const smk = t => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function qaSections(pairs) {
  const out = []; let buf = '';
  for (const p of pairs) {
    const q = smk(p.q).trim(), a = smk(p.a).trim();
    if (!a) continue;
    const piece = `*${q}*\n${a}\n\n`;
    if (buf.length + piece.length > 2800) { if (buf.trim()) out.push(buf.trim()); buf = ''; }
    buf += piece;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.slice(0, 40).map(t => ({ type: 'section', text: { type: 'mrkdwn', text: t } }));
}
function contactLine(bits) {
  const t = bits.filter(Boolean).join('  ·  ');
  return t ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: t }] }] : [];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-CC-Key, X-Edit-Key',
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


// ── Client manager ───────────────────────────────────────────────────────────
// Backs the roster at trt-guy.com/clients and the per-client plan pages at
// trt-guy.com/<first-name>. Rows live in Supabase table `tg_clients`; the manager
// authenticates with the X-CC-Key passcode, each client with their own 4-digit PIN.
//
// Everything here is ADDITIVE: the intake forms and their routes are not touched.
// New clients are pulled OUT of GHL (contacts tagged client-onboarded, plus the
// transcript note the intake form already writes) by the manager's Import button.
//
// The table itself is closed by RLS — even the public Supabase key can't read it.
// All access goes through the SECURITY DEFINER function `tg_client_api`, which
// demands TG_DB_TOKEN (a worker secret). Client plans and payment figures are
// therefore unreadable with the anon key alone.

// Columns the manager is allowed to write.
const CLIENT_COLS = ['slug', 'name', 'email', 'phone', 'instagram', 'status', 'client_type',
  'start_date', 'term_months', 'end_date', 'pay_method', 'amount_paid', 'phase', 'sections', 'notes'];

// Real paths on trt-guy.com — a client slug can never collide with one, or their
// page would be shadowed by the folder.
const RESERVED_SLUGS = new Set(['api', 'app', 'approved', 'client', 'clients', 'coaching',
  'coaching-application', 'control', 'editor', 'favicon', 'fertility-guide', 'img', 'index',
  'links', 'newsletter', 'onboarding', 'onboarding-v2', 'ped-health', 'protocol', 'scripts',
  'start', 'thanks', 'trt-101', 'trt-101-guide', 'waitlist']);

const managerKey = env => env.MANAGER_KEY || env.EDIT_KEY || 'Hierro2026';

async function rpc(env, op, payload = {}) {
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/tg_client_api`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tok: env.TG_DB_TOKEN, op, payload }),
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`db ${op} failed (${r.status}): ${txt.slice(0, 180)}`);
  try { return JSON.parse(txt); } catch (e) { return null; }
}

// Best-effort country + "first-world" qualification from the free-text "where are you based".
// The auto guess is only a starting point \u2014 the dashboard lets Julian override any application.
const QUALIFIED = ['united states','canada','united kingdom','australia','new zealand','germany','switzerland','sweden','norway','denmark','netherlands','ireland','finland','austria','belgium','luxembourg','france','japan','singapore','united arab emirates'];
function classifyBased(based){
  const s = (based || '').toString().trim();
  const key = s.toLowerCase();
  const country = (s.split(',').pop() || '').trim();
  const qualified = QUALIFIED.indexOf(key) !== -1 || QUALIFIED.indexOf(country.toLowerCase()) !== -1 || QUALIFIED.some(k => key.includes(k));
  return { country: country || s, qualified };
}
async function logFunnel(env, op, payload){ try { await rpc(env, op, payload); } catch (e) {} }

const slugify = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

// A client's slug is their first name; collisions and reserved paths get a suffix.
async function uniqueSlug(env, desired, ignoreId) {
  const base = slugify(String(desired || '').trim().split(/\s+/)[0]) || 'client';
  for (let i = 0; i < 40; i++) {
    const cand = i === 0 ? base : `${base}-${i + 1}`;
    if (RESERVED_SLUGS.has(cand)) continue;
    const taken = await rpc(env, 'slug_taken', { slug: cand, ignore_id: ignoreId || null });
    if (!taken) return cand;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

const newPin = () => String(Math.floor(1000 + Math.random() * 9000));

// What a client's own page is allowed to see: their plan — never the money, the
// private notes, or the raw intake transcript.
const publicClient = c => ({
  slug: c.slug,
  name: c.name,
  first: (c.name || '').split(/\s+/)[0] || c.slug,
  client_type: c.client_type,
  status: c.status,
  start_date: c.start_date,
  end_date: c.end_date,
  term_months: c.term_months,
  phase: c.phase || {},
  sections: c.sections || {},
  updated_at: c.updated_at,
});

// The master plan template: what every new client starts with. Kept in tg_settings
// so it is edited in one place and never touches an existing client's plan.
const TEMPLATE_KEY = 'plan_template';
const COPY_KEY = 'client_copy';
const RESOURCES_KEY = 'resources';

async function getTemplate(env) {
  try { return await rpc(env, 'setting_get', { k: TEMPLATE_KEY }); } catch (e) { return null; }
}

// Only fills what the caller left empty — an import or a manual add with its own
// plan is never overwritten.
async function seedFromTemplate(env, row) {
  const t = await getTemplate(env);
  if (!t) return row;
  const emptyObj = o => !o || !Object.keys(o).length;
  if (emptyObj(row.sections) && t.sections) row.sections = t.sections;
  if (emptyObj(row.phase) && t.phase) {
    // Dates belong to the client, not the template — only the shape carries over.
    const { start, end, past, ...rest } = t.phase;
    row.phase = rest;
  }
  if (!row.client_type && t.client_type) row.client_type = t.client_type;
  return row;
}

// Everyone who has finished an intake form, newest first. Read-only against GHL:
// the forms keep writing exactly what they always did, and this just reads it back.
async function ghlIntakes(env, tag) {
  const body = {
    locationId: env.LOCATION_ID,
    pageLimit: 50,
    page: 1,
    sort: [{ field: 'dateAdded', direction: 'desc' }],
    filters: [{ field: 'tags', operator: 'eq', value: tag || 'client-onboarded' }],
  };
  const r = await ghl(env, 'POST', '/contacts/search', body);
  if (!r.ok) return { error: `GHL search failed (${r.status})`, details: (await r.text()).slice(0, 200) };
  const j = await r.json();
  const list = (j.contacts || []).map(c => ({
    id: c.id,
    name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.contactName || c.email || '',
    email: c.email || '',
    phone: c.phone || '',
    tags: c.tags || [],
    dateAdded: c.dateAdded || c.dateUpdated || '',
  }));
  return { contacts: list };
}

// The intake transcript the form already saved as a contact note.
async function ghlTranscript(env, contactId) {
  try {
    const r = await ghl(env, 'GET', `/contacts/${contactId}/notes`);
    if (!r.ok) return '';
    const j = await r.json();
    const notes = j.notes || [];
    // Consultation transcripts get chunked across several notes; keep them in order.
    const parts = notes.filter(n => /TRT GUY|Consultation/i.test(n.body || ''))
      .sort((a, b) => String(a.dateAdded || '').localeCompare(String(b.dateAdded || '')));
    const use = parts.length ? parts : notes.slice(0, 1);
    return use.map(n => n.body || '').join('\n\n').slice(0, 60000);
  } catch (e) { return ''; }
}

export default {
  async fetch(request, env, ctx) {
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
    // ── Client manager: the roster behind trt-guy.com/clients ────────────────
    // Passcode-guarded; the intake forms and their routes are untouched by this.
    if (url.pathname === '/clients') {
      if ((request.headers.get('X-CC-Key') || '') !== managerKey(env)) return json({ error: 'unauthorized' }, 401);
      if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.TG_DB_TOKEN) return json({ error: 'storage not configured' }, 503);

      try {
        if (request.method === 'GET') {
          // ?action=intakes — read finished intake forms straight out of GHL.
          if (url.searchParams.get('action') === 'intakes') {
            return json(await ghlIntakes(env, url.searchParams.get('tag') || 'client-onboarded'));
          }
          if (url.searchParams.get('action') === 'template') {
            return json({ template: await getTemplate(env) });
          }
          if (url.searchParams.get('action') === 'copy') {
            return json({ copy: await rpc(env, 'setting_get', { k: COPY_KEY }) });
          }
          if (url.searchParams.get('action') === 'resources') {
            return json({ resources: await rpc(env, 'setting_get', { k: RESOURCES_KEY }) });
          }
          return json({ clients: await rpc(env, 'list') });
        }

        if (request.method === 'POST') {
          let body = {};
          try { body = await request.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }
          const action = body.action || 'save';
          const now = new Date().toISOString();

          if (action === 'resources_save') {
            const list = Array.isArray(body.resources) ? body.resources : [];
            return json({ ok: true, resources: await rpc(env, 'setting_set', { k: RESOURCES_KEY, v: list }) });
          }

          if (action === 'copy_save') {
            const copy = body.copy || {};
            return json({ ok: true, copy: await rpc(env, 'setting_set', { k: COPY_KEY, v: copy }) });
          }

          if (action === 'template_save') {
            const t = body.template || {};
            return json({ ok: true, template: await rpc(env, 'setting_set', { k: TEMPLATE_KEY, v: t }) });
          }

          if (action === 'delete') {
            if (!body.id) return json({ error: 'id required' }, 400);
            await rpc(env, 'delete', { id: body.id });
            return json({ ok: true });
          }

          if (action === 'newpin') {
            if (!body.id) return json({ error: 'id required' }, 400);
            const client = await rpc(env, 'update', { id: body.id, pin: newPin(), pin_fails: 0, pin_locked_until: null });
            return client ? json({ ok: true, client }) : json({ error: 'not found' }, 404);
          }

          // Import a finished intake: contact details + the transcript note GHL holds.
          if (action === 'import') {
            const email = String(body.email || '').toLowerCase().trim();
            if (!email) return json({ error: 'email required' }, 400);
            const transcript = body.contactId ? await ghlTranscript(env, body.contactId) : '';
            const intake = { source: 'GHL intake', at: now, transcript };
            const existing = await rpc(env, 'by_email', { email });
            if (existing) {
              const client = await rpc(env, 'update', {
                id: existing.id, intake, intake_at: now,
                ghl_contact_id: body.contactId || existing.ghl_contact_id || null,
                phone: existing.phone || body.phone || null,
              });
              return json({ ok: true, existed: true, client });
            }
            const client = await rpc(env, 'insert', await seedFromTemplate(env, {
              slug: await uniqueSlug(env, body.name || email, null),
              name: body.name || email, email, phone: body.phone || null,
              status: 'lead', pin: newPin(), intake, intake_at: now,
              ghl_contact_id: body.contactId || null,
            }));
            return json({ ok: true, client });
          }

          // Create / update.
          const row = {};
          for (const k of CLIENT_COLS) if (k in body) row[k] = body[k] === '' ? null : body[k];
          if (row.email) row.email = String(row.email).toLowerCase().trim();

          if (body.id) {
            if (body.slug != null) row.slug = await uniqueSlug(env, body.slug, body.id);
            row.id = body.id;
            const client = await rpc(env, 'update', row);
            return client ? json({ ok: true, client }) : json({ error: 'not found' }, 404);
          }

          row.slug = await uniqueSlug(env, body.slug || body.name, null);
          row.pin = newPin();
          if (!row.name) row.name = 'New client';
          return json({ ok: true, client: await rpc(env, 'insert', await seedFromTemplate(env, row)) });
        }
      } catch (err) {
        return json({ error: err.message }, 502);
      }
      return json({ error: 'Method not allowed' }, 405);
    }

    // Meta Conversions API. The browser pixel fires the same conversion with the
    // same event_id; Meta matches the pair and counts it once, keeping whichever
    // arrives — which matters because ad blockers and iPhones stop the browser
    // copy on 20-40% of people. Nothing here can break a lead: it is its own
    // route, it never throws, and it no-ops until META_CAPI_TOKEN is set.
    if (url.pathname === '/capi') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!env.META_CAPI_TOKEN || !env.META_PIXEL_ID) return json({ ok: true, skipped: 'not configured' });
      try {
        const d = await request.json().catch(() => ({}));
        if (!d.event) return json({ error: 'event required' }, 400);

        // Meta matches on hashes, so normalise first — a stray capital or space
        // produces a hash that matches nobody and the data is silently wasted.
        const sha256 = async v => {
          if (v == null || v === '') return undefined;
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(v)));
          return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
        };
        const text = v => (v == null ? '' : String(v).trim().toLowerCase()) || undefined;
        // E.164 digits only. A number without a country code cannot be matched.
        const phone = v => { const n = String(v || '').replace(/\D/g, ''); return n.length >= 10 ? n : undefined; };
        // The application asks for a country by name; Meta matches on the 2-letter
        // code. Anything not on this list is sent as nothing rather than as a guess.
        const ISO = { 'united states': 'us', 'canada': 'ca', 'united kingdom': 'gb', 'australia': 'au',
          'new zealand': 'nz', 'ireland': 'ie', 'germany': 'de', 'switzerland': 'ch', 'austria': 'at',
          'netherlands': 'nl', 'belgium': 'be', 'luxembourg': 'lu', 'france': 'fr', 'spain': 'es',
          'portugal': 'pt', 'italy': 'it', 'greece': 'gr', 'sweden': 'se', 'norway': 'no',
          'denmark': 'dk', 'finland': 'fi', 'iceland': 'is', 'poland': 'pl', 'czechia': 'cz',
          'slovakia': 'sk', 'slovenia': 'si', 'croatia': 'hr', 'serbia': 'rs', 'romania': 'ro',
          'bulgaria': 'bg', 'hungary': 'hu', 'estonia': 'ee', 'latvia': 'lv', 'lithuania': 'lt',
          'malta': 'mt', 'cyprus': 'cy', 'turkey': 'tr', 'israel': 'il', 'united arab emirates': 'ae',
          'saudi arabia': 'sa', 'qatar': 'qa', 'kuwait': 'kw', 'bahrain': 'bh', 'oman': 'om',
          'japan': 'jp', 'singapore': 'sg', 'south korea': 'kr', 'china': 'cn', 'india': 'in',
          'pakistan': 'pk', 'philippines': 'ph', 'indonesia': 'id', 'malaysia': 'my',
          'thailand': 'th', 'vietnam': 'vn', 'south africa': 'za', 'nigeria': 'ng', 'kenya': 'ke',
          'egypt': 'eg', 'morocco': 'ma', 'mexico': 'mx', 'brazil': 'br', 'argentina': 'ar',
          'chile': 'cl', 'colombia': 'co', 'peru': 'pe', 'ecuador': 'ec', 'uruguay': 'uy',
          'paraguay': 'py', 'bolivia': 'bo', 'venezuela': 've', 'costa rica': 'cr', 'panama': 'pa',
          'guatemala': 'gt', 'dominican republic': 'do', 'puerto rico': 'pr' };
        const iso = v => ISO[String(v || '').trim().toLowerCase()];

        const user_data = {
          em: await sha256(text(d.email)),
          ph: await sha256(phone(d.phone)),
          fn: await sha256(text(d.first_name)),
          country: await sha256(iso(d.country)),
          // these four are matched raw — hashing them makes them useless
          fbp: d.fbp || undefined,
          fbc: d.fbc || undefined,
          external_id: d.external_id || undefined,
          client_ip_address: request.headers.get('CF-Connecting-IP') || undefined,
          client_user_agent: request.headers.get('User-Agent') || undefined,
        };
        for (const k of Object.keys(user_data)) if (user_data[k] === undefined) delete user_data[k];

        const body = {
          data: [{
            event_name: String(d.event),
            event_time: Math.floor(Date.now() / 1000),
            event_id: String(d.event_id || crypto.randomUUID()),
            action_source: 'website',
            event_source_url: d.source_url || undefined,
            user_data,
            custom_data: d.custom && typeof d.custom === 'object' ? d.custom : {},
          }],
          access_token: env.META_CAPI_TOKEN,
        };
        if (env.META_TEST_EVENT_CODE) body.test_event_code = env.META_TEST_EVENT_CODE;

        const r = await fetch(`https://graph.facebook.com/v24.0/${env.META_PIXEL_ID}/events`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const out = await r.json().catch(() => ({}));
        return json({ ok: r.ok, meta: out }, r.ok ? 200 : 502);
      } catch (e) {
        return json({ ok: false, error: e.message });
      }
    }

    // The client page's own wording, edited in the manager. Public on purpose:
    // it is labels, not client data, and every client page needs it before login.
    if (url.pathname === '/client-copy') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.TG_DB_TOKEN) return json({ copy: null });
      try { return json({ copy: await rpc(env, 'setting_get', { k: COPY_KEY }) }); }
      catch (e) { return json({ copy: null }); }
    }

    // ── A client's own page (trt-guy.com/<first-name>) ───────────────────────
    // GET tells the page whether the slug exists; POST trades the 4-digit PIN for
    // the plan. Wrong PINs are counted and the slug locks for 15 minutes at 8.
    if (url.pathname === '/client') {
      if (!env.SUPABASE_URL || !env.SUPABASE_KEY || !env.TG_DB_TOKEN) return json({ error: 'storage not configured' }, 503);
      try {
        if (request.method === 'GET') {
          const slug = String(url.searchParams.get('slug') || '').toLowerCase();
          if (!slug) return json({ found: false }, 404);
          const c = await rpc(env, 'by_slug', { slug });
          if (!c) return json({ found: false }, 404);
          return json({ found: true, first: (c.name || '').split(/\s+/)[0] || c.slug });
        }

        if (request.method === 'POST') {
          let body = {};
          try { body = await request.json(); } catch (e) { return json({ error: 'invalid json' }, 400); }
          const slug = String(body.slug || '').toLowerCase();
          const pin = String(body.pin || '').trim();
          if (!slug) return json({ error: 'not found' }, 404);
          const c = await rpc(env, 'by_slug', { slug });
          if (!c) return json({ error: 'not found' }, 404);

          if (c.pin_locked_until && new Date(c.pin_locked_until) > new Date()) {
            return json({ error: 'Too many tries. Try again in a few minutes.' }, 429);
          }
          if (!c.pin || pin !== String(c.pin)) {
            const fails = (c.pin_fails || 0) + 1;
            const patch = fails >= 8
              ? { id: c.id, pin_fails: 0, pin_locked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString() }
              : { id: c.id, pin_fails: fails };
            const upd = rpc(env, 'update', patch);
            if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(upd); else await upd;
            return json({ error: "That code doesn't match." }, 401);
          }
          if (c.pin_fails || c.pin_locked_until) {
            const upd = rpc(env, 'update', { id: c.id, pin_fails: 0, pin_locked_until: null });
            if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(upd);
          }
          let resources = [];
        try {
          const all = await rpc(env, 'setting_get', { k: RESOURCES_KEY });
          if (Array.isArray(all)) {
            const pedClient = c.client_type === 'peds' || c.client_type === 'full';
            resources = all
              .filter(r => r && (r.label || '').trim() && (r.on !== false))
              .filter(r => !r.pedOnly || pedClient)
              .map(r => ({ label: r.label, link: (r.link || '').trim() }));
          }
        } catch (e) {}
        return json({ client: publicClient(c), resources });
        }
      } catch (err) {
        return json({ error: err.message }, 502);
      }
      return json({ error: 'Method not allowed' }, 405);
    }

    // ── Funnel tracking: powers the funnel dashboard. Same passcode as the roster. ──
    if (url.pathname === '/funnel') {
      if ((request.headers.get('X-CC-Key') || '') !== managerKey(env)) return json({ error: 'unauthorized' }, 401);
      if (!env.TG_DB_TOKEN) return json({ error: 'not configured' }, 503);
      try {
        if (request.method === 'GET') {
          return json(await rpc(env, 'funnel_get', { from: url.searchParams.get('from'), to: url.searchParams.get('to') }));
        }
        if (request.method === 'POST') {
          const body = await request.json().catch(() => ({}));
          if (body.action === 'set_day') return json(await rpc(env, 'funnel_set_day', { day: body.day, ad_spend: body.ad_spend, organic_shares: body.organic_shares }));
          if (body.action === 'override_app') return json(await rpc(env, 'funnel_override_app', { id: body.id, override: body.override || '' }));
          return json({ error: 'unknown action' }, 400);
        }
        return json({ error: 'method not allowed' }, 405);
      } catch (e) { return json({ error: e.message }, 500); }
    }

    // Audience survey (trt-guy.com/survey/) sent to the email list. Every answer
    // becomes a `survey-*` tag so broadcasts can be segmented by interest, and the
    // full Q&A is saved as a Note. The email link passes ?cid={{contact.id}} so the
    // answers land on the subscriber who clicked; without it we upsert by email.
    // Tags are built from option VALUES (stable slugs), never from the editable
    // option text, so rewording an option in the editor never renames a tag.
    if (url.pathname === '/survey') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const d = await request.json().catch(() => ({}));
      const a = d.answers && typeof d.answers === 'object' ? d.answers : {};
      const slug = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
      const one = v => (Array.isArray(v) ? v[0] : v);
      const many = v => (Array.isArray(v) ? v : v ? [v] : []);

      const tags = ['trt-guy', 'survey-done'];
      const add = (prefix, v) => { const s = slug(v); if (s) tags.push(`survey-${prefix}-${s}`); };
      add('goal', one(a.goal));
      add('trt-interest', one(a.trt_interest));
      many(a.trt_topics).forEach(t => add('trt-topic', t));
      add('aas-interest', one(a.aas_interest));
      many(a.aas_topics).forEach(t => add('aas-topic', t));
      add('on-trt', one(a.on_trt));
      add('considering', one(a.considering));
      add('health', one(a.health));
      const age = parseInt(a.age, 10);
      if (age >= 14 && age < 100) {
        add('age', age < 30 ? 'under-30' : age < 40 ? '30s' : age < 50 ? '40s' : age < 60 ? '50s' : '60-plus');
      }

      let cid = /^[A-Za-z0-9]{10,40}$/.test(String(d.contactId || '')) ? String(d.contactId) : '';
      const email = (d.email || '').toString().trim();
      if (cid) {
        const tr = await ghl(env, 'POST', `/contacts/${cid}/tags`, { tags });
        if (!tr.ok) cid = '';            // bad/stale id from the link — fall back to email
      }
      if (!cid) {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);
        const up = await ghl(env, 'POST', '/contacts/upsert', {
          locationId: env.LOCATION_ID,
          email,
          firstName: (d.firstName || '').toString().trim(),
          source: 'Audience Survey',
          tags,
        });
        const o = await up.json().catch(() => ({}));
        cid = o && o.contact && o.contact.id;
        if (!cid) return json({ error: 'GHL upsert failed', details: o }, 502);
      }

      const pairs = (Array.isArray(d.qa) ? d.qa : [])
        .map(p => ({ q: String((p && p.q) || '').slice(0, 500), a: String((p && p.a) || '').slice(0, 5000) }))
        .filter(p => p.q && p.a);
      const transcript = 'TRT GUY — Audience Survey\n\n' + pairs.map(p => `${p.q}\n→ ${p.a}`).join('\n\n');
      // Open-ended answers can run long, so split across notes instead of cutting off.
      const chunks = [];
      for (let i = 0; i < transcript.length && chunks.length < 6; i += 7000) chunks.push(transcript.slice(i, i + 7000));
      ctx.waitUntil((async () => {
        for (let i = 0; i < chunks.length; i++) {
          const head = chunks.length > 1 ? `(part ${i + 1} of ${chunks.length})\n` : '';
          try { await ghl(env, 'POST', `/contacts/${cid}/notes`, { body: head + chunks[i] }); } catch (e) {}
        }
      })());
      return json({ success: true, contactId: cid, tags });
    }

    if (url.pathname === '/optin') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const d = await request.json().catch(() => ({}));
      const email = (d.email || '').toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'A valid email is required' }, 400);
      const LISTS = {
        'trt-101': { tag: 'trt-101', source: 'TRT 101 Opt-in' },
        'coaching-waitlist': { tag: 'coaching-waitlist', source: 'Coaching Waitlist' },
        'my-protocol': { tag: 'my-protocol', source: 'My Protocol' },
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
      await logFunnel(env, 'funnel_log_optin', { email, list: (d.list || 'lead').toString() });
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
        ['occupation', 'Occupation', 'EKEZceqMhpE8DITc1Jqh'],
        ['age_height_weight', 'Age, height & weight', 'X5nGqJh1qLvYsy7iJLFD'],
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
        ['success_definition', 'What success looks like', 'wuNCYKP8I3hr8Je0FIA3'],
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
      const _cls = classifyBased(d.based);
      await logFunnel(env, 'funnel_log_app', { email, name: (d.firstName || '').toString(), phone: (d.phone || '').toString(), based: (d.based || '').toString(), country: _cls.country, qualified_auto: _cls.qualified, ghl_contact_id: cid });
      const clientName = (d.firstName || email);
      // Prefer the live question wording the page sends (so edited questions transcribe as edited);
      // fall back to the built-in labels. Custom-field values above always map by id regardless.
      const pairs = (Array.isArray(d.qa) && d.qa.length)
        ? d.qa.filter(x => x && x.a != null && x.a.toString().trim() !== '')
              .map(x => ({ q: (x.q || '').toString().trim(), a: x.a.toString().trim() }))
        : APP.map(([k, label]) => { const v = d[k]; return (v && v.toString().trim()) ? { q: label, a: v.toString().trim() } : null; }).filter(Boolean);
      const lines = pairs.map(x => `${x.q}: ${x.a}`);
      const transcript = `TRT GUY — COACHING APPLICATION\nName: ${clientName}\nEmail: ${email}\nPhone: ${(d.phone || '').toString()}\n\n` + lines.join('\n');
      try { await ghl(env, 'POST', `/contacts/${cid}/notes`, { body: transcript }); } catch (e) {}
      // Slack notification (Incoming Webhook) — no-op until the SLACK_WEBHOOK secret is set.
      if (env.SLACK_WEBHOOK) {
        try {
          const ig = (d.instagram || '').toString().trim();
          const ph = (d.phone || '').toString().trim();
          await fetch(env.SLACK_WEBHOOK, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'Money Bot',
              icon_emoji: ':moneybag:',
              text: `${env.SLACK_MENTION || '<@U0BTQAGV85A>'} New coaching application: ${clientName}`,
              blocks: [
                { type: 'header', text: { type: 'plain_text', text: '💰 New coaching application' } },
                { type: 'section', text: { type: 'mrkdwn', text: `*${smk(clientName)}*` } },
                ...contactLine([email, ph, ig ? smk(ig) : '']),
                { type: 'divider' },
                ...qaSections(pairs),
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

    // ── /assessment ── client onboarding questionnaire v2 (the "Initial Client Consultation" doc).
    // Free-form: the page sends a live qa:[{q,a}] array built from its own (editable)
    // labels, so there are no per-question GHL custom fields to keep in sync. Every
    // answer lands in the contact Note, the notify email and Slack.
    if (url.pathname === '/assessment') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      try {
        const form = await request.formData();
        const origin = url.origin;

        // `form` distinguishes the full onboarding from the PED/health-only follow-up.
        const formKind = (form.get('form') || '').toString().trim();
        const isPed = formKind === 'ped-health';
        const formTitle = isPed ? 'PED / Health Assessment' : 'Onboarding Questionnaire';

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
          // All uploads run at once — doing them one after another was the bulk of the
          // wait the client sat through on "Sending…".
          const jobs = [];
          for (const pose of ['front', 'side', 'back']) {
            const f = form.get('photo_' + pose);
            if (f && typeof f === 'object' && f.size > 0) {
              jobs.push(storeFile(env, origin, 'v2/photos/' + pose, f)
                .then(u => { poseUrls[pose] = u; })
                .catch(e => uploadErrors.push(pose + ': ' + e.message)));
            }
          }
          for (const f of form.getAll('bloodwork')) {
            if (f && typeof f === 'object' && f.size > 0) {
              jobs.push(storeFile(env, origin, 'v2/bloodwork', f)
                .then(u => bloodUrls.push(u))
                .catch(e => uploadErrors.push('bloodwork: ' + e.message)));
            }
          }
          for (const f of form.getAll('videos')) {
            if (f && typeof f === 'object' && f.size > 0) {
              jobs.push(storeFile(env, origin, 'v2/videos', f)
                .then(u => videoUrls.push(u))
                .catch(e => uploadErrors.push('video: ' + e.message)));
            }
          }
          await Promise.all(jobs);
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
          `TRT GUY — ${formTitle.toUpperCase()}\nName: ${clientName}\nEmail: ${email}\nPhone: ${(form.get('phone') || '').toString()}\n\n` +
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
          source: 'TRT Guy ' + formTitle,
          tags: isPed ? ['trt-guy', 'client-onboarded', 'ped-health']
                      : ['trt-guy', 'client-onboarded', 'assessment-v2'],
          customFields,
        });
        const out = await upsert.json();
        const contactId = out && out.contact && out.contact.id;
        if (!contactId) return json({ error: 'GHL upsert failed', details: out }, 502);

        // The client doesn't need to wait on the note, Slack and email — hand the
        // response back as soon as the contact exists and the files are stored, then
        // finish the rest in the background (ctx.waitUntil keeps the worker alive).
        const followUp = (async () => {
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
              const blocks = [
                { type: 'header', text: { type: 'plain_text', text: isPed ? '💊 New PED / health assessment' : '📋 New onboarding questionnaire' } },
                { type: 'section', text: { type: 'mrkdwn', text: `*${smk(clientName)}*` } },
                ...contactLine([email, (form.get('phone') || '').toString().trim()]),
                { type: 'divider' },
                ...qaSections(qa.filter(x => x && x.a != null && x.a.toString().trim() !== '')),
              ];
              if (media.length) {
                blocks.push({ type: 'divider' });
                // Same bold-label / value-beneath shape; Slack auto-links the bare URLs.
                blocks.push(...qaSections(media.map(m => {
                  const i = m.indexOf(': ');
                  return i > 0 ? { q: m.slice(0, i), a: m.slice(i + 2) } : { q: 'File', a: m };
                })));
              }
              await fetch(HOOK, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  username: 'Money Bot', icon_emoji: ':clipboard:',
                  text: `${env.SLACK_MENTION || '<@U0BTQAGV85A>'} New ${isPed ? 'PED / health assessment' : 'onboarding questionnaire'}: ${clientName} (${lines.length} answers)`,
                  blocks: blocks,
                }),
              });
            } catch (e) {}
          }

          // 4) Email the answers to the internal notify address.
          try {
            const notify = (env.NOTIFY_EMAIL || 'julian@trt-guy.com');
            const ir = await ghl(env, 'POST', '/contacts/upsert', {
              locationId: env.LOCATION_ID, email: notify, firstName: 'TRT Guy', lastName: 'Onboarding Notifications',
              tags: ['internal-notify'], source: 'TRT Guy Onboarding Questionnaire',
            });
            const ij = await ir.json();
            const notifyId = ij && ij.contact && ij.contact.id;
            if (notifyId) {
              const er = await ghl(env, 'POST', '/conversations/messages', {
                type: 'Email', contactId: notifyId,
                subject: `New TRT Guy ${formTitle}: ${clientName}`,
                html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5"><h2>New ${esc(formTitle)} — ${esc(clientName)}</h2><pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px">${esc(transcript)}</pre></div>`,
                emailFrom: (env.EMAIL_FROM || 'TRT Guy <julian@trt-guy.com>'),
              });
              emailOk = er.ok;
            }
          } catch (e) {}
        })();
        if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(followUp); else await followUp;

        return json({ success: true, contactId, queued: true, answers: lines.length, photos: Object.keys(poseUrls).length, bloodwork: bloodUrls.length, videos: videoUrls.length, uploadErrors });
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
