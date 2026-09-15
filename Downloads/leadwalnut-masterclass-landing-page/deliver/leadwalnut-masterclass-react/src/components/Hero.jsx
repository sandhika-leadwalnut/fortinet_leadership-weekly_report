import { EVENT } from "../config";
import { Stars } from "./Icons";
import EmailMock from "./EmailMock";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div>
          <p className="eyebrow">Marketing Leaders AI Masterclass</p>
          <h1>
          AI Enablement of Marketing Ops Using

            <br />
          Cloud Cowork
          </h1>
          <div className="lead">
            <p>Pipeline at AI speed needs the whole function running agentic workflows.</p>
            <p>See exactly how it's done- live, on real data, in 60 minutes.</p>
          </div>
          <p className="when">{EVENT.line}</p>
          <a href="#register" className="btn btn-primary">Reserve my free seat</a>
          <p className="micro">Invitation-only · 30 seats · Reviewed within 24 hrs</p>

          <div className="rating">
            <span className="score">4.8</span>
            <div>
              <Stars filled={4} outlineLast size={20} />
              <div className="meta">
                <strong>1,500+ marketing leaders</strong>
                <span>across four previous editions</span>
              </div>
            </div>
          </div>
        </div>

        <EmailMock />
      </div>
    </section>
  );
}
