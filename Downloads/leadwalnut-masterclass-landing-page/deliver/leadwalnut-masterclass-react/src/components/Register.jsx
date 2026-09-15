import { useState } from "react";
import {
  SCRIPT_URL, BREVO_FORM_URL, SUCCESS_URL, FREE_EMAIL_DOMAINS,
  EVENT, ROLES, COUNTRY_CODES,
} from "../config";

// The green promo panel's checkerboard squares (decorative).
const CELLS = [
  [0, 42, 86, 86], [86, 128, 86, 86], [0, 214, 86, 86],
  [172, 42, 86, 86], [258, 128, 86, 86], [86, 300, 86, 86],
  [172, 386, 86, 86], [0, 386, 86, 86], [258, 300, 86, 86],
];

const EMPTY = {
  name: "",
  email: "",
  country_code: "+91",
  phone: "",
  linkedin: "",
  role: "",
  whatsapp_optin: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const LINKEDIN_RE = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[A-Za-z0-9._%\-]+\/?/i;

// Every field except `phone` is required. Returns { field: message } for
// whatever failed.
function validate(d) {
  const errors = {};

  if (d.name.trim().length < 2) errors.name = "Please enter your full name.";

  const email = d.email.trim();
  const domain = (email.split("@")[1] || "").toLowerCase();
  if (!EMAIL_RE.test(email)) {
    errors.email = "Please enter a valid work email — e.g. you@company.com";
  } else if (FREE_EMAIL_DOMAINS.includes(domain)) {
    errors.email = "Please use your work email — personal addresses won't be reviewed.";
  }

  if (!LINKEDIN_RE.test(d.linkedin.trim())) {
    errors.linkedin = "Please enter a valid LinkedIn URL — e.g. linkedin.com/in/your-name";
  }

  if (!d.role) errors.role = "Please select your role.";

  return errors;
}

export default function Register() {
  const [data, setData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle"); // idle | sending | error

  const set = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setData((d) => ({ ...d, [k]: v }));
    // Clear a field's error as soon as the person starts fixing it.
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };

  const fieldClass = (k) => (errors[k] ? "field bad" : "field");

  async function onSubmit(e) {
    e.preventDefault();
    if (state === "sending") return;

    const found = validate(data);
    const firstBad = ["name", "email", "linkedin", "role"].find((k) => found[k]);
    if (firstBad) {
      setErrors(found);
      const el = document.getElementById(firstBad);
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return;
    }

    setErrors({});
    setState("sending");

    // One phone string for both destinations. Brevo wants E.164, so strip
    // everything that isn't a digit off the local part.
    const localDigits = data.phone.replace(/\D/g, "");
    const phone = localDigits ? `${data.country_code}${localDigits}` : "";

    try {
      // 1) Save the lead to the Google Sheet. Apps Script web apps don't send
      // CORS headers on the redirect they use, so the reply can't be read from
      // the browser — `no-cors` still delivers the POST body and the row lands
      // in the Sheet. Key names match the Webflow embed so both pages write to
      // the same columns.
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          linkedin: data.linkedin.trim(),
          role: data.role,
          phone,
          whatsapp_updates: data.whatsapp_optin ? "Yes" : "No",
          edition: EVENT.edition,
          session_date: EVENT.iso,
          page_url: typeof window !== "undefined" ? window.location.href : "",
          timestamp: new Date().toISOString(),
        }),
      });

      // 2) Push the contact into Brevo (list + confirmation email).
      const brevo = new FormData();
      brevo.append("NAME", data.name.trim());
      brevo.append("EMAIL", data.email.trim());
      brevo.append("LINKEDIN", data.linkedin.trim());
      brevo.append("ROLE", data.role);
      brevo.append("PHONE_NUMBER", phone);
      brevo.append("OPT_IN", data.whatsapp_optin ? "true" : "false");
      await fetch(BREVO_FORM_URL, { method: "POST", mode: "no-cors", body: brevo });

      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({
          event: "masterclass_register",
          role: data.role,
          edition: EVENT.edition,
        });
      }

      // 3) Off to the thank-you page.
      window.location.href = SUCCESS_URL;
    } catch (err) {
      console.error("Registration failed", err);
      setState("error");
    }
  }

  return (
    <section className="register" id="register">
      <div className="wrap-card">
        <div className="reg-card">
          <div className="reg-visual">
            <div className="checks">
              {CELLS.map((c, i) => (
                <i key={i} style={{ left: c[0], top: c[1], width: c[2], height: c[3] }} />
              ))}
            </div>
            <h2>
              Is your
              <br />
              marketing OS
              <br />
              AI-ready?
            </h2>
            <img src="/assets/speaker.png" alt="" />
          </div>

          <div className="reg-form">
            <h3>Register Now - It's Free!</h3>
            <form onSubmit={onSubmit} noValidate>
              <div className={fieldClass("name")}>
                <label htmlFor="name">Name <i>*</i></label>
                <input id="name" name="name" type="text" placeholder="Your Full Name"
                  value={data.name} onChange={set("name")} />
                {errors.name && <p className="f-err">{errors.name}</p>}
              </div>

              <div className={fieldClass("email")}>
                <label htmlFor="email">Work email <i>*</i></label>
                <input id="email" name="email" type="email" placeholder="you@company.com"
                  value={data.email} onChange={set("email")} />
                {errors.email && <p className="f-err">{errors.email}</p>}
              </div>

              <div className="field">
                <label htmlFor="phone">Phone <em className="opt">(optional)</em></label>
                <div className="field phone" style={{ margin: 0 }}>
                  <select aria-label="Country code" value={data.country_code} onChange={set("country_code")}>
                    {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input id="phone" name="phone" type="tel" value={data.phone} onChange={set("phone")} />
                </div>
              </div>

              <div className={fieldClass("linkedin")}>
                <label htmlFor="linkedin">LinkedIn Profile <i>*</i></label>
                <input id="linkedin" name="linkedin" type="url" placeholder="linkedin.com/in/your-name"
                  value={data.linkedin} onChange={set("linkedin")} />
                {errors.linkedin && <p className="f-err">{errors.linkedin}</p>}
              </div>

              <div className={fieldClass("role")}>
                <label htmlFor="role">Your Role <i>*</i></label>
                <select id="role" name="role" value={data.role} onChange={set("role")}>
                  <option value="">Select your role</option>
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                {errors.role && <p className="f-err">{errors.role}</p>}
              </div>

              <label className="consent">
                <input type="checkbox" checked={data.whatsapp_optin} onChange={set("whatsapp_optin")} />
                Receive masterclass updates via WhatsApp
              </label>

              <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
                {state === "sending" ? "Reserving…" : "Reserve My Seat"}
              </button>

              <div className="reg-when">
                <strong>{EVENT.date}</strong>
                <span>{EVENT.times}</span>
              </div>

              {state === "error" && (
                <p className="form-msg err">
                  Something went wrong. Please check your connection and try again, or email
                  ajay@leadwalnut.com.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
