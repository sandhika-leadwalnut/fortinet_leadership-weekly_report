const ROWS = [
  { k: "Pipeline created", v: "$1.42M", d: "▲ 11%", up: true, bg: "#dfeffb" },
  { k: "Share of AI answers", v: "18.4%", d: "▲ 2.1 pts", up: true, bg: "#dbf4e4" },
  { k: "Non-brand organic", v: "48.2K", d: "▲ 6%", up: true, bg: "#fdf4d4" },
  { k: "Demo-request CVR", v: "3.1%", d: "▼ 0.4 pts", up: false, bg: "#fde4df" },
];

const SOURCES = ["GA4", "Search Console", "HubSpot", "Ahrefs"];

export default function EmailMock() {
  return (
    <div className="mock-wrap">
      <div className="mock">
        <div className="mock-sent">Sent automatically</div>

        <div className="mock-bar">
          <span className="mock-dots">
            <i style={{ background: "#ff5f57" }} />
            <i style={{ background: "#febc2e" }} />
            <i style={{ background: "#28c840" }} />
          </span>
          <span className="label">Inbox</span>
          <span className="time">Mon, 7:00 AM</span>
        </div>

        <div className="mock-body">
          <div className="mock-from">
            <span className="mock-av">CW</span>
            <span>
              <span className="n">Cowork · Marketing Ops</span>
              <br />
              <span className="t">to: Leadership team</span>
            </span>
          </div>

          <p className="mock-h">Last week in marketing — week 34</p>
          <p className="mock-sub">Pipeline held. Category AI visibility moved. One thing needs a decision.</p>

          {ROWS.map((r) => (
            <div className="mock-row" key={r.k} style={{ background: r.bg }}>
              <span className="k">{r.k}</span>
              <span className="v">{r.v}</span>
              <span className={"d " + (r.up ? "d-up" : "d-down")}>{r.d}</span>
            </div>
          ))}

          <div className="mock-src">
            <span>Sources</span>
            {SOURCES.map((s) => (
              <i key={s}>{s}</i>
            ))}
          </div>
        </div>

        <div className="mock-foot">Nobody on the team spent Friday building this.</div>
      </div>
    </div>
  );
}
