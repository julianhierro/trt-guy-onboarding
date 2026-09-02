var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var GHL_API = "https://services.leadconnectorhq.com";
var FIELD_IDS = {
  onboarding_age: "XQpxKbX71PSLaOUvVsaq",
  onboarding_location_timezone: "YdrdAKiVBhS06tiBjsLc",
  onboarding_height: "UOgnoZPVZQtoY4kJ1nLf",
  onboarding_current_weight: "0wCYHhIHw2GTUHA7Klb4",
  onboarding_goal_weight: "cHZjBhmOPcbe4XjTVlgH",
  onboarding_body_fat_pct: "Fe6eK87v6eBGUz1IHK8q",
  onboarding_primary_goal: "auhQQcsSIUZ4byw7Esc9",
  onboarding_short_term_goals: "pWoA3fY8kJcuZibYQ43n",
  onboarding_long_term_goals: "CnfDcPRNsW0BLYZPyyRt",
  onboarding_past_attempts: "aZNy2GCyaBQavYUIIWTl",
  onboarding_why_now: "aPtqCOb8WCET2oH33bKF",
  onboarding_target_timeline: "yRcwJajQ6gnUuw4LJQe5",
  onboarding_on_trt_now: "xxhb7HMca5Okk3gCbwOs",
  onboarding_trt_protocol_dose: "raLhVxY6usleSyymNj0p",
  onboarding_trt_duration: "BDR0GDgIqG5SlCqptRui",
  onboarding_trt_prescriber: "QoQaT168ePRAMQU3bOiS",
  onboarding_previous_ped_use: "jXUAqYTM6kruz27Bse3x",
  onboarding_previous_ped_details: "0SVfyEHwaGJsAaUiNAMY",
  onboarding_enhancement_preference: "aHHMMupMTy4f4nNano5R",
  onboarding_risk_tolerance_1_to_10: "OH4db6kgEXQTWA7Gb7jV",
  onboarding_medical_conditions: "y0Dgz4vwa5jNyi0MWtgL",
  onboarding_medications_supplements: "2EzDRdpCoYCwvMvHcIKQ",
  onboarding_injuries_limitations: "lZbnSDrwzJPPxtO96k9S",
  onboarding_allergies: "rzpVziFklNbRJNDsbGnc",
  onboarding_training_experience: "zz7AbqS1z6ZEYkXVDnd7",
  onboarding_current_routine: "m7FlXOsOox0IOstG7eqo",
  onboarding_days_per_week: "rb5lJcz3NzXdi0iIFhpK",
  onboarding_gym_equipment: "BgUsy6C3EX948e0NC5VP",
  onboarding_tracks_macros: "X6eJBZbEcKdJe5MgURiQ",
  onboarding_current_calories: "DHl3nD8OM70IYAqC9juH",
  onboarding_typical_day_of_eating: "e4jjFs5Ozv04K575ZgEj",
  onboarding_dietary_restrictions: "0qHRZXuE1LJJKtngKwCo",
  onboarding_alcohol_per_week: "hdSjUNq1I8QfN1GLswlL",
  onboarding_avg_sleep: "Ie9SQPKlxLNkWUuaWFcY",
  onboarding_stress_level: "3kfTAPTMVuJqBiplUqo5",
  onboarding_job_activity: "yyFyAZ7cMLz4D5LCvHQN",
  onboarding_photo_social_consent: "3KUszwuDAtNmdaOh5y97",
  onboarding_anything_else: "omtl1MwKiEidJJ4Hu35F",
  onboarding_bloodwork_link: "LEET16pP2xTKga6F9Wzy",
  onboarding_best_contact_method: "g4fYT4guQ7DTafhK2sRS",
  onboarding_photo_front: "Tr6vTGvfjIGMLAiOFMcs",
  onboarding_photo_side: "tStH9wehxV8iJPtYAnaI",
  onboarding_photo_back: "qt8lZQPToUT3KFShx43L"
};
var LABELS = [
  ["email", "Email"],
  ["phone", "Phone"],
  ["onboarding_age", "Age"],
  ["onboarding_location_timezone", "City / timezone"],
  ["units", "Units"],
  ["onboarding_height", "Height"],
  ["onboarding_current_weight", "Current weight"],
  ["onboarding_goal_weight", "Goal weight"],
  ["onboarding_body_fat_pct", "Body fat %"],
  ["onboarding_primary_goal", "Primary goal"],
  ["onboarding_short_term_goals", "Short-term goal"],
  ["onboarding_long_term_goals", "Long-term goal"],
  ["onboarding_past_attempts", "What they tried before"],
  ["onboarding_why_now", "Why now"],
  ["onboarding_target_timeline", "Target timeline"],
  ["onboarding_on_trt_now", "On TRT now"],
  ["onboarding_trt_protocol_dose", "TRT protocol & dose"],
  ["onboarding_trt_duration", "TRT duration"],
  ["onboarding_trt_prescriber", "TRT prescriber"],
  ["onboarding_previous_ped_use", "Previous PED use"],
  ["onboarding_previous_ped_details", "Previous PED details"],
  ["onboarding_enhancement_preference", "Direction"],
  ["onboarding_risk_tolerance_1_to_10", "Risk tolerance (1-10)"],
  ["onboarding_medical_conditions", "Medical conditions"],
  ["onboarding_medications_supplements", "Medications & supplements"],
  ["onboarding_injuries_limitations", "Injuries / limitations"],
  ["onboarding_allergies", "Allergies"],
  ["onboarding_training_experience", "Training experience"],
  ["onboarding_current_routine", "Current routine"],
  ["onboarding_days_per_week", "Days per week"],
  ["onboarding_gym_equipment", "Gym / equipment"],
  ["onboarding_tracks_macros", "Knows how to track macros"],
  ["onboarding_current_calories", "Current calories/day"],
  ["onboarding_typical_day_of_eating", "Typical day of eating"],
  ["onboarding_dietary_restrictions", "Dietary restrictions"],
  ["onboarding_alcohol_per_week", "Alcohol per week"],
  ["onboarding_avg_sleep", "Average sleep"],
  ["onboarding_stress_level", "Stress level"],
  ["onboarding_job_activity", "Job / activity"],
  ["onboarding_photo_social_consent", "Photo social consent"],
  ["onboarding_anything_else", "Anything else"],
  ["onboarding_bloodwork_link", "Bloodwork link"],
  ["onboarding_best_contact_method", "Best contact method"]
];
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var json = /* @__PURE__ */ __name((obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } }), "json");
var esc = /* @__PURE__ */ __name((s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]), "esc");
var safeName = /* @__PURE__ */ __name((n) => (n || "file").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-60), "safeName");
function ghl(env, method, path, body) {
  return fetch(`${GHL_API}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${env.GHL_TOKEN}`,
      "Version": "2021-07-28",
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
}
__name(ghl, "ghl");
async function storeFile(env, origin, prefix, file) {
  const key = `${prefix}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const bytes = await file.arrayBuffer();
  const res = await fetch(`${env.SUPABASE_URL}/storage/v1/object/trt-onboarding/${key}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.SUPABASE_KEY}`,
      "apikey": env.SUPABASE_KEY,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true"
    },
    body: bytes
  });
  if (!res.ok) throw new Error("storage upload failed " + res.status + ": " + (await res.text()).slice(0, 160));
  return `${env.SUPABASE_URL}/storage/v1/object/public/trt-onboarding/${key}`;
}
__name(storeFile, "storeFile");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/content") {
      if (!env.BUCKET) {
        if (request.method === "GET") return new Response("{}", { headers: { ...CORS, "Content-Type": "application/json" } });
        return json({ error: "Editing storage not enabled yet (R2 off)" }, 503);
      }
      if (request.method === "GET") {
        const obj = await env.BUCKET.get("content.json");
        const text = obj ? await obj.text() : "{}";
        return new Response(text, { headers: { ...CORS, "Content-Type": "application/json" } });
      }
      if (request.method === "POST") {
        if ((request.headers.get("X-Edit-Key") || "") !== (env.EDIT_KEY || "Hierro2026")) return json({ error: "unauthorized" }, 401);
        const txt = await request.text();
        try {
          JSON.parse(txt);
        } catch (e) {
          return json({ error: "invalid json" }, 400);
        }
        await env.BUCKET.put("content.json", txt, { httpMetadata: { contentType: "application/json" } });
        return json({ ok: true });
      }
    }
    if (request.method === "GET" && url.pathname.startsWith("/f/")) {
      if (!env.BUCKET) return new Response("Not found", { status: 404 });
      const key = decodeURIComponent(url.pathname.slice(3));
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response("Not found", { status: 404 });
      const h = new Headers();
      obj.writeHttpMetadata(h);
      h.set("Cache-Control", "private, max-age=31536000");
      h.set("Content-Disposition", "inline");
      return new Response(obj.body, { headers: h });
    }
    if (url.pathname === "/optin") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const d = await request.json().catch(() => ({}));
      const email = (d.email || "").toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required" }, 400);
      const LISTS = {
        "trt-101": { tag: "trt-101", source: "TRT 101 Opt-in" },
        "coaching-waitlist": { tag: "coaching-waitlist", source: "Coaching Waitlist" }
      };
      const cfg = LISTS[d.list] || { tag: "lead", source: "TRT Guy" };
      const up = await ghl(env, "POST", "/contacts/upsert", {
        locationId: env.LOCATION_ID,
        email,
        firstName: (d.firstName || d.name || "").toString().trim(),
        phone: (d.phone || "").toString().trim(),
        source: cfg.source,
        tags: ["trt-guy", cfg.tag]
      });
      const o = await up.json();
      const cid = o && o.contact && o.contact.id;
      if (!cid) return json({ error: "GHL upsert failed", details: o }, 502);
      return json({ success: true, contactId: cid });
    }
    if (url.pathname === "/application") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
      const d = await request.json().catch(() => ({}));
      const email = (d.email || "").toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "A valid email is required" }, 400);
      const APP = [
        ["instagram", "Instagram handle", "gsyco9x3jwYCEgCJMvY1"],
        ["based", "Where are you based", "PknI0vXROFIeWfCdux1x"],
        ["short_term_goals", "Short-term goals", "pWoA3fY8kJcuZibYQ43n"],
        ["long_term_goals", "Long-term goals", "CnfDcPRNsW0BLYZPyyRt"],
        ["on_trt", "On TRT / thinking about it", "xxhb7HMca5Okk3gCbwOs"],
        ["trt_protocol", "Current TRT protocol", "4lLXxSHJqWbXyCVgf7MM"],
        ["ever_used_steroids", "Ever used steroids", "QkKJ8nc32jVC0jzZ7t6S"],
        ["on_cycle_now", "Currently on a cycle", "qUAfgqODKeM9VQ5wn5Fy"],
        ["cycle_describe", "Current cycle (described)", "M0iNIa5TEZ7ev3MN5ntS"],
        ["investment_ready", "Willing to invest significantly", "ZDOG2Rfb8e7Ynwhwyomb"],
        ["ready_to_start", "When would you start", "HVGtf4eRQRATvalN4Yfb"],
        ["decision_maker", "Financial decision maker", "QrCNqO0fAoGZNd8e9x7D"],
        ["why_now_vs_wait", "Why now vs waiting 1-2 months", "1rOd8pBztwro2hiklQEp"],
        ["biggest_struggle", "Biggest struggle", "zAgPdBVxY72yreuTI286"],
        ["wants_from_coaching", "What they want from coaching", "ydPPsiNnJ4H95JG12nlt"],
        ["help_accomplish", "Anything else I should know", "gLMxGi5wAVAca0J78lGc"]
      ];
      const customFields = [];
      for (const [k, , id] of APP) {
        const v = d[k];
        if (v != null && v.toString().trim() !== "") customFields.push({ id, value: v.toString() });
      }
      const up = await ghl(env, "POST", "/contacts/upsert", {
        locationId: env.LOCATION_ID,
        email,
        firstName: (d.firstName || "").toString().trim(),
        phone: (d.phone || "").toString().trim(),
        source: "Coaching Application",
        tags: ["trt-guy", "coaching-waitlist", "coaching-application"],
        customFields
      });
      const o = await up.json();
      const cid = o && o.contact && o.contact.id;
      if (!cid) return json({ error: "GHL upsert failed", details: o }, 502);
      const clientName = d.firstName || email;
      const lines = Array.isArray(d.qa) && d.qa.length ? d.qa.filter((x) => x && x.a != null && x.a.toString().trim() !== "").map((x) => `${(x.q || "").toString().trim()}: ${x.a}`) : APP.map(([k, label]) => {
        const v = d[k];
        return v && v.toString().trim() ? `${label}: ${v}` : null;
      }).filter(Boolean);
      const transcript = `TRT GUY \u2014 COACHING APPLICATION
Name: ${clientName}
Email: ${email}
Phone: ${(d.phone || "").toString()}

` + lines.join("\n");
      try {
        await ghl(env, "POST", `/contacts/${cid}/notes`, { body: transcript });
      } catch (e) {
      }
      if (env.SLACK_WEBHOOK) {
        try {
          const ig = (d.instagram || "").toString().trim();
          const body = lines.join("\n");
          const blk = body.length > 2800 ? body.slice(0, 2800) + "\n\u2026(truncated \u2014 full answers in email/GHL)" : body;
          await fetch(env.SLACK_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Money Bot",
              icon_emoji: ":moneybag:",
              text: `${env.SLACK_MENTION || "<@U0BTQAGV85A>"} New coaching application: ${clientName}`,
              blocks: [
                { type: "header", text: { type: "plain_text", text: "\u{1F4B0} New coaching application" } },
                { type: "section", fields: [
                  { type: "mrkdwn", text: `*Name:*
${clientName}` },
                  { type: "mrkdwn", text: `*Email:*
${email}` },
                  { type: "mrkdwn", text: `*Phone:*
${(d.phone || "\u2014").toString()}` },
                  { type: "mrkdwn", text: `*Instagram:*
${ig || "\u2014"}` }
                ] },
                { type: "section", text: { type: "mrkdwn", text: "```" + blk + "```" } }
              ]
            })
          });
        } catch (e) {
        }
      }
      try {
        const notify = env.NOTIFY_EMAIL || "julian@trt-guy.com";
        const ir = await ghl(env, "POST", "/contacts/upsert", { locationId: env.LOCATION_ID, email: notify, firstName: "TRT Guy", lastName: "Onboarding Notifications", tags: ["internal-notify"] });
        const ij = await ir.json();
        const nid = ij && ij.contact && ij.contact.id;
        if (nid) await ghl(env, "POST", "/conversations/messages", { type: "Email", contactId: nid, subject: `New coaching application: ${clientName}`, html: `<h2>New coaching application \u2014 ${esc(clientName)}</h2><pre style="white-space:pre-wrap;font-family:Arial">${esc(transcript)}</pre>`, emailFrom: env.EMAIL_FROM || "TRT Guy <julian@trt-guy.com>" });
      } catch (e) {
      }
      return json({ success: true, contactId: cid });
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    try {
      const form = await request.formData();
      const origin = url.origin;
      const email = (form.get("email") || "").toString().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "A valid email is required" }, 400);
      }
      const firstName = (form.get("firstName") || "").toString().trim();
      const fullName = (form.get("onboarding_full_name") || "").toString().trim();
      const _np = fullName ? fullName.split(/\s+/) : [];
      const nameFirst = _np.length ? _np.shift() : firstName;
      const nameLast = _np.join(" ");
      const clientName = firstName || email;
      const poseUrls = {};
      const bloodUrls = [];
      const uploadErrors = [];
      if (env.SUPABASE_URL && env.SUPABASE_KEY) {
        for (const pose of ["front", "side", "back"]) {
          const f = form.get("photo_" + pose);
          if (f && typeof f === "object" && f.size > 0) {
            try {
              poseUrls[pose] = await storeFile(env, origin, "photos/" + pose, f);
            } catch (e) {
              uploadErrors.push(pose + ": " + e.message);
            }
          }
        }
        for (const f of form.getAll("bloodwork")) {
          if (f && typeof f === "object" && f.size > 0) {
            try {
              bloodUrls.push(await storeFile(env, origin, "bloodwork", f));
            } catch (e) {
              uploadErrors.push("bloodwork: " + e.message);
            }
          }
        }
      }
      const customFields = [];
      for (const [name, id] of Object.entries(FIELD_IDS)) {
        if (name.startsWith("onboarding_photo_")) continue;
        const v = form.get(name);
        if (v != null && v.toString().trim() !== "") customFields.push({ id, value: v.toString() });
      }
      if (poseUrls.front) customFields.push({ id: FIELD_IDS.onboarding_photo_front, value: poseUrls.front });
      if (poseUrls.side) customFields.push({ id: FIELD_IDS.onboarding_photo_side, value: poseUrls.side });
      if (poseUrls.back) customFields.push({ id: FIELD_IDS.onboarding_photo_back, value: poseUrls.back });
      const upsert = await ghl(env, "POST", "/contacts/upsert", {
        locationId: env.LOCATION_ID,
        email,
        firstName: nameFirst,
        lastName: nameLast,
        phone: (form.get("phone") || "").toString().trim(),
        source: "TRT Guy Onboarding",
        tags: ["trt-guy", "client-onboarded"],
        customFields
      });
      const out = await upsert.json();
      const contactId = out && out.contact && out.contact.id;
      if (!contactId) return json({ error: "GHL upsert failed", details: out }, 502);
      const lines = [];
      for (const [k, label] of LABELS) {
        const v = form.get(k);
        if (v != null && v.toString().trim() !== "") lines.push(`${label}: ${v.toString().trim()}`);
      }
      const media = [];
      if (poseUrls.front) media.push("Front photo: " + poseUrls.front);
      if (poseUrls.side) media.push("Side photo: " + poseUrls.side);
      if (poseUrls.back) media.push("Back photo: " + poseUrls.back);
      if (bloodUrls.length) media.push("Bloodwork: " + bloodUrls.join("  |  "));
      const transcript = `TRT GUY \u2014 CLIENT ONBOARDING
Name: ${clientName}

` + lines.join("\n") + (media.length ? "\n\nMEDIA:\n" + media.join("\n") : "");
      let noteOk = false;
      try {
        const nr = await ghl(env, "POST", `/contacts/${contactId}/notes`, { body: transcript });
        noteOk = nr.ok;
      } catch (e) {
      }
      const ONBOARD_HOOK = env.SLACK_WEBHOOK_ONBOARDING || env.SLACK_WEBHOOK;
      if (ONBOARD_HOOK) {
        try {
          const oemail = (form.get("email") || "").toString().trim();
          const body = lines.join("\n") + (media.length ? "\n\nMEDIA:\n" + media.join("\n") : "");
          const blk = body.length > 2800 ? body.slice(0, 2800) + "\n\u2026(truncated \u2014 full answers in email/GHL)" : body;
          await fetch(ONBOARD_HOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Money Bot",
              icon_emoji: ":moneybag:",
              text: `${env.SLACK_MENTION || "<@U0BTQAGV85A>"} New client onboarding: ${clientName}`,
              blocks: [
                { type: "header", text: { type: "plain_text", text: "\u{1F4B0} New client onboarding" } },
                { type: "section", fields: [
                  { type: "mrkdwn", text: `*Name:*
${clientName}` },
                  { type: "mrkdwn", text: `*Email:*
${oemail || "\u2014"}` }
                ] },
                { type: "section", text: { type: "mrkdwn", text: "```" + blk + "```" } }
              ]
            })
          });
        } catch (e) {
        }
      }
      let emailOk = false;
      try {
        const notify = env.NOTIFY_EMAIL || "julian@trt-guy.com";
        const ir = await ghl(env, "POST", "/contacts/upsert", {
          locationId: env.LOCATION_ID,
          email: notify,
          firstName: "TRT Guy",
          lastName: "Onboarding Notifications",
          tags: ["internal-notify"],
          source: "TRT Guy Onboarding"
        });
        const ij = await ir.json();
        const notifyId = ij && ij.contact && ij.contact.id;
        if (notifyId) {
          const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
            <h2 style="font-family:Arial">New onboarding \u2014 ${esc(clientName)}</h2>
            <pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px">${esc(transcript)}</pre>
          </div>`;
          const er = await ghl(env, "POST", "/conversations/messages", {
            type: "Email",
            contactId: notifyId,
            subject: `New TRT Guy onboarding: ${clientName}`,
            html,
            emailFrom: env.EMAIL_FROM || "TRT Guy <julian@trt-guy.com>"
          });
          emailOk = er.ok;
        }
      } catch (e) {
      }
      return json({ success: true, contactId, note: noteOk, emailed: emailOk, photos: Object.keys(poseUrls).length, bloodwork: bloodUrls.length, uploadErrors });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
