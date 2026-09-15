import { EVENT, TESTIMONIALS, SITE_URL } from "../config";
import { Stars, QuoteMark, QuestionDiamond, CheckCircle, Sunburst, LinkedInMark, PinIcon, MailIcon } from "./Icons";

/* ------------------------------------------------------------------ header */
export function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        {/* New tab, so someone mid-registration doesn't lose this page. */}
        <a href={SITE_URL} target="_blank" rel="noreferrer">
          <img src="/assets/logo.png" alt="LeadWalnut — AI SEO & CRO Services for B2B Tech" />
        </a>
        <a href="#register" className="btn btn-primary">Reserve my free seat</a>
      </div>
    </header>
  );
}

/* ------------------------------------------------------- "3x / 1x" band */
export function Band3x() {
  return (
    <section className="band-3x">
      <div className="wrap-mid">
        <div>
          <h2>
            Your marketers are 3x.
            <br />
            Reporting is still 1x.
          </h2>
          <p>
            The platforms are connected. The numbers are sitting there. What's missing is the step
            between raw data and a decision worth making.
          </p>
        </div>
        <div className="note-card">
          <p>
            Drafting got faster. The bottleneck moved upstream and downstream - into briefs, data
            assembly and the Monday scramble
          </p>
          <div className="note-flag">You need to reimagine your marketing operating model</div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- reality check */
const QUOTES = [
  { q: "“My team is busy. I still can't tell how we're doing this week.”", who: "CMO", sub: "B2B SaaS" },
  { q: "“AI visibility and category share matter. Nobody has time to track them.”", who: "VP Marketing", sub: null },
  { q: '"I pay senior salaries for data assembly. Numbers still arrive stale."', who: "Marketing Head", sub: "Cybersecurity" },
];

export function Reality() {
  return (
    <section className="reality">
      <div className="wrap">
        <p className="eyebrow">Reality check</p>
        <h2 className="h2">Your team has adopted AI. Your operating model has not.</h2>
        <div className="quotes">
          {QUOTES.map((c) => (
            <figure className="quote" key={c.who}>
              <q>{c.q}</q>
              <figcaption className="who">
                {c.who} {c.sub && <em>{c.sub}</em>}
              </figcaption>
              <span className="bubble"><QuoteMark /></span>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- the clock */
const ASKED = [
  "What did the AI spend actually return?",
  "Where do we show up when buyers ask an AI?",
  "Can we do more next year without more headcount?",
];

export function Clock() {
  return (
    <section className="clock">
      <div className="wrap-mid">
        <div>
          <p className="kicker">The clock</p>
          <h2>The board approved your AI spend in Jan. In Q3, they want the return.</h2>
          <p>
            Can you show tangible metrics that prove the value of your AI investments? If not yet,
            this masterclass is for you.
          </p>
        </div>
        <div className="asked">
          <h3>What you'll be asked</h3>
          <ul>
            {ASKED.map((t) => (
              <li key={t}><QuestionDiamond /><span>{t}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- who it's for */
const AUDIENCE = [
  { h: "CMOs & VPs", p: ["Set the standard for", "AI-assisted marketing across pods"] },
  { h: "Content & SEO leaders", p: ["Own category visibility as buyers move to answer engines."] },
  { h: "Marketing ops leaders", p: ["Scale output without losing control of the operating model."] },
];

export function Audience() {
  return (
    <section className="audience">
      <div className="wrap-card">
        <h2 className="h2">Who it's for</h2>
        <div className="aud-card">
          <img src="/assets/audience.jpg" alt="Marketing leaders" />
          <div className="aud-cols">
            {AUDIENCE.map((a) => (
              <div key={a.h}>
                <h3>{a.h}</h3>
                <p>
                  {a.p.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < a.p.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- what we'll cover */
const COVER = [
  { h: "Kill the Friday reporting scramble", p: "Weekly numbers assembled, written and sent before Monday." },
  { h: "Win the AI answer box", p: "Track category share across ChatGPT, Perplexity and AI Overviews." },
  { h: "Replace the agency gap analysis", p: "Competitor and content gaps, refreshed on a schedule" },
  { h: "Govern AI across the function", p: "One cadence every pod runs, not fifty personal prompts." },
];

export function Cover() {
  return (
    <section className="cover">
      <div className="burst" style={{ left: "-70px", top: "120px" }}>
        <Sunburst size={240} />
      </div>
      <div className="wrap-card">
        <h2 className="h2">What we'll cover</h2>
        <div className="cover-grid">
          <img src="/assets/ai-graphic.png" alt="Search and AI answer surfaces" />
          <ul className="cover-list">
            {COVER.map((c) => (
              <li key={c.h}>
                <CheckCircle />
                <div>
                  <h3>{c.h}</h3>
                  <p>{c.p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- proof band */
function TCard({ t }) {
  return (
    <div className="tcard">
      <Stars filled={t.stars} size={15} />
      <p>{t.text}</p>
      <p className="name">{t.name}</p>
      <p className="role">{t.role}</p>
    </div>
  );
}

export function Proof() {
  const colA = [...TESTIMONIALS, ...TESTIMONIALS];
  const colB = [...TESTIMONIALS].reverse();
  const colBLoop = [...colB, ...colB];
  return (
    <section className="proof">
      <div className="wrap-mid">
        <div>
          <h2>
            400+ registered.
            <br />
            100+ marketing
            <br />
            leaders joined live
          </h2>
          <p className="from">
            From <b>Wakefit</b>, <b>AWS</b>, <b>Freshworks</b>, and <b>CloudTalk</b>.
          </p>
          <div className="rating">
            <span className="score">4.8</span>
            <div>
              <Stars filled={4} outlineLast size={18} />
              <div className="meta">
                <strong>1,500+ marketing leaders</strong>
                <span>across four previous editions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tcols">
          <div className="tcol a">{colA.map((t, i) => <TCard t={t} key={"a" + i} />)}</div>
          <div className="tcol b">{colBLoop.map((t, i) => <TCard t={t} key={"b" + i} />)}</div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- host */
export function Host() {
  return (
    <section className="host">
      <div className="wrap-mid">
        <div>
          <div className="host-top">
            <div className="host-photo">
              <img src="/assets/ajay.png" alt="Ajay Batra" />
            </div>
            <div>
              <span className="host-tag">Host</span>
              <h3>Ajay Batra</h3>
              <p className="role">CEO &amp; Co-founder</p>
              <a className="li" href="https://www.linkedin.com/company/leadwalnut/" target="_blank" rel="noreferrer">
                Connect on <LinkedInMark />
              </a>
            </div>
          </div>
          <p className="bio">
            Runs LeadWalnut's AI-native practice and builds the Claude Cowork workflows behind every
            demo in this session. He'll run the live walkthrough, moderate the panel and take your
            questions in the open Q&amp;A.
          </p>
        </div>

        <div className="about">
          <h3>About LeadWalnut</h3>
          <p>
            An AI-native SEO &amp; CRO agency for enterprise B2B SaaS. This workshop gives you the
            same Claude Cowork plays we run with clients -QBRs, gap analyses, competitive
            intelligence and content ops on autopilot.
          </p>
          <div className="badges">
            <img src="/assets/iso.png" alt="ISO/IEC 27001:2013 certified" style={{ height: 58 }} />
            <img src="/assets/badge-google.png" alt="Google 4.5 — 28 reviews" />
            <img src="/assets/badge-clutch.png" alt="Clutch 4.9 — 9 reviews" />
          </div>
        </div>
      </div>

      <div className="pullquote">
        <p>AI scales output. Only a leader can scale outcome.</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- agents */
const AGENTS = [
  {
    name: "ICP LLM Prompt Agent",
    stat: "+15",
    unit: "%",
    desc: ["more inbound leads", "in 3 months"],
    chip: "#1 in AI answers · 42% category share",
    from: "Generic keyword prompts",
    to: "the real questions buyers ask AI",
  },
  {
    name: "Content Coverage Analyzer",
    stat: "10",
    unit: "min",
    desc: ["for a full content coverage audit vs competitors"],
    chip: "The exact pages you're losing, ranked",
    from: "A 3–4 day agency audit",
    to: "a report in one sitting",
  },
  {
    name: "AI Content Agent",
    stat: "20",
    unit: "x",
    desc: ["more organic traffic from agent-built pages"],
    chip: "+30% more pipeline",
    from: "Days of briefing & writing →",
    to: "a publish-ready page in minutes",
  },
];

export function Agents() {
  return (
    <section className="agents">
      <div className="wrap">
        <div className="agents-card">
          <p className="eyebrow">What these agents deliver</p>
          <h2>
            The agents you'll see live
            <br />
            are already moving the number.
          </h2>

          <div className="agent-grid">
            {AGENTS.map((a) => (
              <div className="agent" key={a.name}>
                <p className="name">{a.name}</p>
                <p className="stat">
                  {a.stat}
                  <small>{a.unit}</small>
                </p>
                <p className="desc">
                  {a.desc.map((d, i) => (
                    <span key={i}>
                      {d}
                      {i < a.desc.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <span className="chip">{a.chip}</span>
                <p className="swap">
                  {a.from} <b>{a.to}</b>
                </p>
              </div>
            ))}
          </div>

          <div className="agents-foot">
            <p>All three run live, on real data, in the session.</p>
            <a href="#register" className="btn btn-pale">Reserve my free seat</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- CTA banner */
export function CtaBanner() {
  return (
    <section className="cta-band">
      <div className="wrap-card" style={{ padding: "0 24px" }}>
        <div className="cta">
          <img className="art" src="/assets/banner-shapes.jpg" alt="" />
          <div className="burst-tr">
            <Sunburst size={120} color="#ffe8de" r1={20} r2={92} w={12} />
          </div>
          <h2>Rebuild your marketing OS before Q3 closes</h2>
          <p className="when">{EVENT.line}</p>
          <a href="#register" className="btn btn-ghost">Reserve my free seat →</a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- footer */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <img className="logo" src="/assets/logo-white.png" alt="LeadWalnut" />
        <p className="row"><PinIcon /> Bengaluru, India</p>
        <p className="row"><MailIcon /> <a href="mailto:ajay@leadwalnut.com">ajay@leadwalnut.com</a></p>
        <h4>Stay in touch</h4>
        <div className="socials">
          <a href="https://www.youtube.com/@leadwalnut" target="_blank" rel="noreferrer" aria-label="YouTube">
            <svg width="34" height="24" viewBox="0 0 34 24">
              <rect width="34" height="24" rx="6" fill="#ff0000" />
              <path d="M14 7l8 5-8 5z" fill="#fff" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/company/leadwalnut/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
            <LinkedInMark size={26} bg="#fff" fg="#1e7353" />
          </a>
          <a href="https://x.com/leadwalnut" target="_blank" rel="noreferrer" aria-label="X">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L4.7 21H1.5l7.5-8.6L1.1 3h6.6l4.5 5.6zm-1.1 16h1.8L7.7 4.8H5.8z" />
            </svg>
          </a>
        </div>
        <div className="foot-rule" />
        <div className="foot-bottom">
          <span>Copyright @2024</span>
          <span>LeadWalnut is a brand of Bizboost Business Solutions LLP</span>
        </div>
      </div>
      <div className="foot-strip" />
    </footer>
  );
}
