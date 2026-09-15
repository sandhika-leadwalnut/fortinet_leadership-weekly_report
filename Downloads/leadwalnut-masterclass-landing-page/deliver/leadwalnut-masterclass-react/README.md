# Is your marketing OS AI-ready? — masterclass landing page

A pixel-faithful React build of the Figma frame **"Final one"** (LeadWalnut website revamp),
with the registration form wired to a Google Sheet via Apps Script.

The event date has been updated throughout to **Thu, Oct 22, 2026**.

---

## Run it locally

```bash
npm install
npm run dev        # http://localhost:5173
```

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel: **Add New → Project → Import** that repo.
3. Vercel auto-detects Vite. If it asks:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy. You get a `*.vercel.app` URL.

No environment variables are needed — the Apps Script URL lives in `src/config.js`.

---

## Changing things

Almost everything you'll want to edit is in **`src/config.js`**:

| What | Where |
|---|---|
| Event date and times | `EVENT.date`, `EVENT.times` — used in the hero, the form card and the closing CTA banner |
| Google Sheet endpoint | `SCRIPT_URL` |
| Role dropdown options | `ROLES` |
| Country codes | `COUNTRY_CODES` |
| Testimonials | `TESTIMONIALS` |
| FAQ questions and answers | `FAQS` |

Copy, layout and styling live in:

```
src/styles.css              all styling, organised section by section
src/components/Hero.jsx     hero + headline + rating
src/components/EmailMock.jsx the tilted "weekly email" card in the hero
src/components/Register.jsx  the registration form (and its submit logic)
src/components/Faq.jsx       the accordion
src/components/Sections.jsx  every other section, in page order
src/components/Icons.jsx     inline SVG icons and the starburst
public/assets/              images extracted from the design file
```

Colour tokens (`--green-900`, `--orange`, `--cream`, …) are declared once at the
top of `styles.css`. Change them there and they update everywhere.

---

## The registration form

`src/components/Register.jsx` POSTs the form to the Apps Script Web App URL in
`config.js`.

**Set the Sheet up once:**

1. Open the Google Sheet that should collect registrations.
2. **Extensions → Apps Script**, paste in `apps-script/Code.gs` (in this repo).
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the `/exec` URL into `src/config.js` → `SCRIPT_URL`.

The script writes one row per submission with: timestamp, name, work email,
country code, phone, LinkedIn, role, WhatsApp opt-in, event date and page URL.
It creates the header row automatically on the first submission.

**A note on how the POST works.** Apps Script web apps answer through a redirect
that doesn't carry CORS headers, so the browser can't read the reply. The request
is therefore sent with `mode: "no-cors"` — the row still lands in the Sheet, but
the page can't tell you whether the server accepted it. The form shows success
once the request completes. **Test one submission end to end after deploying** and
confirm the row appears; that's the only way to be sure the endpoint is live.

If you later want real success/failure feedback, the usual fix is a small proxy —
e.g. a Vercel serverless function at `/api/register` that forwards to Apps Script
server-side, where CORS doesn't apply.

---

## Fonts

Loaded from Google Fonts in `index.html`: Schibsted Grotesk (headings), Urbanist
(body), Inter Tight (UI/cards), Geist Mono (the eyebrow labels and the orange
flag). These are the four families used in the Figma file.

---

## Responsive behaviour

The Figma file only describes the 1440px desktop frame. Breakpoints at 1120px,
860px and 720px were written for this build, not taken from the design — worth a
look on a real phone before you go live.
