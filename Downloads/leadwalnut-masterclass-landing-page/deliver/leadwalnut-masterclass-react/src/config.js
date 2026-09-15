// ---------------------------------------------------------------------------
// Everything you're likely to change lives in this file.
// ---------------------------------------------------------------------------

// Google Apps Script Web App URL that writes form submissions to your Sheet.
// Deploy: Apps Script editor → Deploy → New deployment → Web app
//         Execute as "Me", Who has access "Anyone". Paste the /exec URL here.
export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzGjcJe9izyfis26xieEaHNDai9BcVs71xIHaoIF74WrIC8Mpi2mS-XB-WbdS5KtNCw/exec";

// Brevo form "serve" endpoint — adds the contact to the list and fires the
// confirmation email. Brevo → Contacts → Forms → your form → Share → the URL
// the generated <form action="..."> points at.
export const BREVO_FORM_URL =
  "https://0161609f.sibforms.com/serve/MUIFAD2tugE3xjSDIOaR20wnwuv-8koOiIDFUZjCmKpLOrYpIQiPQFr2Jrk_Pclmsogj3GBxFASuX3DIgzcyaJdc-GQ4Axv8_0jmPotcH7hFsv2GtTBzwucbiqfj4nk3GMFXQGrrwGIrOeVK1YS7pyIbOkbT09y1no7MO_vS7yaYW97C4uDVWntleJaGWEHH8xxzXE59dWTJHueB";

// The main site — the header logo links here.
export const SITE_URL = "https://www.leadwalnut.com/";

// Where a successful registration lands.
export const SUCCESS_URL = "https://www.leadwalnut.com/registration-success";

// Personal-email domains the form rejects — registrations must use a work address.
export const FREE_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "aol.com", "proton.me", "protonmail.com", "live.com", "rediffmail.com",
  "mail.com", "yandex.com", "gmx.com",
];

// The event. Change the date in ONE place and it updates the hero, the form
// card and the closing CTA banner.
//   edition   — tags every row in the Sheet so editions stay separable.
//   iso       — the session start, written to the Sheet's session_date column.
export const EVENT = {
  date: "Thu, Oct 22, 2026",
  times: "11 AM ET | 4 PM UK | 8:30 PM IST",
  edition: "6th Edition",
  iso: "2026-10-22T20:30:00+05:30",
  // Used for the "when | times" single-line format in the hero + CTA banner.
  get line() {
    return `${this.date} | ${this.times}`;
  },
};

export const ROLES = [
  "CMO / VP Marketing",
  "Content & SEO leader",
  "Marketing ops leader",
  "Demand generation",
  "Founder / CEO",
  "Other",
];

export const COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+65", "+971"];

export const TESTIMONIALS = [
  {
    stars: 3,
    text: "\"Everything ran live on real data. I walked out with a QBR deck I could actually present.",
    name: "Director of Marketing",
    role: "HR Tech,",
  },
  {
    stars: 3,
    text: "My team now runs the Monday leadership email on their own. Most useful 30 minutes of training this year.",
    name: "VP Marketing",
    role: "Fintech,",
  },
  {
    stars: 3,
    text: "\"The competitor-gap demo paid for itself in ten minutes. We'd been paying an agency for that exact work.",
    name: "Head of SEO ",
    role: "Cybersecurity,",
  },
  {
    stars: 3,
    text: "\"Best 90 minutes I've invested in learning how AI can transform marketing workflows.",
    name: "Sonal M",
    role: "Software Engineer,",
  },
];

export const FAQS = [
  {
    q: "Is this for new or existing content?",
    a: "It's for existing and new content both—but we usually recommend starting with content you've already created and under-leveraged",
  },
  {
    q: "What channels do you support?",
    a: "Organic search, AI answer engines (ChatGPT, Perplexity, Google AI Overviews), your website and the reporting layer that sits across them.",
  },
  {
    q: "How much content do we need to start?",
    a: "Enough to see a pattern — usually 20 to 30 pages. The workflows work on what you already have before they generate anything new.",
  },
  {
    q: "Do you have a monthly plan?",
    a: "Yes. We run monthly engagements built around the same operating cadence you'll see in the session.",
  },
  {
    q: "Do you write the repurposed assets too?",
    a: "We do — the agents draft them and our editors take them the last mile, so nothing ships unreviewed.",
  },
];
