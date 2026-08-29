# TRT Guy — Client Onboarding

Post-payment onboarding intake. The page (`index.html`) is static → **GitHub Pages**.
File uploads + saving to GoHighLevel go through a **Cloudflare Worker** (`worker/`) with **R2** storage.

Answers write onto the buyer's GHL contact (location `WmcafLXT7njeQOu3fqlP`) as custom fields,
tagged `trt-guy` + `client-onboarded`. Photos & bloodwork are stored in R2; their links are saved
onto the contact.

## 1. Deploy the Worker (Cloudflare)

```bash
cd worker
npx wrangler login
npx wrangler r2 bucket create trt-guy-onboarding
npx wrangler secret put GHL_TOKEN     # paste the pit-... token when prompted
npx wrangler deploy
```

Copy the deployed URL it prints, e.g. `https://trt-guy-onboarding.<your-subdomain>.workers.dev`.

## 2. Point the page at the Worker

In `index.html`, set:

```js
const WORKER_URL = "https://trt-guy-onboarding.<your-subdomain>.workers.dev";
```

## 3. Deploy the page (GitHub Pages)

Push this repo to GitHub and enable Pages (main branch, root). The page lives at
`https://<user>.github.io/trt-guy-onboarding/` (or a custom subdomain like `start.trt-guy.com`).

## 4. Link from checkout

After payment, redirect the buyer to the page with their details so answers attach to the right contact:

```
.../index.html?name={{contact.first_name}}&email={{contact.email}}&phone={{contact.phone}}&contact_id={{contact.id}}
```

## What the Worker does on submit

1. Stores the 3 photos (front/side/back) + bloodwork in R2.
2. Upserts the buyer's GHL contact with every answer as a custom field (+ the photo/bloodwork links), tagged `trt-guy` + `client-onboarded`.
3. Saves the full **question + answer transcript as a Note** on the contact.
4. **Emails the answers to `julian@trt-guy.com`** (via an internal `internal-notify` contact). Change the address with the `NOTIFY_EMAIL` var.

## Editing the page text yourself

Open the page with `?edit=1` (e.g. `.../index.html?edit=1`), enter the passcode, click any heading/label/instruction to edit it inline, then **Save text**. Changes are stored on the Worker (`/content`) and show for everyone.
- Default passcode is `Hierro2026`. Override it by setting a Wrangler secret: `wrangler secret put EDIT_KEY`.

## Notes

- The GHL token is **never** in this repo — it's a Wrangler secret on the Worker only.
- Uploaded files are served back from the Worker at `/f/<key>` using unguessable keys (capability URLs).
- ~45 GHL custom fields already exist (keys are `contact.onboarding_*`); the Worker maps form fields → field IDs.
- Sender is `admin@jackedvegans.com` (authenticated on the GHL location). Swap it with the `EMAIL_FROM` var once a trt-guy.com sender is authenticated in GHL.
