import { useState } from "react";
import { FAQS } from "../config";
import { Chevron } from "./Icons";

const BRIGHT = "#1faf38";
const DEEP = "#0c744d";

/* The decorative mark under the heading: a solid disc with a striped disc
   overlapping it up and to the left, and a ring + three chevrons above right. */
function FaqDeco() {
  return (
    <svg className="faq-deco" width="205" height="146" viewBox="0 0 205 146" aria-hidden="true">
      <defs>
        <pattern id="lwFaqStripes" width="11.5" height="4" patternUnits="userSpaceOnUse">
          <rect width="5.6" height="4" fill={DEEP} />
        </pattern>
      </defs>

      <circle cx="74.8" cy="92.5" r="53" fill={BRIGHT} />
      <circle cx="61.2" cy="75.7" r="47.5" fill="url(#lwFaqStripes)" />

      <circle cx="136.9" cy="13.5" r="12.4" fill="none" stroke={DEEP} strokeWidth="2" />
      <g fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M170.6 1.3L160.2 13.5 170.6 25.7" stroke={BRIGHT} />
        <path d="M185.9 1.3L175.5 13.5 185.9 25.7" stroke={DEEP} />
        <path d="M201.2 1.3L190.8 13.5 201.2 25.7" stroke={BRIGHT} />
      </g>
    </svg>
  );
}

export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="faq">
      <div className="wrap">
        <div className="side">
          <p className="eyebrow">FAQ</p>
          <h2>
            Questions
            <br />
            leaders usually
            <br />
            ask
          </h2>
          <FaqDeco />
        </div>

        <div className="acc">
          {FAQS.map((f, i) => (
            <div className="acc-item" key={f.q}>
              <button
                type="button"
                className="acc-q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span>{f.q}</span>
                <span className="ic"><Chevron up={open === i} /></span>
              </button>
              {open === i && <p className="a">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
